import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { saveDeviceFingerprint, getDeviceFingerprint } from '@/utils/fingerprint';

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

        // CRITICAL: Collect fingerprint data for OAuth users right after successful authentication
        if (data.session?.user) {
          try {
            console.log('🔐 OAuth user authenticated, collecting fingerprint data...');
            
            // Save fingerprint
            const fpId = await saveDeviceFingerprint(data.session.user.id);
            
            // Get full fingerprint data
            const fullFingerprintData = await getDeviceFingerprint();
            
            // Get IP address
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            
            // Determine login method (OAuth provider)
            const loginMethod = data.session.user.app_metadata?.provider || 'email';
            
            console.log('📱 Saving OAuth fingerprint for user:', { 
              userId: data.session.user.id, 
              loginMethod, 
              fpId,
              ip: ipData.ip 
            });
            
            // Call edge function to log full fingerprint data
            const { error: fpError } = await supabase.functions.invoke('auth-login-tracker', {
              body: {
                userId: data.session.user.id,
                loginMethod,
                ipAddress: ipData.ip,
                userAgent: navigator.userAgent,
                fingerprintId: fpId,
                fingerprintData: fullFingerprintData
              }
            });
            
            if (fpError) {
              console.error('❌ Error calling auth-login-tracker:', fpError);
            } else {
              console.log('✅ Successfully logged OAuth fingerprint data');
            }
            
            console.log('✅ Profile fingerprint data saved to login logs');
          } catch (fpError) {
            console.error('❌ Error collecting OAuth fingerprint:', fpError);
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
        
        // Navigate to account page after session is saved
        // Increased delay to ensure session is fully persisted to localStorage
        if (data.session?.user) {
          console.log('✅ OAuth successful, redirecting to account page for user:', data.session.user.id);
          setTimeout(() => {
            navigate('/account');
          }, 1500); // Increased from 1000ms to 1500ms
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
