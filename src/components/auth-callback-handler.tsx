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
        
        const { data, error } = await supabase.auth.exchangeCodeForSession(href);
        if (cancelled) return;
        if (error) return; // Fail silently to avoid flashing forms

        handledRef.current = href;

        // Clean URL from auth params
        const url = new URL(window.location.href);
        ["code", "type", "redirect_to", "next"].forEach((k) => url.searchParams.delete(k));
        // Some links may put params after hash, normalize by dropping hash entirely
        window.history.replaceState({}, "", url.pathname + url.search);

        // Restore scroll position after URL cleanup
        setTimeout(() => {
          window.scrollTo(0, scrollY);
        }, 0);

        toast({ description: "Email confirmed. Welcome!" });
      } catch (_) {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.key]);

  return null;
};

export default AuthCallbackHandler;
