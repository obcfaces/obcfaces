import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import LoginModalTrigger from "@/components/login-modal";
import { ContestParticipationModal } from "@/components/contest-participation-modal";

interface AuthProtectedModalProps {
  children?: React.ReactNode;
}

export const AuthProtectedModal = ({ children }: AuthProtectedModalProps) => {
  const [session, setSession] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

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
      setIsOpen(true);
    } else {
      // User is not authenticated or email not confirmed, login modal will open automatically
    }
  };

  // If user is not authenticated or email not confirmed, show login modal trigger
  if (!session?.user?.email_confirmed_at) {
    return <LoginModalTrigger />;
  }

  // If user is authenticated and email confirmed, show participation modal
  return (
    <ContestParticipationModal 
      isOpen={isOpen} 
      onOpenChange={setIsOpen}
      editMode={false}
    >
      {children}
    </ContestParticipationModal>
  );
};

export default AuthProtectedModal;