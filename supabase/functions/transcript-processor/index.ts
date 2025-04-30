// Supabase Edge Function to process real-time transcription using OpenAI API
import { OpenAI } from "npm:openai@4.29.0";

// CORS headers to allow browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.info('Transcript processor started');

// Main handler function using Deno.serve as recommended in guidelines
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, tenant_id, audio_chunk, speaker, sequence_number } = await req.json();

    // Validate required parameters
    if (!session_id || !tenant_id || !audio_chunk) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: session_id, tenant_id, and audio_chunk are required",
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Setup OpenAI client
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
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
      };

      // Store transcript entry in the database
      const { data, error } = await req.supabaseClient
        .from("transcript_entries")
        .insert(entry)
        .select("id")
        .single();

      if (error) {
        console.error("Error storing transcript entry:", error);
        return new Response(
          JSON.stringify({ error: "Failed to store transcript" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      // Broadcast transcript update via Realtime
      const channelName = `interview:${session_id}`;
      await req.supabaseClient.channel(channelName).send({
        type: "broadcast",
        event: "transcript.new",
        payload: {
          id: data.id,
          ...entry,
        },
      });

      // Return successful response
      return new Response(
        JSON.stringify({
          id: data.id,
          text: transcriptionResult.text,
          confidence: transcriptionResult.confidence,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "No transcription result" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  } catch (error) {
    console.error("Error processing transcription:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
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

    // Call OpenAI API to transcribe audio
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
    };
  } catch (error) {
    console.error("Error in processAudioChunk:", error);
    return null;
  }
} 