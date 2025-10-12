import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Account = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    console.log('📍 AccountPage mounted, checking session...');
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📊 AccountPage session check:', { 
        hasSession: !!session,
        userId: session?.user?.id 
      });
      
      if (session?.user) {
        console.log('✅ Session found, redirecting to profile:', session.user.id);
        navigate(`/u/${session.user.id}`, { replace: true });
      } else {
        console.log('❌ No session, redirecting to auth');
        navigate("/auth", { replace: true });
      }
      setIsChecking(false);
    };

    checkSession();
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