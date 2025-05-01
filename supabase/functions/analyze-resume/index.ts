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
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional resume analyzer and formatter. Analyze the provided resume text and extract key information in a clean, structured JSON format. Focus on:

1. Personal Information (name, contact details)
2. Skills (technical and soft skills)
3. Work Experience (properly formatted with standardized dates, clear responsibilities)
4. Education
5. Professional Summary

For experience entries, ensure:
- Extract ALL positions with their full details
- Dates are standardized (MM/YYYY format when possible)
- Job titles and companies are clearly separated
- Responsibilities are formatted as clear, action-oriented bullet points
- Include achievements and impact metrics
- Preserve the chronological order

Return the data in this exact JSON format:
{
  "personal_info": {
    "full_name": string,
    "email": string | null,
    "phone": string | null
  },
  "skills": string[],
  "experience": {
    "positions_held": [{
      "title": string,
      "company": string,
      "dates": string,
      "responsibilities": string[],
      "achievements": string[]
    }],
    "years": string,
    "industries": string[]
  },
  "education": string[],
  "geographic_location": string | null,
  "professional_summary": string,
  "areas_specialization": string[],
  "certifications_licenses": string[],
  "notable_achievements": string[]
}`,
          },
          {
            role: 'user',
            content: `Please analyze and format this resume: ${cleanedText}`
          },
        ],
        response_format: { "type": "json_object" },
        temperature: 0.1,
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
