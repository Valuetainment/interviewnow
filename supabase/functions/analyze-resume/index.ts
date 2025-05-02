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
      console.error('No resume text provided');
      return new Response(
        JSON.stringify({ error: 'Resume text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key from environment variables with fallbacks
    const openaiApiKey = Deno.env.get('OPENAI_RESUME_API_KEY') || 
                        Deno.env.get('OPENAI_API_KEY') || 
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
    const cleanedText = resumeText.replace(/```[a-z]*\n/g, '').replace(/```/g, '').trim();
    console.log('Text length:', cleanedText.length);

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
        temperature: 0.3,
      }),
    });

    // Check if the response is OK before processing
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error response:', errorText);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error: ${openaiResponse.status}`, 
          details: errorText 
        }),
        { status: openaiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiResponse.json();
    
    if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message?.content) {
      console.error('Unexpected OpenAI response format:', openaiData);
      return new Response(
        JSON.stringify({ error: 'Invalid response format from OpenAI', details: openaiData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('OpenAI response received, processing response...');

    // Parse the JSON content from the response
    let analysis;
    try {
      analysis = JSON.parse(openaiData.choices[0].message.content);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse OpenAI response', details: parseError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure experience object has all required fields
    if (!analysis.experience) {
      analysis.experience = {
        positions_held: [],
        years: "0",
        industries: []
      };
    }

    console.log('Resume analysis complete. Experience entries:', analysis.experience?.positions_held?.length || 0);
    console.log('Final experience data:', JSON.stringify(analysis.experience, null, 2));

    return new Response(
      JSON.stringify({ analysis }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
