import { supabase } from '@/integrations/supabase/client';

// Add this to your public/index.html:
// <script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>

const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Test key, replace in production

interface CaptchaVerificationResult {
  success: boolean;
  score?: number;
  error?: string;
}

/**
 * Execute reCAPTCHA and get token
 */
export const executeRecaptcha = async (action: string = 'submit'): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !(window as any).grecaptcha) {
      reject(new Error('reCAPTCHA not loaded'));
      return;
    }

    (window as any).grecaptcha.ready(() => {
      (window as any).grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action })
        .then((token: string) => {
          resolve(token);
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  });
};

/**
 * Verify reCAPTCHA token on server
 */
export const verifyCaptcha = async (
  token: string,
  action?: string,
  minScore: number = 0.5
): Promise<CaptchaVerificationResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-captcha', {
      body: {
        token,
        action,
        minScore,
      },
    });

    if (error) {
      console.error('CAPTCHA verification error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data as CaptchaVerificationResult;
  } catch (error: any) {
    console.error('CAPTCHA verification failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Higher-order function to protect forms with CAPTCHA
 */
export const withCaptcha = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  action: string = 'submit',
  minScore: number = 0.5
): T => {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      // Execute reCAPTCHA
      const token = await executeRecaptcha(action);

      // Verify token
      const verification = await verifyCaptcha(token, action, minScore);

      if (!verification.success) {
        throw new Error(verification.error || 'CAPTCHA verification failed');
      }

      // Call original function if verification passed
      return fn(...args);
    } catch (error: any) {
      throw new Error(`Security check failed: ${error.message}`);
    }
  }) as T;
};

/**
 * Load reCAPTCHA script dynamically
 */
export const loadRecaptchaScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined'));
      return;
    }

    // Check if already loaded
    if ((window as any).grecaptcha) {
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load reCAPTCHA script'));
    };

    document.head.appendChild(script);
  });
};