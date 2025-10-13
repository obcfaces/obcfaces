import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function weekStartWITA(d = new Date()): Date {
  // UTC -> shift -8h -> truncate to Monday -> shift back +8h
  const utc = new Date(d.toISOString());
  const shifted = new Date(utc.getTime() - 8 * 3600 * 1000);
  const day = shifted.getUTCDay(); // 0 Sun..6 Sat
  const diffToMon = (day + 6) % 7; // days back to Monday
  const monUTC = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() - diffToMon,
    0, 0, 0, 0
  );
  return new Date(monUTC + 8 * 3600 * 1000); // back to WITA
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const nowWeek = weekStartWITA();
    const lastWeek = new Date(nowWeek.getTime() - 7 * 24 * 3600 * 1000);

    console.log('🔄 Starting weekly rollover...');
    console.log(`📅 Current week start (WITA): ${nowWeek.toISOString()}`);
    console.log(`📅 Previous week start (WITA): ${lastWeek.toISOString()}`);

    // 1) Close previous this_week -> past (determine winner)
    console.log('Step 1: Closing previous week and determining winner...');
    const { data: closing, error: e1 } = await supabase.rpc('sp_close_this_week', {
      p_week_start: nowWeek.toISOString(),
      p_prev_week_start: lastWeek.toISOString()
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
      p_week_start: nowWeek.toISOString()
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
      p_preview_week_start: nowWeek.toISOString()
    });

    if (e3) {
      console.error('❌ Error in step 3:', e3);
      return new Response(
        JSON.stringify({ ok: false, step: 3, error: e3.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Step 3 complete');
    console.log('🎉 Weekly rollover completed successfully!');

    return new Response(
      JSON.stringify({
        ok: true,
        nowWeek: nowWeek.toISOString(),
        lastWeek: lastWeek.toISOString(),
        winner: closing
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
