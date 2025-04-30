// Supabase Edge Function to analyze resume text using OpenAI
import { createClient } from "npm:@supabase/supabase-js@2.33.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  resumeText: string;
}

// Using Deno.serve as recommended
Deno.serve(async (req) => {
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

    // Get API key from environment variables with fallbacks
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || 
                        Deno.env.get('OPENAI_RESUME_API_KEY') || 
                        Deno.env.get('VITE_OPENAI_API_KEY');
                        
    if (!openaiApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('OpenAI API key found, analyzing resume text...');
    
    // Clean the resume text to improve analysis quality
    const cleanedText = resumeText.trim().replace(/\s+/g, ' ');

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
            content: `Please analyze and format this resume: ${cleanedText}`
          },
        ],
        response_format: { "type": "json_object" },
        temperature: 0.3,
      }),
    });

    const openaiData = await openaiResponse.json();
    
    if (!openaiData.choices || !openaiData.choices[0]) {
      console.error('OpenAI API error:', openaiData);
      return new Response(
        JSON.stringify({ error: 'Error analyzing resume text', details: openaiData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('OpenAI response received, processing response...');

    // With response_format: "json_object", we can directly use the content
    const analysisJson = openaiData.choices[0].message.content;

    console.log('Resume analysis complete');

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
