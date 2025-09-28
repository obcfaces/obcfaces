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

      // Transition statuses
      const transitions = [];

      // Move 'past week 2' to 'past'
      const { data: pastWeek2, error: error1 } = await supabase
        .from('weekly_contest_participants')
        .update({ admin_status: 'past' })
        .eq('admin_status', 'past week 2')
        .select('id');

      if (error1) console.error('Error updating past week 2:', error1);
      else transitions.push(`Moved ${pastWeek2?.length || 0} from 'past week 2' to 'past'`);

      // Move 'past week 1' to 'past week 2'
      const { data: pastWeek1, error: error2 } = await supabase
        .from('weekly_contest_participants')
        .update({ admin_status: 'past week 2' })
        .eq('admin_status', 'past week 1')
        .select('id');

      if (error2) console.error('Error updating past week 1:', error2);
      else transitions.push(`Moved ${pastWeek1?.length || 0} from 'past week 1' to 'past week 2'`);

      // Move 'this week' to 'past week 1'
      const { data: thisWeek, error: error3 } = await supabase
        .from('weekly_contest_participants')
        .update({ admin_status: 'past week 1' })
        .eq('admin_status', 'this week')
        .select('id');

      if (error3) console.error('Error updating this week:', error3);
      else transitions.push(`Moved ${thisWeek?.length || 0} from 'this week' to 'past week 1'`);

      // Move 'next week on site' to 'this week'
      const { data: nextWeekOnSite, error: error4 } = await supabase
        .from('weekly_contest_participants')
        .update({ admin_status: 'this week' })
        .eq('admin_status', 'next week on site')
        .select('id');

      if (error4) console.error('Error updating next week on site:', error4);
      else transitions.push(`Moved ${nextWeekOnSite?.length || 0} from 'next week on site' to 'this week'`);

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