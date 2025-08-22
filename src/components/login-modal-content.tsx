import { useMemo, useState, useEffect } from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Country, State } from 'country-state-city';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { getCitiesForLocation } from '@/lib/location-utils';

interface LoginModalContentProps {
  onClose?: () => void;
}

const LoginModalContent = ({ onClose }: LoginModalContentProps) => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  
  // Reset to login mode when modal opens
  useEffect(() => {
    setMode("login");
    setAuthError("");
    setForgotEmailSent(false);
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
  const [forgotEmailSent, setForgotEmailSent] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

// Get all countries from library and format them
const countries = useMemo(() => {
  const allCountries = Country.getAllCountries().map(country => ({
    value: country.isoCode,
    label: country.name
  }));
  
  // Sort alphabetically but put Philippines first
  const philippines = allCountries.find(c => c.value === 'PH');
  const otherCountries = allCountries.filter(c => c.value !== 'PH').sort((a, b) => a.label.localeCompare(b.label));
  
  return [
    // Active countries
    ...(philippines ? [philippines] : []),
    { value: "separator", label: "", disabled: true, divider: true },
    // All other countries
    ...otherCountries
  ];
}, []);

const states = useMemo(() => {
  if (!countryCode) return [];
  
  // Get states from library for the selected country
  const countryStates = State.getStatesOfCountry(countryCode);
  
  return countryStates.map(state => ({
    name: state.name,
    isoCode: state.isoCode
  }));
}, [countryCode]);

const cities = useMemo(() => {
  if (!countryCode) return [];
  const cityList = getCitiesForLocation(countryCode, stateCode);
  return cityList
    .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
    .map(city => ({
      name: city
    }));
}, [countryCode, stateCode]);
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
      if (mode === "forgot") {
        // Обработка восстановления пароля
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });
        
        if (error) {
          let errorMessage = "Ошибка при отправке письма для восстановления";
          
          switch (error.message) {
            case "Invalid email":
              errorMessage = "Неправильный формат email";
              break;
            case "For security purposes, you can only request this once every 60 seconds":
              errorMessage = "Слишком частые запросы. Подождите 60 секунд";
              break;
            default:
              if (error.message.toLowerCase().includes("rate limit")) {
                errorMessage = "Слишком много запросов. Попробуйте позже";
              } else {
                errorMessage = error.message;
              }
          }
          
          throw new Error(errorMessage);
        }
        
        setForgotEmailSent(true);
        toast({ description: "Письмо для восстановления пароля отправлено на ваш email" });
      } else if (mode === "login") {
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
        onClose?.(); // Close modal after successful login
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
          onClose?.(); // Close modal after successful registration
        } else {
          // User needs to confirm email but registration was successful
          toast({ description: "Регистрация завершена. Проверьте почту для подтверждения" });
          onClose?.(); // Close modal after signup (user needs to check email)
        }
      }
    } catch (err: any) {
      setAuthError(err.message ?? (mode === "login" ? "Ошибка входа" : "Ошибка регистрации"));
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return "Sign in";
      case "signup": return "Sign up";
      case "forgot": return "Reset password";
      default: return "Sign in";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "login": return "Enter your email and password to continue.";
      case "signup": return "Create an account for your profile.";
      case "forgot": return forgotEmailSent 
        ? "Check your email for password reset instructions." 
        : "Enter your email address to receive password reset instructions.";
      default: return "Enter your email and password to continue.";
    }
  };

  const getSwitchText = () => {
    if (mode === "login") {
      return (
        <span className="text-sm text-muted-foreground">No account?{" "}
          <button type="button" className="text-primary underline" onClick={() => {
            setMode("signup");
            setAuthError("");
          }}>Sign up</button>
        </span>
      );
    } else if (mode === "signup") {
      return (
        <span className="text-sm text-muted-foreground">Already have an account?{" "}
          <button type="button" className="text-primary underline" onClick={() => {
            setMode("login");
            setAuthError("");
          }}>Sign in</button>
        </span>
      );
    } else {
      return (
        <span className="text-sm text-muted-foreground">Remember your password?{" "}
          <button type="button" className="text-primary underline" onClick={() => {
            setMode("login");
            setAuthError("");
            setForgotEmailSent(false);
          }}>Sign in</button>
        </span>
      );
    }
  };

  const showErrors = submitted && mode === "signup";
  const invalidFirstName = showErrors && !firstName.trim();
  const invalidLastName = showErrors && !lastName.trim();
  const invalidCountry = showErrors && !countryCode;
  const invalidAge = showErrors && !age;
  const invalidTerms = showErrors && !acceptTerms;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{getTitle()}</DialogTitle>
        <DialogDescription>{getDescription()}</DialogDescription>
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
        {mode !== "forgot" && (
          <div className="space-y-2">
            <div className="relative">
              <Input id="auth-password" type={showPassword ? "text" : "password"} placeholder="Password" className="pr-10 placeholder:italic placeholder:text-muted-foreground" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        )}
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
                    const c = countries.find((c) => c.value === code);
                    setCountry(c?.label || "");
                    setStateName("");
                    setStateCode(null);
                    setCity("");
                  }}
                  placeholder="Country"
                  ariaLabel="Select country"
                  invalid={invalidCountry}
                  options={countries}
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
          {getSwitchText()}
          <div className="flex flex-col space-y-2 items-end">
            <Button type="submit" disabled={loading || forgotEmailSent}>
              {loading ? "Please wait…" : 
               forgotEmailSent ? "Email sent" :
               mode === "login" ? "Sign in" : 
               mode === "signup" ? "Sign up" : 
               "Send reset email"}
            </Button>
            {mode === "login" && (
              <button 
                type="button" 
                className="text-sm text-primary underline hover:no-underline" 
                onClick={() => {
                  setMode("forgot");
                  setAuthError("");
                  setForgotEmailSent(false);
                }}
              >
                Forgot password?
              </button>
            )}
          </div>
        </div>
      </form>
    </>
  );
};

export default LoginModalContent;