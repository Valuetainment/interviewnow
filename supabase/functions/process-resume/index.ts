// Supabase Edge Function to process PDF resumes using PDF.co API
import { createClient } from "npm:@supabase/supabase-js@2.33.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  pdfUrl: string;
}

// Create Supabase client with service role key (for any database operations)
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
}

// Create client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Using Deno.serve as recommended
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Process resume function invoked');
    const { pdfUrl } = await req.json() as RequestBody;

    if (!pdfUrl) {
      return new Response(
        JSON.stringify({ error: 'PDF URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key from environment variables
    // Looking for both formats since different environments might use different naming
    const pdfCoApiKey = Deno.env.get('PDFCO_API_KEY') || 
                      Deno.env.get('PDF_CO_API_KEY') || 
                      Deno.env.get('VITE_PDFCO_API_KEY');
                      
    if (!pdfCoApiKey) {
      console.error('PDF.co API key not found');
      return new Response(
        JSON.stringify({ error: 'PDF.co API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('PDF.co API key found, uploading PDF URL:', pdfUrl);

    // Step 1: Upload the PDF URL to PDF.co
    const uploadUrl = 'https://api.pdf.co/v1/file/upload/url';
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': pdfCoApiKey,
      },
      body: JSON.stringify({ url: pdfUrl }),
    });

    const uploadData = await uploadResponse.json();
    if (uploadData.error) {
      console.error('PDF.co upload error:', uploadData.error);
      return new Response(
        JSON.stringify({ error: 'Error uploading PDF to PDF.co', details: uploadData.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('PDF uploaded successfully, converting to text with OCR...');

    // Step 2: Convert the uploaded PDF to text using OCR
    const convertUrl = 'https://api.pdf.co/v1/pdf/convert/to/text';
    const convertResponse = await fetch(convertUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': pdfCoApiKey,
      },
      body: JSON.stringify({
        url: uploadData.url,  // The URL returned from previous step
        async: false,
        ocr: true,
        language: "eng",
        ocrLanguages: ["eng"],
        ocrEngine: "2",  // Using OCR engine version 2
      }),
    });

    const convertData = await convertResponse.json();
    if (convertData.error) {
      console.error('PDF.co conversion error:', convertData.error);
      return new Response(
        JSON.stringify({ error: 'Error converting PDF to text', details: convertData.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Download the extracted text
    console.log('Text conversion successful, downloading from:', convertData.url);
    const textResponse = await fetch(convertData.url);
    const extractedText = await textResponse.text();

    return new Response(
      JSON.stringify({ success: true, text: extractedText }),
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
