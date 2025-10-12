import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to protect private pages
 * Redirects to /auth if user is not authenticated
 * Returns true when authentication check is complete and user is authenticated
 */
export function useRequireAuth() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Save current path to redirect back after login
        sessionStorage.setItem('redirectPath', window.location.pathname);
        navigate('/auth', { replace: true });
        return;
      }
      
      if (mounted) {
        setReady(true);
      }
    })();
    
    return () => { 
      mounted = false;
    };
  }, [navigate]);

  return ready;
}
