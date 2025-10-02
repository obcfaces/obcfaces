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
  const [editMode, setEditMode] = useState(false);
  const [existingParticipant, setExistingParticipant] = useState<any>(null);

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

  const handleTriggerClick = async () => {
    console.log('Participation button clicked, session:', session?.user?.email_confirmed_at);
    
    if (session?.user?.email_confirmed_at) {
      // User is authenticated, check their application status
      console.log('Checking application status for user:', session.user.id);
      
      // Check if user has a participant record
      const { data: participant, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('Participant check result:', { participant, error });

      if (error) {
        console.error('Error checking participant status:', error);
        setEditMode(false);
        setExistingParticipant(null);
        setIsParticipationOpen(true);
        return;
      }

      if (participant) {
        const status = participant.admin_status;
        console.log('Found participant with admin_status:', status);
        
        if (status === 'rejected') {
          // Allow new participation
          console.log('Opening participation modal for user with rejected application');
          setEditMode(false);
          setExistingParticipant(null);
          setIsParticipationOpen(true);
        } else {
          // Open form in edit mode with existing data
          console.log('Opening participation modal in edit mode for existing participant');
          setEditMode(true);
          setExistingParticipant(participant);
          setIsParticipationOpen(true);
        }
      } else {
        // No participant record exists, allow new participation
        console.log('Opening participation modal for user with no participant record');
        setEditMode(false);
        setExistingParticipant(null);
        setIsParticipationOpen(true);
      }
    } else {
      // User is not authenticated, open login modal
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

      {/* Login Modal - opens in signup mode for participation */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="sm:max-w-lg data-[state=open]:translate-y-[5%] sm:data-[state=open]:translate-y-[2%]">
          <LoginModalContent 
            defaultMode="signup" 
            onClose={() => setIsLoginOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Participation Modal */}
      <ContestParticipationModal 
        isOpen={isParticipationOpen} 
        onOpenChange={setIsParticipationOpen}
        editMode={editMode}
        existingData={existingParticipant}
      />
    </>
  );
};

export default AuthProtectedModal;