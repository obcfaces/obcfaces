import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
  languages?: string[];
}

export const SEOHead = ({ 
  title, 
  description, 
  canonicalPath,
  languages = ['en', 'es', 'ru']
}: SEOHeadProps) => {
  const baseUrl = window.location.origin;
  const canonicalUrl = `${baseUrl}${canonicalPath}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Hreflang tags for multi-language support */}
      {languages.map(lang => (
        <link 
          key={lang}
          rel="alternate" 
          hrefLang={lang} 
          href={`${baseUrl}${canonicalPath}?lang=${lang}`}
        />
      ))}
      
      {/* x-default for international targeting */}
      <link 
        rel="alternate" 
        hrefLang="x-default" 
        href={canonicalUrl}
      />
      
      {/* Open Graph tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};
