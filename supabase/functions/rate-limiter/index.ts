import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitRequest {
  endpoint: string;
  maxRequests?: number;
  windowMinutes?: number;
}

const DEFAULT_MAX_REQUESTS = 30;
const DEFAULT_WINDOW_MINUTES = 1;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      endpoint, 
      maxRequests = DEFAULT_MAX_REQUESTS,
      windowMinutes = DEFAULT_WINDOW_MINUTES 
    }: RateLimitRequest = await req.json();

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const { data: { user }, error } = await supabaseClient.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      userId = user?.id || null;
    }

    // Get IP address
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 
                      req.headers.get('x-real-ip') || '0.0.0.0';

    console.log(`🔒 Rate limit check: endpoint=${endpoint}, ip=${ipAddress}, user=${userId}`);

    // Check if IP is blocked
    const { data: isBlocked } = await supabaseClient.rpc('is_ip_blocked', {
      check_ip: ipAddress
    });

    if (isBlocked) {
      console.log(`❌ IP ${ipAddress} is blocked`);
      
      // Log suspicious activity
      await supabaseClient.rpc('log_suspicious_activity', {
        activity_user_id: userId,
        activity_ip: ipAddress,
        activity_type: 'blocked_ip_attempt',
        activity_details: { endpoint },
        activity_severity: 'high'
      });

      return new Response(
        JSON.stringify({ 
          allowed: false, 
          error: 'Access denied',
          reason: 'IP blocked'
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check rate limit
    const { data: withinLimit, error: rateLimitError } = await supabaseClient.rpc('check_rate_limit', {
      check_ip: ipAddress,
      check_user_id: userId,
      check_endpoint: endpoint,
      max_requests: maxRequests,
      window_minutes: windowMinutes
    });

    if (rateLimitError) {
      console.error('Error checking rate limit:', rateLimitError);
      throw rateLimitError;
    }

    if (!withinLimit) {
      console.log(`⚠️  Rate limit exceeded for ${endpoint}: ip=${ipAddress}, user=${userId}`);
      
      // Log rate limit violation
      await supabaseClient.rpc('log_suspicious_activity', {
        activity_user_id: userId,
        activity_ip: ipAddress,
        activity_type: 'rate_limit_exceeded',
        activity_details: { 
          endpoint, 
          maxRequests, 
          windowMinutes 
        },
        activity_severity: 'medium'
      });

      return new Response(
        JSON.stringify({ 
          allowed: false, 
          error: 'Rate limit exceeded',
          retryAfter: windowMinutes * 60
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(windowMinutes * 60)
          }
        }
      );
    }

    // Log the attempt
    await supabaseClient.rpc('log_rate_limit_attempt', {
      log_ip: ipAddress,
      log_user_id: userId,
      log_endpoint: endpoint
    });

    console.log(`✅ Rate limit check passed for ${endpoint}`);

    return new Response(
      JSON.stringify({ 
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: new Date(Date.now() + windowMinutes * 60000).toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in rate-limiter function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        allowed: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});