import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
      console.log('Auth state changed in AuthProtectedModal:', nextSession?.user?.email_confirmed_at);
      setSession(nextSession);
    });

    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      console.log('Initial session in AuthProtectedModal:', data.session?.user?.email_confirmed_at);
      setSession(data.session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleTriggerClick = () => {
    console.log('Participation button clicked, session:', session?.user?.email_confirmed_at);
    
    if (session?.user?.email_confirmed_at) {
      // User is authenticated, open participation modal
      console.log('Opening participation modal for authenticated user');
      setIsParticipationOpen(true);
    } else {
      // User is not authenticated, open login modal (same as header)
      console.log('Opening login modal for unauthenticated user');
      setIsLoginOpen(true);
    }
  };

  return (
    <>
      {/* Always show the trigger button */}
      <div onClick={handleTriggerClick}>
        {children}
      </div>

      {/* Login Modal - same as in auth-nav.tsx */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="sm:max-w-lg data-[state=open]:translate-y-[5%] sm:data-[state=open]:translate-y-[2%]">
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