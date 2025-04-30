// Simple Edge Function to check environment variables
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const pdfcoApiKey = Deno.env.get('PDFCO_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Mask the keys for security
    const maskKey = (key: string | undefined) => {
      if (!key) return 'Not found';
      if (key.length <= 8) return '********';
      return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    };
    
    return new Response(
      JSON.stringify({
        pdfcoApiKey: pdfcoApiKey ? `Found (${maskKey(pdfcoApiKey)})` : 'Not found',
        openaiApiKey: openaiApiKey ? `Found (${maskKey(openaiApiKey)})` : 'Not found',
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error checking environment variables:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 