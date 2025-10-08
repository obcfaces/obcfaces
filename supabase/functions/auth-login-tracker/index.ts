import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, loginMethod, ipAddress, userAgent, fingerprintId, fingerprintData } = await req.json();

    console.log('📊 Logging user login:', { userId, loginMethod, ipAddress: ipAddress?.substring(0, 10) });

    // Insert login log
    const { error: loginError } = await supabaseClient
      .from('user_login_logs')
      .insert({
        user_id: userId,
        login_method: loginMethod || 'unknown',
        success: true,
        ip_address: ipAddress,
        user_agent: userAgent,
        fingerprint_id: fingerprintId
      });

    if (loginError) {
      console.error('Error inserting login log:', loginError);
    }

    // Insert or update fingerprint data if provided
    if (fingerprintId && fingerprintData) {
      const { error: fpError } = await supabaseClient
        .from('user_device_fingerprints')
        .upsert({
          user_id: userId,
          fingerprint_id: fingerprintId,
          ip_address: ipAddress,
          user_agent: userAgent,
          screen_resolution: fingerprintData.screen_resolution,
          timezone: fingerprintData.timezone,
          timezone_offset: fingerprintData.timezone_offset,
          language: fingerprintData.language,
          languages: fingerprintData.languages,
          platform: fingerprintData.platform,
          canvas_fingerprint: fingerprintData.canvas_fingerprint,
          webgl_vendor: fingerprintData.webgl_vendor,
          webgl_renderer: fingerprintData.webgl_renderer,
          touch_support: fingerprintData.touch_support,
          hardware_concurrency: fingerprintData.hardware_concurrency,
          device_memory: fingerprintData.device_memory,
          cookies_enabled: fingerprintData.cookies_enabled,
          do_not_track: fingerprintData.do_not_track,
          screen_color_depth: fingerprintData.screen_color_depth
        }, {
          onConflict: 'fingerprint_id,user_id'
        });

      if (fpError) {
        console.error('Error upserting fingerprint:', fpError);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auth-login-tracker:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});