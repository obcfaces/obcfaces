import { useMemo, useState, useEffect } from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
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
  defaultMode?: "login" | "signup" | "forgot";
}

const LoginModalContent = ({ onClose, defaultMode = "login" }: LoginModalContentProps) => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(defaultMode);
  
  // Reset to default mode when modal opens
  useEffect(() => {
    setMode(defaultMode);
    setAuthError("");
    setForgotEmailSent(false);
    setRegistrationSuccess(false);
  }, [defaultMode]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [stateName, setStateName] = useState("");
  const [stateCode, setStateCode] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [authError, setAuthError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [forgotEmailSent, setForgotEmailSent] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
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
    setAuthError(""); // Clear previous errors
    setEmailError("");
    setPasswordError("");
    setLoading(true);
    if (mode === "signup") {
      setSubmitted(true);
      // Check validation for signup
      if (!firstName.trim() || !acceptTerms || password !== confirmPassword) {
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
        
        if (error) {
          let errorMessage = "Error sending password recovery email";
          
          switch (error.message) {
            case "Invalid email":
              errorMessage = "Invalid email format";
              break;
            case "For security purposes, you can only request this once every 60 seconds":
              errorMessage = "Too many requests. Please wait 60 seconds";
              break;
            default:
              if (error.message.toLowerCase().includes("rate limit")) {
                errorMessage = "Too many requests. Please try again later";
              } else {
                errorMessage = error.message;
              }
          }
          
          throw new Error(errorMessage);
        }
        
        setForgotEmailSent(true);
        // Don't show toast, show in modal instead
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message === "Invalid login credentials") {
            // Стандартное сообщение с двумя ссылками
            setEmailError("Invalid email or password");
            setLoading(false);
            return;
          } else if (error.message === "Email not confirmed") {
            setAuthError("Email not confirmed. Check your email");
          } else if (error.message === "Too many requests") {
            setAuthError("Too many attempts. Please try again later");
          } else {
            setAuthError(error.message);
          }
          
          throw new Error("Login failed");
        }
        toast({ description: "Login successful" });
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
              country: country || null,
              state: stateName || null,
              city: city || null,
            },
          },
        });
        
        if (error) {
          // More specific registration error messages
          let errorMessage = "Registration error";
          
          switch (error.message) {
            case "User already registered":
              errorMessage = "User with this email already exists";
              break;
            case "Password should be at least 6 characters":
              errorMessage = "Password must contain at least 6 characters";
              break;
            case "Invalid email":
              errorMessage = "Invalid email format";
              break;
            case "Weak password":
              errorMessage = "Password too simple. Use letters, numbers and symbols";
              break;
            default:
              if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
                errorMessage = "User with this email is already registered";
              } else if (error.message.toLowerCase().includes("password")) {
                errorMessage = "Password issue: " + error.message;
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
                country: country || null,
                state: stateName || null,
                city: city || null,
              },
              { onConflict: "id" }
            );
          if (upsertErr) console.warn("Profile creation warning:", upsertErr.message);
        }
        
        if (data.session?.user) {
          // User is immediately logged in
          toast({ description: "Registration completed successfully" });
          onClose?.(); // Close modal after successful registration
        } else {
          // User needs to confirm email but registration was successful
          setRegistrationSuccess(true);
          // Don't close modal, show success message instead
        }
      }
    } catch (err: any) {
      setAuthError(err.message ?? (mode === "login" ? "Login error" : "Registration error"));
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
      case "signup": return "";
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
            setEmailError("");
            setPasswordError("");
            setRegistrationSuccess(false);
          }}>Sign up</button>
        </span>
      );
    } else if (mode === "signup") {
      return (
        <span className="text-sm text-muted-foreground">Already have an account?{" "}
          <button type="button" className="text-primary underline" onClick={() => {
            setMode("login");
            setAuthError("");
            setEmailError("");
            setPasswordError("");
            setRegistrationSuccess(false);
          }}>Sign in</button>
        </span>
      );
    } else {
      return (
        <span className="text-sm text-muted-foreground">Remember your password?{" "}
          <button type="button" className="text-primary underline" onClick={() => {
            setMode("login");
            setAuthError("");
            setEmailError("");
            setPasswordError("");
            setForgotEmailSent(false);
            setRegistrationSuccess(false);
          }}>Sign in</button>
        </span>
      );
    }
  };

  const showErrors = submitted && mode === "signup";
  const invalidFirstName = showErrors && !firstName.trim();
  const invalidTerms = showErrors && !acceptTerms;
  const invalidPasswordMatch = showErrors && password !== confirmPassword;

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
        {forgotEmailSent && mode === "forgot" && (
          <div className="text-green-600 text-sm font-bold">
            Password recovery link has been sent to your email. Please check your inbox.
          </div>
        )}
        {registrationSuccess && mode === "signup" && (
          <div className="text-green-600 text-sm font-bold">
            Registration successful! Please check your email and click the confirmation link to activate your account.
          </div>
        )}
        <div className="space-y-2">
          {emailError && mode === "login" && (
            <div className="text-red-500 text-sm font-medium">
              {emailError}{" "}
              <button 
                type="button" 
                className="text-primary underline hover:no-underline"
                onClick={() => {
                  setMode("signup");
                  setEmailError("");
                  setPasswordError("");
                }}
              >
                Sign up
              </button>
              {" or "}
              <button 
                type="button" 
                className="text-primary underline hover:no-underline"
                onClick={() => {
                  setMode("forgot");
                  setEmailError("");
                  setPasswordError("");
                }}
              >
                Reset password
              </button>
            </div>
          )}
          <Input id="auth-email" type="email" placeholder="Email" className="placeholder:italic placeholder:text-muted-foreground" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {mode !== "forgot" && (
          <div className="space-y-2">
            {passwordError && mode === "login" && (
              <div className="text-red-500 text-sm font-medium">
                {passwordError}{" "}
                <button 
                  type="button" 
                  className="text-primary underline hover:no-underline"
                  onClick={() => {
                    setMode("forgot");
                    setPasswordError("");
                    setEmailError("");
                  }}
                >
                  Reset password
                </button>
              </div>
            )}
            <div className="relative">
              <Input id="auth-password" type={showPassword ? "text" : "password"} placeholder="Password" className="pr-10 placeholder:italic placeholder:text-muted-foreground" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {mode === "signup" && (
              <div className="relative">
                <Input 
                  id="auth-confirm-password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Confirm password" 
                  className={`pr-10 placeholder:italic placeholder:text-muted-foreground ${invalidPasswordMatch ? 'border-destructive focus:ring-destructive' : ''}`} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                />
                <button 
                  type="button" 
                  aria-label={showPassword ? "Hide password" : "Show password"} 
                  onClick={() => setShowPassword((v) => !v)} 
                  className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            )}
            {invalidPasswordMatch && mode === "signup" && (
              <div className="text-destructive text-sm">
                Passwords do not match
              </div>
            )}
          </div>
        )}
        {mode === "signup" && (
          <>
            <div className="space-y-2">
              <div className="grid gap-2 grid-cols-2">
                <Input 
                  id="auth-firstname" 
                  placeholder="Your name" 
                  aria-invalid={invalidFirstName} 
                  className={`placeholder:italic placeholder:text-muted-foreground ${invalidFirstName ? 'border-destructive focus:ring-destructive' : ''}`} 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                />
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
                  options={countries}
                />
              </div>
            </div>
            
            <div className="space-y-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    <Checkbox 
                      id="terms" 
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                      className={invalidTerms ? "border-destructive" : ""}
                    />
                    <label
                      htmlFor="terms"
                      className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${invalidTerms ? 'text-destructive' : ''} flex items-center gap-1 flex-wrap`}
                    >
                      I agree to the{" "}
                      <Link to="/terms" className="text-primary underline hover:no-underline" target="_blank">
                        Terms of Service
                      </Link>
                      {" "}and{" "}
                      <Link to="/privacy" className="text-primary underline hover:no-underline" target="_blank">
                        Privacy Policy
                      </Link>
                      <Collapsible open={isTermsOpen} onOpenChange={setIsTermsOpen}>
                        <CollapsibleTrigger className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors ml-1">
                          <ChevronDown className={`h-4 w-4 transition-transform ${isTermsOpen ? 'rotate-180' : ''}`} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 w-full">
                          <p className="text-xs text-muted-foreground">
                            By registering, you confirm that you are at least 18 years old and agree to our community guidelines. 
                            We may use your information to improve our services and provide personalized content. 
                            You can delete your account at any time. We respect your privacy and will never share your personal data with third parties without your consent.
                          </p>
                        </CollapsibleContent>
                      </Collapsible>
                    </label>
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