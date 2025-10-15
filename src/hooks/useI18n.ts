import { useState, useEffect } from 'react';
import enTranslations from '@/i18n/en.json';
import ruTranslations from '@/i18n/ru.json';
import phTranslations from '@/i18n/ph.json';

type Translations = typeof enTranslations;
type TranslationKey = keyof Translations;

const translations: Record<string, Translations> = {
  en: enTranslations,
  ru: ruTranslations,
  ph: phTranslations,
};

export const useI18n = () => {
  const [locale, setLocale] = useState<string>(() => {
    return localStorage.getItem('locale') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let text = translations[locale]?.[key] || translations['en'][key] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{{${param}}}`, String(value));
      });
    }
    
    return text;
  };

  return { t, locale, setLocale };
};
