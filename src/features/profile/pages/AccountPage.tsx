import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Account = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Subscribe to auth state changes to handle OAuth redirects properly
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('📍 Account page - Auth state change:', { 
        event, 
        userId: session?.user?.id,
        hasSession: !!session 
      });
      
      // Clear any pending timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      if (session?.user) {
        console.log('✅ Account page - User authenticated, redirecting to profile:', session.user.id);
        // User is authenticated, redirect to profile
        navigate(`/u/${session.user.id}`, { replace: true });
      } else if (!isChecking && event !== 'INITIAL_SESSION') {
        // No session and done checking, redirect to auth (but not on initial load)
        console.log('❌ Account page - No session, redirecting to auth');
        navigate("/auth", { replace: true });
      }
    });

    // Also check current session (for direct navigation)
    const checkSession = async () => {
      console.log('🔍 Account page - Checking current session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📊 Account page - Session check result:', { 
        userId: session?.user?.id,
        hasSession: !!session 
      });
      
      if (session?.user) {
        console.log('✅ Account page - Session found, redirecting to profile');
        navigate(`/u/${session.user.id}`, { replace: true });
      } else {
        console.log('⏳ Account page - No session yet, will wait for auth state change...');
        // Set a fallback timeout - if no session after 3 seconds, redirect to auth
        timeoutId = setTimeout(() => {
          console.log('⏰ Account page - Timeout reached, redirecting to auth');
          navigate("/auth", { replace: true });
        }, 3000);
      }
      setIsChecking(false);
    };

    checkSession();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
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