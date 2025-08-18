import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Account = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth", { replace: true });
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const logout = async () => {
    setLogoutLoading(true);
    try {
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } catch (error) {
      toast({ description: "Ошибка при выходе" });
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>Account - OBC faces</title>
        <meta name="description" content="Account management" />
      </Helmet>
      
      <div className="container mx-auto max-w-2xl py-10 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Account</h1>
          <Button variant="secondary" onClick={logout} disabled={logoutLoading}>
            {logoutLoading ? "Logging out..." : "Logout"}
          </Button>
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">Account settings coming soon</p>
        </div>
      </div>
    </main>
  );
};

export default Account;
