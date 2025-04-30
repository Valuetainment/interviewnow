// Supabase Edge Function to enrich candidate profiles using People Data Labs API
import { createClient } from "npm:@supabase/supabase-js@2.33.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  candidate_id: string;
  email?: string;
  name?: string;
  phone?: string;
  linkedin_url?: string;
}

interface PDLResponse {
  status: number;
  likelihood: number;
  data: PDLPersonData;
  [key: string]: any;
}

interface PDLPersonData {
  id?: string;
  full_name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  gender?: string;
  birth_year?: number;
  linkedin_url?: string;
  linkedin_username?: string;
  linkedin_id?: string;
  facebook_url?: string;
  facebook_username?: string;
  twitter_url?: string;
  twitter_username?: string;
  github_url?: string;
  github_username?: string;
  work_email?: string;
  personal_emails?: string[];
  mobile_phone?: string;
  industry?: string;
  job_title?: string;
  job_title_levels?: string[];
  job_company_name?: string;
  job_company_size?: string;
  job_company_industry?: string;
  job_start_date?: string;
  job_last_updated?: string;
  location_name?: string;
  location_locality?: string;
  location_region?: string;
  location_country?: string;
  location_continent?: string;
  location_postal_code?: string;
  location_street_address?: string;
  location_geo?: string;
  skills?: string[];
  interests?: string[];
  countries?: string[];
  education?: any[];
  experience?: any[];
  [key: string]: any;
}

// Using Deno.serve as recommended
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidate_id, email, name, phone, linkedin_url } = await req.json() as RequestBody;

    if (!candidate_id) {
      return new Response(
        JSON.stringify({ error: 'Candidate ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // We need at least one identifier for PDL
    if (!email && !name && !phone && !linkedin_url) {
      return new Response(
        JSON.stringify({ error: 'At least one identifier (email, name, phone, or linkedin_url) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key from environment variables
    const pdlApiKey = Deno.env.get('PDL_API_KEY') || 
                      Deno.env.get('VITE_PDL_API_KEY');
                      
    if (!pdlApiKey) {
      console.error('People Data Labs API key not found');
      return new Response(
        JSON.stringify({ error: 'People Data Labs API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Supabase credentials for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, get the tenant_id from the candidate record
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('tenant_id, email, full_name, phone')
      .eq('id', candidate_id)
      .single();

    if (candidateError || !candidate) {
      console.error('Error fetching candidate:', candidateError);
      return new Response(
        JSON.stringify({ error: 'Candidate not found', details: candidateError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct parameters for PDL API
    const params = new URLSearchParams();
    
    // Use provided parameters first, fallback to candidate data
    if (email) {
      params.append('email', email);
    } else if (candidate.email) {
      params.append('email', candidate.email);
    }
    
    if (name) {
      params.append('name', name);
    } else if (candidate.full_name) {
      params.append('name', candidate.full_name);
    }
    
    if (phone) {
      params.append('phone', phone);
    } else if (candidate.phone) {
      params.append('phone', candidate.phone);
    }
    
    if (linkedin_url) {
      params.append('profile', linkedin_url);
    }
    
    // Require essential fields and limit data size
    params.append('required', 'full_name');
    params.append('pretty', 'false');
    
    console.log('PDL API key found, enriching candidate profile...');
    console.log('Using parameters:', Object.fromEntries(params.entries()));

    // Call PDL API to enrich the candidate profile
    const pdlUrl = `https://api.peopledatalabs.com/v5/person/enrich?${params.toString()}`;
    const pdlResponse = await fetch(pdlUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': pdlApiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    // Parse the PDL response
    const pdlData = await pdlResponse.json() as PDLResponse;
    
    if (pdlData.status !== 200) {
      console.error('PDL API error:', pdlData);
      return new Response(
        JSON.stringify({ 
          error: 'Error enriching candidate profile', 
          details: pdlData.error ? pdlData.error : 'Unknown error',
          status: pdlData.status
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received PDL data with likelihood:', pdlData.likelihood);

    // Prepare the data for storage
    const personData = pdlData.data;
    
    // Store the enriched profile in the database
    const { data: profile, error: profileError } = await supabase
      .from('candidate_profiles')
      .upsert({
        candidate_id: candidate_id,
        tenant_id: candidate.tenant_id,
        
        // Personal Info
        first_name: personData.first_name,
        middle_name: personData.middle_name,
        last_name: personData.last_name,
        gender: personData.gender,
        birth_year: personData.birth_year,
        
        // Location
        location_name: personData.location_name,
        location_locality: personData.location_locality,
        location_region: personData.location_region,
        location_country: personData.location_country,
        location_continent: personData.location_continent,
        location_postal_code: personData.location_postal_code,
        location_street_address: personData.location_street_address,
        location_geo: personData.location_geo,
        
        // Job Info
        job_title: personData.job_title,
        job_company_name: personData.job_company_name,
        job_company_size: personData.job_company_size,
        job_company_industry: personData.job_company_industry,
        job_start_date: personData.job_start_date,
        job_last_updated: personData.job_last_updated,
        industry: personData.industry,
        
        // Social Media
        linkedin_url: personData.linkedin_url,
        linkedin_username: personData.linkedin_username,
        linkedin_id: personData.linkedin_id,
        twitter_url: personData.twitter_url,
        twitter_username: personData.twitter_username,
        facebook_url: personData.facebook_url,
        facebook_username: personData.facebook_username,
        github_url: personData.github_url,
        github_username: personData.github_username,
        
        // Skills and Interests
        skills: personData.skills,
        interests: personData.interests,
        countries: personData.countries,
        
        // Additional Info
        experience: personData.experience ? JSON.stringify(personData.experience) : null,
        education: personData.education ? JSON.stringify(personData.education) : null,
        job_title_levels: personData.job_title_levels,
        
        // PDL Metadata
        pdl_source_id: personData.id,
        pdl_updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error storing enriched profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Error storing enriched profile', details: profileError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile_id: profile.id,
        likelihood: pdlData.likelihood
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in enrich-candidate function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 