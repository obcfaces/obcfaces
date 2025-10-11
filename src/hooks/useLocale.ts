import { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ALL_LOCALES } from '@/data/locale-config';
import type { LocaleTuple } from '@/features/contest/types';

const SUPPORTED_LOCALES = new Set(
  ALL_LOCALES.map(l => `${l.languageCode}-${l.countryCode}`.toLowerCase())
);

/**
 * Normalize locale string to lowercase and validate
 * Returns normalized locale or default fallback
 */
export function normalizeLocale(raw?: string): string {
  if (!raw) return "en-ph";
  
  const normalized = raw.toLowerCase();
  
  // Check if already valid
  if (SUPPORTED_LOCALES.has(normalized)) {
    return normalized;
  }
  
  // Try to parse and validate parts
  const parts = normalized.split("-");
  if (parts.length === 2) {
    const candidate = `${parts[0]}-${parts[1]}`;
    if (SUPPORTED_LOCALES.has(candidate)) {
      return candidate;
    }
  }
  
  // Fallback to default
  return "en-ph";
}

/**
 * Parse locale string into language and country code
 */
export function parseLocaleTuple(locale: string): LocaleTuple {
  const normalized = normalizeLocale(locale);
  const [lang, cc] = normalized.split("-");
  return { lang, cc };
}

/**
 * Hook for locale management
 * Provides current locale info and navigation helpers
 */
export function useLocale() {
  const { locale: localeParam } = useParams<{ locale?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const locale = useMemo(() => {
    return normalizeLocale(localeParam);
  }, [localeParam]);
  
  const { lang, cc } = useMemo(() => {
    return parseLocaleTuple(locale);
  }, [locale]);
  
  const localeConfig = useMemo(() => {
    return ALL_LOCALES.find(
      l => l.languageCode === lang && l.countryCode.toLowerCase() === cc
    );
  }, [lang, cc]);
  
  const navigateToLocale = (newLang: string, newCc: string, preserveQuery = true) => {
    const newLocale = `${newLang}-${newCc}`.toLowerCase();
    const query = preserveQuery ? location.search : "";
    const path = location.pathname.replace(/^\/[a-z]{2}-[a-z]{2}/, "");
    
    // Save to localStorage
    localStorage.setItem("ui_lang", newLang);
    localStorage.setItem("ui_cc", newCc);
    
    navigate(`/${newLocale}${path}${query}`);
  };
  
  const isValidLocale = SUPPORTED_LOCALES.has(locale);
  
  return {
    locale,
    lang,
    cc,
    localeConfig,
    navigateToLocale,
    isValidLocale,
    supportedLocales: ALL_LOCALES,
  };
}
