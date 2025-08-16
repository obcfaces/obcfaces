import { useMemo, useState, useEffect } from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
// Simplified location data for mobile performance

interface LoginModalContentProps {
  onClose?: () => void;
}

const LoginModalContent = ({ onClose }: LoginModalContentProps) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  
  // Reset to login mode when modal opens
  useEffect(() => {
    setMode("login");
    setAuthError("");
  }, []);
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
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [authError, setAuthError] = useState<string>("");
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

// Simplified location data for mobile performance
const countries = useMemo(() => [
  { name: "Philippines", isoCode: "PH" },
  { name: "United States", isoCode: "US" },
  { name: "Canada", isoCode: "CA" },
  { name: "United Kingdom", isoCode: "GB" },
], []);

const states = useMemo(() => {
  if (countryCode === "PH") {
    return [
      { name: "Metro Manila", isoCode: "MM" },
      { name: "Cebu", isoCode: "CE" },
      { name: "Davao", isoCode: "DA" },
    ];
  }
  return [];
}, [countryCode]);

const cities = useMemo(() => {
  if (!stateCode) return [];
  const stateData = states.find(s => s.isoCode === stateCode);
  if (stateData?.name === "Metro Manila") {
    return [{ name: "Manila" }, { name: "Quezon City" }, { name: "Makati" }];
  }
  if (stateData?.name === "Cebu") {
    return [{ name: "Cebu City" }, { name: "Lapu-Lapu" }];
  }
  if (stateData?.name === "Davao") {
    return [{ name: "Davao City" }];
  }
  return [];
}, [stateCode, states]);
const ageOptions = useMemo(() => Array.from({ length: 47 }, (_, i) => 18 + i), []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(""); // Очищаем предыдущие ошибки
    setLoading(true);
    if (mode === "signup") {
      setSubmitted(true);
      // Check validation for signup
      if (!firstName.trim() || !lastName.trim() || !countryCode || !age || !acceptTerms) {
        setLoading(false);
        return;
      }
    }
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // Более конкретные сообщения об ошибках
          let errorMessage = "Ошибка входа";
          
          switch (error.message) {
            case "Invalid login credentials":
              errorMessage = "Неправильный email или пароль";
              break;
            case "Email not confirmed":
              errorMessage = "Email не подтвержден. Проверьте почту";
              break;
            case "Too many requests":
              errorMessage = "Слишком много попыток. Попробуйте позже";
              break;
            case "User not found":
              errorMessage = "Пользователь не найден";
              break;
            case "Invalid email":
              errorMessage = "Неправильный формат email";
              break;
            case "Weak password":
              errorMessage = "Слишком слабый пароль";
              break;
            default:
              // Проверяем, содержит ли сообщение ключевые слова
              if (error.message.toLowerCase().includes("password")) {
                errorMessage = "Неправильный пароль";
              } else if (error.message.toLowerCase().includes("email") || error.message.toLowerCase().includes("user")) {
                errorMessage = "Пользователь с таким email не существует";
              } else if (error.message.toLowerCase().includes("confirmed")) {
                errorMessage = "Email не подтвержден";
              } else {
                errorMessage = error.message;
              }
          }
          
          throw new Error(errorMessage);
        }
        toast({ description: "Вход выполнен успешно" });
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
        
        if (error) {
          // Более конкретные сообщения об ошибках регистрации
          let errorMessage = "Ошибка регистрации";
          
          switch (error.message) {
            case "User already registered":
              errorMessage = "Пользователь с таким email уже существует";
              break;
            case "Password should be at least 6 characters":
              errorMessage = "Пароль должен содержать минимум 6 символов";
              break;
            case "Invalid email":
              errorMessage = "Неправильный формат email";
              break;
            case "Weak password":
              errorMessage = "Пароль слишком простой. Используйте буквы, цифры и символы";
              break;
            default:
              if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
                errorMessage = "Пользователь с таким email уже зарегистрирован";
              } else if (error.message.toLowerCase().includes("password")) {
                errorMessage = "Проблема с паролем: " + error.message;
              } else {
                errorMessage = error.message;
              }
          }
          
          throw new Error(errorMessage);
        }

        // Always try to create profile for registered user, even if session isn't immediately available
        const userId = data.user?.id;
        if (userId) {
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
          if (upsertErr) console.warn("Profile creation warning:", upsertErr.message);
        }
        
        if (data.session?.user) {
          // User is immediately logged in
          toast({ description: "Регистрация завершена успешно" });
        } else {
          // User needs to confirm email but registration was successful
          toast({ description: "Регистрация завершена. Проверьте почту для подтверждения" });
        }
      }
    } catch (err: any) {
      setAuthError(err.message ?? (mode === "login" ? "Ошибка входа" : "Ошибка регистрации"));
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Sign in" : "Sign up";
  const description = mode === "login" ? "Enter your email and password to continue." : "Create an account for your profile.";

  const switchText = mode === "login" ? (
    <span className="text-sm text-muted-foreground">No account?{" "}
      <button type="button" className="text-primary underline" onClick={() => {
        setMode("signup");
        setAuthError("");
      }}>Sign up</button>
    </span>
  ) : (
    <span className="text-sm text-muted-foreground">Already have an account?{" "}
      <button type="button" className="text-primary underline" onClick={() => {
        setMode("login");
        setAuthError("");
      }}>Sign in</button>
    </span>
  );

  const showErrors = submitted && mode === "signup";
  const invalidFirstName = showErrors && !firstName.trim();
  const invalidLastName = showErrors && !lastName.trim();
  const invalidCountry = showErrors && !countryCode;
  const invalidAge = showErrors && !age;
  const invalidTerms = showErrors && !acceptTerms;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-3">
        {authError && (
          <div className="text-destructive text-sm font-medium">
            {authError}
          </div>
        )}
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
          <>
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
                  <SelectTrigger aria-label="Gender">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="na">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                  className={invalidTerms ? "border-destructive" : ""}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms"
                    className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${invalidTerms ? 'text-destructive' : ''}`}
                  >
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary underline hover:no-underline" target="_blank">
                      Terms of Service
                    </Link>
                    {" "}and{" "}
                    <Link to="/privacy" className="text-primary underline hover:no-underline" target="_blank">
                      Privacy Policy
                    </Link>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    By registering, you confirm that you are at least 18 years old and agree to our community guidelines. 
                    We may use your information to improve our services and provide personalized content. 
                    You can delete your account at any time. We respect your privacy and will never share your personal data with third parties without your consent.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
        <div className="flex items-center justify-between">
          {switchText}
          <div className="flex">
            <Button type="submit" disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}</Button>
          </div>
        </div>
      </form>
    </>
  );
};

export default LoginModalContent;