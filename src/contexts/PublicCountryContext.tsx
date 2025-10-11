import React, { createContext, useContext, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CONTEST_COUNTRIES } from '@/types/admin';
import { getCountryCapitalTimezone } from '@/utils/weekIntervals';
import { parseLocale } from '@/types/locale';
import { useLanguage } from '@/contexts/LanguageContext';

interface PublicCountryContextType {
  locale: string;
  countryCode: string;
  countryName: string;
  timezone: string;
  flag: string;
  languageCode: string;
  navigateToLocale: (countryCode: string, languageCode?: string) => void;
  navigateToCountry: (code: string) => void; // Deprecated, use navigateToLocale
}

const PublicCountryContext = createContext<PublicCountryContextType | undefined>(undefined);

export const PublicCountryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { locale: localeParam } = useParams<{ locale: string }>();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  
  // Parse locale from URL or use default
  const parsedLocale = localeParam ? parseLocale(localeParam) : null;
  const countryCode = parsedLocale?.countryCode || 'PH';
  const languageCode = parsedLocale?.languageCode || currentLanguage.code;
  const locale = `${languageCode}-${countryCode.toLowerCase()}`;
  
  // Find country config
  const countryConfig = CONTEST_COUNTRIES.find(c => c.code === countryCode) || CONTEST_COUNTRIES[0];
  
  const timezone = getCountryCapitalTimezone(countryCode);

  const navigateToLocale = (newCountryCode: string, newLanguageCode?: string) => {
    const lang = newLanguageCode || languageCode;
    navigate(`/${lang}-${newCountryCode.toLowerCase()}`);
  };

  const navigateToCountry = (code: string) => {
    // Legacy support - use current language
    navigateToLocale(code, languageCode);
  };

  return (
    <PublicCountryContext.Provider
      value={{
        locale,
        countryCode,
        countryName: countryConfig.name,
        timezone,
        flag: countryConfig.flag,
        languageCode,
        navigateToLocale,
        navigateToCountry,
      }}
    >
      {children}
    </PublicCountryContext.Provider>
  );
};

export const usePublicCountry = () => {
  const context = useContext(PublicCountryContext);
  if (context === undefined) {
    throw new Error('usePublicCountry must be used within PublicCountryProvider');
  }
  return context;
};
