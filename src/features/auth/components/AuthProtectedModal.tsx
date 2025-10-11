import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ContestParticipationModal } from "@/features/contest/components/ContestParticipationModal";
import LoginModalContent from "./LoginModalContent";
import { Button } from "@/components/ui/button";

interface AuthProtectedModalProps {
  children?: React.ReactNode;
}

export const AuthProtectedModal = ({ children }: AuthProtectedModalProps) => {
  const [session, setSession] = useState<any>(null);
  const [isParticipationOpen, setIsParticipationOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [existingParticipant, setExistingParticipant] = useState<any>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

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
      
      // Check if user has ANY participant record (including deleted)
      const { data: allParticipants, error: allError } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      console.log('All participant records:', { allParticipants, allError });

      if (allError) {
        console.error('Error checking participant status:', allError);
        setEditMode(false);
        setExistingParticipant(null);
        setIsParticipationOpen(true);
        return;
      }

      // Check for deleted record
      const deletedParticipant = allParticipants?.find(p => p.deleted_at !== null);
      if (deletedParticipant && !allParticipants?.some(p => p.deleted_at === null)) {
        // Only deleted records exist, create new participation
        console.log('User has only deleted records, creating new participation');
        setEditMode(false);
        setExistingParticipant(null);
        setIsParticipationOpen(true);
        return;
      }

      // Check for active participant record
      const activeParticipant = allParticipants?.find(p => p.is_active && p.deleted_at === null);
      
      if (!activeParticipant) {
        // No active participant record exists, allow new participation
        console.log('Opening participation modal for user with no active participant record');
        setEditMode(false);
        setExistingParticipant(null);
        setIsParticipationOpen(true);
        return;
      }

      const status = activeParticipant.admin_status;
      console.log('Found active participant with admin_status:', status);
      
      // Handle different statuses
      if (status === 'past') {
        // Show message about waiting period
        setInfoMessage('You can participate in the contest one year after your last participation');
        setIsInfoModalOpen(true);
      } else if (['pre next week', 'next week', 'next week on site', 'this week'].includes(status)) {
        // Show message about active card
        setInfoMessage('You have an active card, you can see it in your personal account in the participant tab');
        setIsInfoModalOpen(true);
      } else if (['rejected', 'pending'].includes(status)) {
        // Open form in edit mode for rejected/pending
        console.log('Opening participation modal in edit mode for rejected/pending application');
        setEditMode(true);
        setExistingParticipant(activeParticipant);
        setIsParticipationOpen(true);
      } else {
        // For any other status, open in edit mode
        console.log('Opening participation modal in edit mode for existing participant');
        setEditMode(true);
        setExistingParticipant(activeParticipant);
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

      {/* Info Modal */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Participation Status</DialogTitle>
            <DialogDescription className="pt-4">
              {infoMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setIsInfoModalOpen(false)}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthProtectedModal;