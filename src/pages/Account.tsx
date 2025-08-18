import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Account = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth", { replace: true });
        return;
      }
      // Redirect to user's profile
      navigate(`/u/${session.user.id}`, { replace: true });
    };
    checkAuthAndRedirect();
  }, [navigate]);

  return null;
};

export default Account;