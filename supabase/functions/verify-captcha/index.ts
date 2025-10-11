import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CaptchaVerificationRequest {
  token: string;
  action?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action = 'submit' }: CaptchaVerificationRequest = 
      await req.json();

    if (!token) {
      throw new Error('CAPTCHA token is required');
    }

    const TURNSTILE_SECRET = Deno.env.get('CLOUDFLARE_TURNSTILE_SECRET_KEY');
    
    if (!TURNSTILE_SECRET) {
      console.error('CLOUDFLARE_TURNSTILE_SECRET_KEY not configured');
      throw new Error('CAPTCHA verification not configured');
    }

    console.log(`🔐 Verifying Turnstile for action: ${action}`);

    // Verify with Cloudflare Turnstile API
    const verificationUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const verificationResponse = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET,
        response: token,
      }),
    });

    const verificationData = await verificationResponse.json();

    console.log('Turnstile verification result:', {
      success: verificationData.success,
      action: verificationData.action,
      hostname: verificationData.hostname
    });

    // Get client info
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 
                      req.headers.get('x-real-ip') || '0.0.0.0';

    // Get user ID if authenticated
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const { data: { user } } = await supabaseClient.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      userId = user?.id || null;
    }

    // Check verification result
    if (!verificationData.success) {
      console.log('❌ Turnstile verification failed:', verificationData['error-codes']);
      
      // Log suspicious activity
      await supabaseClient.rpc('log_suspicious_activity', {
        activity_user_id: userId,
        activity_ip: ipAddress,
        activity_type: 'captcha_failed',
        activity_details: { 
          action,
          errors: verificationData['error-codes']
        },
        activity_severity: 'medium'
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Security verification failed',
          details: verificationData['error-codes']
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Turnstile verified successfully`);

    return new Response(
      JSON.stringify({ 
        success: true,
        action: verificationData.action,
        hostname: verificationData.hostname
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in verify-captcha function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});