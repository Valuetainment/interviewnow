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
    
    if (!candidate_id) {
      return new Response(
        JSON.stringify({ error: 'Candidate ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get PDL API key from environment
    const pdlApiKey = Deno.env.get('PDL_API_KEY');
    if (!pdlApiKey) {
      return new Response(
        JSON.stringify({ error: 'People Data Labs API key not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Prepare PDL API call
    const pdlEndpoint = 'https://api.peopledatalabs.com/v5/person/enrich';
    
    // Build params based on available data
    const params: Record<string, string> = {};
    if (email) params.email = email;
    if (name) params.name = name;
    if (phone) params.phone = phone;
    
    if (Object.keys(params).length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one of: email, name, or phone is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Make PDL API request
    const response = await fetch(pdlEndpoint, {
      method: 'GET',
      headers: {
        'X-Api-Key': pdlApiKey,
        'Content-Type': 'application/json',
      },
      // PDL API expects query params, not a JSON body
      // Convert params object to URL query string
      // TODO: handle cases where data needs preprocessing
    });
    
    // Handle PDL API response
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `PDL API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const pdlData = await response.json();
    
    // Update candidate record with enriched data
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        enrichment_data: pdlData,
        enriched_at: new Date().toISOString(),
      })
      .eq('id', candidate_id);
    
    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update candidate with enriched data', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Candidate profile enriched successfully',
        match_likelihood: pdlData.likelihood || 0
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