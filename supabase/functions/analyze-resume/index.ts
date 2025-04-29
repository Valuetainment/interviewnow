
// Supabase Edge Function to analyze resume text using OpenAI
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  resumeText: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText } = await req.json() as RequestBody;

    if (!resumeText) {
      return new Response(
        JSON.stringify({ error: 'Resume text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_RESUME_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call OpenAI API to analyze the resume text
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume parser. Extract structured information from the resume text. 
                      Return a JSON object with the following structure:
                      {
                        "personal_info": {
                          "full_name": "",
                          "email": "",
                          "phone": "",
                          "location": ""
                        },
                        "summary": "Professional summary or objective statement",
                        "skills": ["skill1", "skill2", ...],
                        "experience": [
                          {
                            "title": "Job Title",
                            "company": "Company Name",
                            "dates": "Start - End",
                            "responsibilities": ["responsibility1", "responsibility2", ...]
                          }
                        ],
                        "education": [
                          {
                            "degree": "Degree Name",
                            "institution": "Institution Name",
                            "dates": "Start - End"
                          }
                        ]
                      }
                      Ensure all text is properly formatted and don't include any explanations, just the JSON.`,
          },
          {
            role: 'user',
            content: resumeText,
          },
        ],
      }),
    });

    const openaiData = await openaiResponse.json();
    
    if (!openaiData.choices || !openaiData.choices[0]) {
      console.error('OpenAI API error:', openaiData);
      return new Response(
        JSON.stringify({ error: 'Error analyzing resume text' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the structured JSON from OpenAI's response
    let analysisJson;
    try {
      const responseContent = openaiData.choices[0].message.content;
      // Extract the JSON part from the response, in case OpenAI adds any text
      const jsonMatch = responseContent.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        analysisJson = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract JSON from response');
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Error parsing resume analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ analysis: analysisJson }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
