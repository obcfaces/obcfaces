import { supabase } from "@/integrations/supabase/client";

interface TurnstileVerificationResult {
  success: boolean;
  score?: number;
  error?: string;
}

/**
 * Execute Cloudflare Turnstile and get token
 */
export const executeTurnstile = async (action: string = 'submit'): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if Turnstile is loaded
    if (!window.turnstile) {
      reject(new Error('Turnstile not loaded'));
      return;
    }

    // Get site key from environment
    const siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      reject(new Error('Turnstile site key not configured'));
      return;
    }

    // Render invisible widget
    const widgetId = window.turnstile.render('#turnstile-container', {
      sitekey: siteKey,
      action,
      callback: (token: string) => {
        resolve(token);
        // Remove widget after success
        if (widgetId) {
          window.turnstile.remove(widgetId);
        }
      },
      'error-callback': () => {
        reject(new Error('Turnstile verification failed'));
        if (widgetId) {
          window.turnstile.remove(widgetId);
        }
      },
    });
  });
};

/**
 * Verify Turnstile token on server
 */
export const verifyTurnstile = async (
  token: string,
  action?: string
): Promise<TurnstileVerificationResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-captcha', {
      body: { token, action },
    });

    if (error) {
      console.error('Turnstile verification error:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error: any) {
    console.error('Turnstile verification exception:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Higher-order function to protect forms with Turnstile
 */
export const withTurnstile = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  action: string = 'submit'
): T => {
  return (async (...args: any[]) => {
    try {
      // Execute Turnstile
      const token = await executeTurnstile(action);

      // Verify token
      const verification = await verifyTurnstile(token, action);

      if (!verification.success) {
        throw new Error(verification.error || 'Security verification failed');
      }

      // Call original function
      return await fn(...args);
    } catch (error) {
      console.error('Turnstile protection error:', error);
      throw error;
    }
  }) as T;
};

/**
 * Load Turnstile script dynamically
 */
export const loadTurnstileScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.turnstile) {
      resolve();
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src*="challenges.cloudflare.com"]')) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Turnstile script loading timeout'));
      }, 10000);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Wait for turnstile to be available
      const checkTurnstile = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkTurnstile);
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkTurnstile);
        if (window.turnstile) {
          resolve();
        } else {
          reject(new Error('Turnstile not available after script load'));
        }
      }, 5000);
    };

    script.onerror = () => {
      reject(new Error('Failed to load Turnstile script'));
    };

    document.head.appendChild(script);
  });
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}
