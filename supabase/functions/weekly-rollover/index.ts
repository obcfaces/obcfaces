import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Starting weekly rollover...');
    
    // Get current week start using database WITA function
    const { data: nowWeekData, error: nowWeekError } = await supabase.rpc('week_start_wita', {
      ts: new Date().toISOString()
    });

    if (nowWeekError) {
      console.error('❌ Error getting current week start:', nowWeekError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to calculate week start: ' + nowWeekError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nowWeek = nowWeekData as string;
    const lastWeekDate = new Date(new Date(nowWeek).getTime() - 7 * 24 * 3600 * 1000);
    
    const { data: lastWeekData, error: lastWeekError } = await supabase.rpc('week_start_wita', {
      ts: lastWeekDate.toISOString()
    });

    if (lastWeekError) {
      console.error('❌ Error getting previous week start:', lastWeekError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to calculate previous week: ' + lastWeekError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lastWeek = lastWeekData as string;

    console.log(`📅 Current week start (WITA): ${nowWeek}`);
    console.log(`📅 Previous week start (WITA): ${lastWeek}`);

    // Check if rollover already completed for this week (idempotency)
    const { data: existingJob, error: jobCheckError } = await supabase
      .from('weekly_jobs')
      .select('week_start, ran_at')
      .eq('week_start', nowWeek)
      .maybeSingle();

    if (jobCheckError) {
      console.error('❌ Error checking job history:', jobCheckError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to check job history: ' + jobCheckError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingJob) {
      console.log(`✅ Rollover already completed for week ${nowWeek} at ${existingJob.ran_at}`);
      return new Response(
        JSON.stringify({
          ok: true,
          message: 'Rollover already completed for this week',
          nowWeek,
          completedAt: existingJob.ran_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record that we're starting this job
    const { error: jobInsertError } = await supabase
      .from('weekly_jobs')
      .insert({
        week_start: nowWeek,
        run_details: {
          started_at: new Date().toISOString(),
          previous_week: lastWeek
        }
      });

    if (jobInsertError) {
      console.error('❌ Error recording job start:', jobInsertError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to record job start: ' + jobInsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1) Close previous this_week -> past (determine winner)
    console.log('Step 1: Closing previous week and determining winner...');
    const { data: closing, error: e1 } = await supabase.rpc('sp_close_this_week', {
      p_week_start: nowWeek,
      p_prev_week_start: lastWeek
    });

    if (e1) {
      console.error('❌ Error in step 1:', e1);
      return new Response(
        JSON.stringify({ ok: false, step: 1, error: e1.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Step 1 complete:', closing);

    // 2) next_week(current) -> this_week(current)
    console.log('Step 2: Promoting next week to this week...');
    const { error: e2 } = await supabase.rpc('sp_promote_next_to_this', {
      p_week_start: nowWeek
    });

    if (e2) {
      console.error('❌ Error in step 2:', e2);
      return new Response(
        JSON.stringify({ ok: false, step: 2, error: e2.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Step 2 complete');

    // 3) pre_next_week -> next_week (preview_week_start=current)
    console.log('Step 3: Publishing pre-next week to next week...');
    const { error: e3 } = await supabase.rpc('sp_publish_pre_to_next', {
      p_preview_week_start: nowWeek
    });

    if (e3) {
      console.error('❌ Error in step 3:', e3);
      return new Response(
        JSON.stringify({ ok: false, step: 3, error: e3.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Step 3 complete');
    
    // Update job record with completion details
    await supabase
      .from('weekly_jobs')
      .update({
        run_details: {
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          previous_week: lastWeek,
          winner: closing,
          status: 'completed'
        }
      })
      .eq('week_start', nowWeek);

    console.log('🎉 Weekly rollover completed successfully!');

    return new Response(
      JSON.stringify({
        ok: true,
        nowWeek,
        lastWeek,
        winner: closing,
        message: 'Weekly rollover completed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fatal error in weekly rollover:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
