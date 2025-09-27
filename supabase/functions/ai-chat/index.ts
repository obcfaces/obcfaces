import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Starting ai-chat function`);
  
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[REQUEST] Processing request...');
    
    const body = await req.json();
    console.log('[REQUEST] Body:', JSON.stringify(body));
    
    const { message, context } = body;

    if (!message) {
      console.error('[ERROR] No message provided');
      throw new Error('Message is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      console.error('[ERROR] OpenAI API key not found');
      throw new Error('OpenAI API key not configured');
    }

    console.log('[OPENAI] Making API request...');
    
    // Use GPT-4o-mini for better stability
    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: `You are a helpful AI assistant for a beauty contest website. ${context ? `Context: ${context}.` : ''} Respond briefly and friendly in Russian if the user writes in Russian, otherwise in English.` 
        },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    };

    console.log('[OPENAI] Request body:', JSON.stringify(requestBody));
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[OPENAI] Response status:', openAIResponse.status);

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('[OPENAI] Error response:', errorText);
      throw new Error(`OpenAI API error (${openAIResponse.status}): ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('[OPENAI] Response received');
    
    const aiResponse = openAIData.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      console.error('[ERROR] No response content from OpenAI');
      throw new Error('No response from OpenAI');
    }

    console.log('[SUCCESS] Returning response');
    
    return new Response(
      JSON.stringify({ response: aiResponse }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[ERROR] Function error:', error.message);
    console.error('[ERROR] Stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});