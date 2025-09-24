import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContestParticipationModal } from "@/components/contest-participation-modal";
import LoginModalContent from "@/components/login-modal-content";
import { Button } from "@/components/ui/button";

interface AuthProtectedModalProps {
  children?: React.ReactNode;
}

export const AuthProtectedModal = ({ children }: AuthProtectedModalProps) => {
  const [session, setSession] = useState<any>(null);
  const [isParticipationOpen, setIsParticipationOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

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
      
      const { data: applications, error } = await supabase
        .from('contest_applications')
        .select('status')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('Application check result:', { applications, error });

      if (error) {
        console.error('Error checking application status:', error);
        setIsParticipationOpen(true);
        return;
      }

      if (applications && applications.length > 0) {
        const status = applications[0].status;
        console.log('Found application with status:', status);
        
        if (status === 'rejected') {
          // Allow new participation
          console.log('Opening participation modal for user with rejected application');
          setIsParticipationOpen(true);
        } else {
          // Show status modal
          console.log('Showing status modal for user with existing application:', status);
          setApplicationStatus(status);
          setIsStatusModalOpen(true);
        }
      } else {
        // No application exists, allow participation
        console.log('Opening participation modal for user with no application');
        setIsParticipationOpen(true);
      }
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
        editMode={false}
      />

      {/* Status Information Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Application Already Exists</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              You already have an application with status: <span className="font-semibold">{applicationStatus}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              You can only submit a new application after the previous one is rejected.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsStatusModalOpen(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthProtectedModal;