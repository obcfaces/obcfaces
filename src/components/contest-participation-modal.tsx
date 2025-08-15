import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SearchableSelect from "@/components/ui/searchable-select";
import { Country, State, City } from 'country-state-city';
import { getCitiesForLocation } from '@/lib/location-utils';

interface ContestParticipationModalProps {
  children: React.ReactNode;
}

export const ContestParticipationModal = ({ children }: ContestParticipationModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'auth' | 'location'>('auth');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState<string>("");
  const { toast } = useToast();

  // Auth form data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Location form data
  const [formData, setFormData] = useState({
    country: "",
    countryCode: "",
    state: "",
    stateCode: "",
    city: "",
  });

  const [showCityInput, setShowCityInput] = useState(false);

  // Countries with Philippines first
  const countries = useMemo(() => {
    const allCountries = Country.getAllCountries();
    const philippines = allCountries.find(c => c.isoCode === 'PH');
    const otherCountries = allCountries.filter(c => c.isoCode !== 'PH');
    
    return [
      ...(philippines ? [{ name: philippines.name, isoCode: philippines.isoCode }] : []),
      { name: "", isoCode: "__divider__", disabled: true, divider: true },
      ...otherCountries.map(c => ({ name: c.name, isoCode: c.isoCode }))
    ];
  }, []);
  
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [stateCode, setStateCode] = useState<string | null>(null);
  
  // States for selected country
  const states = useMemo(() => {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode).map(s => ({
      name: s.name,
      isoCode: s.isoCode
    }));
  }, [countryCode]);
  
  // Cities for selected state
  const cities = useMemo(() => {
    if (!countryCode || !stateCode) return [];
    
    // Format city names to Title Case
    const formatCityName = (name: string) => {
      return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
    // Use Philippines database for PH
    if (countryCode === 'PH') {
      const stateName = states.find(s => s.isoCode === stateCode)?.name;
      if (stateName) {
        const philippinesCities = getCitiesForLocation(countryCode, stateCode, stateName);
        if (philippinesCities.length > 0) {
          const cityList = philippinesCities.map(city => ({ 
            name: formatCityName(city.name) 
          }));
          cityList.push({ name: "Other (enter manually)" });
          return cityList;
        }
      }
    }
    
    // Use country-state-city library for other countries
    const cscCities = City.getCitiesOfState(countryCode, stateCode);
    const cityList = cscCities
      .map(c => ({ name: formatCityName(c.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Always add "Other" option for manual entry
    if (cityList.length > 0) {
      cityList.push({ name: "Other (enter manually)" });
    }
    
    return cityList;
  }, [countryCode, stateCode, states]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentStep('location');
        // Load existing profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('country, state, city')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setFormData({
            country: profile.country || "",
            countryCode: profile.country || "",
            state: profile.state || "",
            stateCode: profile.state || "",
            city: profile.city || "",
          });
        }
      }
    };

    if (isOpen) {
      checkUser();
    }
  }, [isOpen]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
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
            default:
              if (error.message.toLowerCase().includes("password")) {
                errorMessage = "Неправильный пароль";
              } else if (error.message.toLowerCase().includes("email") || error.message.toLowerCase().includes("user")) {
                errorMessage = "Пользователь с таким email не существует";
              }
          }
          
          setAuthError(errorMessage);
          return;
        }

        toast({
          title: "Успешный вход",
          description: "Добро пожаловать!",
          duration: 1000,
        });
        setCurrentStep('location');
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        if (error) {
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
            default:
              if (error.message.toLowerCase().includes("already registered")) {
                errorMessage = "Пользователь с таким email уже зарегистрирован";
              }
          }
          
          setAuthError(errorMessage);
          return;
        }

        toast({
          title: "Регистрация успешна",
          description: "Проверьте почту для подтверждения",
        });
      }
    } catch (error) {
      setAuthError("Произошла неожиданная ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    
    // Wait for state update before checking validation
    setTimeout(async () => {
      setIsLoading(true);

      // Validation
      let isValid = true;

      // Check required fields
      if (!formData.countryCode) {
        isValid = false;
      }

      // Only validate state if country is selected
      if (formData.countryCode && !formData.stateCode) {
        isValid = false;
      }

      // Only validate city if state is selected
      if (formData.stateCode && !formData.city.trim()) {
        isValid = false;
      }

      if (!isValid) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Update profile with location data
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            country: formData.country,
            state: formData.state,
            city: formData.city,
          });

        if (error) {
          toast({
            title: "Ошибка",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Успешно!",
          description: "Ваша локация сохранена",
        });
        setIsOpen(false);
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Произошла неожиданная ошибка",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 0);
  };

  // Validation states
  const showLocationErrors = submitted;
  const invalidCountry = showLocationErrors && !formData.countryCode;
  const invalidState = showLocationErrors && formData.countryCode && !formData.stateCode;
  const invalidCity = showLocationErrors && formData.stateCode && !formData.city.trim();

  // Helper function for field styling
  const getFieldClasses = (isInvalid: boolean, isFilled: boolean) => {
    if (isInvalid) {
      return "border-2 border-red-500 focus:ring-red-500 focus:border-red-500";
    } else if (isFilled) {
      return "border-2 border-blue-500 focus:ring-blue-500 focus:border-blue-500";
    }
    return "";
  };

  // Check if fields are filled
  const isCountryFilled = !!formData.countryCode;
  const isStateFilled = !!formData.stateCode;
  const isCityFilled = formData.city.trim() !== "";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'auth' ? 'Sign in' : 'Select your location'}
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'auth' ? (
          <form onSubmit={handleAuth} className="space-y-3">
            {authError && (
              <div className="text-destructive text-sm font-medium">
                {authError}
              </div>
            )}
            
            <div className="space-y-2">
              <Input 
                id="email" 
                type="email" 
                placeholder="Email" 
                className="text-sm placeholder:text-muted-foreground" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  className="pr-10 text-sm placeholder:text-muted-foreground" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
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
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {mode === 'login' ? 'No account? ' : 'Already have an account? '}
                <button 
                  type="button" 
                  className="text-primary underline" 
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setAuthError("");
                  }}
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </span>
              <div className="flex">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Please wait..." : mode === 'login' ? 'Sign in' : 'Sign up'}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLocationSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Country *</label>
                <SearchableSelect 
                  options={countries.map(c => ({ value: c.isoCode, label: c.name }))}
                  value={countryCode || ""}
                  onValueChange={(value) => {
                    setCountryCode(value);
                    const country = countries.find(c => c.isoCode === value);
                    setFormData(prev => ({ 
                      ...prev, 
                      countryCode: value,
                      country: country?.name || "",
                      state: "",
                      stateCode: "",
                      city: ""
                    }));
                    setStateCode(null);
                    setShowCityInput(false);
                  }}
                  placeholder="Select Country"
                  invalid={invalidCountry}
                  highlightSelected={isCountryFilled}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">State/Region *</label>
                <SearchableSelect 
                  options={states.map(s => ({ value: s.isoCode, label: s.name }))}
                  value={stateCode || ""}
                  onValueChange={(value) => {
                    setStateCode(value);
                    const state = states.find(s => s.isoCode === value);
                    setFormData(prev => ({ 
                      ...prev, 
                      stateCode: value,
                      state: state?.name || "",
                      city: ""
                    }));
                    setShowCityInput(false);
                  }}
                  placeholder="Select State/Province"
                  disabled={!formData.countryCode}
                  invalid={invalidState}
                  highlightSelected={isStateFilled}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">City *</label>
                {cities.length === 0 && formData.stateCode ? (
                  <Input 
                    type="text" 
                    placeholder="Enter your city" 
                    value={formData.city} 
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} 
                    className={getFieldClasses(invalidCity, isCityFilled)}
                  />
                ) : showCityInput ? (
                  <Input 
                    type="text" 
                    placeholder="Enter your city" 
                    value={formData.city} 
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} 
                    className={getFieldClasses(invalidCity, isCityFilled)}
                  />
                ) : (
                  <SearchableSelect 
                    options={cities.map(ct => ({ value: ct.name, label: ct.name }))}
                    value={formData.city}
                    onValueChange={(value) => {
                      if (value === "Other (enter manually)") {
                        setShowCityInput(true);
                        setFormData(prev => ({ ...prev, city: "" }));
                      } else {
                        setFormData(prev => ({ ...prev, city: value }));
                      }
                    }}
                    placeholder="Select City"
                    disabled={!formData.stateCode}
                    invalid={invalidCity}
                    highlightSelected={isCityFilled}
                  />
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Location"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};