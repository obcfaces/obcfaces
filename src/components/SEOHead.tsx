import { Helmet } from "react-helmet-async";
import { PRIORITY_LOCALES } from "@/data/locale-config";

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
  const fullCanonicalPath = locale && !canonicalPath.startsWith(`/${locale}`)
    ? `/${locale}${canonicalPath}`
    : canonicalPath;
  const canonicalUrl = `${baseUrl}${fullCanonicalPath}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Hreflang tags for all priority locales */}
      {generateHreflang && PRIORITY_LOCALES.map(loc => {
        const path = canonicalPath.replace(/^\/[a-z]{2}-[a-z]{2}/, '');
        return (
          <link 
            key={loc}
            rel="alternate" 
            hrefLang={loc} 
            href={`${baseUrl}/${loc}${path}`}
          />
        );
      })}
      
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
      <meta property="og:locale" content={locale || 'en_PH'} />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};
