import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';

interface UseTranslationReturn {
  t: (text: string) => string;
  isLoading: boolean;
}

export const useTranslation = (): UseTranslationReturn => {
  const { tSync, currentLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const t = (text: string): string => {
    if (currentLanguage.code === 'en') {
      return text;
    }
    return tSync(text);
  };

  return { t, isLoading };
};