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
      console.log('Calling weekly-transition edge function...');
      
      // Call the edge function instead of doing the logic here
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