import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Ctx = { user: { id: string } | null };

export function authMiddleware(handler: (req: Request, ctx: Ctx) => Promise<Response> | Response) {
  return async (req: Request) => {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    return handler(req, { user });
  };
}
