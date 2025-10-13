import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, PlayCircle, TestTube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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

interface SystemCheck {
  check_type: string;
  value: number;
  status: string;
}

export const WeeklyTransitionSelfCheck = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = React.useState(false);
  const [isDryRun, setIsDryRun] = React.useState(false);
  const [systemChecks, setSystemChecks] = React.useState<SystemCheck[]>([]);
  const [lastResult, setLastResult] = React.useState<TransitionResult | null>(null);
  const [isLoadingChecks, setIsLoadingChecks] = React.useState(false);

  const loadSystemChecks = async () => {
    setIsLoadingChecks(true);
    try {
      // Get current Monday to calculate past week intervals
      const { data: mondayData } = await supabase.rpc('get_current_monday_utc');
      const currentMonday = new Date(mondayData as string);
      
      // Calculate intervals for past 5 weeks
      const pastIntervals = Array.from({ length: 5 }, (_, i) => {
        const weekStart = new Date(currentMonday);
        weekStart.setDate(weekStart.getDate() - (7 * (i + 1)));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        return `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}-${weekEnd.getDate().toString().padStart(2, '0')}/${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}/${weekEnd.getFullYear().toString().slice(-2)}`;
      });

      const checks = await Promise.all([
        supabase.from('weekly_contests').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('weekly_contest_participants').select('id', { count: 'exact' }).eq('admin_status', 'this week').is('deleted_at', null),
        supabase.from('weekly_contest_participants').select('id', { count: 'exact' }).eq('admin_status', 'next week on site').is('deleted_at', null),
        supabase.from('weekly_contest_participants').select('id', { count: 'exact' }).eq('admin_status', 'pre next week').is('deleted_at', null),
        ...pastIntervals.map(interval => 
          supabase.from('weekly_contest_participants').select('id', { count: 'exact' }).eq('admin_status', 'past').eq('week_interval', interval).is('deleted_at', null)
        ),
      ]);

      setSystemChecks([
        { check_type: 'Active weeks', value: checks[0].count || 0, status: checks[0].count === 1 ? '✅' : '❌' },
        { check_type: 'This week participants', value: checks[1].count || 0, status: checks[1].count! > 0 ? '✅' : '⚠️' },
        { check_type: 'Next week on site', value: checks[2].count || 0, status: checks[2].count! > 0 ? '✅' : '⚠️' },
        { check_type: 'Pre next week', value: checks[3].count || 0, status: checks[3].count! > 0 ? '✅' : '⚠️' },
        { check_type: '1 week ago', value: checks[4].count || 0, status: checks[4].count! > 0 ? '✅' : '⚠️' },
        { check_type: '2 weeks ago', value: checks[5].count || 0, status: checks[5].count! > 0 ? '✅' : '⚠️' },
        { check_type: '3 weeks ago', value: checks[6].count || 0, status: checks[6].count! > 0 ? '✅' : '⚠️' },
        { check_type: '4 weeks ago', value: checks[7].count || 0, status: checks[7].count! > 0 ? '✅' : '⚠️' },
        { check_type: '5 weeks ago', value: checks[8].count || 0, status: checks[8].count! > 0 ? '✅' : '⚠️' },
      ]);
    } catch (error) {
      console.error('Failed to load system checks:', error);
    } finally {
      setIsLoadingChecks(false);
    }
  };

  React.useEffect(() => {
    loadSystemChecks();
  }, []);

  const handleTransition = async (dryRunMode: boolean) => {
    if (isRunning) return;
    
    setIsRunning(true);
    setIsDryRun(dryRunMode);
    
    try {
      console.log(`⏰ ${dryRunMode ? 'DRY RUN' : 'LIVE RUN'}: Calling SQL transition function...`);
      
      // Get current Monday from SQL function
      const { data: mondayData, error: mondayError } = await supabase.rpc('get_current_monday_utc');
      
      if (mondayError) {
        console.error('❌ Error getting current Monday:', mondayError);
        throw new Error('Failed to get current Monday: ' + mondayError.message);
      }
      
      const targetWeekStart = mondayData as string;
      console.log(`📅 Target week start (Monday UTC from SQL): ${targetWeekStart}`);
      
      // Call SQL function directly
      const { data, error } = await supabase.rpc('transition_weekly_contest', {
        target_week_start: targetWeekStart,
        dry_run: dryRunMode
      });

      if (error) throw error;
      if (!data) throw new Error('No data returned from transition');

      const result = data as unknown as TransitionResult;
      console.log(`✅ ${dryRunMode ? 'Dry run' : 'Live transition'} result:`, result);
      
      setLastResult(result);

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
        title: dryRunMode 
          ? "🧪 Dry Run Completed" 
          : result.status === 'success' 
            ? "✅ Weekly Transition Completed" 
            : "ℹ️ Info",
        description: message,
      });

      // Reload checks and page after successful live run
      if (!dryRunMode && result.status === 'success') {
        await loadSystemChecks();
        setTimeout(() => window.location.reload(), 2000);
      } else {
        await loadSystemChecks();
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
      setIsDryRun(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Weekly Contest Transition Control
        </CardTitle>
        <CardDescription>
          Test and execute weekly status transitions (Mon 00:00 UTC)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Health Checks */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            System Health
            <Button
              variant="ghost"
              size="sm"
              onClick={loadSystemChecks}
              disabled={isLoadingChecks}
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingChecks ? 'animate-spin' : ''}`} />
            </Button>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {systemChecks.map((check) => (
              <div
                key={check.check_type}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <span className="text-sm">{check.check_type}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{check.value}</Badge>
                  <span className="text-lg">{check.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Last Result */}
        {lastResult && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Last Result</h3>
            <div className="p-3 rounded-lg border bg-muted/50 space-y-1 text-xs font-mono">
              <div>Status: <Badge>{lastResult.status}</Badge></div>
              <div>Week: {lastResult.week_interval}</div>
              {lastResult.transitions && (
                <>
                  <div>This → Past: {lastResult.transitions.thisWeekToPast}</div>
                  <div>Next Site → This: {lastResult.transitions.nextWeekOnSiteToThisWeek}</div>
                  <div>Pre Next → Next: {lastResult.transitions.preNextWeekToNextWeek}</div>
                </>
              )}
              {lastResult.winner && (
                <div className="pt-1 border-t">
                  Winner: {lastResult.winner.user_id.substring(0, 8)}... 
                  (⭐ {lastResult.winner.average_rating} • 🗳️ {lastResult.winner.total_votes})
                </div>
              )}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => handleTransition(true)}
            variant="outline"
            className="flex-1"
            disabled={isRunning}
          >
            <TestTube className={`mr-2 h-4 w-4 ${isDryRun ? 'animate-pulse' : ''}`} />
            {isDryRun ? 'Running Dry Run...' : 'Dry Run (Test)'}
          </Button>
          <Button
            onClick={() => handleTransition(false)}
            variant="default"
            className="flex-1"
            disabled={isRunning}
          >
            <PlayCircle className={`mr-2 h-4 w-4 ${isRunning && !isDryRun ? 'animate-spin' : ''}`} />
            {isRunning && !isDryRun ? 'Running Live...' : 'Run Now (Live)'}
          </Button>
        </div>

        {/* Warning */}
        <p className="text-xs text-muted-foreground">
          ⚠️ "Run Now" will execute real transitions. Use "Dry Run" first to preview changes.
        </p>
      </CardContent>
    </Card>
  );
};
