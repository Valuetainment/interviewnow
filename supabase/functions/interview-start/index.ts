import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { corsHeaders } from '../_shared/cors.ts';

interface InterviewStartRequest {
  interview_session_id: string;
  tenant_id: string;
  region?: string;
}

interface InterviewResponse {
  success: boolean;
  webrtc_server_url?: string;
  webrtc_session_id?: string;
  error?: string;
}

async function setupFlyVM(tenantId: string, sessionId: string, region = 'mia'): Promise<{ url: string, error?: string }> {
  try {
    // In a real implementation, this would use the Fly.io API to provision a new VM
    // For now, we'll use a mock implementation that assumes the VM already exists
    
    // Construct VM name using tenant and session ID for isolation
    const vmName = `interview-proxy-${tenantId}-${sessionId.substring(0, 8)}`;
    
    // Generate a token for secure access to the VM (would be a real secure token in production)
    const secureToken = crypto.randomUUID();
    
    // In production, we would make API calls to Fly.io to:
    // 1. Create the VM with the desired configuration
    // 2. Set the necessary secrets (OPENAI_API_KEY, JWT_SECRET)
    // 3. Deploy the WebRTC proxy application
    // 4. Wait for the VM to be ready
    
    // Mock VM URL (in production, this would be the actual VM URL)
    const vmUrl = `wss://${vmName}.fly.dev?token=${secureToken}`;
    
    return { url: vmUrl };
  } catch (error) {
    console.error('Error setting up Fly VM:', error);
    return { url: '', error: error.message };
  }
}

async function updateInterviewSession(
  supabase: any, 
  sessionId: string, 
  webrtcServerUrl: string, 
  webrtcSessionId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('interview_sessions')
      .update({
        webrtc_status: 'ready',
        webrtc_server_url: webrtcServerUrl,
        webrtc_session_id: webrtcSessionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating interview session:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get request data
    const requestData: InterviewStartRequest = await req.json();
    const { interview_session_id, tenant_id, region } = requestData;
    
    if (!interview_session_id || !tenant_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: interview_session_id and tenant_id are required' 
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
    
    // Check if interview session exists and is valid
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
    
    // Verify tenant ID matches (extra security check)
    if (sessionData.tenant_id !== tenant_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tenant ID mismatch - unauthorized access' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      );
    }
    
    // Set up Fly.io VM for the interview
    const { url: webrtcServerUrl, error: vmError } = await setupFlyVM(
      tenant_id,
      interview_session_id,
      region
    );
    
    if (vmError || !webrtcServerUrl) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to set up WebRTC server: ${vmError || 'Unknown error'}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    // Generate a WebRTC session ID
    const webrtcSessionId = crypto.randomUUID();
    
    // Update the interview session with WebRTC information
    const updateSuccess = await updateInterviewSession(
      supabaseClient,
      interview_session_id,
      webrtcServerUrl,
      webrtcSessionId
    );
    
    if (!updateSuccess) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update interview session with WebRTC details' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    // Return success with connection details
    const response: InterviewResponse = {
      success: true,
      webrtc_server_url: webrtcServerUrl,
      webrtc_session_id: webrtcSessionId
    };
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Error processing interview start request:', error);
    
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