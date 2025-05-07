import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { corsHeaders } from '../_shared/cors.ts';

interface TranscriptRequest {
  interview_session_id: string;
  text: string;
  timestamp?: string;
  speaker?: string;
  confidence?: number;
}

interface TranscriptResponse {
  success: boolean;
  entry_id?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get request data
    const requestData: TranscriptRequest = await req.json();
    const { interview_session_id, text, timestamp, speaker, confidence } = requestData;
    
    if (!interview_session_id || !text) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: interview_session_id and text are required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    
    // Check if interview session exists and is active
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('interview_sessions')
      .select('id, status, tenant_id')
      .eq('id', interview_session_id)
      .single();
    
    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Interview session not found or not accessible' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }
    
    // Check if session is active
    if (sessionData.status !== 'in_progress') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Interview session is not active' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    // Store transcript entry
    const { data: transcriptData, error: transcriptError } = await supabaseClient
      .from('transcript_entries')
      .insert({
        interview_session_id,
        text,
        timestamp: timestamp || new Date().toISOString(),
        speaker,
        confidence
      })
      .select('id')
      .single();
    
    if (transcriptError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to store transcript: ${transcriptError.message}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    // Return success with entry ID
    const response: TranscriptResponse = {
      success: true,
      entry_id: transcriptData.id
    };
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Error processing transcript storage request:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Internal server error: ${error.message}` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
}); 