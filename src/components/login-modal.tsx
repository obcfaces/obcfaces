import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
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
const LoginModalTrigger = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [stateName, setStateName] = useState("");
  const [stateCode, setStateCode] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [acceptTerms, setAcceptTerms] = useState(false);
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
    setLoading(true);
    if (mode === "signup") {
      setSubmitted(true);
      // Check validation for signup
      if (!name.trim() || !countryCode || !age || !acceptTerms) {
        setLoading(false);
        return;
      }
    }
    try {
      if (mode === "forgot") {
        // Password recovery handling
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });
        
        if (error) throw error;
        
        setForgotEmailSent(true);
        toast({ description: "Password recovery email sent" });
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ 
          description: "Signed in",
          duration: 1000  // Auto-hide after 1 second
        });
        setOpen(false); // Close modal after successful login
      } else {
        const redirectUrl = window.location.href; // Confirm email back to current page
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              first_name: name || null,
              last_name: null,
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
                first_name: name || null,
                last_name: null,
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
          setOpen(false); // Close modal after successful registration
        } else {
          toast({ description: "Check your email to confirm." });
          setOpen(false); // Close modal after signup (user needs to check email)
        }
      }
    } catch (err: any) {
      toast({ description: err.message ?? (mode === "login" ? "Sign-in error" : "Sign-up error") });
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
          <button type="button" className="text-primary underline" onClick={() => setMode("signup")}>Sign up</button>
        </span>
      );
    } else if (mode === "signup") {
      return (
        <span className="text-sm text-muted-foreground">Already have an account?{" "}
          <button type="button" className="text-primary underline" onClick={() => setMode("login")}>Sign in</button>
        </span>
      );
    } else {
      return (
        <span className="text-sm text-muted-foreground">Remember your password?{" "}
          <button type="button" className="text-primary underline" onClick={() => {
            setMode("login");
            setForgotEmailSent(false);
          }}>Sign in</button>
        </span>
      );
    }
  };

  const showErrors = submitted && mode === "signup";
  const invalidName = showErrors && !name.trim();
  const invalidCountry = showErrors && !countryCode;
  const invalidAge = showErrors && !age;
  const invalidTerms = showErrors && !acceptTerms;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-sm underline text-primary">Sign in</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg data-[state=open]:translate-y-[5%] sm:data-[state=open]:translate-y-[2%]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
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
              {/* Separator between email/password and profile fields */}
              <div className="border-t pt-4">
                <div className="space-y-3">
                  <div className="grid gap-3 grid-cols-2">
                    <Input 
                      id="auth-name" 
                      placeholder="Name" 
                      aria-invalid={invalidName} 
                      className={`placeholder:italic placeholder:text-muted-foreground ${invalidName ? 'border-destructive focus:ring-destructive' : ''}`} 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                    />
                    
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
                  
                  <div className="grid gap-3 grid-cols-2">
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
                    setForgotEmailSent(false);
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModalTrigger;
