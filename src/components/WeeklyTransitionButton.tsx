import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const WeeklyTransitionButton = () => {
  const { toast } = useToast();
  const [isRunningTransition, setIsRunningTransition] = React.useState(false);
  const [isRunningStatus, setIsRunningStatus] = React.useState(false);

  const handleWeeklyTransition = async () => {
    if (isRunningTransition) return;
    
    setIsRunningTransition(true);
    
    try {
      console.log('Calling weekly-transition edge function...');
      
      const { data, error } = await supabase.functions.invoke('weekly-transition', {
        body: {}
      });

      if (error) throw error;

      console.log('Weekly transition result:', data);
      
      let message = 'Weekly transition completed successfully!';
      if (data.winner_info) {
        message += ` Winner: ${data.winner_info.name} (${data.winner_info.average_rating} rating, ${data.winner_info.total_votes} votes)`;
      }
      
      if (data.transitions && data.transitions.length > 0) {
        message += `\n\n${data.transitions.join('\n')}`;
      }

      toast({
        title: "Weekly Transition Completed",
        description: message,
      });

      // Reload page after 2 seconds to show updated data
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      console.error('Error running weekly transition:', error);
      toast({
        title: "Error",
        description: "Failed to run weekly transition: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsRunningTransition(false);
    }
  };

  const handleStatusTransition = async () => {
    if (isRunningStatus) return;
    
    setIsRunningStatus(true);
    
    try {
      console.log('Calling weekly-status-transition edge function...');
      
      const { data, error } = await supabase.functions.invoke('weekly-status-transition', {
        body: {}
      });

      if (error) throw error;

      console.log('Status transition result:', data);
      
      let message = `Status transition completed for week ${data.weekInterval || 'unknown'}!`;
      if (data.transitions) {
        const total = data.transitions.thisWeekToPast + 
                      data.transitions.nextWeekOnSiteToThisWeek + 
                      data.transitions.preNextWeekToNextWeek;
        message += `\n\nTotal transitions: ${total}`;
        message += `\n- This Week → Past: ${data.transitions.thisWeekToPast}`;
        message += `\n- Next Week On Site → This Week: ${data.transitions.nextWeekOnSiteToThisWeek}`;
        message += `\n- Pre Next Week → Next Week: ${data.transitions.preNextWeekToNextWeek}`;
      }

      toast({
        title: "Status Transition Completed",
        description: message,
      });

      // Reload page after 2 seconds to show updated data
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      console.error('Error running status transition:', error);
      toast({
        title: "Error",
        description: "Failed to run status transition: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsRunningStatus(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={handleStatusTransition}
        variant="outline" 
        className="flex items-center gap-2"
        disabled={isRunningStatus}
      >
        <RefreshCw className={`h-4 w-4 ${isRunningStatus ? 'animate-spin' : ''}`} />
        {isRunningStatus ? "Running..." : "Run Status Transition"}
      </Button>
      
      <Button 
        onClick={handleWeeklyTransition}
        variant="outline" 
        className="flex items-center gap-2"
        disabled={isRunningTransition}
      >
        <Clock className="h-4 w-4" />
        {isRunningTransition ? "Running..." : "Run Weekly Transition"}
      </Button>
    </div>
  );
};