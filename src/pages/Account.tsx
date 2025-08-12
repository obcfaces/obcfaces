import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/ui/searchable-select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Country, State, City } from "country-state-city";
import { getCitiesForLocation } from "@/lib/location-utils";

interface ProfileForm {
  display_name: string;
  birthdate: string | null;
  height_cm: number | undefined;
  weight_kg: number | undefined;
  first_name: string;
  last_name: string;
  country: string;
  state: string;
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
    state: "",
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
  const [stateCode, setStateCode] = useState<string | null>(null);
  const states = useMemo(() => (countryCode ? State.getStatesOfCountry(countryCode) : []), [countryCode]);
  const cities = useMemo(() => getCitiesForLocation(
    countryCode,
    stateCode,
    states.find((s) => s.isoCode === stateCode)?.name
  ), [countryCode, stateCode, states]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth", { replace: true });
        return;
      }
      if (session?.user) {
        setUserId(session.user.id);
      }
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
        .select("display_name, birthdate, height_cm, weight_kg, first_name, last_name, country, state, city, age")
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
          state: profile.state ?? "",
          city: profile.city ?? "",
          age: profile.age ?? undefined,
        });
        // try set country and state codes by name
        const found = countries.find((c) => c.name === (profile.country ?? ""));
        if (found) {
          setCountryCode(found.isoCode);
          if (profile.state) {
            const sts = State.getStatesOfCountry(found.isoCode);
            const st = sts.find((s) => s.name === profile.state);
            if (st) setStateCode(st.isoCode);
          }
        }
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
          state: form.state || null,
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
              
              <Input id="display_name" placeholder="Имя на сайте" className="placeholder:italic placeholder:text-muted-foreground"
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              
              <Input id="birthdate" type="date" value={form.birthdate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, birthdate: e.target.value || null }))} />
            </div>
            <div className="space-y-2">
              
              <Input id="first_name" placeholder="Имя" className="placeholder:italic placeholder:text-muted-foreground" value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              
              <Input id="last_name" placeholder="Фамилия" className="placeholder:italic placeholder:text-muted-foreground" value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              
              <SearchableSelect
                value={countryCode ?? ""}
                onValueChange={(code) => {
                  setCountryCode(code);
                  const c = countries.find((c) => c.isoCode === code);
                  setForm((f) => ({ ...f, country: c?.name || "", state: "", city: "" }));
                  setStateCode(null);
                }}
                placeholder="Страна"
                ariaLabel="Выбор страны"
                options={countries.map((c) => ({ value: c.isoCode, label: c.name }))}
              />
            </div>
            <div className="space-y-2">
              
              <SearchableSelect
                disabled={!countryCode}
                value={stateCode ?? ""}
                onValueChange={(code) => {
                  setStateCode(code);
                  const s = states.find((s) => s.isoCode === code);
                  setForm((f) => ({ ...f, state: s?.name || "", city: "" }));
                }}
                placeholder="Штат/Регион"
                ariaLabel="Выбор региона"
                options={states.map((s) => ({ value: s.isoCode, label: s.name }))}
              />
              {!countryCode && (
                <p className="text-xs text-muted-foreground">Сначала выберите страну</p>
              )}
            </div>
            <div className="space-y-2">
              
              {!countryCode ? (
                <p className="text-xs text-muted-foreground">Сначала выберите страну</p>
              ) : !stateCode ? (
                <p className="text-xs text-muted-foreground">Сначала выберите штат/регион</p>
              ) : cities.length > 0 ? (
                <SearchableSelect
                  value={form.city}
                  onValueChange={(val) => setForm((f) => ({ ...f, city: val }))}
                  placeholder="Город"
                  ariaLabel="Выбор города"
                  options={cities.map((ct) => ({ value: ct.name, label: ct.name }))}
                />
              ) : (
                <>
                  <Input
                    id="city"
                    placeholder="Город (введите вручную)"
                    className="placeholder:italic placeholder:text-muted-foreground"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Для выбранного региона нет списка городов — введите название вручную.</p>
                </>
              )}
            </div>
            <div className="space-y-2">
              
              <Input id="height_cm" type="number" inputMode="numeric" placeholder="Рост"
                className="placeholder:italic placeholder:text-muted-foreground" value={form.height_cm ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div className="space-y-2">
              
              <Input id="weight_kg" type="number" inputMode="decimal" step="0.1" placeholder="Вес"
                className="placeholder:italic placeholder:text-muted-foreground" value={form.weight_kg ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div className="space-y-2">
              
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
