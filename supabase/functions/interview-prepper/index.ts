import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InterviewPrepRequest {
  candidate_id: string;
  position_id: string;
  company_id: string;
  tenant_id: string;
}

interface InterviewPrepResponse {
  success: boolean;
  analysis?: {
    candidate_summary: string;
    skill_matches: string[];
    skill_gaps: string[];
    experience_highlights: string[];
    red_flags: string[];
    green_flags: string[];
    competency_evidence: {
      [key: string]: {
        evidence_level: 'strong' | 'moderate' | 'limited' | 'none';
        specific_examples: string[];
        suggested_questions: string[];
        estimated_score: number;
      };
    };
    interview_strategy: {
      focus_areas: string[];
      skip_areas: string[];
      time_allocation: { [key: string]: number };
      opening_approach: string;
      must_ask_questions: string[];
      conversation_bridges: string[];
    };
    cultural_fit_indicators: {
      alignment_factors: string[];
      potential_concerns: string[];
      values_match_score: number;
    };
    overall_fit_score: number;
    key_talking_points: string[];
  };
  error?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidate_id, position_id, company_id, tenant_id } = await req.json() as InterviewPrepRequest;

    // Validate required fields
    if (!candidate_id || !position_id || !company_id || !tenant_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Fetch all necessary data in parallel
    const [candidateResult, positionResult, companyResult] = await Promise.all([
      supabaseClient
        .from('candidates')
        .select('*')
        .eq('id', candidate_id)
        .eq('tenant_id', tenant_id)
        .single(),
      
      supabaseClient
        .from('positions')
        .select(`
          *,
          position_competencies(
            weight,
            competencies(
              id,
              name,
              description
            )
          )
        `)
        .eq('id', position_id)
        .eq('tenant_id', tenant_id)
        .single(),
      
      supabaseClient
        .from('companies')
        .select('*')
        .eq('id', company_id)
        .eq('tenant_id', tenant_id)
        .single()
    ]);

    if (candidateResult.error || positionResult.error || companyResult.error) {
      throw new Error('Failed to fetch required data');
    }

    const candidate = candidateResult.data;
    const position = positionResult.data;
    const company = companyResult.data;

    // Prepare data for AI analysis
    const candidateContext = {
      name: candidate.full_name || `${candidate.first_name} ${candidate.last_name}`,
      skills: candidate.skills || [],
      experience: candidate.experience || [],
      education: candidate.education || '',
      resume_text: candidate.resume_text || ''
    };

    const positionContext = {
      title: position.title,
      description: position.description,
      required_skills: position.required_skills || [],
      competencies: position.position_competencies?.map((pc: any) => ({
        name: pc.competencies.name,
        description: pc.competencies.description,
        weight: pc.weight
      })) || []
    };

    // Call OpenAI to analyze and prepare interview strategy
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    const analysisPrompt = `Analyze this candidate for a position and prepare a comprehensive interview strategy.

CANDIDATE:
${JSON.stringify(candidateContext, null, 2)}

POSITION:
${JSON.stringify(positionContext, null, 2)}

COMPANY:
${company.name} - ${company.description || 'Technology company'}

Provide a detailed analysis in the following JSON structure:
{
  "candidate_summary": "2-3 sentence executive summary",
  "skill_matches": ["Array of skills that match the position"],
  "skill_gaps": ["Array of missing skills or experience"],
  "experience_highlights": ["Most relevant experiences"],
  "red_flags": ["Potential concerns to probe"],
  "green_flags": ["Strong indicators of fit"],
  "competency_evidence": {
    "[competency_name]": {
      "evidence_level": "strong|moderate|limited|none",
      "specific_examples": ["Examples from resume"],
      "suggested_questions": ["2-3 targeted questions"],
      "estimated_score": 0.0-1.0
    }
  },
  "interview_strategy": {
    "focus_areas": ["Areas needing deep exploration"],
    "skip_areas": ["Areas with sufficient evidence"],
    "time_allocation": { "[competency]": percentage },
    "opening_approach": "Specific way to start based on their background",
    "must_ask_questions": ["Critical questions based on analysis"],
    "conversation_bridges": ["Ways to transition between topics using their experience"]
  },
  "cultural_fit_indicators": {
    "alignment_factors": ["Why they might fit the culture"],
    "potential_concerns": ["Cultural fit concerns"],
    "values_match_score": 0.0-1.0
  },
  "overall_fit_score": 0.0-1.0,
  "key_talking_points": ["Important topics to cover"]
}

Be specific and reference actual details from their resume. Focus on actionable insights.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert recruiter and interview strategist. Analyze candidates and provide actionable interview strategies.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const analysis = JSON.parse(aiResponse.choices[0].message.content);

    // Log the analysis for debugging
    console.log('Interview prep analysis completed:', {
      candidate: candidateContext.name,
      position: positionContext.title,
      overall_fit: analysis.overall_fit_score
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in interview-prepper:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
