import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const redirectTo = searchParams.get('redirect_to');

        if (!token || !type) {
          setStatus('error');
          setMessage('Invalid verification link. Missing required parameters.');
          return;
        }

        console.log('Verifying email with token:', token, 'type:', type);

        // Exchange token for session
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type === 'signup' ? 'signup' : type === 'email_change' ? 'email_change' : 'recovery'
        });

        if (error) {
          console.error('Email verification error:', error);
          setStatus('error');
          setMessage(error.message || 'Failed to verify email. The link may have expired.');
          return;
        }

        console.log('Email verified successfully:', data);
        setStatus('success');
        setMessage('Email verified successfully! Redirecting...');

        toast({
          title: "Success!",
          description: "Your email has been verified.",
        });

        // Redirect after 2 seconds
        setTimeout(() => {
          if (redirectTo) {
            window.location.href = redirectTo;
          } else {
            navigate('/account');
          }
        }, 2000);

      } catch (err) {
        console.error('Verification exception:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-lg border border-border bg-card">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
            <h1 className="text-2xl font-semibold">Verifying your email...</h1>
            <p className="text-muted-foreground">Please wait while we confirm your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
            <h1 className="text-2xl font-semibold">Email Verified!</h1>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-semibold">Verification Failed</h1>
            <p className="text-muted-foreground">{message}</p>
            <div className="space-y-3 pt-4">
              <Button onClick={() => navigate('/auth')} className="w-full">
                Back to Login
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                Go to Homepage
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
