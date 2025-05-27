import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get request data
    const requestData: TranscriptRequest = await req.json();
    const { interview_session_id, text, timestamp, speaker, confidence, source = 'sdp_proxy' } = requestData;
    
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
    
    // Check if we need to determine the architecture
    let architecture = null;

    if (!speaker && source === 'hybrid') {
      // For hybrid architecture, try to determine the speaker from session information
      // In a real implementation, this would use more advanced logic
      // This is a simplified example
      const { data: sessionArchData } = await supabaseClient
        .from('interview_sessions')
        .select('webrtc_architecture')
        .eq('id', interview_session_id)
        .single();

      architecture = sessionArchData?.webrtc_architecture || 'sdp_proxy';
    }

    // Determine speaker based on architecture and provided speaker value
    let finalSpeaker = speaker;
    if (!finalSpeaker && source === 'hybrid') {
      // If we don't have a speaker but are using hybrid architecture,
      // we can make a reasonable guess based on pattern matching
      if (text && text.trim().startsWith('User:')) {
        finalSpeaker = 'candidate';
      } else if (text && text.trim().startsWith('AI:')) {
        finalSpeaker = 'ai';
      } else {
        finalSpeaker = 'unknown';
      }
    }

    // Store transcript entry
    const { data: transcriptData, error: transcriptError } = await supabaseClient
      .from('transcript_entries')
      .insert({
        session_id: interview_session_id, // Note: column is named session_id, not interview_session_id
        tenant_id: sessionData.tenant_id, // Ensure tenant_id is set for security
        text,
        timestamp: timestamp || new Date().toISOString(),
        speaker: finalSpeaker || 'unknown', // Use determined speaker or default
        confidence,
        source_architecture: source // Track which architecture sent this
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