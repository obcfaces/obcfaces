import React, { createContext, useContext, useState, useEffect } from 'react';
import { translationService } from '../services/translationService';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (text: string) => Promise<string>;
  tSync: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]);
  const [translatedTexts, setTranslatedTexts] = useState<Map<string, string>>(new Map());

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('preferredLanguage', language.code);
    // Clear translated texts cache when language changes
    setTranslatedTexts(new Map());
  };

  // Async translation function
  const t = async (text: string): Promise<string> => {
    if (currentLanguage.code === 'en') {
      return text; // English is the base language
    }

    const cacheKey = `${text}_${currentLanguage.code}`;
    if (translatedTexts.has(cacheKey)) {
      return translatedTexts.get(cacheKey)!;
    }

    try {
      const translated = await translationService.translateText(text, currentLanguage.code);
      setTranslatedTexts(prev => new Map(prev).set(cacheKey, translated));
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  // Synchronous translation function for immediate use
  const tSync = (text: string): string => {
    if (currentLanguage.code === 'en') {
      return text; // English is the base language
    }

    const cacheKey = `${text}_${currentLanguage.code}`;
    if (translatedTexts.has(cacheKey)) {
      return translatedTexts.get(cacheKey)!;
    }

    // For synchronous use, trigger async translation in background
    t(text).then(() => {
      // This will update the cache for next render
    });

    // Return original text while translation is pending
    return text;
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      const language = languages.find(lang => lang.code === savedLanguage);
      if (language) {
        setCurrentLanguage(language);
      }
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, tSync }}>
      {children}
    </LanguageContext.Provider>
  );
};