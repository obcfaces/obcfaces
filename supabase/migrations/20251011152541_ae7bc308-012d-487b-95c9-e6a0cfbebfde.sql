-- ============================================
-- 🌐 i18n Tables for Auto-Translation System
-- ============================================

-- 1. Table for storing translation keys and default text
CREATE TABLE IF NOT EXISTS public.i18n_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  default_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Table for storing translations in different languages
CREATE TABLE IF NOT EXISTS public.i18n_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lang text NOT NULL CHECK (lang IN ('ru', 'es', 'fr', 'de', 'en')),
  key text NOT NULL,
  text text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(lang, key)
);

-- 3. Table for tracking missing translations (queue for auto-translate)
CREATE TABLE IF NOT EXISTS public.i18n_missing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  default_text text NOT NULL,
  target_lang text NOT NULL CHECK (target_lang IN ('ru', 'es', 'fr', 'de')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(key, target_lang)
);

-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE public.i18n_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.i18n_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.i18n_missing ENABLE ROW LEVEL SECURITY;

-- Anyone can read translation keys
CREATE POLICY "Anyone can read i18n keys" 
  ON public.i18n_keys 
  FOR SELECT 
  USING (true);

-- Anyone can read translation values
CREATE POLICY "Anyone can read i18n values" 
  ON public.i18n_values 
  FOR SELECT 
  USING (true);

-- Admins can manage i18n keys
CREATE POLICY "Admins can manage i18n keys" 
  ON public.i18n_keys 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage i18n values
CREATE POLICY "Admins can manage i18n values" 
  ON public.i18n_values 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- System (edge functions) can manage missing translations
CREATE POLICY "System can manage missing translations" 
  ON public.i18n_missing 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Admins can view missing translations
CREATE POLICY "Admins can view missing translations" 
  ON public.i18n_missing 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Helper Function: Report Missing Translation
-- ============================================

CREATE OR REPLACE FUNCTION public.report_missing_translation(
  translation_key text,
  default_text_param text,
  target_languages text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert key if doesn't exist
  INSERT INTO public.i18n_keys (key, default_text)
  VALUES (translation_key, default_text_param)
  ON CONFLICT (key) DO NOTHING;
  
  -- Add missing translations for each target language
  INSERT INTO public.i18n_missing (key, default_text, target_lang)
  SELECT translation_key, default_text_param, unnest(target_languages)
  ON CONFLICT (key, target_lang) DO NOTHING;
END;
$$;

COMMENT ON TABLE public.i18n_keys IS 'Stores translation keys and default English text';
COMMENT ON TABLE public.i18n_values IS 'Stores translations in different languages';
COMMENT ON TABLE public.i18n_missing IS 'Queue for auto-translation - tracks missing translations';
COMMENT ON FUNCTION public.report_missing_translation IS 'Helper function to report missing translations for auto-translation';