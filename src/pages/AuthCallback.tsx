import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        
        if (!code) {
          console.error('❌ No authorization code in URL');
          setStatus('error');
          toast({
            title: "Authentication Error",
            description: "No authorization code received",
            variant: "destructive"
          });
          navigate('/auth', { replace: true });
          return;
        }

        console.log('🔐 Exchanging code for session...');
        
        // CRITICAL: Exchange OAuth code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        
        if (error) {
          console.error('❌ Session exchange error:', error);
          setStatus('error');
          toast({
            title: "Authentication Failed",
            description: error.message,
            variant: "destructive"
          });
          navigate('/auth', { replace: true });
          return;
        }

        if (!data.session?.user) {
          console.error('❌ No session after exchange');
          setStatus('error');
          navigate('/auth', { replace: true });
          return;
        }

        const user = data.session.user;
        console.log('✅ Session established for user:', user.id);

        // Create/update profile for OAuth user
        try {
          await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              first_name: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || null,
              display_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              email_verified: true,
              provider_data: user.user_metadata
            }, { onConflict: "id" });
          
          console.log('✅ Profile created/updated');
        } catch (profileErr) {
          console.warn('⚠️ Profile error:', profileErr);
        }

        toast({
          title: "Success!",
          description: "Successfully signed in"
        });

        // Get redirect destination
        const next = searchParams.get('next') || `/u/${user.id}`;
        
        // Redirect after short delay
        setTimeout(() => {
          navigate(next, { replace: true });
        }, 500);

      } catch (err) {
        console.error('❌ Auth callback exception:', err);
        setStatus('error');
        navigate('/auth', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <div className="text-lg font-medium">Signing you in...</div>
        <div className="text-sm text-muted-foreground">Please wait a moment</div>
      </div>
    </div>
  );
};

export default AuthCallback;
