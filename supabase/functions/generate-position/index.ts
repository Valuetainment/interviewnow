// Supabase Edge Function to generate position descriptions and competencies using OpenAI
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  title: string;
  shortDescription: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, shortDescription } = await req.json() as RequestBody;

    if (!title || !shortDescription) {
      return new Response(
        JSON.stringify({ error: 'Title and short description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_POSITION_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call OpenAI API to generate position description and competencies
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
            content: `You are an expert in HR and job descriptions. Generate a detailed job description and suggest relevant competencies with weights based on the position title and brief description provided.
            
            Return a JSON object with the following structure:
            {
              "description": "Full markdown job description with sections",
              "competencies": [
                {
                  "name": "Technical Knowledge",
                  "description": "Competency description",
                  "suggested_weight": 30
                },
                ...
              ]
            }
            
            Guidelines:
            - The job description should be in markdown format with sections for Overview, Responsibilities, Requirements, etc.
            - Suggest 5-7 competencies that are most relevant for the position
            - Assign suggested weights (%) to each competency based on importance, ensuring they sum to 100%
            - Make the description professional and comprehensive
            - Do not include any explanations or notes outside the JSON structure
            `,
          },
          {
            role: 'user',
            content: `Generate a job description and competencies for:\nPosition Title: ${title}\nBrief Description: ${shortDescription}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const openaiData = await openaiResponse.json();
    
    if (!openaiData.choices || !openaiData.choices[0]) {
      console.error('OpenAI API error:', openaiData);
      return new Response(
        JSON.stringify({ error: 'Error generating position description' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the structured JSON from OpenAI's response
    let generatedData;
    try {
      const responseContent = openaiData.choices[0].message.content;
      // Extract the JSON part from the response
      const jsonMatch = responseContent.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        generatedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract JSON from response');
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Error parsing position generation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(generatedData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-position function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 