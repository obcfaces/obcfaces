import { supabase } from '@/data/supabaseClient';

/**
 * Capture error and log to database
 */
export function captureError(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : null;

  // Fire and forget - don't await or handle errors from logging
  void supabase.from('error_logs').insert({
    message: msg,
    stack,
    url: typeof window !== 'undefined' ? window.location.href : null,
  });
}

/**
 * Install global error handlers
 */
export function installGlobalErrorHandler() {
  if (typeof window === 'undefined') return;

  window.onerror = (message, source, lineno, colno, err) => {
    captureError(err ?? new Error(String(message)));
    return false;
  };

  window.onunhandledrejection = (ev) => {
    captureError(ev.reason ?? new Error('Unhandled rejection'));
  };
}
