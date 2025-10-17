import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authMiddleware } from "../_shared/auth_middleware.ts";
import { RateLimiter } from "../_shared/ratelimit_memory.ts";

const limiter = new RateLimiter({ max: 20, windowMs: 60_000 });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(authMiddleware(async (req, { user }) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  const { participant_id, is_up = true, fp } = await req.json().catch(() => ({}));
  if (!participant_id || typeof is_up !== "boolean") 
    return new Response("Bad Request", { status: 400, headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for") ?? "0.0.0.0";
  if (!limiter.allow(`${user.id}:${ip}:${fp ?? "na"}`)) 
    return new Response("Too Many Requests", { status: 429, headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const srv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, srv);

  const { error } = await supabase
    .from("votes")
    .upsert({ user_id: user.id, participant_id, is_up }, { onConflict: "user_id,participant_id,week_key" });

  if (error) return new Response("Server Error", { status: 500, headers: corsHeaders });
  return new Response(JSON.stringify({ ok: true }), { 
    status: 200, 
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
}));
