import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AuthCallbackHandler = () => {
  const navigate = useNavigate();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const href = window.location.href;
    
    if (!href.includes("code=")) return;
    if (handledRef.current === href) return;
    handledRef.current = href;

    let cancelled = false;

    (async () => {
      try {
        console.log('🔐 OAuth callback - exchanging code for session...');
        
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

        const user = data.session.user;
        console.log('✅ OAuth successful, user:', user.id, 'email confirmed:', user.email_confirmed_at);

        // CRITICAL: Create/update profile for OAuth user
        try {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert(
              {
                id: user.id,
                first_name: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || null,
                display_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
                email_verified: true, // OAuth users are already verified by provider
                provider_data: user.user_metadata
              },
              { onConflict: "id" }
            );
          
          if (profileError) {
            console.warn('⚠️ Profile upsert warning:', profileError);
          } else {
            console.log('✅ Profile created/updated for OAuth user');
          }
        } catch (profileErr) {
          console.error('❌ Profile creation error:', profileErr);
        }

        // Clean URL
        const url = new URL(window.location.href);
        ["code", "type", "redirect_to", "next"].forEach((k) => url.searchParams.delete(k));
        window.history.replaceState({}, "", '/');

        toast({ 
          title: "Success!",
          description: "Successfully signed in!" 
        });
        
        // Redirect to profile page after short delay
        setTimeout(() => {
          navigate(`/u/${user.id}`, { replace: true });
        }, 1000);

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
