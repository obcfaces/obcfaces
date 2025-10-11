import { useEffect, useRef, useState } from 'react';
import { loadTurnstileScript } from '@/utils/turnstile';

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

export const TurnstileWidget = ({ 
  onSuccess, 
  onError, 
  action = 'submit',
  theme = 'auto',
  size = 'normal'
}: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const initTurnstile = async () => {
      try {
        await loadTurnstileScript();
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load Turnstile:', error);
        setLoadError(true);
        onError?.();
      }
    };

    initTurnstile();
  }, [onError]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile) return;

    const siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.error('Turnstile site key not configured');
      setLoadError(true);
      return;
    }

    try {
      // Remove existing widget if any
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }

      // Render new widget
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        theme,
        size,
        callback: (token: string) => {
          onSuccess(token);
        },
        'error-callback': () => {
          console.error('Turnstile error callback triggered');
          onError?.();
        },
        'expired-callback': () => {
          console.log('Turnstile token expired, resetting...');
          if (widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
          }
        },
      });
    } catch (error) {
      console.error('Failed to render Turnstile widget:', error);
      setLoadError(true);
      onError?.();
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [isLoaded, action, theme, size, onSuccess, onError]);

  if (loadError) {
    return (
      <div className="text-sm text-muted-foreground text-center py-2">
        Security verification unavailable
      </div>
    );
  }

  return (
    <div className="flex justify-center py-2">
      <div ref={containerRef} id="turnstile-widget" />
    </div>
  );
};
