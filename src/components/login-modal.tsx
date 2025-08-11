import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Country, City } from "country-state-city";

const LoginModalTrigger = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [age, setAge] = useState<string>("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const countries = useMemo(() => Country.getAllCountries(), []);
  const cities = useMemo(() => countryCode ? City.getCitiesOfCountry(countryCode) : [], [countryCode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ description: "Вход выполнен" });
        setOpen(false);
        navigate("/account", { replace: true });
      } else {
        const redirectUrl = `${window.location.origin}/account`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              first_name: firstName || null,
              last_name: lastName || null,
              country: country || null,
              city: city || null,
              age: age ? Number(age) : null,
            },
          },
        });
        if (error) throw error;

        if (data.session?.user) {
          const userId = data.session.user.id;
          let uploadedUrl: string | null = null;
          if (photo) {
            const path = `${userId}/${Date.now()}-${photo.name}`;
            const { error: uploadError } = await supabase.storage.from("avatars").upload(path, photo, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
            uploadedUrl = pub.publicUrl;
          }
          const { error: upsertErr } = await supabase
            .from("profiles")
            .upsert(
              {
                id: userId,
                first_name: firstName || null,
                last_name: lastName || null,
                country: country || null,
                city: city || null,
                age: age ? Number(age) : null,
                avatar_url: uploadedUrl,
              },
              { onConflict: "id" }
            );
          if (upsertErr) throw upsertErr;
          toast({ description: "Регистрация завершена" });
          setOpen(false);
          navigate("/account", { replace: true });
        } else {
          toast({ description: "Проверьте почту для подтверждения. Фото можно загрузить после входа." });
          setOpen(false);
        }
      }
    } catch (err: any) {
      toast({ description: err.message ?? (mode === "login" ? "Ошибка входа" : "Ошибка регистрации") });
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Вход" : "Регистрация";
  const description = mode === "login" ? "Введите email и пароль, чтобы продолжить." : "Создайте аккаунт для личной страницы.";

  const switchText = mode === "login" ? (
    <span className="text-sm text-muted-foreground">Нет аккаунта?{" "}
      <button type="button" className="text-primary underline" onClick={() => setMode("signup")}>Зарегистрироваться</button>
    </span>
  ) : (
    <span className="text-sm text-muted-foreground">Уже есть аккаунт?{" "}
      <button type="button" className="text-primary underline" onClick={() => setMode("login")}>Войти</button>
    </span>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setMode("login"); }}>
      <DialogTrigger asChild>
        <button className="text-sm underline text-primary">Log in</button>
      </DialogTrigger>
      <DialogContent className={mode === "signup" ? "sm:max-w-lg" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input id="auth-email" type="email" placeholder="email" className="placeholder:italic placeholder:text-muted-foreground" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">Пароль</Label>
            <div className="relative">
              <Input id="auth-password" type={showPassword ? "text" : "password"} placeholder="password" className="pr-10 placeholder:italic placeholder:text-muted-foreground" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {mode === "signup" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="auth-firstname">Имя</Label>
                <Input id="auth-firstname" placeholder="Имя" className="placeholder:italic placeholder:text-muted-foreground" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-lastname">Фамилия</Label>
                <Input id="auth-lastname" placeholder="Фамилия" className="placeholder:italic placeholder:text-muted-foreground" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Страна</Label>
                <Select value={countryCode ?? ""} onValueChange={(code) => {
                  setCountryCode(code);
                  const c = countries.find((c) => c.isoCode === code);
                  setCountry(c?.name || "");
                  setCity("");
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
                <Select disabled={!countryCode} value={city} onValueChange={setCity}>
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
                <Label htmlFor="auth-age">Возраст</Label>
                <Input id="auth-age" type="number" inputMode="numeric" placeholder="Возраст" className="placeholder:italic placeholder:text-muted-foreground" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="auth-photo">Фото</Label>
                <Input id="auth-photo" type="file" accept="image/*" onChange={(e) => setPhoto(e.currentTarget.files?.[0] ?? null)} />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            {switchText}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={loading}>{loading ? "Подождите…" : mode === "login" ? "Войти" : "Зарегистрироваться"}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModalTrigger;
