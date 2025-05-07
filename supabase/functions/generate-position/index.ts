// Supabase Edge Function to generate position descriptions and competencies using OpenAI

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

interface RequestBody {
  title: string;
  shortDescription: string;
  experienceLevel?: string; // Optional experience level
  competencies?: Array<{
    name: string;
    description: string;
    suggested_weight: number;
  }>;
}

// Using Deno.serve as per Supabase Edge Function guidelines
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, shortDescription, experienceLevel, competencies } = await req.json() as RequestBody;

    if (!title || !shortDescription) {
      return new Response(
        JSON.stringify({ error: 'Title and short description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key from environment variables with fallbacks
    const openaiApiKey = Deno.env.get('OPENAI_POSITION_API_KEY') || 
                        Deno.env.get('OPENAI_API_KEY');
                         
    if (!openaiApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create system prompt based on whether competencies are provided
    const systemPrompt = `You are an expert technical recruiter and HR professional who creates compelling, professional job descriptions.
    
Use clear, concise language and ensure all content is properly structured. Focus on creating job descriptions that both accurately reflect the role and attract qualified candidates. Always maintain a professional tone and highlight both technical requirements and soft skills where appropriate.

${competencies ? 
  `Pay special attention to the provided competencies and their weights - these represent the most important skills and attributes for this role. Competencies with higher weights should be emphasized more in the job description. The weights indicate the relative importance of each competency in determining success in this role.` : 
  `You will need to suggest 5 key competencies with appropriate weights (adding up to 100%) based on the job title and description provided.`}

Return a JSON object with the following structure:
{
  "role_overview": "A compelling introduction to the role and its impact (2-3 sentences)",
  "key_responsibilities": "A bullet-pointed list of 5-7 specific responsibilities",
  "required_qualifications": "A bullet-pointed list of required skills and qualifications",
  "preferred_qualifications": "A bullet-pointed list of preferred (but not required) skills",
  "benefits": "A bullet-pointed list of compelling benefits and opportunities", 
  "key_competencies_section": "A paragraph that highlights how the key competencies relate to success in this role"${!competencies ? ',\n  "competencies": [\n    {\n      "name": "Technical Knowledge",\n      "description": "Competency description",\n      "suggested_weight": 30\n    },\n    ...\n  ]' : ''}
}

Guidelines:
- Format bullet points with markdown (using either * or - format)
- Use specific, actionable language appropriate for the ${experienceLevel || 'specified'} experience level
- Ensure content is professional, clear, and focused on attracting qualified candidates
- Do not include any explanations or notes outside the JSON structure
${!competencies ? '- Suggest EXACTLY 5 competencies that are most relevant for the position\n- Assign weights to competencies based on importance, ensuring they sum to exactly 100%' : ''}
`;

    // Create user prompt, including competencies if provided
    let userPrompt = `Create a detailed and professional job description for a ${experienceLevel || ''} ${title} position.`;
    
    // Add short description
    userPrompt += `\n\nBrief description: ${shortDescription}`;
    
    // Add competencies section if provided
    if (competencies && competencies.length > 0) {
      userPrompt += `\n\nThe key competencies for this position include: ${competencies.map(c => 
        `${c.name} (${c.suggested_weight}%)`
      ).join(', ')}.`;
      
      // Add more details about competencies
      userPrompt += `\n\nDetailed competencies:\n${competencies.map(c => 
        `- ${c.name} (${c.suggested_weight}%): ${c.description}`
      ).join('\n')}`;
    }
    
    userPrompt += `\n\nPlease structure the response as a JSON object with the fields specified in your instructions.`;

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
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
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
        
        // If competencies were provided and not returned, add them back
        if (competencies && !generatedData.competencies) {
          generatedData.competencies = competencies;
        }
        
        // Create a combined full description for backward compatibility
        generatedData.description = `# ${title} ${experienceLevel ? `(${experienceLevel})` : ''}

## Overview
${generatedData.role_overview || ''}

## Key Responsibilities
${generatedData.key_responsibilities || ''}

## Required Qualifications
${generatedData.required_qualifications || ''}

## Preferred Qualifications
${generatedData.preferred_qualifications || ''}

## Benefits
${generatedData.benefits || ''}

## Key Competencies
${generatedData.key_competencies_section || ''}`;

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