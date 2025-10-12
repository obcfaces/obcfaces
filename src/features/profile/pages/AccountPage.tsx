import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// SIMPLIFIED: Just redirect to user profile
const Account = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('✅ Redirecting to profile:', session.user.id);
        navigate(`/u/${session.user.id}`, { replace: true });
      } else {
        console.log('❌ No session, redirecting to auth');
        navigate("/auth", { replace: true });
      }
    };

    redirect();
  }, [navigate]);

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