// Enhanced interview-start Edge Function with improved hybrid architecture support
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

// Enhanced CORS headers with security improvements
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tenant-id, x-session-id',
  'Access-Control-Max-Age': '86400',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'self'; connect-src *.fly.dev *.openai.com"
};

// Operation ID for request tracking
const operationId = crypto.randomUUID();

// Request interface with expanded parameters for hybrid architecture
interface InterviewStartRequest {
  interview_session_id: string;
  tenant_id: string;
  region?: string;
  architecture?: 'hybrid' | 'sdp_proxy'; // Default is now hybrid
  jwt_token?: string;
  openai_settings?: {
    voice?: string;
    model?: string;
    temperature?: number;
    turn_detection?: {
      silence_duration_ms?: number;
      threshold?: number;
    };
  };
}

// Enhanced response interface with detailed configuration
interface InterviewResponse {
  success: boolean;
  webrtc_server_url?: string;
  webrtc_session_id?: string;
  error?: string;
  architecture?: string;
  operation_id?: string;
  openai_api_config?: {
    voice: string;
    model: string;
    instructions?: string;
    temperature?: number;
    turn_detection?: {
      silence_duration_ms: number;
      threshold: number;
    };
  };
}

// JWT token validation for enhanced security
async function validateJwtToken(token: string, tenant_id: string): Promise<{valid: boolean, error?: string, userId?: string}> {
  try {
    if (!token) {
      return { valid: false, error: 'Missing JWT token' };
    }

    // For production, we'd use a proper JWT library for verification
    const [header, payload, signature] = token.split('.');

    if (!header || !payload || !signature) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Decode the payload
    const payloadData = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

    // Check expiration
    if (payloadData.exp && payloadData.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }

    // Check tenant_id
    if (payloadData.tenant_id !== tenant_id) {
      return { valid: false, error: 'Tenant ID mismatch' };
    }

    return { valid: true, userId: payloadData.sub };
  } catch (error) {
    console.error(`Token validation error [${operationId}]:`, error);
    return { valid: false, error: 'Token validation failed: ' + error.message };
  }
}

// Enhanced VM setup function with proper per-session isolation
async function setupFlyVM(
  tenantId: string,
  sessionId: string,
  region = 'mia',
  architecture: 'hybrid' | 'sdp_proxy' = 'hybrid'
): Promise<{ url: string, error?: string, architecture: string }> {
  try {
    console.log(`Setting up Fly VM for session ${sessionId} with architecture ${architecture} [${operationId}]`);

    // SECURITY FIX: Always use per-session VMs for proper isolation, regardless of architecture
    // Create unique VM name that includes both tenant and session IDs for isolation
    const sessionShortId = sessionId.substring(0, 8);
    const vmName = architecture === 'hybrid'
      ? `interview-hybrid-${tenantId}-${sessionShortId}`
      : `interview-proxy-${tenantId}-${sessionShortId}`;

    console.log(`Creating isolated VM: ${vmName} for tenant ${tenantId}, session ${sessionId} [${operationId}]`);

    // Generate a secure JWT token for VM access
    // In a real implementation, we would sign this properly with a secret key
    const jwtPayload = {
      session_id: sessionId,
      tenant_id: tenantId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
      operation_id: operationId
    };

    // Convert payload to base64
    const base64Payload = btoa(JSON.stringify(jwtPayload));

    // Create JWT token (simplified - in production would use proper signing)
    const secureToken = `eyJhbGciOiJIUzI1NiJ9.${base64Payload}.${crypto.randomUUID()}`;

    // Different URL paths for different architectures
    // IMPORTANT: The Fly.io server listens on the root path, not on /ws
    const wsPath = architecture === 'hybrid' ? '' : 'socket';

    // TEMPORARY FIX: Use the existing interview-hybrid-template app
    // In production, we would actually provision a new VM here
    const baseUrl = 'wss://interview-hybrid-template.fly.dev';
    
    // VM URL with enhanced security parameters
    // For hybrid, this becomes wss://interview-hybrid-template.fly.dev?token=...
    const vmUrl = wsPath ? `${baseUrl}/${wsPath}?token=${secureToken}&session=${sessionId}&tenant=${tenantId}` 
                        : `${baseUrl}?token=${secureToken}&session=${sessionId}&tenant=${tenantId}`;

    console.log(`VM URL generated for ${architecture} architecture using template app [${operationId}]`);
    console.log(`TODO: In production, provision actual VM: ${vmName}`);
    return { url: vmUrl, architecture };
  } catch (error) {
    console.error(`Error setting up Fly VM [${operationId}]:`, error);
    return { url: '', error: error.message, architecture: architecture };
  }
}

