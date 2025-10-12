import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// SIMPLIFIED OAuth callback handler
const AuthCallbackHandler = () => {
  const navigate = useNavigate();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const href = window.location.href;
    
    // Only process URLs with auth code
    if (!href.includes("code=")) return;
    
    // Prevent duplicate processing
    if (handledRef.current === href) return;
    handledRef.current = href;

    let cancelled = false;

    (async () => {
      try {
        console.log('🔐 Processing OAuth callback...');
        
        // Exchange code for session - SAME AS EMAIL VERIFICATION
        const { data, error } = await supabase.auth.exchangeCodeForSession(href);
        if (cancelled) return;
        
        if (error) {
          console.error('❌ OAuth error:', error);
          toast({ 
            title: "Authentication Failed",
            description: error.message,
            variant: "destructive"
          });
          navigate('/auth', { replace: true });
          return;
        }

        if (!data.session?.user) {
          console.error('❌ No session after OAuth');
          navigate('/auth', { replace: true });
          return;
        }

        console.log('✅ OAuth successful, user:', data.session.user.id);

        // Clean URL
        const url = new URL(window.location.href);
        ["code", "type", "redirect_to", "next"].forEach((k) => url.searchParams.delete(k));
        window.history.replaceState({}, "", '/');

        // Show success message
        toast({ 
          title: "Success!",
          description: "Successfully signed in!" 
        });
        
        // Redirect to /account (SAME AS EMAIL VERIFICATION)
        setTimeout(() => {
          navigate('/account', { replace: true });
        }, 2000);

      } catch (err) {
        console.error('❌ OAuth exception:', err);
        if (!cancelled) {
          navigate('/auth', { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return null;
};

export default AuthCallbackHandler;
