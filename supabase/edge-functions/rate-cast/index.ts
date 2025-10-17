import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authMiddleware } from "../_shared/auth_middleware.ts";
import { RateLimiter } from "../_shared/ratelimit_memory.ts";

const limiter = new RateLimiter({ max: 30, windowMs: 60_000 });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(authMiddleware(async (req, { user }) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  const { participant_id, stars } = await req.json().catch(() => ({}));
  if (!participant_id || !Number.isInteger(stars) || stars < 1 || stars > 5)
    return new Response("Bad Request", { status: 400, headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for") ?? "0.0.0.0";
  if (!limiter.allow(`${user.id}:${ip}`)) 
    return new Response("Too Many Requests", { status: 429, headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const srv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, srv);

  // защита: ставить звёзды можно только тем, кто реально в This Week
  const { data: part, error: e1 } = await supabase
    .from("weekly_contest_participants")
    .select("this_week_key, status")
    .eq("id", participant_id)
    .single();

  if (e1 || !part?.this_week_key || part.status !== "this week")
    return new Response("Not in This Week", { status: 409, headers: corsHeaders });

  const { error } = await supabase
    .from("ratings")
    .upsert({
      user_id: user.id,
      participant_id,
      this_week_key: part.this_week_key,
      stars,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,participant_id,this_week_key" });

  if (error) return new Response("Server Error", { status: 500, headers: corsHeaders });
  return new Response(JSON.stringify({ ok: true }), { 
    status: 200, 
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
}));
