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
        console.log('🔐 Auth callback - processing authentication...');
        
        // Check if we have a code in URL (PKCE flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
          console.log('📝 Found auth code, attempting PKCE exchange...');
          try {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.warn('⚠️ PKCE exchange failed (non-critical):', exchangeError.message);
              // Don't fail - session might already exist from implicit flow
            } else {
              console.log('✅ PKCE code exchanged successfully');
            }
          } catch (exchangeErr) {
            console.warn('⚠️ PKCE exchange error (non-critical):', exchangeErr);
            // Continue - session might exist via other means
          }
        } else {
          console.log('ℹ️ No auth code found - checking for existing session (implicit flow)');
        }
        
        // Always check for existing session (works for both flows)
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
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              first_name: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || null,
              display_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              email_verified: true,
              provider_data: user.user_metadata
            }, { 
              onConflict: "id",
              ignoreDuplicates: false 
            });
          
          if (profileError) {
            console.warn('⚠️ Profile upsert warning:', profileError);
            // Don't fail the login if profile update fails
          } else {
            console.log('✅ Profile created/updated');
          }
        } catch (profileErr) {
          console.warn('⚠️ Profile error (non-critical):', profileErr);
          // Continue with login even if profile update fails
        }

        // CRITICAL: Log fingerprint and IP data for OAuth user
        try {
          const { getDeviceFingerprint, getCurrentFingerprint } = await import('@/utils/fingerprint');
          
          // Get fingerprint data
          const fingerprintData = await getDeviceFingerprint();
          const visitorId = await getCurrentFingerprint();
          
          // Get IP address
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          
          // Determine login method
          const loginMethod = user.app_metadata?.provider || 'oauth';
          
          console.log('📱 Saving OAuth user fingerprint:', { userId: user.id, loginMethod, ip: ipData.ip });
          
          // Call edge function to log everything
          const { error: logError } = await supabase.functions.invoke('auth-login-tracker', {
            body: {
              userId: user.id,
              loginMethod,
              ipAddress: ipData.ip,
              userAgent: navigator.userAgent,
              fingerprintId: visitorId,
              fingerprintData: fingerprintData
            }
          });
          
          if (logError) {
            console.warn('⚠️ Error logging OAuth fingerprint (non-critical):', logError);
          } else {
            console.log('✅ OAuth fingerprint logged successfully');
          }
        } catch (fpError) {
          console.warn('⚠️ Error saving OAuth fingerprint (non-critical):', fpError);
          // Continue with login even if fingerprint logging fails
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
