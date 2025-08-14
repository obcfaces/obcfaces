import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Country, State } from "country-state-city";
import { getCitiesForLocation } from "@/lib/location-utils";
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
  const [stateName, setStateName] = useState("");
  const [stateCode, setStateCode] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
const countries = useMemo(() => Country.getAllCountries(), []);
const states = useMemo(() => (countryCode ? State.getStatesOfCountry(countryCode) : []), [countryCode]);
const cities = useMemo(() => getCitiesForLocation(countryCode, stateCode, stateName), [countryCode, stateCode, stateName]);
const ageOptions = useMemo(() => Array.from({ length: 65 }, (_, i) => 16 + i), []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") setSubmitted(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ description: "Signed in" });
        setOpen(false); // Stay on current page
      } else {
        const redirectUrl = window.location.href; // Confirm email back to current page
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              first_name: firstName || null,
              last_name: lastName || null,
              country: country || null,
              state: stateName || null,
              city: city || null,
              age: age ? Number(age) : null,
              gender: gender || null,
            },
          },
        });
        if (error) throw error;

        if (data.session?.user) {
          const userId = data.session.user.id;
          const { error: upsertErr } = await supabase
            .from("profiles")
            .upsert(
              {
                id: userId,
                first_name: firstName || null,
                last_name: lastName || null,
                country: country || null,
                state: stateName || null,
                city: city || null,
                age: age ? Number(age) : null,
                gender: gender || null,
              },
              { onConflict: "id" }
            );
          if (upsertErr) throw upsertErr;
          toast({ description: "Registration complete" });
          setOpen(false); // Stay on current page
        } else {
          toast({ description: "Check your email to confirm." });
          setOpen(false);
        }
      }
    } catch (err: any) {
      toast({ description: err.message ?? (mode === "login" ? "Sign-in error" : "Sign-up error") });
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Sign in" : "Sign up";
  const description = mode === "login" ? "Enter your email and password to continue." : "Create an account for your profile.";

  const switchText = mode === "login" ? (
    <span className="text-sm text-muted-foreground">No account?{" "}
      <button type="button" className="text-primary underline" onClick={() => setMode("signup")}>Sign up</button>
    </span>
  ) : (
    <span className="text-sm text-muted-foreground">Already have an account?{" "}
      <button type="button" className="text-primary underline" onClick={() => setMode("login")}>Sign in</button>
    </span>
  );

  const showErrors = submitted && mode === "signup";
  const invalidFirstName = showErrors && !firstName.trim();
  const invalidLastName = showErrors && !lastName.trim();
  const invalidCountry = showErrors && !countryCode;
  const invalidAge = showErrors && !age;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setMode("login"); setSubmitted(false); } }}>
      <DialogTrigger asChild>
        <button className="text-sm underline text-primary">Sign in</button>
      </DialogTrigger>
      <DialogContent className={mode === "signup" ? "sm:max-w-lg" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-2">
            
            <Input id="auth-email" type="email" placeholder="Email" className="placeholder:italic placeholder:text-muted-foreground" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            
            <div className="relative">
              <Input id="auth-password" type={showPassword ? "text" : "password"} placeholder="Password" className="pr-10 placeholder:italic placeholder:text-muted-foreground" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {mode === "signup" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                
                <Input id="auth-firstname" placeholder="First name" aria-invalid={invalidFirstName} className={`placeholder:italic placeholder:text-muted-foreground ${invalidFirstName ? 'border-destructive focus:ring-destructive' : ''}`} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                
                <Input id="auth-lastname" placeholder="Last name" aria-invalid={invalidLastName} className={`placeholder:italic placeholder:text-muted-foreground ${invalidLastName ? 'border-destructive focus:ring-destructive' : ''}`} value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="space-y-2">
                
                <SearchableSelect
                  value={countryCode ?? ""}
                  onValueChange={(code) => {
                    setCountryCode(code);
                    const c = countries.find((c) => c.isoCode === code);
                    setCountry(c?.name || "");
                    setStateName("");
                    setStateCode(null);
                    setCity("");
                  }}
                  placeholder="Country"
                  ariaLabel="Select country"
                  invalid={invalidCountry}
                  options={countries.map((c) => ({ value: c.isoCode, label: c.name }))}
                />
              </div>
              <div className="space-y-2">
                
                <Select value={age} onValueChange={setAge}>
                  <SelectTrigger aria-label="Age" className={invalidAge ? "border-destructive focus:ring-destructive" : undefined}>
                    <SelectValue placeholder="Age" />
                  </SelectTrigger>
                  <SelectContent>
                    {ageOptions.map((a) => (
                      <SelectItem key={a} value={String(a)}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger aria-label="Пол">
                    <SelectValue placeholder="Пол" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Мужской</SelectItem>
                    <SelectItem value="female">Женский</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                    <SelectItem value="na">Предпочитаю не указывать</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            {switchText}
            <div className="flex">
              <Button type="submit" disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModalTrigger;
