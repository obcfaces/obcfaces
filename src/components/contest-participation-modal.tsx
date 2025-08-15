import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SearchableSelect from "@/components/ui/searchable-select";

interface ContestParticipationModalProps {
  children: React.ReactNode;
}

export const ContestParticipationModal = ({ children }: ContestParticipationModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'auth' | 'profile'>('auth');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState<string>("");
  const { toast } = useToast();

  // Auth form data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Profile form data
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    country: "",
    countryCode: "",
    state: "",
    stateCode: "",
    city: "",
    gender: "",
    birth_day: "",
    birth_month: "",
    birth_year: "",
    marital_status: "",
    has_children: false,
    height_cm: "",
    weight_kg: "",
  });

  const [photo1File, setPhoto1File] = useState<File | null>(null);
  const [photo2File, setPhoto2File] = useState<File | null>(null);

  // Location data - simplified like in registration
  const countries = [
    { name: "Philippines", isoCode: "PH" },
    { name: "United States", isoCode: "US" },
    { name: "Canada", isoCode: "CA" },
    { name: "United Kingdom", isoCode: "GB" },
  ];

  const states = formData.countryCode === "PH" ? [
    { name: "Metro Manila", isoCode: "MM" },
    { name: "Cebu", isoCode: "CE" },
    { name: "Davao", isoCode: "DA" },
  ] : [];

  const cities = !formData.stateCode ? [] : (() => {
    const stateData = states.find(s => s.isoCode === formData.stateCode);
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
  })();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentStep('profile');
        // Load existing profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setFormData({
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            country: profile.country || "",
            countryCode: profile.country || "",
            state: profile.state || "",
            stateCode: profile.state || "",
            city: profile.city || "",
            gender: profile.gender || "",
            birth_day: profile.birthdate ? new Date(profile.birthdate).getDate().toString() : "",
            birth_month: profile.birthdate ? (new Date(profile.birthdate).getMonth() + 1).toString() : "",
            birth_year: profile.birthdate ? new Date(profile.birthdate).getFullYear().toString() : "",
            marital_status: profile.marital_status || "",
            has_children: profile.has_children || false,
            height_cm: profile.height_cm?.toString() || "",
            weight_kg: profile.weight_kg?.toString() || "",
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
        });
        setCurrentStep('profile');
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

  const uploadPhoto = async (file: File, photoNumber: 1 | 2): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}/photo-${photoNumber}.${fileExt}`;

    const { error } = await supabase.storage
      .from('contest-photos')
      .upload(fileName, file, {
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('contest-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setIsLoading(true);

    // Validation
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.countryCode || 
        !formData.gender || !formData.birth_day || !formData.birth_month || 
        !formData.birth_year || !photo1File || !photo2File) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Upload photos
      let photo1Url = null;
      let photo2Url = null;

      if (photo1File) {
        photo1Url = await uploadPhoto(photo1File, 1);
      }
      if (photo2File) {
        photo2Url = await uploadPhoto(photo2File, 2);
      }

      // Create birthdate from separate fields
      let birthdate = null;
      if (formData.birth_day && formData.birth_month && formData.birth_year) {
        birthdate = `${formData.birth_year}-${formData.birth_month.padStart(2, '0')}-${formData.birth_day.padStart(2, '0')}`;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          gender: formData.gender,
          birthdate: birthdate,
          marital_status: formData.marital_status,
          has_children: formData.has_children,
          height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
          photo_1_url: photo1Url,
          photo_2_url: photo2Url,
          is_contest_participant: true,
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
        description: "Ваша заявка на участие отправлена",
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
  };

  const handleFileSelect = (file: File, photoNumber: 1 | 2) => {
    if (photoNumber === 1) {
      setPhoto1File(file);
    } else {
      setPhoto2File(file);
    }
  };

  // Validation states for profile form
  const showProfileErrors = submitted;
  const invalidFirstName = showProfileErrors && !formData.first_name.trim();
  const invalidLastName = showProfileErrors && !formData.last_name.trim();
  const invalidCountry = showProfileErrors && !formData.countryCode;
  const invalidGender = showProfileErrors && !formData.gender;
  const invalidBirthDay = showProfileErrors && !formData.birth_day;
  const invalidBirthMonth = showProfileErrors && !formData.birth_month;
  const invalidBirthYear = showProfileErrors && !formData.birth_year;
  const invalidPhoto1 = showProfileErrors && !photo1File;
  const invalidPhoto2 = showProfileErrors && !photo2File;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'auth' ? 'Sign in' : 'Contest participation form'}
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
          <form onSubmit={handleProfileSubmit} className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                id="first_name"
                placeholder="First name"
                className={`text-sm placeholder:text-muted-foreground ${invalidFirstName ? 'border-destructive focus:ring-destructive' : ''}`}
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                aria-invalid={invalidFirstName}
                required
              />
              <Input
                id="last_name"
                placeholder="Last name"
                className={`text-sm placeholder:text-muted-foreground ${invalidLastName ? 'border-destructive focus:ring-destructive' : ''}`}
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                aria-invalid={invalidLastName}
                required
              />
            </div>

            <div className="grid gap-2 grid-cols-3">
              <SearchableSelect
                placeholder="Country"
                options={countries.map(c => ({ value: c.isoCode, label: c.name }))}
                value={formData.countryCode}
                onValueChange={(code) => {
                  const country = countries.find(c => c.isoCode === code);
                  setFormData({
                    ...formData, 
                    countryCode: code,
                    country: country?.name || "",
                    state: "", 
                    stateCode: "",
                    city: ""
                  });
                }}
                invalid={invalidCountry}
              />
              
              <Select value={formData.stateCode} onValueChange={(code) => {
                const state = states.find(s => s.isoCode === code);
                setFormData({
                  ...formData, 
                  stateCode: code,
                  state: state?.name || "",
                  city: ""
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.isoCode} value={state.isoCode}>{state.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={formData.city} onValueChange={(value) => setFormData({...formData, city: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                <SelectTrigger className={`${invalidGender ? "border-destructive focus:ring-destructive" : ""}`}>
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="grid grid-cols-3 gap-1">
                <Select value={formData.birth_day} onValueChange={(value) => setFormData({...formData, birth_day: value})}>
                  <SelectTrigger className={`${invalidBirthDay ? "border-destructive focus:ring-destructive" : ""}`}>
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={formData.birth_month} onValueChange={(value) => setFormData({...formData, birth_month: value})}>
                  <SelectTrigger className={`${invalidBirthMonth ? "border-destructive focus:ring-destructive" : ""}`}>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={formData.birth_year} onValueChange={(value) => setFormData({...formData, birth_year: value})}>
                  <SelectTrigger className={`${invalidBirthYear ? "border-destructive focus:ring-destructive" : ""}`}>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 80}, (_, i) => new Date().getFullYear() - 18 - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Select value={formData.marital_status} onValueChange={(value) => setFormData({...formData, marital_status: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Marital status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={formData.has_children ? formData.has_children.toString() : ""} 
              onValueChange={(value) => setFormData({...formData, has_children: value === 'true'})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Do you have children?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                id="height"
                type="number"
                placeholder="Height (cm)"
                className="text-sm placeholder:text-muted-foreground"
                value={formData.height_cm}
                onChange={(e) => setFormData({...formData, height_cm: e.target.value})}
              />
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="Weight (kg)"
                className="text-sm placeholder:text-muted-foreground"
                value={formData.weight_kg}
                onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
              />
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Photos (2 photos required)</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className={`border-2 border-dashed rounded-lg p-4 text-center ${invalidPhoto1 ? 'border-destructive' : 'border-gray-300'}`}>
                  <input
                    id="photo1"
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 1)}
                    className="hidden"
                    required
                  />
                  <label htmlFor="photo1" className="cursor-pointer">
                    <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    {photo1File ? (
                      <p className="text-sm text-green-600">{photo1File.name}</p>
                    ) : (
                      <p className="text-sm text-gray-500">Photo 1</p>
                    )}
                  </label>
                </div>
                
                <div className={`border-2 border-dashed rounded-lg p-4 text-center ${invalidPhoto2 ? 'border-destructive' : 'border-gray-300'}`}>
                  <input
                    id="photo2"
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 2)}
                    className="hidden"
                    required
                  />
                  <label htmlFor="photo2" className="cursor-pointer">
                    <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    {photo2File ? (
                      <p className="text-sm text-green-600">{photo2File.name}</p>
                    ) : (
                      <p className="text-sm text-gray-500">Photo 2</p>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit application"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};