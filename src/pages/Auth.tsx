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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

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
        // Check if there's a saved redirect path (for admin users)
        const redirectPath = sessionStorage.getItem('redirectPath');
        if (redirectPath) {
          sessionStorage.removeItem('redirectPath');
          navigate(redirectPath, { replace: true });
        } else {
          navigate("/account", { replace: true });
        }
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        // Check if there's a saved redirect path (for admin users)
        const redirectPath = sessionStorage.getItem('redirectPath');
        if (redirectPath) {
          sessionStorage.removeItem('redirectPath');
          navigate(redirectPath, { replace: true });
        } else {
          navigate("/account", { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        // Use the current site URL for redirect - works in all environments
        const currentUrl = window.location.origin;
        const redirectUrl = `${currentUrl}/account`;
        
        console.log('Signup redirect URL:', redirectUrl);
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            emailRedirectTo: redirectUrl,
            data: {
              display_name: displayName,
              gender: gender,
              country: country,
              bio: bio
            }
          },
        });
        if (error) throw error;
        toast({ description: "Check your email to confirm your account." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ description: "Login successful" });
      }
    } catch (err: any) {
      let errorMessage = err.message ?? "Authorization error";
      
      // Provide more specific error messages
      if (err.message?.includes("Email not confirmed")) {
        errorMessage = "Please check your email and click the confirmation link before signing in.";
      } else if (err.message?.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (err.message?.includes("Email address not confirmed")) {
        errorMessage = "Your email address needs to be confirmed. Please check your inbox for the confirmation email.";
      } else if (err.message?.includes("signups not allowed")) {
        errorMessage = "New registrations are currently disabled. Please contact support.";
      }
      
      toast({ 
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Reset link sent",
        description: "Check your email for the password reset link."
      });
      setShowForgotPassword(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message ?? "Failed to send reset email.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Sign In" : "Sign Up";
  const description = mode === "login" ? "Sign in to manage your profile" : "Create an account for your personal page";

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Helmet>
        <title>{`${title} — Profiles`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${window.location.origin}/auth`} />
      </Helmet>
      <article className="w-full max-w-xs rounded-lg border border-input bg-card p-6 shadow-sm">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </header>

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="resetEmail" className="text-sm font-medium text-foreground">Email</label>
              <Input 
                id="resetEmail" 
                type="email" 
                value={resetEmail} 
                onChange={(e) => setResetEmail(e.target.value)} 
                required 
                className="h-12 text-base md:text-base" 
                style={{ fontSize: '16px' }}
                placeholder="Enter your email address"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => setShowForgotPassword(false)}
            >
              Back to Sign In
            </Button>
          </form>
        ) : (
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
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Sign Up"}
            </Button>
            
            {mode === "login" && (
              <div className="text-center">
                <button 
                  type="button"
                  className="text-sm text-primary underline"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot password?
                </button>
              </div>
            )}
          </form>
        )}

        {!showForgotPassword && (
          <aside className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <span>
                Don't have an account?{" "}
                <button className="text-primary underline" onClick={() => { setMode("signup"); setSearchParams({ mode: "signup" }); }}>Sign Up</button>
              </span>
            ) : (
              <span>
                Already have an account?{" "}
                <button className="text-primary underline" onClick={() => { setMode("login"); setSearchParams({ mode: "login" }); }}>Sign In</button>
              </span>
            )}
          </aside>
        )}
        
        <nav className="mt-4 text-center">
          <Link to="/" className="text-sm text-primary underline">Home</Link>
        </nav>
      </article>
    </main>
  );
};

export default Auth;
