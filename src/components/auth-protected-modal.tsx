import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ContestParticipationModal } from "@/components/contest-participation-modal";
import LoginModalContent from "@/components/login-modal-content";

interface AuthProtectedModalProps {
  children?: React.ReactNode;
}

export const AuthProtectedModal = ({ children }: AuthProtectedModalProps) => {
  const [session, setSession] = useState<any>(null);
  const [isParticipationOpen, setIsParticipationOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get current session first
    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setIsLoading(false);
      console.log('Initial session loaded:', data.session?.user?.email_confirmed_at);
    };

    getInitialSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log('Auth state changed:', event, nextSession?.user?.email_confirmed_at);
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleTriggerClick = () => {
    if (isLoading) return;
    
    if (session?.user?.email_confirmed_at) {
      // User is authenticated and email confirmed, open participation modal
      console.log('Opening participation modal for authenticated user');
      setIsParticipationOpen(true);
    } else {
      // User is not authenticated or email not confirmed, open login modal
      console.log('Opening login modal for unauthenticated user');
      setIsLoginOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    console.log('Auth success callback triggered');
    setIsLoginOpen(false);
    // Small delay to ensure modal closes properly before opening new one
    setTimeout(() => {
      setIsParticipationOpen(true);
    }, 200);
  };

  return (
    <>
      {/* Always show the trigger button */}
      <div onClick={handleTriggerClick}>
        {children}
      </div>

      {/* Login Modal */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="sm:max-w-lg data-[state=open]:translate-y-[5%] sm:data-[state=open]:translate-y-[2%]">
          <LoginModalContent 
            onClose={() => setIsLoginOpen(false)}
            onAuthSuccess={handleAuthSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Participation Modal */}
      <ContestParticipationModal 
        isOpen={isParticipationOpen} 
        onOpenChange={setIsParticipationOpen}
        editMode={false}
      />
    </>
  );
};

export default AuthProtectedModal;