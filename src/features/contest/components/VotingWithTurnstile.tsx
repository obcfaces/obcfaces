import React, { useState } from 'react';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import { toast } from 'sonner';

interface VotingWithTurnstileProps {
  participantId: string;
  participantName: string;
  onVoteSubmit: (participantId: string, rating: number, token: string) => Promise<void>;
  children: (props: { onVote: (rating: number) => void; isLoading: boolean }) => React.ReactNode;
}

export const VotingWithTurnstile: React.FC<VotingWithTurnstileProps> = ({
  participantId,
  participantName,
  onVoteSubmit,
  children,
}) => {
  const [pendingRating, setPendingRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVoteClick = (rating: number) => {
    setPendingRating(rating);
  };

  const handleTurnstileSuccess = async (token: string) => {
    if (pendingRating === null) return;

    setIsLoading(true);
    try {
      await onVoteSubmit(participantId, pendingRating, token);
      toast.success(`Voted ${pendingRating} ⭐ for ${participantName}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit vote');
    } finally {
      setIsLoading(false);
      setPendingRating(null);
    }
  };

  const handleTurnstileError = () => {
    toast.error('Security verification failed. Please try again.');
    setPendingRating(null);
    setIsLoading(false);
  };

  return (
    <>
      {children({ onVote: handleVoteClick, isLoading })}
      
      {/* Render Turnstile when vote is initiated */}
      {pendingRating !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Security Verification</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please complete the security check to submit your vote.
            </p>
            <TurnstileWidget
              action="vote"
              onSuccess={handleTurnstileSuccess}
              onError={handleTurnstileError}
            />
            <button
              onClick={() => setPendingRating(null)}
              className="mt-4 w-full py-2 px-4 border border-input rounded-md hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};
