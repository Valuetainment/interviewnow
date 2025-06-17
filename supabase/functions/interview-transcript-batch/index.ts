import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { corsHeaders } from '../_shared/cors.ts';

interface TranscriptBatchEntry {
  text: string;
  speaker: string;
  timestamp: string;
  confidence?: number;
  source?: 'hybrid' | 'sdp_proxy';
}

interface TranscriptBatchRequest {
  interview_session_id: string;
  entries: TranscriptBatchEntry[];
}

interface TranscriptBatchResponse {
  success: boolean;
  saved_count?: number;
  error?: string;
}

const MAX_BATCH_SIZE = 50; // Maximum entries per batch

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('Received transcript batch request');
    
    // Get request data
    const requestData: TranscriptBatchRequest = await req.json();
    const { interview_session_id, entries } = requestData;
    
    // Validate request
    if (!interview_session_id || !entries || !Array.isArray(entries)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: interview_session_id and entries array are required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    // Validate batch size
    if (entries.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Entries array cannot be empty' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    if (entries.length > MAX_BATCH_SIZE) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE} entries` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    console.log(`Processing batch of ${entries.length} transcript entries for session: ${interview_session_id}`);
    
    // Create Supabase client
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
    
    // Check if interview session exists and get tenant_id
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('interview_sessions')
      .select('id, status, tenant_id')
      .eq('id', interview_session_id)
      .single();
    
    if (sessionError || !sessionData) {
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
    
    console.log('Session verified:', { 
      id: sessionData.id, 
      status: sessionData.status, 
      tenant_id: sessionData.tenant_id 
    });
    
    // Prepare entries for insertion
    const transcriptRecords = entries.map(entry => ({
      session_id: interview_session_id,
      tenant_id: sessionData.tenant_id,
      text: entry.text,
      start_ms: 0, // Required field, always 0 for now
      timestamp: entry.timestamp || new Date().toISOString(),
      speaker: entry.speaker || 'unknown',
      confidence: entry.confidence,
      source_architecture: entry.source || 'hybrid'
    }));
    
    // Insert all entries in a single transaction
    const { data: insertedData, error: insertError } = await supabaseClient
      .from('transcript_entries')
      .insert(transcriptRecords)
      .select('id');
    
    if (insertError) {
      console.error('Batch insert error:', insertError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to store transcript batch: ${insertError.message}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    const savedCount = insertedData?.length || 0;
    console.log(`Batch saved successfully: ${savedCount} entries`);
    
    // Return success with count
    const response: TranscriptBatchResponse = {
      success: true,
      saved_count: savedCount
    };
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Error processing transcript batch request:', error);
    
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