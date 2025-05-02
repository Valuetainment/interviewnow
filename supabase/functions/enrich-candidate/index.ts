// Supabase Edge Function to enrich candidate profiles using People Data Labs
import { createClient } from "npm:@supabase/supabase-js@2.33.1";
import { corsHeaders } from '../_shared/cors.ts';

interface RequestBody {
  candidate_id: string;
  email?: string;
  name?: string;
  phone?: string;
}

// Create Supabase client with service role key
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
}

// Create client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Handle incoming requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const { candidate_id, email, name, phone } = await req.json() as RequestBody;
    console.log(`Processing enrichment for candidate ${candidate_id} with email: ${email}, name: ${name}`);
    
    if (!candidate_id) {
      return new Response(
        JSON.stringify({ error: 'Candidate ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get PDL API key from environment
    const pdlApiKey = Deno.env.get('PDL_API_KEY');
    if (!pdlApiKey) {
      console.error('PDL_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'People Data Labs API key not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // First, check if we need to fetch the tenant_id for this candidate
    const { data: candidateData, error: candidateError } = await supabase
      .from('candidates')
      .select('tenant_id, email, full_name, phone')
      .eq('id', candidate_id)
      .single();
    
    if (candidateError) {
      console.error('Error fetching candidate data:', candidateError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch candidate data', details: candidateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Prepare PDL API call
    const pdlEndpoint = 'https://api.peopledatalabs.com/v5/person/enrich';
    
    // Build params for PDL API
    const searchParams = new URLSearchParams();
    
    // Use passed params first, fall back to data from DB
    if (email) searchParams.append('email', email);
    else if (candidateData.email) searchParams.append('email', candidateData.email);
    
    if (name) searchParams.append('name', name);
    else if (candidateData.full_name) searchParams.append('name', candidateData.full_name);
    
    if (phone) searchParams.append('phone', phone);
    else if (candidateData.phone) searchParams.append('phone', candidateData.phone);
    
    // Add additional PDL parameters
    searchParams.append('min_likelihood', '2'); // Require decent match quality
    searchParams.append('required', 'emails'); // Require email match
    
    if (searchParams.toString().length === 0) {
      console.error('No valid search parameters for PDL API');
      return new Response(
        JSON.stringify({ error: 'No valid search parameters for PDL API' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Append query params to URL
    const pdlUrl = `${pdlEndpoint}?${searchParams.toString()}`;
    console.log(`Making PDL API request to: ${pdlUrl}`);
    
    // Make PDL API request
    const response = await fetch(pdlUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': pdlApiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    // Handle PDL API response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`PDL API error: ${response.status}`, errorText);
      return new Response(
        JSON.stringify({ error: `PDL API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const pdlData = await response.json();
    console.log('PDL API response received with likelihood:', pdlData.likelihood);
    
    // Transform PDL data to our schema
    const profileData = {
      candidate_id,
      tenant_id: candidateData.tenant_id,
      pdl_id: pdlData.id,
      pdl_likelihood: pdlData.likelihood,
      last_enriched_at: new Date().toISOString(),
      
      // Basic profile information
      first_name: pdlData.first_name,
      middle_name: pdlData.middle_name,
      last_name: pdlData.last_name,
      gender: pdlData.gender,
      birth_year: pdlData.birth_year,
      
      // Contact information
      linkedin_url: pdlData.linkedin_url,
      linkedin_username: pdlData.linkedin_username,
      linkedin_id: pdlData.linkedin_id,
      twitter_url: pdlData.twitter_url,
      twitter_username: pdlData.twitter_username,
      facebook_url: pdlData.facebook_url,
      facebook_username: pdlData.facebook_username,
      github_url: pdlData.github_url,
      github_username: pdlData.github_username,
      
      // Location data
      location_name: pdlData.location_name,
      location_locality: pdlData.location_locality,
      location_region: pdlData.location_region,
      location_country: pdlData.location_country,
      location_continent: pdlData.location_continent,
      location_postal_code: pdlData.location_postal_code,
      location_street_address: pdlData.location_street_address,
      
      // Work information
      job_title: pdlData.job_title,
      job_company_name: pdlData.job_company_name,
      job_company_size: pdlData.job_company_size,
      job_company_industry: pdlData.job_company_industry,
      job_start_date: pdlData.job_start_date,
      job_last_updated: pdlData.job_last_updated,
      
      // Arrays of data
      skills: pdlData.skills || [],
      interests: pdlData.interests || [],
      countries: pdlData.countries || [],
      job_title_levels: pdlData.job_title_levels || [],
      
      // Full JSON objects
      experience: pdlData.experience || [],
      education: pdlData.education || [],
      industry: pdlData.industry,
    };
    
    // Store enriched data in candidate_profiles table
    console.log('Storing enriched data in candidate_profiles table');
    const { error: upsertError } = await supabase
      .from('candidate_profiles')
      .upsert(profileData, {
        onConflict: 'candidate_id',
        ignoreDuplicates: false,
      });
    
    if (upsertError) {
      console.error('Error upserting candidate profile data:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store enriched candidate data', details: upsertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Candidate profile enriched successfully',
        match_likelihood: pdlData.likelihood || 0,
        profile_id: pdlData.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in enrich-candidate function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error in enrichment process' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 