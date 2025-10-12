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

  // SIMPLIFIED: Just wait for session to be confirmed, then redirect
  useEffect(() => {
    if (!oauthCompleted) return;

    console.log('⏳ OAuth completed, waiting for session confirmation...');
    
    // Give Supabase time to save session to localStorage
    const timeoutId = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 Checking session after OAuth:', { 
        hasSession: !!session, 
        userId: session?.user?.id 
      });
      
      if (session?.user) {
        console.log('✅ Session confirmed, redirecting to account');
        navigate('/account');
      } else {
        console.log('❌ No session found after OAuth');
        navigate('/auth');
      }
    }, 2000); // Wait 2 seconds for session to be saved

    return () => clearTimeout(timeoutId);
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

        // Clean URL from auth params
        const url = new URL(window.location.href);
        ["code", "type", "redirect_to", "next"].forEach((k) => url.searchParams.delete(k));
        window.history.replaceState({}, "", url.pathname);

        console.log('🔄 URL cleaned');

        toast({ description: "Successfully signed in with Google!" });
        
        // Trigger the redirect flow
        console.log('✅ Setting oauthCompleted flag');
        setOauthCompleted(true);
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
