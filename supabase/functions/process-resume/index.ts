
// Supabase Edge Function to process PDF resumes using PDF.co API
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  pdfUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfUrl } = await req.json() as RequestBody;

    if (!pdfUrl) {
      return new Response(
        JSON.stringify({ error: 'PDF URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY');
    if (!pdfCoApiKey) {
      return new Response(
        JSON.stringify({ error: 'PDF.co API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call PDF.co API to extract text from the PDF
    const pdfCoUrl = 'https://api.pdf.co/v1/pdf/extract/text';
    const pdfCoResponse = await fetch(pdfCoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': pdfCoApiKey,
      },
      body: JSON.stringify({
        url: pdfUrl,
        inline: false,
        async: false,
      }),
    });

    const pdfCoData = await pdfCoResponse.json();

    if (pdfCoData.error) {
      console.error('PDF.co API error:', pdfCoData.error);
      return new Response(
        JSON.stringify({ error: 'Error extracting text from PDF' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The PDF.co API returns a URL where the extracted text can be downloaded
    const textFileUrl = pdfCoData.url;
    const textResponse = await fetch(textFileUrl);
    const extractedText = await textResponse.text();

    return new Response(
      JSON.stringify({ text: extractedText }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-resume function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
