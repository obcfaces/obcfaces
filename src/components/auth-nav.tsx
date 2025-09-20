import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, MessageCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LoginModalContent from "@/components/login-modal-content";

// Shows Login button when logged out and a round avatar linking to the user's profile when logged in
const AuthNav = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [session, setSession] = useState<import("@supabase/supabase-js").Session | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Subscribe first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        // Defer any additional Supabase calls
        setTimeout(() => fetchProfile(nextSession.user.id), 0);
      } else {
        setAvatarUrl(null);
        setDisplayName(null);
      }
    });

    // Then get current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchProfile(data.session.user.id);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async (id: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, display_name, first_name, last_name")
      .eq("id", id)
      .maybeSingle();

    const dn = data?.display_name || [data?.first_name, data?.last_name].filter(Boolean).join(" ") || null;
    setDisplayName(dn);
    setAvatarUrl(data?.avatar_url || null);

    // Check admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', id);

    setIsAdmin(roles?.some(r => r.role === 'admin') || false);
  };

  const fallbackInitial = useMemo(() => {
    const base = displayName || session?.user?.email || "U";
    return base.trim().charAt(0).toUpperCase();
  }, [displayName, session?.user?.email]);

  if (!session?.user) {
    return (
      <>
        <button 
          className="text-sm underline text-primary whitespace-nowrap"
          onClick={() => setIsLoginOpen(true)}
        >
          Sign in
        </button>
        
        <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
          <DialogContent className="sm:max-w-lg data-[state=open]:translate-y-[5%] sm:data-[state=open]:translate-y-[2%]">
            <LoginModalContent onClose={() => setIsLoginOpen(false)} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        to={`/u/${session.user.id}`}
        className="inline-flex items-center"
        aria-label="Open your profile"
      >
        <div className="h-9 w-9 ring-1 ring-border hover:ring-primary transition-colors rounded-full overflow-hidden bg-muted flex items-center justify-center">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={(displayName || "User") + " avatar"} 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {fallbackInitial}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};

export default AuthNav;
