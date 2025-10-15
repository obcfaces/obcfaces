import { useEffect, useState } from 'react';
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import LoginModalContent from "@/features/auth/components/LoginModalContent";
import { exchangeIfCodeInUrl, upsertProfileIdempotent, getCurrentSession } from '../services/auth.service';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phase, setPhase] = useState<'working' | 'idle' | 'error'>('working');
  const [mode, setMode] = useState<"login" | "signup">("signup");

  // Handle mode from query params for login/signup UI
  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "signup" || m === "login") {
      setMode(m);
    }
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const err = url.searchParams.get('error');

        // 0) Check for existing session
        const session = await getCurrentSession();
        
        if (session?.user) {
          // Check if user has email
          if (!session.user.email) {
            toast({
              title: "Email Required",
              description: "Your social account doesn't provide an email. Please contact support.",
              variant: "destructive"
            });
            await supabase.auth.signOut();
            setPhase('error');
            return;
          }
          
          // Check if there's a saved redirect path (for admin users)
          const redirectPath = sessionStorage.getItem('redirectPath');
          if (redirectPath) {
            sessionStorage.removeItem('redirectPath');
            navigate(redirectPath, { replace: true });
          } else {
            navigate("/", { replace: true });
          }
          return;
        }

        // 1) Ошибка от провайдера (access_denied и т.п.)
        if (err) {
          console.warn('OAuth error:', err, url.searchParams.get('error_description'));
          toast({
            title: "Authentication Error",
            description: url.searchParams.get('error_description') || "Authentication failed. Please try again.",
            variant: "destructive"
          });
          setPhase('idle'); // Show login form again
          return;
        }

        // 2) Exchange code for session (PKCE flow)
        const codeSession = await exchangeIfCodeInUrl();
        if (codeSession) {
          const user = codeSession.user;
          if (!user) throw new Error('No user after exchangeCodeForSession');

          // Check if user has email
          if (!user.email) {
            toast({
              title: "Email Required",
              description: "Your social account doesn't provide an email. Please contact support.",
              variant: "destructive"
            });
            await supabase.auth.signOut();
            setPhase('error');
            return;
          }

          await upsertProfileIdempotent(user.id);
          
          // Check if there's a saved redirect path
          const redirectPath = sessionStorage.getItem('redirectPath');
          if (redirectPath) {
            sessionStorage.removeItem('redirectPath');
            navigate(redirectPath, { replace: true });
          } else {
            navigate("/", { replace: true });
          }
          return;
        }

        // 3) Просто открыли /auth руками — показать форму входа
        setPhase('idle');
      } catch (e) {
        console.error('Auth page error:', e);
        toast({
          title: "Error",
          description: "An error occurred during authentication. Please try again.",
          variant: "destructive"
        });
        setPhase('idle'); // Show login form
      }
    })();
  }, [navigate, searchParams]);

  const title = mode === "login" ? "Sign in" : "Sign up";
  const description = mode === "login" ? "Sign in to manage your profile" : "Share your profile, invite friends to vote, and join the contest!";

  if (phase === 'working') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm text-muted-foreground">Loading authentication...</div>
        </div>
      </div>
    );
  }

  // idle or error - show login form
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Helmet>
        <title>{`${title} — OBC Face`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${window.location.origin}/auth`} />
      </Helmet>
      
      <div className="w-full max-w-md bg-card rounded-lg border border-border shadow-lg p-8">
        <LoginModalContent 
          defaultMode={mode}
          isStandalonePage={true}
          onAuthSuccess={() => {
            // Auth success will be handled by code exchange flow
          }}
        />
      </div>
    </main>
  );
};

export default Auth;
