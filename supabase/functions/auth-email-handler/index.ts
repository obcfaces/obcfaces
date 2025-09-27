import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("AUTH_WEBHOOK_SECRET") || "your-webhook-secret";

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
    const headers = Object.fromEntries(req.headers);
    
    console.log("Received auth webhook payload:", payload);

    // Verify webhook signature if secret is set
    if (hookSecret !== "your-webhook-secret") {
      const wh = new Webhook(hookSecret);
      try {
        wh.verify(payload, headers);
      } catch (err) {
        console.error("Webhook verification failed:", err);
        return new Response("Unauthorized", { status: 401 });
      }
    }

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

    let subject = "";
    let html = "";

    // Generate email content based on action type
    switch (email_action_type) {
      case "signup":
        subject = "Подтвердите вашу регистрацию - OBC Face";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Добро пожаловать в OBC Face!</h2>
            <p>Здравствуйте!</p>
            <p>Спасибо за регистрацию. Для завершения регистрации, пожалуйста, подтвердите ваш email адрес:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" 
                 style="background-color: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Подтвердить Email
              </a>
            </div>
            <p>Или скопируйте и вставьте эту ссылку в браузер:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">
              ${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}
            </p>
            <p style="color: #666; font-size: 14px;">
              Если вы не регистрировались на OBC Face, просто проигнорируйте это сообщение.
            </p>
          </div>
        `;
        break;

      case "recovery":
        subject = "Сброс пароля - OBC Face";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Сброс пароля</h2>
            <p>Здравствуйте!</p>
            <p>Вы запросили сброс пароля для вашего аккаунта OBC Face. Нажмите на кнопку ниже для создания нового пароля:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" 
                 style="background-color: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Сбросить пароль
              </a>
            </div>
            <p>Или скопируйте и вставьте эту ссылку в браузер:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">
              ${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}
            </p>
            <p style="color: #666; font-size: 14px;">
              Если вы не запрашивали сброс пароля, просто проигнорируйте это сообщение.
            </p>
          </div>
        `;
        break;

      case "email_change":
        subject = "Подтвердите смену email - OBC Face";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Подтверждение смены email</h2>
            <p>Здравствуйте!</p>
            <p>Вы запросили смену email адреса для вашего аккаунта OBC Face. Нажмите на кнопку ниже для подтверждения:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" 
                 style="background-color: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Подтвердить смену email
              </a>
            </div>
            <p>Или скопируйте и вставьте эту ссылку в браузер:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">
              ${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}
            </p>
            <p style="color: #666; font-size: 14px;">
              Если вы не запрашивали смену email, немедленно свяжитесь с поддержкой.
            </p>
          </div>
        `;
        break;

      default:
        subject = "Уведомление - OBC Face";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Уведомление от OBC Face</h2>
            <p>Здравствуйте!</p>
            <p>У вас есть новое уведомление от OBC Face.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" 
                 style="background-color: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Перейти к приложению
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