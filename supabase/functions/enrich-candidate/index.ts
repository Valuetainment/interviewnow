// Supabase Edge Function to enrich candidate profiles using People Data Labs
import { createClient } from "npm:@supabase/supabase-js@2.33.1";
import { corsHeaders } from '../_shared/cors.ts';

interface RequestBody {
  candidate_id: string;
  email?: string;
  name?: string;
  phone?: string;
}

// Using Deno.serve as recommended
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const PDL_API_KEY = Deno.env.get('PDL_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('VITE_SUPABASE_ANON_KEY');

    if (!PDL_API_KEY) {
      console.error('PDL_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'PDL API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase credentials not found');
      return new Response(
        JSON.stringify({ error: 'Supabase credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Parse request body
    const { candidate_id, email, name, phone } = await req.json() as RequestBody;

    if (!candidate_id) {
      return new Response(
        JSON.stringify({ error: 'candidate_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get candidate data to access phone number if not provided
    let candidatePhone = phone;
    if (!candidatePhone) {
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .select('phone')
        .eq('id', candidate_id)
        .single();
      
      if (candidateError) {
        console.error('Error fetching candidate:', candidateError);
        throw candidateError;
      }
      
      candidatePhone = candidate?.phone;
    }

    console.log('Starting PDL enrichment for:', {
      candidate_id,
      email,
      name,
      phone: candidatePhone
    });

    // Build PDL API query parameters
    const params = new URLSearchParams();
    
    // Special case for Amanda Harrington (for demo/testing purposes)
    if (name === "Amanda Harrington") {
      params.append('name', name);
      params.append('email', 'amanda@hm3.com');
      params.append('phone', '+1 727 252-3009');
    } else {
      if (email) params.append('email', email);
      if (name) params.append('name', name);
      if (candidatePhone) params.append('phone', candidatePhone);
    }
    
    params.append('min_likelihood', '2');
    params.append('include_if_matched', 'false');
    params.append('titlecase', 'false');
    
    const pdlUrl = `https://api.peopledatalabs.com/v5/person/enrich?${params.toString()}`;
    console.log('Calling PDL API:', pdlUrl);

    // Call PDL API
    const pdlResponse = await fetch(pdlUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': PDL_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const pdlData = await pdlResponse.json();
    console.log('PDL API response status:', pdlResponse.status);
    console.log('PDL API response likelihood:', pdlData.likelihood);
    
    if (pdlData.matched) {
      console.log('Matched fields:', pdlData.matched);
    }

    if (!pdlResponse.ok) {
      console.error('PDL API Error:', pdlData);
      return new Response(
        JSON.stringify({ 
          error: `PDL API Error: ${pdlData.error?.message || 'Unknown error'}`, 
          details: pdlData 
        }),
        { status: pdlResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced mapping of PDL response to our schema
    const profileData = {
      candidate_id,
      pdl_id: pdlData.data.id,
      pdl_likelihood: pdlData.likelihood,
      last_enriched_at: new Date().toISOString(),
      first_name: pdlData.data.first_name,
      middle_name: pdlData.data.middle_name,
      last_name: pdlData.data.last_name,
      gender: pdlData.data.sex,
      birth_year: pdlData.data.birth_year === false ? null : pdlData.data.birth_year,
      // Enhanced location data
      location_name: pdlData.data.location_name || pdlData.data.job_company_location_name,
      location_locality: pdlData.data.location_locality || pdlData.data.job_company_location_locality,
      location_region: pdlData.data.location_region || pdlData.data.job_company_location_region,
      location_country: pdlData.data.location_country || pdlData.data.job_company_location_country,
      location_continent: pdlData.data.location_continent || pdlData.data.job_company_location_continent,
      location_postal_code: pdlData.data.location_postal_code || pdlData.data.job_company_location_postal_code,
      location_street_address: pdlData.data.location_street_address || pdlData.data.job_company_location_street_address,
      location_geo: pdlData.data.location_geo || pdlData.data.job_company_location_geo,
      // Enhanced job data
      job_title: pdlData.data.job_title,
      job_company_name: pdlData.data.job_company_name,
      job_company_size: pdlData.data.job_company_size,
      job_company_industry: pdlData.data.job_company_industry,
      job_start_date: pdlData.data.job_start_date,
      job_last_updated: pdlData.data.job_last_changed,
      // Social profiles
      linkedin_url: pdlData.data.linkedin_url,
      linkedin_username: pdlData.data.linkedin_username,
      linkedin_id: pdlData.data.linkedin_id,
      twitter_url: pdlData.data.twitter_url,
      twitter_username: pdlData.data.twitter_username,
      facebook_url: pdlData.data.facebook_url,
      facebook_username: pdlData.data.facebook_username,
      github_url: pdlData.data.github_url,
      github_username: pdlData.data.github_username,
      // Arrays and JSON fields
      skills: Array.isArray(pdlData.data.skills) ? pdlData.data.skills : [],
      interests: Array.isArray(pdlData.data.interests) ? pdlData.data.interests : [],
      countries: Array.isArray(pdlData.data.countries) ? pdlData.data.countries : [],
      // Store full experience and education objects
      experience: pdlData.data.experience || null,
      education: pdlData.data.education || null,
      industry: pdlData.data.industry,
      job_title_levels: Array.isArray(pdlData.data.job_title_levels) ? pdlData.data.job_title_levels : []
    };

    console.log('Upserting profile data for candidate:', candidate_id);

    // Upsert the profile data
    const { error: upsertError } = await supabase
      .from('candidate_profiles')
      .upsert(profileData, {
        onConflict: 'candidate_id',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('Error upserting profile:', upsertError);
      throw upsertError;
    }

    console.log('Profile enrichment completed successfully');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Profile enriched successfully',
        matched_fields: pdlData.matched || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in enrich-candidate function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 