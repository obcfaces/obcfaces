import { supabase } from '@/integrations/supabase/client';

// List of all texts that need translation on the main page
export const MAIN_PAGE_TEXTS = [
  "How It Works",
  "international — user-facing, legal-safe",
  "Join OBC — the international, fully online beauty contest.",
  "Enter Anytime",
  "Upload two photos:",
  "• 1 full-body photo (natural look — no filters, no heavy editing)",
  "• 1 close-up face photo (no makeup)",
  "By submitting, you confirm you are 18 years or older, you own the photos (or have permission), and you accept our",
  "Terms",
  "and",
  "Privacy Policy",
  "Selection & Posting",
  "Global Voting",
  "Prizes & Verification",
  "Rules & Safety",
  "Questions or disputes?",
];

export async function seedMissingTranslations(targetLang: string = 'es') {
  const promises = MAIN_PAGE_TEXTS.map(text => 
    supabase
      .from('i18n_missing')
      .upsert({
        key: text,
        default_text: text,
        target_lang: targetLang,
      }, {
        onConflict: 'key,target_lang',
        ignoreDuplicates: true,
      })
  );

  await Promise.all(promises);
  console.log(`✅ Seeded ${MAIN_PAGE_TEXTS.length} missing translations for ${targetLang}`);
}

export async function triggerAutoTranslate() {
  const { data, error } = await supabase.functions.invoke('auto-translate');
  
  if (error) {
    console.error('❌ Auto-translate error:', error);
    throw error;
  }
  
  console.log('✅ Auto-translate result:', data);
  return data;
}
