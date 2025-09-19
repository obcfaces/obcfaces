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

  useEffect(() => {
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
    });

    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleTriggerClick = () => {
    if (session?.user?.email_confirmed_at) {
      // User is authenticated and email confirmed, open participation modal
      setIsParticipationOpen(true);
    } else {
      // User is not authenticated or email not confirmed, open login modal
      setIsLoginOpen(true);
    }
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
          <DialogHeader>
            <DialogTitle>Sign in</DialogTitle>
            <DialogDescription>Enter your email and password to continue.</DialogDescription>
          </DialogHeader>
          <LoginModalContent onClose={() => setIsLoginOpen(false)} />
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