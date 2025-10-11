import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const buildInfo = {
      ok: true,
      status: 'healthy',
      version: Deno.env.get('APP_VERSION') || '1.0.0',
      buildId: Deno.env.get('BUILD_ID') || 'dev',
      timestamp: new Date().toISOString(),
      uptime: Deno.osUptime(),
      environment: Deno.env.get('ENVIRONMENT') || 'production',
    };

    // Basic database connectivity check
    // Note: This is a simple check. For production, you might want more comprehensive checks
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    let dbStatus = 'unknown';
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const dbCheck = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        });
        dbStatus = dbCheck.ok ? 'connected' : 'degraded';
      } catch (error) {
        console.error('Database health check failed:', error);
        dbStatus = 'error';
      }
    }

    const healthStatus = {
      ...buildInfo,
      services: {
        database: dbStatus,
        api: 'operational',
      },
    };

    return new Response(
      JSON.stringify(healthStatus),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Healthcheck error:', error);
    
    return new Response(
      JSON.stringify({
        ok: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
