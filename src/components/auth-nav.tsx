import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoginModalTrigger from "@/components/login-modal";

// Shows Login button when logged out and a round avatar linking to the user's profile when logged in
const AuthNav = () => {
  const [session, setSession] = useState<import("@supabase/supabase-js").Session | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

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
  };

  const fallbackInitial = useMemo(() => {
    const base = displayName || session?.user?.email || "U";
    return base.trim().charAt(0).toUpperCase();
  }, [displayName, session?.user?.email]);

  if (!session?.user) {
    return <LoginModalTrigger />;
  }

  return (
    <Link
      to={`/u/${session.user.id}`}
      className="inline-flex items-center"
      aria-label="Open your profile"
    >
      <Avatar className="h-9 w-9 ring-1 ring-border hover:ring-primary transition-colors">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={(displayName || "User") + " avatar"} />
        ) : (
          <AvatarFallback className="text-sm font-medium">
            {fallbackInitial}
          </AvatarFallback>
        )}
      </Avatar>
    </Link>
  );
};

export default AuthNav;
