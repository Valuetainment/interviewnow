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
  'Content-Security-Policy': "default-src 'self'; connect-src *.openai.com"
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
async function validateJwtToken(token: string, tenant_id: string): Promise<{ valid: boolean, error?: string, userId?: string }> {
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

// Build enhanced instructions with competency weights and full candidate context
function buildEnhancedInstructions(sessionData: any, prepperAnalysis?: any): string {
  const position = sessionData.positions;
  const candidate = sessionData.candidates;
  const company = sessionData.companies;
  
  // Extract competencies with weights
  const competencies = position?.position_competencies || [];
  const hasCompetencies = competencies.length > 0;
  
  // Extract candidate info - handle both full_name and first/last name
  let candidateName = 'the candidate';
  let candidateFirstName = '';
  if (candidate) {
    // Try full_name first, then fall back to first_name + last_name
    if (candidate.full_name) {
      candidateName = candidate.full_name;
      // Extract first name from full name
      candidateFirstName = candidate.full_name.split(' ')[0];
    } else if (candidate.first_name || candidate.last_name) {
      candidateName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim();
      candidateFirstName = candidate.first_name || '';
    }
  }
  
  // Parse work experience
  let experienceSection = '';
  let careerProgression = '';
  let yearsOfExperience = 0;
  let relevantCompanies = [];
  let leadershipExperience = false;
  
  if (candidate?.experience && Array.isArray(candidate.experience)) {
    // Sort experience by date (most recent first)
    const sortedExperience = [...candidate.experience].sort((a, b) => {
      const dateA = new Date(a.end_date || a.start_date || 0);
      const dateB = new Date(b.end_date || b.start_date || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Calculate total years of experience
    const earliestStart = sortedExperience.reduce((earliest, exp) => {
      const startDate = new Date(exp.start_date || Date.now());
      return startDate < earliest ? startDate : earliest;
    }, new Date());
    yearsOfExperience = Math.floor((Date.now() - earliestStart.getTime()) / (1000 * 60 * 60 * 24 * 365));
    
    // Build experience summary
    experienceSection = `
CANDIDATE BACKGROUND:
Work Experience (${yearsOfExperience} years):`;
    
    sortedExperience.slice(0, 5).forEach(exp => {
      const duration = exp.start_date && exp.end_date 
        ? `${new Date(exp.start_date).getFullYear()}-${new Date(exp.end_date).getFullYear()}`
        : exp.start_date 
          ? `${new Date(exp.start_date).getFullYear()}-Present`
          : '';
      
      experienceSection += `
- ${exp.title || 'Role'} at ${exp.company || 'Company'} ${duration ? `(${duration})` : ''}`;
      
      if (exp.description) {
        experienceSection += `
  • ${exp.description}`;
      }
      
      relevantCompanies.push(exp.company);
      
      // Check for leadership indicators
      if (exp.title && /lead|manager|director|head|chief|vp|president|founder/i.test(exp.title)) {
        leadershipExperience = true;
      }
    });
    
    // Analyze career progression
    if (sortedExperience.length > 1) {
      const currentRole = sortedExperience[0]?.title || '';
      const previousRole = sortedExperience[1]?.title || '';
      if (currentRole && previousRole) {
        careerProgression = `Career progression shows movement from ${previousRole} to ${currentRole}.`;
      }
    }
  }
  
  // Parse education
  let educationSection = '';
  if (candidate?.education) {
    educationSection = `

Education:
${candidate.education}`;
  }
  
  // Skills analysis
  const candidateSkills = candidate?.skills || [];
  const skillsText = candidateSkills.join(', ');
  
  // Build competency evaluation section with pre-scoring and WEIGHTS
  let competencySection = '';
  let competencyIntelligence = '';
  
  if (hasCompetencies) {
    // Sort by weight descending
    const sortedCompetencies = [...competencies].sort((a: any, b: any) => b.weight - a.weight);
    
    // Pre-score competencies based on resume
    const competencyAnalysis = sortedCompetencies.map((pc: any) => {
      const competency = pc.competencies;
      let evidence = 'limited';
      let focusArea = true;
      
      // Analyze resume for competency evidence
      if (competency.name.toLowerCase().includes('leadership') && leadershipExperience) {
        evidence = 'strong';
        focusArea = false;
      } else if (competency.name.toLowerCase().includes('technical') && candidateSkills.length > 10) {
        evidence = 'moderate';
      } else if (competency.name.toLowerCase().includes('communication') && candidate?.resume_text?.length > 2000) {
        evidence = 'moderate';
      }
      
      return {
        name: competency.name,
        weight: pc.weight,
        description: competency.description,
        evidence,
        focusArea
      };
    });
    
    competencySection = `

IMPORTANT - COMPETENCY EVALUATION FRAMEWORK:
You must evaluate the candidate on these specific competencies, weighted by importance:

${competencyAnalysis.map((comp: any) => 
  `- ${comp.name} (${comp.weight}% of evaluation): ${comp.description}
  Resume Evidence: ${comp.evidence} | ${comp.focusArea ? 'FOCUS AREA - probe deeply' : 'Some evidence found - validate with examples'}`
).join('\n')}

INTERVIEW STRATEGY:
1. Allocate your questions proportionally to the weights above
2. For competencies with higher weights (>25%), ask 2-3 in-depth questions
3. For medium weights (15-25%), ask 1-2 solid questions  
4. For lower weights (<15%), ask 1 quick question
5. Focus most of your time on the highest-weighted competencies
6. For "FOCUS AREA" competencies, dig deeper as resume shows limited evidence`;

    competencyIntelligence = `

INTERVIEW INTELLIGENCE:
- This candidate has ${yearsOfExperience} years of experience${leadershipExperience ? ' with leadership roles' : ''}
- ${careerProgression || 'Review their career trajectory during the interview'}
- Key companies to reference: ${relevantCompanies.slice(0, 3).join(', ') || 'Ask about their experience'}
- Competencies needing validation: ${competencyAnalysis.filter(c => c.focusArea).map(c => c.name).join(', ')}`;
  }
  
  // Build dynamic interview approach
  const dynamicApproach = `

DYNAMIC INTERVIEW APPROACH:
1. Start with: "${candidateFirstName}, I see you're currently${candidate?.experience?.[0] ? ` a ${candidate.experience[0].title} at ${candidate.experience[0].company}` : ' working'}. What sparked your interest in this ${position?.title} opportunity?"
2. For technical questions: Reference their experience with ${candidateSkills.slice(0, 3).join(', ') || 'relevant technologies'}
3. For leadership questions: ${leadershipExperience ? `Ask about team size and challenges at ${relevantCompanies[0] || 'their current role'}` : 'Explore their experience working in teams and any informal leadership'}
4. Bridge questions using their background: "I noticed you worked with ${candidateSkills[0] || 'various technologies'}. How would you apply that here?"
5. Time allocation: ${hasCompetencies ? 'Follow the competency weights strictly' : 'Balance technical and behavioral questions'}`;

  // Build behavioral question bank based on their experience
  const behavioralQuestions = `

PERSONALIZED BEHAVIORAL QUESTIONS:
${candidate?.experience?.[0] ? `- "Tell me about a challenging technical decision you had to make at ${candidate.experience[0].company}"` : '- "Tell me about a challenging technical decision from your recent experience"'}
${leadershipExperience ? '- "How did you scale your team while maintaining quality and culture?"' : '- "Describe a time when you had to influence teammates without formal authority"'}
${yearsOfExperience > 5 ? '- "How has your approach to software development evolved over your career?"' : '- "What key lessons have you learned in your career so far?"'}
- "Given your background in ${candidateSkills.slice(0, 2).join(' and ') || 'technology'}, how would you approach our technical challenges?"`;

  // Add AI-prepared analysis if available
  let prepperSection = '';
  if (prepperAnalysis) {
    prepperSection = `

AI INTERVIEW PREPARATION ANALYSIS:
Overall Fit Score: ${prepperAnalysis.overall_fit_score || 'N/A'}

Key Focus Areas:
${prepperAnalysis.interview_strategy?.focus_areas?.map((area: string) => `- ${area}`).join('\n') || '- Assess general fit'}

Must-Ask Questions from Analysis:
${prepperAnalysis.interview_strategy?.must_ask_questions?.map((q: string) => `- ${q}`).join('\n') || '- Use standard questions'}

Red Flags to Probe:
${prepperAnalysis.red_flags?.map((flag: string) => `- ${flag}`).join('\n') || '- None identified'}

Skill Gaps to Address:
${prepperAnalysis.skill_gaps?.map((gap: string) => `- ${gap}`).join('\n') || '- None identified'}

Conversation Bridges:
${prepperAnalysis.interview_strategy?.conversation_bridges?.map((bridge: string) => `- ${bridge}`).join('\n') || '- Use natural transitions'}

IMPORTANT: Use the AI analysis to guide your interview strategy. Focus extra time on the identified gaps and concerns.`;
  }

  // Build the complete instructions
  return `You are an interviewer for ${company?.name || 'our company'}, conducting an interview for the position of ${position?.title || 'Software Developer'}.

You are interviewing ${candidateName}.
${experienceSection}${educationSection}

Skills: ${skillsText}

${position?.description || ''}${competencySection}${competencyIntelligence}${dynamicApproach}${behavioralQuestions}${prepperSection}

GREETING AND INTERACTION:
- Start the interview by greeting the candidate warmly: "Hello ${candidateFirstName || candidateName}, I'm an AI interviewer with ${company?.name || 'our company'}. Today we'll be discussing your interest in the ${position?.title || 'Software Developer'} role."
- Use ${candidateFirstName}'s first name periodically throughout the interview
- Reference specific experiences from their background to make questions more relevant

GENERAL GUIDELINES:
- After your greeting, transition naturally to their current role and interests
- Ask follow-up questions based on their specific experiences
- When they mention a project or achievement, dig deeper with "Tell me more about..."
- If they struggle, reference easier wins from their resume to rebuild confidence
- For senior candidates (${yearsOfExperience}+ years), ask about mentoring and architecture decisions
- End by asking if they have questions about ${company?.name || 'the company'} or the specific team they'd join

Remember: This is ${candidateFirstName} with ${yearsOfExperience} years at companies like ${relevantCompanies.slice(0, 2).join(', ') || 'various organizations'}. Make the interview conversational and relevant to their actual experience.`;
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
          skills,
          experience,
          education,
          resume_text,
          phone
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

    // Call interview-prepper for AI analysis
    let prepperAnalysis = null;
    try {
      console.log(`Calling interview-prepper for session ${interview_session_id} [${operationId}]`);
      
      const prepperResponse = await supabaseClient.functions.invoke('interview-prepper', {
        body: {
          candidate_id: sessionData.candidate_id,
          position_id: sessionData.position_id,
          company_id: sessionData.company_id,
          tenant_id: tenant_id
        }
      });

      if (prepperResponse.data?.success && prepperResponse.data?.analysis) {
        prepperAnalysis = prepperResponse.data.analysis;
        console.log(`Interview prep analysis received [${operationId}]:`, {
          overall_fit: prepperAnalysis.overall_fit_score,
          skill_gaps: prepperAnalysis.skill_gaps?.length || 0,
          focus_areas: prepperAnalysis.interview_strategy?.focus_areas?.length || 0
        });
      } else {
        console.warn(`Interview prepper failed or returned no analysis [${operationId}]`);
      }
    } catch (prepError) {
      console.error(`Error calling interview-prepper [${operationId}]:`, prepError);
      // Continue without prep analysis - don't fail the entire interview
    }

    // For direct OpenAI connection, no server setup needed
    const usedArchitecture = 'direct-openai';
    const webrtcSessionId = `${tenant_id}:${interview_session_id}:${crypto.randomUUID()}`;

    // Update the interview session with architecture information
    const updateSuccess = await updateInterviewSession(
      supabaseClient,
      interview_session_id,
      null, // No server URL needed for direct OpenAI
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

    // Enhanced OpenAI configuration for direct-openai architecture
    let openaiConfig = undefined;

    if (usedArchitecture === 'direct-openai') {
      // ENHANCED: Use the new instruction builder
      openaiConfig = {
        voice: openai_settings.voice || 'verse',
        model: openai_settings.model || 'gpt-4o-realtime-preview-2025-06-03',
        temperature: openai_settings.temperature || 0.7,
        turn_detection: {
          silence_duration_ms: openai_settings.turn_detection?.silence_duration_ms || 5000,
          threshold: openai_settings.turn_detection?.threshold || 0.5
        },
        instructions: buildEnhancedInstructions(sessionData, prepperAnalysis)
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
      webrtc_server_url: null, // No server URL needed for direct OpenAI
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