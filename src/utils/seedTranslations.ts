import { supabase } from '@/integrations/supabase/client';

// List of all texts that need translation
export const MAIN_PAGE_TEXTS = [
  // ContestHeader
  "Join & Win 5,000 PHP",
  "All online — no need to travel",
  "Anyone can join — open to all!",
  "Free entry with just 2 photos",
  "Natural. Honest. Voted by People.",
  "Weekly winner gets 5,000 PHP",
  "Annual winner takes 100,000 PHP",
  "Follow us on Facebook",
  "Follow us on Instagram",
  "Contest",
  "How it works",
  
  // Index.tsx - How it works section
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
  
  // ContestCard - Voting and interactions
  "Rate from 1 (lowest)",
  "to 5 (highest)",
  "Like",
  "Dislike",
  "Comment",
  "Share",
  "Example",
  
  // ContestCard - Example instructions
  "How your photos should look:",
  "• Look like an ID photo",
  "• No makeup",
  "• No filters",
  "• No glasses allowed",
  "• Whole body from head to toe",
  "• Wear tight/fitted clothes. No dresses, skirts, heels",
  "• No bags or backpacks",
  
  // PhotoModal
  "No comments yet. Be the first!",
  "Write a comment for this photo...",
  
  // Footer
  "OBC - Online Beauty Contest",
  "The world's weekly online beauty contest. A global platform that celebrates natural beauty and talent in different categories of participants, offering exciting prizes and international recognition.",
  "Quick Links",
  "My Account",
  "Messages",
  "Likes",
  "Legal",
  "Terms of Service",
  "Privacy Policy",
  "All rights reserved.",
  "Made with",
  
  // Week sections
  "NEXT WEEK",
  "THIS WEEK",
  "Choose next week's finalists",
  "Loading...",
  "left",
  "You've rated all cards in this block. New ones will appear next week.",
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
