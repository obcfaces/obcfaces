import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { saveDeviceFingerprint } from "@/utils/fingerprint";

// Handles Supabase email confirmation / magic-link callbacks globally
const AuthCallbackHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const href = window.location.href;
    // Prevent duplicate handling on the same URL
    if (handledRef.current === href) return;

    const hasCode = href.includes("code=");
    if (!hasCode) return;

    let cancelled = false;

    (async () => {
      try {
        // Save current scroll position
        const scrollY = window.scrollY;
        
        console.log('Auth callback handler processing URL:', href);
        
        const { data, error } = await supabase.auth.exchangeCodeForSession(href);
        if (cancelled) return;
        
        if (error) {
          console.error('Auth callback error:', error);
          // Provide more specific error messages based on error type
          let errorMessage = "Confirmation link is invalid or expired. Please try logging in again.";
          
          if (error.message.includes('session_not_found')) {
            errorMessage = "Session not found. Please try logging in again.";
          } else if (error.message.includes('invalid_grant')) {
            errorMessage = "Invalid authorization code. Please request a new confirmation email.";
          } else if (error.message.includes('expired')) {
            errorMessage = "Confirmation link has expired. Please request a new one.";
          } else if (error.message.includes('invalid_request')) {
            errorMessage = "Invalid request. Please try logging in again.";
          }
          
          toast({ 
            title: "Email Confirmation Failed",
            description: errorMessage,
            variant: "destructive"
          });
          return;
        }

        handledRef.current = href;
        
        console.log('Auth callback successful:', data);

        // Save device fingerprint and log login for OAuth users
        if (data.session?.user) {
          try {
            // Get full fingerprint data and save it
            const { getDeviceFingerprint, saveDeviceFingerprint } = await import('@/utils/fingerprint');
            const fullFingerprintData = await getDeviceFingerprint();
            const fingerprintId = await saveDeviceFingerprint(data.session.user.id);
            
            console.log('Device fingerprint saved for OAuth user');
            
            // Get IP address
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            
            // Determine login method from provider
            const provider = data.session.user.app_metadata?.provider || 'oauth';
            
            // Log the OAuth login with full fingerprint data
            await supabase.functions.invoke('auth-login-tracker', {
              body: {
                userId: data.session.user.id,
                loginMethod: provider,
                ipAddress: ipData.ip,
                userAgent: navigator.userAgent,
                fingerprintId: fingerprintId,
                fingerprintData: {
                  screen_resolution: fullFingerprintData.screen_resolution,
                  timezone: fullFingerprintData.timezone,
                  timezone_offset: fullFingerprintData.timezone_offset,
                  language: fullFingerprintData.language,
                  languages: fullFingerprintData.languages,
                  platform: fullFingerprintData.platform,
                  canvas_fingerprint: fullFingerprintData.canvas_fingerprint,
                  webgl_vendor: fullFingerprintData.webgl_vendor,
                  webgl_renderer: fullFingerprintData.webgl_renderer,
                  touch_support: fullFingerprintData.touch_support,
                  hardware_concurrency: fullFingerprintData.hardware_concurrency,
                  device_memory: fullFingerprintData.device_memory,
                  cookies_enabled: fullFingerprintData.cookies_enabled,
                  do_not_track: fullFingerprintData.do_not_track,
                  screen_color_depth: fullFingerprintData.screen_color_depth
                }
              }
            });
            
            console.log('OAuth login logged successfully');
          } catch (fpError) {
            console.error('Error saving fingerprint/logging OAuth login:', fpError);
          }
        }

        // Clean URL from auth params
        const url = new URL(window.location.href);
        ["code", "type", "redirect_to", "next"].forEach((k) => url.searchParams.delete(k));
        
        // Always redirect to home page instead of localhost URLs
        const cleanPath = url.pathname === '/account' ? '/account' : '/';
        window.history.replaceState({}, "", cleanPath);

        // Restore scroll position after URL cleanup
        setTimeout(() => {
          window.scrollTo(0, scrollY);
        }, 0);

        toast({ description: "Email confirmed. Welcome!" });
        
        // Force navigation to account page if we're on the callback
        if (data.session?.user) {
          setTimeout(() => {
            navigate('/account');
          }, 1000);
        }
      } catch (err) {
        console.error('Auth callback exception:', err);
        // Don't show errors to user unless it's critical
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.key]);

  return null;
};

export default AuthCallbackHandler;
