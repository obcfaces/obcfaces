import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('🔄 Starting weekly contest transition...');

    // Get current Monday UTC
    const getMondayResp = await fetch(`${url}/rest/v1/rpc/get_current_monday_utc`, {
      method: 'POST',
      headers: {
        apiKey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    });

    const monday = await getMondayResp.json();
    console.log('📅 Target week start:', monday);

    // Call transition function
    const transitionResp = await fetch(`${url}/rest/v1/rpc/transition_weekly_contest`, {
      method: 'POST',
      headers: {
        apiKey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_week_start: monday,
        dry_run: false,
      }),
    });

    const result = await transitionResp.json();
    console.log('✅ Transition result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Transition error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