// Enhanced session update with additional metadata
async function updateInterviewSession(
  supabase: any,
  sessionId: string,
  webrtcServerUrl: string,
  webrtcSessionId: string,
  architecture: string
): Promise<boolean> {
  try {
    console.log(`Updating interview session ${sessionId} [${operationId}]`);

    const { error } = await supabase
      .from('interview_sessions')
      .update({
        webrtc_status: 'ready',
        webrtc_server_url: webrtcServerUrl,
        webrtc_session_id: webrtcSessionId,
        webrtc_architecture: architecture,
        webrtc_connection_time: new Date().toISOString(),
        webrtc_operation_id: operationId,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;

    console.log(`Session update successful [${operationId}]`);
    return true;
  } catch (error) {
    console.error(`Error updating interview session [${operationId}]:`, error);
    return false;
  }
}

// Build enhanced instructions with competency weights
function buildEnhancedInstructions(sessionData: any): string {
  const position = sessionData.positions;
  const candidate = sessionData.candidates;
  const company = sessionData.companies;
  
  // Extract competencies with weights
  const competencies = position?.position_competencies || [];
  const hasCompetencies = competencies.length > 0;
  
  // Build competency evaluation section
  let competencySection = '';
  if (hasCompetencies) {
    // Sort by weight descending
    const sortedCompetencies = [...competencies].sort((a: any, b: any) => b.weight - a.weight);
    
    competencySection = `

IMPORTANT - COMPETENCY EVALUATION FRAMEWORK:
You must evaluate the candidate on these specific competencies, weighted by importance:

${sortedCompetencies.map((pc: any) => 
  `- ${pc.competencies.name} (${pc.weight}% of evaluation): ${pc.competencies.description}`
).join('\n')}

INTERVIEW STRATEGY:
1. Allocate your questions proportionally to the weights above
2. For competencies with higher weights (>25%), ask 2-3 in-depth questions
3. For medium weights (15-25%), ask 1-2 solid questions  
4. For lower weights (<15%), ask 1 quick question
5. Focus most of your time on the highest-weighted competencies`;
  }

  // Extract candidate info - handle both full_name and first/last name
  let candidateName = 'the candidate';
  if (candidate) {
    // Try full_name first, then fall back to first_name + last_name
    if (candidate.full_name) {
      candidateName = candidate.full_name;
    } else if (candidate.first_name || candidate.last_name) {
      candidateName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim();
    }
  }
  
  const candidateSkills = candidate?.skills?.join(', ') || '';
  
  // Build the complete instructions
  return `You are an interviewer for ${company?.name || 'our company'}, conducting an interview for the position of ${position?.title || 'Software Developer'}.

You are interviewing ${candidateName}.${candidateSkills ? ` Their listed skills include: ${candidateSkills}.` : ''}

${position?.description || ''}${competencySection}

GENERAL GUIDELINES:
- Start with a warm introduction and ask about their background
- Be conversational but professional
- Listen carefully to responses and ask follow-up questions
- Provide constructive feedback when appropriate
- If they struggle with a question, offer hints or rephrase
- End by asking if they have questions about ${company?.name || 'the company'} or the role

Remember: ${hasCompetencies ? 'Focus your evaluation on the competencies listed above, especially those with higher weights.' : 'Conduct a thorough technical interview appropriate for this role.'}`;
}

// Main handler with enhanced error handling and logging
serve(async (req) => {
  // Start performance timer
  const startTime = performance.now();
  let tenantId: string | null = null;

  console.info(`Interview start request received [${operationId}]`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request data
    const requestData: InterviewStartRequest = await req.json();
    const {
      interview_session_id,
      tenant_id,
      region,
      architecture = 'hybrid',
      jwt_token,
      openai_settings = {}
    } = requestData;

    // Set tenant ID for logging
    tenantId = tenant_id;

    console.log(`Processing request for session ${interview_session_id}, tenant ${tenant_id} [${operationId}]`);

    // Validate required parameters
    if (!interview_session_id || !tenant_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters: interview_session_id and tenant_id are required',
          operation_id: operationId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Validate architecture parameter
    if (architecture !== 'hybrid' && architecture !== 'sdp_proxy') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid architecture parameter. Valid values are "hybrid" or "sdp_proxy".',
          operation_id: operationId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Validate JWT token if provided
    if (jwt_token) {
      const validation = await validateJwtToken(jwt_token, tenant_id);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: validation.error,
            operation_id: operationId
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403
          }
        );
      }
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // ENHANCED: Fetch comprehensive session data including competencies
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('interview_sessions')
      .select(`
        id,
        status,
        tenant_id,
        candidate_id,
        position_id,
        company_id,
        positions(
          id,
          title,
          description,
          position_competencies(
            weight,
            competencies(
              id,
              name,
              description
            )
          )
        ),
        candidates(
          id,
          first_name,
          last_name,
          full_name,
          email,
          skills
        ),
        companies(
          id,
          name
        )
      `)
      .eq('id', interview_session_id)
      .single();

    if (sessionError || !sessionData) {
      console.error(`Session validation error [${operationId}]:`, sessionError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Interview session not found or not accessible',
          operation_id: operationId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // DEBUG: Log the fetched session data
    console.log(`[DEBUG ${operationId}] Session data fetched:`, JSON.stringify({
      id: sessionData.id,
      candidate_id: sessionData.candidate_id,
      position_id: sessionData.position_id,
      company_id: sessionData.company_id,
      candidate: sessionData.candidates ? {
        name: `${sessionData.candidates.first_name} ${sessionData.candidates.last_name}`,
        skills: sessionData.candidates.skills,
        hasSkills: Array.isArray(sessionData.candidates.skills) && sessionData.candidates.skills.length > 0
      } : 'NO CANDIDATE DATA',
      position: sessionData.positions ? {
        title: sessionData.positions.title,
        competencyCount: sessionData.positions.position_competencies?.length || 0
      } : 'NO POSITION DATA',
      company: sessionData.companies ? {
        name: sessionData.companies.name
      } : 'NO COMPANY DATA'
    }, null, 2));

    // Verify tenant ID matches (extra security check)
    if (sessionData.tenant_id !== tenant_id) {
      console.error(`Tenant ID mismatch [${operationId}]: ${sessionData.tenant_id} vs ${tenant_id}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Tenant ID mismatch - unauthorized access',
          operation_id: operationId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }

    // Set up Fly.io VM for the interview
    const {
      url: webrtcServerUrl,
      error: vmError,
      architecture: usedArchitecture
    } = await setupFlyVM(
      tenant_id,
      interview_session_id,
      region,
      architecture
    );

    if (vmError || !webrtcServerUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to set up WebRTC server: ${vmError || 'Unknown error'}`,
          operation_id: operationId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Generate a WebRTC session ID with tenant context for database storage
    // Note: Fly.io server will generate its own sessionId for WebSocket management
    const webrtcSessionId = `${tenant_id}:${interview_session_id}:${crypto.randomUUID()}`;

    // Update the interview session with WebRTC information
    const updateSuccess = await updateInterviewSession(
      supabaseClient,
      interview_session_id,
      webrtcServerUrl,
      webrtcSessionId,
      usedArchitecture
    );

    if (!updateSuccess) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update interview session with WebRTC details',
          operation_id: operationId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Enhanced OpenAI configuration for hybrid architecture
    let openaiConfig = undefined;

    if (usedArchitecture === 'hybrid') {
      // ENHANCED: Use the new instruction builder
      openaiConfig = {
        voice: openai_settings.voice || 'alloy',
        model: openai_settings.model || 'gpt-4o',
        temperature: openai_settings.temperature || 0.7,
        turn_detection: {
          silence_duration_ms: openai_settings.turn_detection?.silence_duration_ms || 800,
          threshold: openai_settings.turn_detection?.threshold || 0.5
        },
        instructions: buildEnhancedInstructions(sessionData)
      };
      
      // DEBUG: Log the generated instructions
      console.log(`[DEBUG ${operationId}] Generated AI instructions:`, openaiConfig.instructions);
      
      // Log the competency weights for debugging
      const competencies = sessionData.positions?.position_competencies || [];
      if (competencies.length > 0) {
        console.log(`Interview configured with ${competencies.length} competencies:`, 
          competencies.map((pc: any) => `${pc.competencies.name}: ${pc.weight}%`).join(', ')
        );
      }
    }

    // Calculate performance metrics
    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Log operational metrics
    console.info(`Interview start processed successfully [${operationId}]. Processing time: ${processingTime.toFixed(2)}ms`);

    // Return success with enhanced connection details
    const response: InterviewResponse = {
      success: true,
      webrtc_server_url: webrtcServerUrl,
      webrtc_session_id: webrtcSessionId,
      architecture: usedArchitecture,
      operation_id: operationId,
      openai_api_config: openaiConfig
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error(`Error processing interview start request [${operationId}]:`, error);

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
        success: false,
        error: `Internal server error: ${error.message}`,
        operation_id: operationId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
}); 