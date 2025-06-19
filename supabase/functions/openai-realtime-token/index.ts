import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

// CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenRequest {
  model?: string;
  voice?: string;
  session_id: string;
  tenant_id?: string;
}

interface OpenAITokenResponse {
  id: string;
  model: string;
  client_secret: {
    value: string;
    expires_at: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Parse request body
    const body: TokenRequest = await req.json();
    const { 
      model = 'gpt-4o-realtime-preview-2025-06-03', 
      voice = 'verse', 
      session_id,
      tenant_id 
    } = body;

    // Validate required parameters
    if (!session_id) {
      throw new Error('session_id is required');
    }

    console.log(`Generating ephemeral token for session ${session_id}, tenant ${tenant_id || 'unknown'}`);

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Call OpenAI API to get ephemeral token
    const openaiResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        model, 
        voice 
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data: OpenAITokenResponse = await openaiResponse.json();

    // Log token generation for monitoring
    console.log(`Ephemeral token generated successfully for session ${session_id}`);
    console.log(`Token expires at: ${new Date(data.client_secret.expires_at * 1000).toISOString()}`);

    // Optionally verify the session exists in the database
    if (authHeader.startsWith('Bearer ')) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') || '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        );

        const { data: sessionData, error: sessionError } = await supabaseClient
          .from('interview_sessions')
          .select('id, status')
          .eq('id', session_id)
          .single();

        if (sessionError || !sessionData) {
          console.warn(`Session ${session_id} not found in database`);
        } else {
          console.log(`Session ${session_id} verified, status: ${sessionData.status}`);
        }
      } catch (dbError) {
        // Log but don't fail if database check fails
        console.warn('Database verification failed:', dbError);
      }
    }

    // Return the token data to the client
    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error generating ephemeral token:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate ephemeral token',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message?.includes('authorization') ? 401 : 400,
      }
    );
  }
});