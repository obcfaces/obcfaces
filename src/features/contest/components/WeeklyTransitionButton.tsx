import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TransitionResult {
  status: 'success' | 'dry_run' | 'already_completed';
  message?: string;
  week_start_date: string;
  week_end_date: string;
  week_interval: string;
  run_id: string;
  transitions?: {
    thisWeekToPast: number;
    nextWeekOnSiteToThisWeek: number;
    preNextWeekToNextWeek: number;
  };
  winner?: {
    user_id: string;
    average_rating: number;
    total_votes: number;
  };
}

export const WeeklyTransitionButton = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = React.useState(false);

  const handleTransition = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    
    try {
      console.log('⏰ Calling SQL transition function directly...');
      
      // Calculate current Monday in UTC
      const now = new Date();
      const currentMonday = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      ));
      
      const currentDay = currentMonday.getUTCDay();
      const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      currentMonday.setUTCDate(currentMonday.getUTCDate() + daysToMonday);
      
      const targetWeekStart = currentMonday.toISOString().split('T')[0];
      
      console.log(`📅 Target week start (Monday UTC): ${targetWeekStart}`);
      
      // Call SQL function directly
      const { data, error } = await supabase.rpc('transition_weekly_contest', {
        target_week_start: targetWeekStart,
        dry_run: false
      });

      if (error) throw error;
      if (!data) throw new Error('No data returned from transition');

      const result = data as unknown as TransitionResult;
      console.log('✅ Weekly contest transition result:', result);
      
      let message = result.message || 'All transitions completed successfully!';
      
      if (result.status === 'already_completed') {
        message = `⚠️ Transition already completed for week ${result.week_interval}`;
      } else if (result.winner) {
        message += `\n\n🏆 Winner: user ${result.winner.user_id}`;
        message += `\n   Rating: ${result.winner.average_rating}`;
        message += `\n   Votes: ${result.winner.total_votes}`;
      }
      
      if (result.transitions) {
        message += `\n\nTransitions:`;
        message += `\n- "this week" → "past": ${result.transitions.thisWeekToPast}`;
        message += `\n- "next week on site" → "this week": ${result.transitions.nextWeekOnSiteToThisWeek}`;
        message += `\n- "pre next week" → "next week": ${result.transitions.preNextWeekToNextWeek}`;
      }

      toast({
        title: result.status === 'success' ? "✅ Weekly Transition Completed" : "ℹ️ Info",
        description: message,
      });

      // Reload page after 2 seconds to show updated data
      if (result.status === 'success') {
        setTimeout(() => window.location.reload(), 2000);
      }

    } catch (error) {
      console.error('❌ Error running weekly transition:', error);
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
