import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { saveDeviceFingerprint, getDeviceFingerprint } from '@/utils/fingerprint';

// Handles Supabase email confirmation / magic-link callbacks globally
const AuthCallbackHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const handledRef = useRef<string | null>(null);
  const [oauthCompleted, setOauthCompleted] = useState(false);

  // Subscribe to auth state changes to handle OAuth completion properly
  useEffect(() => {
    if (!oauthCompleted) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state change after OAuth:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ Session confirmed in storage, redirecting to account page');
        // Session is now confirmed to be in localStorage
        navigate('/account');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, oauthCompleted]);

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
        
        console.log('✅ Auth callback successful:', { 
          userId: data.session?.user?.id,
          email: data.session?.user?.email,
          provider: data.session?.user?.app_metadata?.provider
        });

        // Collect fingerprint data in background (non-blocking)
        if (data.session?.user) {
          const user = data.session.user;
          
          // Don't await - let it run in background
          (async () => {
            try {
              console.log('🔐 Collecting fingerprint data...');
              
              const fpId = await saveDeviceFingerprint(user.id);
              const fullFingerprintData = await getDeviceFingerprint();
              const ipResponse = await fetch('https://api.ipify.org?format=json');
              const ipData = await ipResponse.json();
              const loginMethod = user.app_metadata?.provider || 'email';
              
              await supabase.functions.invoke('auth-login-tracker', {
                body: {
                  userId: user.id,
                  loginMethod,
                  ipAddress: ipData.ip,
                  userAgent: navigator.userAgent,
                  fingerprintId: fpId,
                  fingerprintData: fullFingerprintData
                }
              });
              
              console.log('✅ Fingerprint logged');
            } catch (fpError) {
              console.error('❌ Fingerprint error (non-critical):', fpError);
            }
          })();
        }

        // Clean URL from auth params but keep the path
        const url = new URL(window.location.href);
        const originalPath = url.pathname;
        ["code", "type", "redirect_to", "next"].forEach((k) => url.searchParams.delete(k));
        
        // Don't change the path, just clean the query params
        window.history.replaceState({}, "", originalPath);

        console.log('🔄 URL cleaned, original path:', originalPath);

        toast({ description: "Successfully signed in with Google!" });
        
        // Set flag to trigger auth state listener which will handle redirect
        if (data.session?.user) {
          console.log('✅ OAuth successful for user:', data.session.user.id);
          console.log('⏳ Waiting for SIGNED_IN event from Supabase...');
          setOauthCompleted(true);
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
