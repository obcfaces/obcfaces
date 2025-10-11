import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.text();
    console.log("Received auth webhook payload:", payload);

    const data = JSON.parse(payload);
    const { user, email_data } = data;

    if (!user || !email_data) {
      console.error("Missing user or email_data in payload");
      return new Response("Bad request", { status: 400 });
    }

    const { 
      token, 
      token_hash, 
      redirect_to, 
      email_action_type,
      site_url 
    } = email_data;

    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    // Always use obcface.com for redirects
    const confirmUrl = "https://obcface.com";

    let subject = "";
    let html = "";

    // Generate email content based on action type
    switch (email_action_type) {
      case "signup":
        subject = "Confirm your registration - OBC Face";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Welcome to OBC Face!</h2>
            <p>Hello!</p>
            <p>Thank you for signing up. To complete your registration, please confirm your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://obcface.com/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(confirmUrl)}" 
                 style="background-color: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Confirm Email
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">
              https://obcface.com/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(confirmUrl)}
            </p>
            <p style="color: #666; font-size: 14px;">
              If you did not sign up for OBC Face, please ignore this message.
            </p>
          </div>
        `;
        break;

      case "recovery":
        subject = "Password Reset - OBC Face";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Password Reset</h2>
            <p>Hello!</p>
            <p>You requested to reset your password for your OBC Face account. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://obcface.com/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(confirmUrl)}" 
                 style="background-color: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">
              https://obcface.com/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(confirmUrl)}
            </p>
            <p style="color: #666; font-size: 14px;">
              If you did not request a password reset, please ignore this message.
            </p>
          </div>
        `;
        break;

      case "email_change":
        subject = "Confirm Email Change - OBC Face";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Email Change Confirmation</h2>
            <p>Hello!</p>
            <p>You requested to change the email address for your OBC Face account. Click the button below to confirm:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://obcface.com/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(confirmUrl)}" 
                 style="background-color: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Confirm Email Change
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">
              https://obcface.com/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(confirmUrl)}
            </p>
            <p style="color: #666; font-size: 14px;">
              If you did not request an email change, please contact support immediately.
            </p>
          </div>
        `;
        break;

      default:
        subject = "Notification - OBC Face";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Notification from OBC Face</h2>
            <p>Hello!</p>
            <p>You have a new notification from OBC Face.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://obcface.com/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(confirmUrl)}" 
                 style="background-color: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Go to Application
              </a>
            </div>
          </div>
        `;
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "OBC Face <noreply@obcface.com>",
      to: [user.email],
      subject: subject,
      html: html,
    });

    console.log("Auth email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, response: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in auth-email-handler:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);