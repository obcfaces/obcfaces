import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

interface MissingTranslation {
  key: string;
  default_text: string;
  target_lang: string;
}

/**
 * Auto-translate missing translation keys using Lovable AI Gateway
 * Translates from English to target languages (RU, ES, FR, DE)
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get missing translations from database
    const { data: missingTranslations, error: fetchError } = await supabase
      .from('i18n_missing')
      .select('*')
      .limit(100); // Process in batches

    if (fetchError) throw fetchError;

    if (!missingTranslations || missingTranslations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No missing translations',
          translated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${missingTranslations.length} missing translations`);
    
    let translatedCount = 0;
    const errors: string[] = [];

    // Process each missing translation
    for (const item of missingTranslations as MissingTranslation[]) {
      try {
        // Translate using Lovable AI Gateway (Gemini 2.5 Flash)
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a professional translator for the OBC Faces beauty contest website. Translate the following text from English to ${item.target_lang}. Keep the same tone and context. Return ONLY the translated text, nothing else.`,
              },
              {
                role: 'user',
                content: item.default_text,
              },
            ],
            temperature: 0.3, // Low temperature for consistent translations
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`AI translation failed for key ${item.key}:`, errorText);
          errors.push(`${item.key}: ${errorText}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const translatedText = aiData.choices[0]?.message?.content?.trim();

        if (!translatedText) {
          console.error(`Empty translation for key ${item.key}`);
          errors.push(`${item.key}: Empty translation`);
          continue;
        }

        // Store translation in database
        const { error: upsertError } = await supabase
          .from('i18n_values')
          .upsert({
            lang: item.target_lang,
            key: item.key,
            text: translatedText,
            updated_at: new Date().toISOString(),
          });

        if (upsertError) {
          console.error(`Failed to store translation for ${item.key}:`, upsertError);
          errors.push(`${item.key}: ${upsertError.message}`);
          continue;
        }

        // Remove from missing translations
        await supabase
          .from('i18n_missing')
          .delete()
          .eq('key', item.key)
          .eq('target_lang', item.target_lang);

        translatedCount++;
        console.log(`✅ Translated ${item.key} to ${item.target_lang}`);

      } catch (error) {
        console.error(`Error translating ${item.key}:`, error);
        errors.push(`${item.key}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        translated: translatedCount,
        total: missingTranslations.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auto-translate error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
