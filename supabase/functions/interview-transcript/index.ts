import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { corsHeaders } from '../_shared/cors.ts';

interface TranscriptRequest {
  interview_session_id: string;
  text: string;
  timestamp?: string;
  speaker?: string;
  confidence?: number;
  source?: 'hybrid' | 'sdp_proxy'; // Indicates which architecture sent the transcript
}

interface TranscriptResponse {
  success: boolean;
  entry_id?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Log the request for debugging
    console.log('Received transcript request');
    
    // Get request data
    const requestData: TranscriptRequest = await req.json();
    const { interview_session_id, text, timestamp, speaker, confidence, source = 'sdp_proxy' } = requestData;
    
    console.log('Request data:', { interview_session_id, speaker, source, textLength: text?.length });
    
    if (!interview_session_id || !text) {
      console.error('Missing required parameters');
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
    
    // Create Supabase client with proper error handling
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    
    // Check if interview session exists and is active
    console.log('Checking interview session:', interview_session_id);
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('interview_sessions')
      .select('id, status, tenant_id')
      .eq('id', interview_session_id)
      .single();
    
    if (sessionError) {
      console.error('Session lookup error:', sessionError);
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
    
    if (!sessionData) {
      console.error('No session data found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Interview session not found' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }
    
    console.log('Session data:', { id: sessionData.id, status: sessionData.status, tenant_id: sessionData.tenant_id });
    
    // Check if session is active - make this check optional for now
    if (sessionData.status !== 'in_progress' && sessionData.status !== 'scheduled') {
      console.warn('Session is not in progress, but allowing transcript storage. Status:', sessionData.status);
    }
    
    // Determine speaker based on source and provided value
    let finalSpeaker = speaker || 'unknown';
    
    console.log('Storing transcript entry with speaker:', finalSpeaker);
    
    // Store transcript entry
    const { data: transcriptData, error: transcriptError } = await supabaseClient
      .from('transcript_entries')
      .insert({
        session_id: interview_session_id, // Note: column is named session_id, not interview_session_id
        tenant_id: sessionData.tenant_id, // Ensure tenant_id is set for security
        text,
        start_ms: 0,
        timestamp: timestamp || new Date().toISOString(),
        speaker: finalSpeaker,
        confidence,
        source_architecture: source // Track which architecture sent this
      })
      .select('id')
      .single();
    
    if (transcriptError) {
      console.error('Transcript storage error:', transcriptError);
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
    
    console.log('Transcript stored successfully:', transcriptData?.id);
    
    // Return success with entry ID
    const response: TranscriptResponse = {
      success: true,
      entry_id: transcriptData?.id
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