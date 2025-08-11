import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Country, City } from "country-state-city";

interface ProfileForm {
  display_name: string;
  birthdate: string | null;
  height_cm: number | undefined;
  weight_kg: number | undefined;
  first_name: string;
  last_name: string;
  country: string;
  city: string;
  age: number | undefined;
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
    first_name: "",
    last_name: "",
    country: "",
    city: "",
    age: undefined,
  });

  const age = useMemo(() => {
    if (!form.birthdate) return null;
    const b = new Date(form.birthdate);
    const diff = Date.now() - b.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  }, [form.birthdate]);

  const countries = useMemo(() => Country.getAllCountries(), []);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const cities = useMemo(() => countryCode ? City.getCitiesOfCountry(countryCode) : [], [countryCode]);

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
        .select("display_name, birthdate, height_cm, weight_kg, first_name, last_name, country, city, age")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile) {
        setForm({
          display_name: profile.display_name ?? "",
          birthdate: profile.birthdate ?? null,
          height_cm: profile.height_cm ?? undefined,
          weight_kg: profile.weight_kg ?? undefined,
          first_name: profile.first_name ?? "",
          last_name: profile.last_name ?? "",
          country: profile.country ?? "",
          city: profile.city ?? "",
          age: profile.age ?? undefined,
        });
        // try set country code by name
        const found = countries.find((c) => c.name === (profile.country ?? ""));
        if (found) setCountryCode(found.isoCode);
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
          first_name: form.first_name || null,
          last_name: form.last_name || null,
          country: form.country || null,
          city: form.city || null,
          age: form.age ?? null,
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
              <Label htmlFor="display_name">Имя на сайте</Label>
              <Input id="display_name" placeholder="Имя на сайте" className="placeholder:italic placeholder:text-muted-foreground"
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthdate">Дата рождения</Label>
              <Input id="birthdate" type="date" value={form.birthdate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, birthdate: e.target.value || null }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first_name">Имя</Label>
              <Input id="first_name" placeholder="Имя" className="placeholder:italic placeholder:text-muted-foreground" value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Фамилия</Label>
              <Input id="last_name" placeholder="Фамилия" className="placeholder:italic placeholder:text-muted-foreground" value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Страна</Label>
              <Select value={countryCode ?? ""} onValueChange={(code) => {
                setCountryCode(code);
                const c = countries.find((c) => c.isoCode === code);
                setForm((f) => ({ ...f, country: c?.name || "", city: "" }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Страна" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Город</Label>
              <Select disabled={!countryCode} value={form.city} onValueChange={(val) => setForm((f) => ({ ...f, city: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Город" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((ct) => (
                    <SelectItem key={`${ct.name}-${ct.latitude}-${ct.longitude}`} value={ct.name}>{ct.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="height_cm">Рост (см)</Label>
              <Input id="height_cm" type="number" inputMode="numeric" placeholder="Рост"
                className="placeholder:italic placeholder:text-muted-foreground" value={form.height_cm ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight_kg">Вес (кг)</Label>
              <Input id="weight_kg" type="number" inputMode="decimal" step="0.1" placeholder="Вес"
                className="placeholder:italic placeholder:text-muted-foreground" value={form.weight_kg ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Возраст</Label>
              <Input id="age" type="number" inputMode="numeric" placeholder="Возраст" className="placeholder:italic placeholder:text-muted-foreground"
                value={form.age ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value ? Number(e.target.value) : undefined }))} />
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
