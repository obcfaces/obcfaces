import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const WeeklyTransitionButton = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = React.useState(false);

  const handleWeeklyTransition = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    
    try {
      console.log('Starting manual weekly transition...');
      
      // Determine winner and transition statuses
      const { data: currentParticipants, error: fetchError } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('admin_status', 'this week')
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      console.log(`Found ${currentParticipants?.length || 0} current week participants`);

      let winnerInfo = null;

      // Determine winner (highest average rating, then highest votes)
      if (currentParticipants && currentParticipants.length > 0) {
        const sortedParticipants = currentParticipants
          .filter(p => p.total_votes && p.total_votes > 0)
          .sort((a, b) => {
            if (b.average_rating !== a.average_rating) {
              return (b.average_rating || 0) - (a.average_rating || 0);
            }
            return (b.total_votes || 0) - (a.total_votes || 0);
          });

        if (sortedParticipants.length > 0) {
          const winner = sortedParticipants[0];
          
          // Set final ranks
          for (let i = 0; i < sortedParticipants.length; i++) {
            const participant = sortedParticipants[i];
            const { error: rankError } = await supabase
              .from('weekly_contest_participants')
              .update({ final_rank: i + 1 })
              .eq('id', participant.id);

            if (rankError) {
              console.error(`Error setting rank for participant ${participant.id}:`, rankError);
            }
          }

          winnerInfo = {
            name: `${(winner.application_data as any)?.first_name || ''} ${(winner.application_data as any)?.last_name || ''}`.trim(),
            rating: winner.average_rating,
            votes: winner.total_votes
          };
        }
      }

      // Get current user for audit
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;
      const currentTime = new Date().toISOString();

      // Transition statuses with audit logging
      const transitions = [];

      // Move 'this week' to 'past' (simplified - only one past status)
      const { data: thisWeekToUpdate, error: fetchThisWeekError } = await supabase
        .from('weekly_contest_participants')
        .select('id, status_history')
        .eq('admin_status', 'this week');

      if (!fetchThisWeekError && thisWeekToUpdate) {
        for (const participant of thisWeekToUpdate) {
          const currentHistory = (participant.status_history as Record<string, any>) || {};
          const updatedHistory = {
            ...currentHistory,
            past: {
              changed_at: currentTime,
              changed_by: currentUserId,
              changed_via: 'UI_BUTTON',
              previous_status: 'this week'
            }
          };

          await supabase
            .from('weekly_contest_participants')
            .update({ 
              admin_status: 'past',
              status_history: updatedHistory
            })
            .eq('id', participant.id);
        }
        transitions.push(`Moved ${thisWeekToUpdate.length} from 'this week' to 'past' (by user ${currentUserId})`);
      }

      // Move 'next week on site' to 'this week'
      const { data: nextWeekToUpdate, error: fetchNextWeekError } = await supabase
        .from('weekly_contest_participants')
        .select('id, status_history')
        .eq('admin_status', 'next week on site');

      if (!fetchNextWeekError && nextWeekToUpdate) {
        for (const participant of nextWeekToUpdate) {
          const currentHistory = (participant.status_history as Record<string, any>) || {};
          const updatedHistory = {
            ...currentHistory,
            'this week': {
              changed_at: currentTime,
              changed_by: currentUserId,
              changed_via: 'UI_BUTTON',
              previous_status: 'next week on site'
            }
          };

          await supabase
            .from('weekly_contest_participants')
            .update({ 
              admin_status: 'this week',
              status_history: updatedHistory
            })
            .eq('id', participant.id);
        }
        transitions.push(`Moved ${nextWeekToUpdate.length} from 'next week on site' to 'this week' (by user ${currentUserId})`);
      }

      console.log('Transitions completed:', transitions);
      
      let message = 'Weekly transition completed successfully!';
      if (winnerInfo) {
        message += ` Winner: ${winnerInfo.name} (${winnerInfo.rating} rating, ${winnerInfo.votes} votes)`;
      }

      toast({
        title: "Weekly Transition Completed",
        description: message,
      });

    } catch (error) {
      console.error('Error running weekly transition:', error);
      toast({
        title: "Error",
        description: "Failed to run weekly transition: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Button 
      onClick={handleWeeklyTransition}
      variant="outline" 
      className="flex items-center gap-2"
      disabled={isRunning}
    >
      <Clock className="h-4 w-4" />
      {isRunning ? "Running..." : "Run Weekly Transition"}
    </Button>
  );
};