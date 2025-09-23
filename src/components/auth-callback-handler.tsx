import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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
