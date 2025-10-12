import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      try {
        console.log('🔐 Auth callback - waiting for session...');
        
        // Wait a bit for Supabase to process the hash
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('❌ Session error:', error);
          setStatus('error');
          toast({
            title: "Authentication Failed",
            description: error.message,
            variant: "destructive"
          });
          navigate('/auth', { replace: true });
          return;
        }

        if (!session?.user) {
          console.error('❌ No session found');
          setStatus('error');
          navigate('/auth', { replace: true });
          return;
        }

        const user = session.user;
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

        if (!mounted) return;

        toast({
          title: "Success!",
          description: "Successfully signed in"
        });

        // Redirect to user profile
        setTimeout(() => {
          if (mounted) {
            navigate(`/u/${user.id}`, { replace: true });
          }
        }, 500);

      } catch (err) {
        console.error('❌ Auth callback exception:', err);
        if (mounted) {
          setStatus('error');
          navigate('/auth', { replace: true });
        }
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate]);

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
