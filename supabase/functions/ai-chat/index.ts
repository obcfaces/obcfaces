import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ai-chat`);
  
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[REQUEST] Processing POST request...');
    
    const body = await req.json();
    console.log('[REQUEST] Body received:', JSON.stringify(body, null, 2));
    
    const { message } = body;

    if (!message) {
      console.error('[ERROR] No message provided');
      throw new Error('Message is required');
    }

    console.log('[ENV] Checking environment variables...');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      console.error('[ERROR] OPENAI_API_KEY not found');
      throw new Error('OpenAI API key not configured. Please check your secrets.');
    }

    console.log('[ENV] OpenAI API key found, length:', openAIApiKey.length);

    // Test OpenAI API call
    console.log('[OPENAI] Making request to OpenAI API...');
    
    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful AI assistant for a beauty contest website. Respond briefly and friendly.' 
        },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    };

    console.log('[OPENAI] Request body:', JSON.stringify(requestBody, null, 2));

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[OPENAI] Response status:', openAIResponse.status);
    console.log('[OPENAI] Response headers:', Object.fromEntries(openAIResponse.headers.entries()));

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('[OPENAI] API error response:', errorText);
      
      if (openAIResponse.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your API key.');
      } else if (openAIResponse.status === 429) {
        throw new Error('OpenAI API rate limit exceeded or insufficient credits.');
      } else {
        throw new Error(`OpenAI API error (${openAIResponse.status}): ${errorText}`);
      }
    }

    const openAIData = await openAIResponse.json();
    console.log('[OPENAI] Response received:', JSON.stringify(openAIData, null, 2));
    
    const aiResponse = openAIData.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      console.error('[ERROR] No response content from OpenAI');
      throw new Error('No response received from OpenAI');
    }

    console.log('[SUCCESS] Sending response to client');
    
    return new Response(
      JSON.stringify({ response: aiResponse }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[ERROR] Function error:', error.message);
    console.error('[ERROR] Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        details: 'Check function logs for detailed error information'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});