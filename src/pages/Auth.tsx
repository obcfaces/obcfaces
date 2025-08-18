import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchableSelect from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  // Country options for Facebook-style dropdown
  const countryOptions = [
    { value: "USA", label: "🇺🇸 United States" },
    { value: "Canada", label: "🇨🇦 Canada" },
    { value: "UK", label: "🇬🇧 United Kingdom" },
    { value: "Germany", label: "🇩🇪 Germany" },
    { value: "France", label: "🇫🇷 France" },
    { value: "Spain", label: "🇪🇸 Spain" },
    { value: "Italy", label: "🇮🇹 Italy" },
    { value: "Russia", label: "🇷🇺 Russia" },
    { value: "China", label: "🇨🇳 China" },
    { value: "Japan", label: "🇯🇵 Japan" },
    { value: "Australia", label: "🇦🇺 Australia" },
    { value: "Brazil", label: "🇧🇷 Brazil" },
    { value: "Mexico", label: "🇲🇽 Mexico" },
    { value: "India", label: "🇮🇳 India" },
    { value: "Philippines", label: "🇵🇭 Philippines" },
  ];

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "signup" || m === "login") setMode(m);
  }, [searchParams]);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/account", { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) navigate("/account", { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/account`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        toast({ description: "Проверьте почту для подтверждения аккаунта." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ description: "Вход выполнен" });
      }
    } catch (err: any) {
      toast({ description: err.message ?? "Ошибка авторизации" });
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Вход в аккаунт" : "Регистрация";
  const description = mode === "login" ? "Войдите, чтобы управлять профилем" : "Создайте аккаунт для личной страницы";

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Helmet>
        <title>{`${title} — Профили`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${window.location.origin}/auth`} />
      </Helmet>
      <article className="w-full max-w-xs rounded-lg border border-input bg-card p-6 shadow-sm">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </header>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="h-12 text-base md:text-base" 
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="h-12 text-base md:text-base" 
              style={{ fontSize: '16px' }}
            />
          </div>

          {mode === "signup" && (
            <>
              <div className="space-y-1">
                <label htmlFor="displayName" className="text-sm font-medium text-foreground">Display Name</label>
                <Input 
                  id="displayName" 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  className="h-12 text-base md:text-base" 
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Gender</label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">👨 Male</SelectItem>
                    <SelectItem value="female">👩 Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Country</label>
                <SearchableSelect
                  value={country}
                  onValueChange={setCountry}
                  options={countryOptions}
                  placeholder="Select country"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="bio" className="text-sm font-medium text-foreground">About Me</label>
                <Input 
                  id="bio" 
                  type="text" 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  className="h-12 text-base md:text-base" 
                  style={{ fontSize: '16px' }}
                />
              </div>
            </>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Подождите..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </Button>
        </form>
        <aside className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <span>
              Нет аккаунта?{" "}
              <button className="text-primary underline" onClick={() => { setMode("signup"); setSearchParams({ mode: "signup" }); }}>Зарегистрироваться</button>
            </span>
          ) : (
            <span>
              Уже есть аккаунт?{" "}
              <button className="text-primary underline" onClick={() => { setMode("login"); setSearchParams({ mode: "login" }); }}>Войти</button>
            </span>
          )}
        </aside>
        <nav className="mt-4 text-center">
          <Link to="/" className="text-sm text-primary underline">На главную</Link>
        </nav>
      </article>
    </main>
  );
};

export default Auth;
