import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Request received:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('Returning CORS headers for OPTIONS');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing POST request...');
    
    // Простой тестовый ответ без вызова OpenAI API
    const body = await req.json();
    console.log('Request body received:', body);
    
    const { message } = body;
    console.log('Message:', message);
    
    // Простой статический ответ для тестирования
    const testResponse = `Thank you for your message: "${message}". I'm the AI contest assistant and I'm working correctly now! Feel free to ask me about the beauty contest, participants, or voting process.`;
    
    console.log('Sending test response:', testResponse);
    
    return new Response(JSON.stringify({ response: testResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('Error occurred:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check function logs for more details'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});