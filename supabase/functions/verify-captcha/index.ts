import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CaptchaVerificationRequest {
  token: string;
  action?: string;
  minScore?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action = 'submit', minScore = 0.5 }: CaptchaVerificationRequest = 
      await req.json();

    if (!token) {
      throw new Error('CAPTCHA token is required');
    }

    const RECAPTCHA_SECRET = Deno.env.get('RECAPTCHA_SECRET_KEY');
    
    if (!RECAPTCHA_SECRET) {
      console.error('RECAPTCHA_SECRET_KEY not configured');
      throw new Error('CAPTCHA verification not configured');
    }

    console.log(`🔐 Verifying CAPTCHA for action: ${action}`);

    // Verify with Google reCAPTCHA API
    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const verificationResponse = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET,
        response: token,
      }),
    });

    const verificationData = await verificationResponse.json();

    console.log('CAPTCHA verification result:', {
      success: verificationData.success,
      score: verificationData.score,
      action: verificationData.action
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
      console.log('❌ CAPTCHA verification failed:', verificationData['error-codes']);
      
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
          error: 'CAPTCHA verification failed',
          details: verificationData['error-codes']
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check score (reCAPTCHA v3)
    const score = verificationData.score || 0;
    if (score < minScore) {
      console.log(`⚠️  Low CAPTCHA score: ${score} (minimum: ${minScore})`);
      
      // Log low score activity
      await supabaseClient.rpc('log_suspicious_activity', {
        activity_user_id: userId,
        activity_ip: ipAddress,
        activity_type: 'low_captcha_score',
        activity_details: { 
          action,
          score,
          minScore
        },
        activity_severity: score < 0.3 ? 'high' : 'medium'
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Suspicious activity detected',
          score
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ CAPTCHA verified successfully with score: ${score}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        score,
        action: verificationData.action
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