import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const WeeklyTransitionButton = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = React.useState(false);

  const handleTransition = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    
    try {
      console.log('Calling weekly-contest-transition edge function...');
      
      const { data, error } = await supabase.functions.invoke('weekly-contest-transition', {
        body: {}
      });

      if (error) throw error;

      console.log('Weekly contest transition result:', data);
      
      let message = data.message || 'All transitions completed successfully!';
      
      if (data.winner) {
        message += `\n\n🏆 Winner: ${data.winner.name}`;
      }
      
      if (data.transitions) {
        message += `\n\nTransitions:`;
        message += `\n- "this week" → "past": ${data.transitions.thisToPast}`;
        message += `\n- "next week on site" → "this week": ${data.transitions.nextOnSiteToThis}`;
        message += `\n- "pre next week" → "next week": ${data.transitions.preNextToNext}`;
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
      setIsRunning(false);
    }
  };

  return (
    <Button 
      onClick={handleTransition}
      variant="default" 
      className="flex items-center gap-2"
      disabled={isRunning}
    >
      <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
      {isRunning ? "Running All Transitions..." : "Run All Transitions"}
    </Button>
  );
};
