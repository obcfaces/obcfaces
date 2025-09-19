import { useState, useEffect } from 'react';

export type CookieCategory = 'necessary' | 'analytics' | 'marketing' | 'personalization';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true, // Always true, cannot be disabled
  analytics: false,
  marketing: false,
  personalization: false,
};

export const useCookieConsent = () => {
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  // Load preferences from localStorage
  useEffect(() => {
    const savedConsent = localStorage.getItem('cookie-consent');
    const savedPreferences = localStorage.getItem('cookie-preferences');
    
    if (savedConsent) {
      setHasConsent(true);
      
      if (savedPreferences) {
        try {
          const parsed = JSON.parse(savedPreferences);
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        } catch (error) {
          console.error('Failed to parse cookie preferences:', error);
        }
      } else {
        // Set default based on consent type
        if (savedConsent === 'accepted') {
          setPreferences({
            necessary: true,
            analytics: true,
            marketing: true,
            personalization: true,
          });
        }
      }
    } else {
      setHasConsent(false);
    }
  }, []);

  // Apply cookie preferences (load/unload scripts)
  useEffect(() => {
    if (hasConsent === null) return;

    // Analytics (Google Analytics)
    if (preferences.analytics) {
      loadGoogleAnalytics();
    } else {
      unloadGoogleAnalytics();
    }

    // Marketing (Meta Pixel)
    if (preferences.marketing) {
      loadMetaPixel();
    } else {
      unloadMetaPixel();
    }

    // Personalization cookies would go here
    if (preferences.personalization) {
      // Enable personalization features
      enablePersonalization();
    } else {
      disablePersonalization();
    }
  }, [preferences, hasConsent]);

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
    };
    
    setPreferences(allAccepted);
    setHasConsent(true);
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('cookie-preferences', JSON.stringify(allAccepted));
  };

  const rejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
    };
    
    setPreferences(onlyNecessary);
    setHasConsent(true);
    localStorage.setItem('cookie-consent', 'rejected');
    localStorage.setItem('cookie-preferences', JSON.stringify(onlyNecessary));
  };

  const saveCustomPreferences = (customPreferences: CookiePreferences) => {
    const finalPreferences = { ...customPreferences, necessary: true };
    setPreferences(finalPreferences);
    setHasConsent(true);
    localStorage.setItem('cookie-consent', 'customized');
    localStorage.setItem('cookie-preferences', JSON.stringify(finalPreferences));
  };

  const resetConsent = () => {
    setHasConsent(false);
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem('cookie-consent');
    localStorage.removeItem('cookie-preferences');
  };

  return {
    preferences,
    hasConsent,
    acceptAll,
    rejectAll,
    saveCustomPreferences,
    resetConsent,
  };
};

// Analytics Functions
const loadGoogleAnalytics = () => {
  if (document.querySelector('#google-analytics')) return;
  
  // Google Analytics script loading would go here
  console.log('Loading Google Analytics');
  
  // Example: Load GA script
  const script = document.createElement('script');
  script.id = 'google-analytics';
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
  document.head.appendChild(script);
  
  // Initialize GA
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
};

const unloadGoogleAnalytics = () => {
  const script = document.querySelector('#google-analytics');
  if (script) {
    script.remove();
  }
  
  // Clear GA cookies
  document.cookie.split(";").forEach((c) => {
    if (c.trim().startsWith('_ga')) {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
  });
  
  console.log('Unloaded Google Analytics');
};

// Marketing Functions
const loadMetaPixel = () => {
  if (document.querySelector('#meta-pixel')) return;
  
  console.log('Loading Meta Pixel');
  
  // Meta Pixel script loading would go here
  const script = document.createElement('script');
  script.id = 'meta-pixel';
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', 'YOUR_PIXEL_ID');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);
};

const unloadMetaPixel = () => {
  const script = document.querySelector('#meta-pixel');
  if (script) {
    script.remove();
  }
  
  // Clear Facebook cookies
  document.cookie.split(";").forEach((c) => {
    if (c.trim().startsWith('_fb')) {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
  });
  
  console.log('Unloaded Meta Pixel');
};

// Personalization Functions
const enablePersonalization = () => {
  console.log('Enabled personalization features');
  // Enable personalized content, language preferences, etc.
};

const disablePersonalization = () => {
  console.log('Disabled personalization features');
  // Clear personalization cookies
  const personalCookies = ['language-preference', 'theme-preference', 'user-settings'];
  personalCookies.forEach(cookie => {
    document.cookie = `${cookie}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  });
};

// Global type declarations
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
  }
}