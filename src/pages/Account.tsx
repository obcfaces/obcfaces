import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProfileForm {
  display_name: string;
  birthdate: string | null;
  height_cm: number | undefined;
  weight_kg: number | undefined;
}

const Account = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    display_name: "",
    birthdate: null,
    height_cm: undefined,
    weight_kg: undefined,
  });

  const age = useMemo(() => {
    if (!form.birthdate) return null;
    const b = new Date(form.birthdate);
    const diff = Date.now() - b.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  }, [form.birthdate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth", { replace: true });
        return;
      }
      setUserId(session.user.id);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (!session?.user) {
        navigate("/auth", { replace: true });
        return;
      }
      setUserId(session.user.id);
      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, birthdate, height_cm, weight_kg")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile) {
        setForm({
          display_name: profile.display_name ?? "",
          birthdate: profile.birthdate ?? null,
          height_cm: profile.height_cm ?? undefined,
          weight_kg: profile.weight_kg ?? undefined,
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          id: userId,
          display_name: form.display_name || null,
          birthdate: form.birthdate || null,
          height_cm: form.height_cm ?? null,
          weight_kg: form.weight_kg ?? null,
        },
        { onConflict: "id" }
      );
      if (error) throw error;
      toast({ description: "Профиль сохранён" });
    } catch (err: any) {
      toast({ description: err.message ?? "Не удалось сохранить профиль" });
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>Аккаунт — Профиль пользователя</title>
        <meta name="description" content="Управление личным профилем: имя, возраст, рост и вес" />
        <link rel="canonical" href={`${window.location.origin}/account`} />
      </Helmet>
      <section className="container mx-auto max-w-2xl py-10 px-4">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Личный кабинет</h1>
          <Button variant="secondary" onClick={logout}>Выйти</Button>
        </header>

        {loading ? (
          <p className="text-muted-foreground">Загрузка…</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="display_name">Имя</Label>
                <Input id="display_name" value={form.display_name}
                  onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthdate">Дата рождения</Label>
                <Input id="birthdate" type="date" value={form.birthdate ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, birthdate: e.target.value || null }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height_cm">Рост (см)</Label>
                <Input id="height_cm" type="number" inputMode="numeric" value={form.height_cm ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value ? Number(e.target.value) : undefined }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight_kg">Вес (кг)</Label>
                <Input id="weight_kg" type="number" inputMode="decimal" step="0.1" value={form.weight_kg ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value ? Number(e.target.value) : undefined }))} />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Возраст: {age ?? "—"}</span>
            </div>
            <div>
              <Button onClick={save} disabled={saving}>{saving ? "Сохранение…" : "Сохранить"}</Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default Account;
