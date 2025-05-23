// Supabase Edge Function to process real-time transcription using OpenAI API
// Enhanced for hybrid architecture support with improved tenant isolation and error handling
import { OpenAI } from "npm:openai@4.29.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

// CORS headers with enhanced security settings
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tenant-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Security-Policy': "default-src 'self'; connect-src *.openai.com",
  'X-Content-Type-Options': 'nosniff',
};

// Operation log with request tracking
const operationId = crypto.randomUUID();
console.info(`Transcript processor started [${operationId}]`);

// Validate JWT token for tenant authorization
async function validateJwtToken(token, tenant_id) {
  try {
    if (!token) {
      return { valid: false, error: 'Missing JWT token' };
    }

    // For production, we'd use a proper JWT library for verification
    // This is a simplified implementation for demonstration
    const [header, payload, signature] = token.split('.');

    if (!header || !payload || !signature) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Decode the payload
    const payloadData = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

    // Verify token expiration
    if (payloadData.exp && payloadData.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }

    // Verify tenant_id matches the one in the token
    if (payloadData.tenant_id !== tenant_id) {
      return { valid: false, error: 'Tenant ID mismatch - unauthorized access' };
    }

    return { valid: true, tenantId: payloadData.tenant_id, userId: payloadData.sub };
  } catch (error) {
    console.error(`Token validation error [${operationId}]:`, error);
    return { valid: false, error: 'Token validation failed' };
  }
}

// Main handler function using Deno.serve as recommended in guidelines
Deno.serve(async (req) => {
  // Start timing for performance monitoring
  const startTime = performance.now();
  let tenantId = null;

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      session_id,
      tenant_id,
      audio_chunk,
      speaker,
      sequence_number,
      architecture = 'hybrid', // Default to hybrid architecture
      jwt_token
    } = await req.json();

    console.info(`Processing transcript request for session ${session_id} [${operationId}]`);
    tenantId = tenant_id;

    // Validate required parameters
    if (!session_id || !tenant_id || !audio_chunk) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: session_id, tenant_id, and audio_chunk are required",
          operation_id: operationId
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Validate JWT token
    if (jwt_token) {
      const validation = await validateJwtToken(jwt_token, tenant_id);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            error: validation.error,
            operation_id: operationId
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // Setup OpenAI client
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured",
          operation_id: operationId
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Process audio chunk with OpenAI's real-time API
    const transcriptionResult = await processAudioChunk(openai, audio_chunk);

    if (transcriptionResult && transcriptionResult.text) {
      // Create transcript entry in the database
      const entry = {
        tenant_id: tenant_id,
        session_id: session_id,
        speaker: speaker || "unknown",
        text: transcriptionResult.text,
        start_ms: Date.now(), // Use current timestamp
        confidence: transcriptionResult.confidence || 0.0,
        sequence_number: sequence_number || 0,
        architecture: architecture, // Track which architecture produced this entry
        source: "webrtc" // Identify source for analytics
      };

      // Get Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Verify the session belongs to the specified tenant
      const { data: sessionData, error: sessionError } = await supabase
        .from("interview_sessions")
        .select("id, tenant_id")
        .eq("id", session_id)
        .eq("tenant_id", tenant_id)
        .single();

      if (sessionError || !sessionData) {
        console.error(`Session validation error [${operationId}]:`, sessionError);
        return new Response(
          JSON.stringify({
            error: "Session validation failed - session not found or unauthorized",
            operation_id: operationId
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      // Store transcript entry in the database
      const { data, error } = await supabase
        .from("transcript_entries")
        .insert(entry)
        .select("id")
        .single();

      if (error) {
        console.error(`Error storing transcript entry [${operationId}]:`, error);
        return new Response(
          JSON.stringify({
            error: "Failed to store transcript",
            details: error.message,
            operation_id: operationId
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      // Broadcast transcript update via Realtime
      const channelName = `interview:${session_id}`;
      const broadcastResult = await supabase.channel(channelName).send({
        type: "broadcast",
        event: "transcript.new",
        payload: {
          id: data.id,
          ...entry,
        },
      });

      // Calculate performance metrics
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Log operational metrics
      console.info(`Transcript processed successfully [${operationId}]. Processing time: ${processingTime.toFixed(2)}ms`);

      // Return successful response with performance data
      return new Response(
        JSON.stringify({
          id: data.id,
          text: transcriptionResult.text,
          confidence: transcriptionResult.confidence,
          processing_time_ms: processingTime,
          operation_id: operationId,
          architecture: architecture
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          error: "No transcription result",
          operation_id: operationId
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error(`Error processing transcription [${operationId}]:`, error);

    // Record error metrics for monitoring
    try {
      // In production, we'd send these metrics to a monitoring system
      const errorMetrics = {
        operation_id: operationId,
        tenant_id: tenantId,
        error_type: error.name,
        error_message: error.message,
        timestamp: new Date().toISOString()
      };
      console.error(`Error metrics [${operationId}]:`, JSON.stringify(errorMetrics));
    } catch (metricError) {
      // Ignore metric recording errors
    }

    return new Response(
      JSON.stringify({
        error: error.message || "An unknown error occurred",
        operation_id: operationId
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

/**
 * Process audio chunk with OpenAI's real-time API
 *
 * @param openai - OpenAI client
 * @param audioChunk - Base64 encoded audio chunk
 * @returns Object containing transcribed text and confidence
 */
async function processAudioChunk(
  openai,
  audioChunk
) {
  try {
    // Decode base64 audio chunk
    const binaryAudio = Uint8Array.from(atob(audioChunk), c => c.charCodeAt(0));

    // Create a blob for the audio data
    const audioBlob = new Blob([binaryAudio], { type: 'audio/webm' });

    // Create form data for the API request
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');
    formData.append('temperature', '0');
    formData.append('language', 'en');
    formData.append('timestamp_granularities', 'segment');

    // Call OpenAI API to transcribe audio with proper error handling
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openai.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    return {
      text: result.text,
      confidence: result.segments?.length > 0 ? result.segments[0].confidence : 0.5,
      segments: result.segments,
      language: result.language
    };
  } catch (error) {
    console.error(`Error in processAudioChunk [${operationId}]:`, error);
    return null;
  }
} 