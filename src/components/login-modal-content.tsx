import { useMemo, useState, useEffect } from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Country, State } from 'country-state-city';

import { Input } from "@/components/ui/input";
import { EmailInputWithSuggestions } from "@/components/ui/email-input-with-suggestions";
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
  onAuthSuccess?: () => void;
}

const LoginModalContent = ({ onClose, defaultMode = "login", onAuthSuccess }: LoginModalContentProps) => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(defaultMode);
  
  // Reset to default mode when modal opens
  useEffect(() => {
    setMode(defaultMode);
    setAuthError("");
    setForgotEmailSent(false);
    setRegistrationSuccess(false);
    
    // Start timing when switching to signup mode
    if (defaultMode === "signup") {
      setFormStartTime(Date.now());
    }
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
  const [formStartTime, setFormStartTime] = useState<number | null>(null);
  
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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
        
        // Log successful login with fingerprint
        if (data.user) {
          try {
            const { getDeviceFingerprint, saveDeviceFingerprint } = await import('@/utils/fingerprint');
            const fingerprintData = await getDeviceFingerprint();
            const fingerprintId = await saveDeviceFingerprint(data.user.id);
            
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            
            await supabase.functions.invoke('auth-login-tracker', {
              body: {
                userId: data.user.id,
                loginMethod: 'email',
                ipAddress: ipData.ip,
                userAgent: navigator.userAgent,
                fingerprintId: fingerprintId,
                fingerprintData: fingerprintData
              }
            });
          } catch (logError) {
            console.error('Error logging login:', logError);
          }
        }
        
        toast({ description: "Login successful" });
        onAuthSuccess?.(); // Call auth success callback
      } else {
        // Calculate form fill time
        const formFillTime = formStartTime ? Math.floor((Date.now() - formStartTime) / 1000) : null;
        
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
              form_fill_time_seconds: formFillTime
            },
          },
        });
        
        // Log signup with IP, user agent and fingerprint
        if (data?.user) {
          try {
            const { getDeviceFingerprint, saveDeviceFingerprint } = await import('@/utils/fingerprint');
            const fingerprintData = await getDeviceFingerprint();
            const fingerprintId = await saveDeviceFingerprint(data.user.id);
            
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            
            await supabase.functions.invoke('auth-login-tracker', {
              body: {
                userId: data.user.id,
                loginMethod: 'email',
                ipAddress: ipData.ip,
                userAgent: navigator.userAgent,
                fingerprintId: fingerprintId,
                fingerprintData: fingerprintData
              }
            });
          } catch (logError) {
            console.error('Error logging signup:', logError);
          }
        }
        
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
                email: email || null,
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
          onAuthSuccess?.(); // Call auth success callback
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

  // Show only success message after registration
  if (registrationSuccess && mode === "signup") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="text-red-600 text-sm">
          Please check your email and click the confirmation link to activate your account.
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{getTitle()}</DialogTitle>
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
          <EmailInputWithSuggestions id="auth-email" placeholder="Email" className="placeholder:italic placeholder:text-muted-foreground" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
              <div className="flex items-start gap-2">
                <Checkbox 
                  id="terms" 
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                  className={`${invalidTerms ? "border-destructive" : ""} mt-0.5 flex-shrink-0`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <label
                      htmlFor="terms"
                      className={`text-xs leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${invalidTerms ? 'text-destructive' : ''}`}
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
                    <Collapsible open={isTermsOpen} onOpenChange={setIsTermsOpen}>
                      <CollapsibleTrigger className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors ml-1">
                        <ChevronDown className={`h-3 w-3 transition-transform ${isTermsOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                    </Collapsible>
                  </div>
                  <Collapsible open={isTermsOpen} onOpenChange={setIsTermsOpen}>
                    <CollapsibleContent className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        By registering, you confirm that you are at least 18 years old and agree to our community guidelines. 
                        We may use your information to improve our services and provide personalized content. 
                        You can delete your account at any time. We respect your privacy and will never share your personal data with third parties without your consent.
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
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
        
        {/* Social Login - only show for login and signup modes */}
        {mode !== "forgot" && (
          <div className="space-y-3 mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={async () => {
                try {
                  setLoading(true);
                  setAuthError("");
                  
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${window.location.origin}/`,
                      queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account',
                      }
                    }
                  });
                  
                  if (error) {
                    setAuthError(error.message);
                  }
                } catch (error) {
                  setAuthError('Google authentication failed');
                } finally {
                  setLoading(false);
                }
              }}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={async () => {
                try {
                  setLoading(true);
                  setAuthError("");
                  
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'facebook',
                    options: {
                      redirectTo: `${window.location.origin}/`,
                      queryParams: {
                        auth_type: 'rerequest'
                      }
                    }
                  });
                  
                  if (error) {
                    // Check for common Facebook OAuth errors
                    if (error.message.includes('email') || error.message.includes('Email')) {
                      setAuthError('Your Facebook account does not provide an email address. Please use a different login method or add an email to your Facebook account.');
                    } else if (error.message.includes('access_denied')) {
                      setAuthError('Facebook login was cancelled. Please try again.');
                    } else {
                      setAuthError(error.message || 'Facebook authentication failed. Please try again.');
                    }
                  }
                } catch (error: any) {
                  console.error('Facebook auth error:', error);
                  setAuthError('Facebook authentication failed. Please try again or use a different login method.');
                } finally {
                  setLoading(false);
                }
              }}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </Button>
          </div>
        )}
      </form>
    </>
  );
};

export default LoginModalContent;