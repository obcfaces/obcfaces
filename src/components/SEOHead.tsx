import { Helmet } from "react-helmet-async";
import { ALL_LOCALES, PRIORITY_LOCALES } from "@/data/locale-config";
import { useMemo } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
  locale?: string;
  generateHreflang?: boolean;
}

export const SEOHead = ({ 
  title, 
  description, 
  canonicalPath,
  locale,
  generateHreflang = true
}: SEOHeadProps) => {
  const baseUrl = window.location.origin;
  
  // Ensure canonical includes locale if provided
  const fullCanonicalPath = useMemo(() => {
    if (locale && !canonicalPath.startsWith(`/${locale}`)) {
      return `/${locale}${canonicalPath}`;
    }
    return canonicalPath;
  }, [locale, canonicalPath]);
  
  const canonicalUrl = `${baseUrl}${fullCanonicalPath}`;

  // Generate hreflang entries dynamically from config
  const hreflangEntries = useMemo(() => {
    if (!generateHreflang) return [];
    
    // Extract path without locale prefix
    const pathWithoutLocale = canonicalPath.replace(/^\/[a-z]{2}-[a-z]{2}/, '');
    
    return PRIORITY_LOCALES.map(localeStr => {
      const localeConfig = ALL_LOCALES.find(
        l => `${l.languageCode}-${l.countryCode}`.toLowerCase() === localeStr.toLowerCase()
      );
      
      if (!localeConfig) return null;
      
      return {
        hreflang: `${localeConfig.languageCode}-${localeConfig.countryCode.toUpperCase()}`,
        href: `${baseUrl}/${localeStr}${pathWithoutLocale}`,
      };
    }).filter(Boolean);
  }, [generateHreflang, canonicalPath, baseUrl]);

  // Convert locale to og:locale format (e.g., en-ph -> en_PH)
  const ogLocale = useMemo(() => {
    if (!locale) return 'en_PH';
    const [lang, cc] = locale.split('-');
    return `${lang}_${cc?.toUpperCase() || 'PH'}`;
  }, [locale]);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Hreflang tags for all priority locales */}
      {hreflangEntries.map(entry => entry && (
        <link 
          key={entry.hreflang}
          rel="alternate" 
          hrefLang={entry.hreflang} 
          href={entry.href}
        />
      ))}
      
      {/* x-default for international targeting */}
      <link 
        rel="alternate" 
        hrefLang="x-default" 
        href={`${baseUrl}/en-ph${canonicalPath.replace(/^\/[a-z]{2}-[a-z]{2}/, '')}`}
      />
      
      {/* Open Graph tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={ogLocale} />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};
