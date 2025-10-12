import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import LoginModalContent from "@/features/auth/components/LoginModalContent";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("signup");

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "signup" || m === "login") {
      setMode(m);
    }
  }, [searchParams]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Check if user has email - critical for OAuth users
        if (!session.user.email) {
          toast({
            title: "Email Required",
            description: "Your social account doesn't provide an email. Please contact support.",
            variant: "destructive"
          });
          await supabase.auth.signOut();
          return;
        }
        
        // Check if there's a saved redirect path (for admin users)
        const redirectPath = sessionStorage.getItem('redirectPath');
        if (redirectPath) {
          sessionStorage.removeItem('redirectPath');
          navigate(redirectPath, { replace: true });
        } else {
          navigate("/account", { replace: true });
        }
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        // Check if user has email
        if (!data.session.user.email) {
          toast({
            title: "Email Required", 
            description: "Your social account doesn't provide an email. Please contact support.",
            variant: "destructive"
          });
          await supabase.auth.signOut();
          return;
        }
        
        // Check if there's a saved redirect path (for admin users)
        const redirectPath = sessionStorage.getItem('redirectPath');
        if (redirectPath) {
          sessionStorage.removeItem('redirectPath');
          navigate(redirectPath, { replace: true });
        } else {
          navigate("/account", { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const title = mode === "login" ? "Sign in" : "Sign up";
  const description = mode === "login" ? "Sign in to manage your profile" : "Share your profile, invite friends to vote, and join the contest!";

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
            // Auth success will be handled by onAuthStateChange
          }}
        />
      </div>
    </main>
  );
};

export default Auth;
