import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Account = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes to handle OAuth redirects properly
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Account page auth state change:', event, session?.user?.id);
      
      if (session?.user) {
        // User is authenticated, redirect to profile
        navigate(`/u/${session.user.id}`, { replace: true });
      } else if (!isChecking) {
        // No session and done checking, redirect to auth
        navigate("/auth", { replace: true });
      }
    });

    // Also check current session (for direct navigation)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Account page checking session:', session?.user?.id);
      
      if (session?.user) {
        navigate(`/u/${session.user.id}`, { replace: true });
      } else {
        // No session, redirect to auth
        navigate("/auth", { replace: true });
      }
      setIsChecking(false);
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, isChecking]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm text-muted-foreground">Redirecting...</div>
      </div>
    </div>
  );
};

export default Account;