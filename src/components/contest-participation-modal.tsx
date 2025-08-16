import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Eye, EyeOff } from "lucide-react";
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

  // Cache key for localStorage
  const FORM_CACHE_KEY = 'contest_form_cache';

  // Load cached form data
  const loadCachedFormData = () => {
    try {
      const cached = localStorage.getItem(FORM_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Failed to load cached form data:', error);
    }
    return {
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
      has_children: undefined as boolean | undefined,
      height_cm: "",
      weight_kg: "",
      measurement_system: "metric",
    };
  };

  // Profile form data
  const [formData, setFormData] = useState(loadCachedFormData);

  // Photo files
  const [photo1File, setPhoto1File] = useState<File | null>(null);
  const [photo2File, setPhoto2File] = useState<File | null>(null);

  // Simple validation state - just track which fields are invalid
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  // Check if a field should have red border
  const hasRedBorder = (fieldName: string) => {
    return submitted && invalidFields.has(fieldName);
  };

  // Get CSS classes for form fields
  const getFieldClasses = (fieldName: string, baseClasses: string = "") => {
    if (hasRedBorder(fieldName)) {
      return `${baseClasses} border border-red-500`.trim();
    }
    return baseClasses;
  };

  // Photo cache handling
  const savePhotoToCache = (photoNumber: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const photoData = {
          name: file.name,
          type: file.type,
          data: reader.result as string,
          lastModified: file.lastModified
        };
        localStorage.setItem(`contest_photo_${photoNumber}_cache`, JSON.stringify(photoData));
      } catch (error) {
        console.warn('Failed to cache photo:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const loadPhotoFromCache = (photoNumber: number): File | null => {
    try {
      const cached = localStorage.getItem(`contest_photo_${photoNumber}_cache`);
      if (cached) {
        const photoData = JSON.parse(cached);
        // Convert base64 back to File
        const byteCharacters = atob(photoData.data.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new File([byteArray], photoData.name, { type: photoData.type, lastModified: photoData.lastModified });
      }
    } catch (error) {
      console.warn('Failed to load cached photo:', error);
    }
    return null;
  };

  // Photo upload handlers
  const handlePhoto1Upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhoto1File(file);
      savePhotoToCache(1, file);
      // Remove from invalid fields when photo is uploaded
      if (invalidFields.has('photo1')) {
        setInvalidFields(prev => {
          const newSet = new Set(prev);
          newSet.delete('photo1');
          return newSet;
        });
      }
    }
  };

  const handlePhoto2Upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhoto2File(file);
      savePhotoToCache(2, file);
      // Remove from invalid fields when photo is uploaded
      if (invalidFields.has('photo2')) {
        setInvalidFields(prev => {
          const newSet = new Set(prev);
          newSet.delete('photo2');
          return newSet;
        });
      }
    }
  };

  // Countries and states data
  const countries = Country.getAllCountries().map(country => ({
    value: country.isoCode,
    label: country.name
  }));

  const states = useMemo(() => {
    if (!formData.countryCode) return [];
    return State.getStatesOfCountry(formData.countryCode).map(state => ({
      value: state.isoCode,
      label: state.name
    }));
  }, [formData.countryCode]);

  const cities = useMemo(() => {
    if (!formData.countryCode) return [];
    return getCitiesForLocation(formData.countryCode, formData.stateCode).map(city => ({
      value: city,
      label: city
    }));
  }, [formData.countryCode, formData.stateCode]);

  // Auth handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({
          title: "Success",
          description: "Please check your email to confirm your account."
        });
      }
      setCurrentStep('profile');
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload photo to Supabase storage
  const uploadPhoto = async (file: File, photoNumber: number): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Create file path with user folder structure for RLS to work
    const fileName = `${session.user.id}/photo${photoNumber}-${Date.now()}.${file.name.split('.').pop()}`;
    
    const { error: uploadError } = await supabase.storage
      .from('contest-photos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('contest-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  // Profile form submission with validation
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // Validate all required fields
    const newInvalidFields = new Set<string>();

    // Check each required field
    if (!formData.first_name.trim()) newInvalidFields.add('first_name');
    if (!formData.last_name.trim()) newInvalidFields.add('last_name');
    if (!formData.countryCode) newInvalidFields.add('country');
    if (formData.countryCode && !formData.stateCode) newInvalidFields.add('state');
    if (formData.stateCode && !formData.city.trim()) newInvalidFields.add('city');
    if (!formData.gender) newInvalidFields.add('gender');
    if (!formData.birth_day) newInvalidFields.add('birth_day');
    if (!formData.birth_month) newInvalidFields.add('birth_month');
    if (!formData.birth_year) newInvalidFields.add('birth_year');
    if (!formData.marital_status) newInvalidFields.add('marital_status');
    if (formData.has_children === undefined) newInvalidFields.add('has_children');
    if (!formData.height_cm) newInvalidFields.add('height_cm');
    if (!formData.weight_kg) newInvalidFields.add('weight_kg');
    if (!photo1File) newInvalidFields.add('photo1');
    if (!photo2File) newInvalidFields.add('photo2');

    setInvalidFields(newInvalidFields);

    // If there are validation errors, stop here
    if (newInvalidFields.size > 0) {
      return;
    }

    // All fields are valid, proceed with submission
    setIsLoading(true);

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

      // Save application to database
      const applicationData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        country: formData.countryCode,
        state: formData.stateCode,
        city: formData.city,
        gender: formData.gender,
        birth_day: parseInt(formData.birth_day),
        birth_month: parseInt(formData.birth_month),
        birth_year: parseInt(formData.birth_year),
        marital_status: formData.marital_status,
        has_children: formData.has_children,
        height_cm: parseInt(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg),
        photo1_url: photo1Url,
        photo2_url: photo2Url,
      };

      // Insert into contest_applications table
      const { error: dbError } = await supabase
        .from('contest_applications')
        .insert({
          user_id: session.user.id,
          application_data: applicationData,
          status: 'pending'
        });

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Update user profile to mark as contest participant and add all form data
      const profileUpdateData = {
        is_contest_participant: true,
        participant_type: 'candidate',
        first_name: formData.first_name,
        last_name: formData.last_name,
        gender: formData.gender,
        height_cm: parseInt(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg),
        marital_status: formData.marital_status,
        has_children: formData.has_children,
        photo_1_url: photo1Url,
        photo_2_url: photo2Url,
        birthdate: `${formData.birth_year}-${formData.birth_month.padStart(2, '0')}-${formData.birth_day.padStart(2, '0')}`,
        country: Country.getAllCountries().find(c => c.isoCode === formData.countryCode)?.name || formData.countryCode,
        state: formData.stateCode,
        city: formData.city
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', session.user.id);

      if (profileError) {
        console.warn('Failed to update profile:', profileError);
      }

      toast({
        title: "Success!",
        description: "Your contest application has been submitted successfully."
      });

      // Clear cache after successful submission
      clearFormCache();
      
      setIsOpen(false);
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setInvalidFields(new Set());
      
      // Load cached photos
      const cachedPhoto1 = loadPhotoFromCache(1);
      const cachedPhoto2 = loadPhotoFromCache(2);
      if (cachedPhoto1) setPhoto1File(cachedPhoto1);
      if (cachedPhoto2) setPhoto2File(cachedPhoto2);
      
      const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentStep('profile');
        } else {
          setCurrentStep('auth');
        }
      };
      checkAuth();
    }
  }, [isOpen]);

  // Save form data to cache
  const saveFormDataToCache = (data: typeof formData) => {
    try {
      localStorage.setItem(FORM_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save form data to cache:', error);
    }
  };

  // Clear cache
  const clearFormCache = () => {
    try {
      localStorage.removeItem(FORM_CACHE_KEY);
      localStorage.removeItem('contest_photo_1_cache');
      localStorage.removeItem('contest_photo_2_cache');
    } catch (error) {
      console.warn('Failed to clear form cache:', error);
    }
  };

  // Clear field from invalid set when user starts typing
  const handleFieldChange = (fieldName: string, value: any) => {
    const newFormData = { ...formData, [fieldName]: value };
    setFormData(newFormData);
    
    // Save to cache whenever data changes
    saveFormDataToCache(newFormData);
    
    // Remove field from invalid set when user types
    if (invalidFields.has(fieldName)) {
      setInvalidFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldName);
        return newSet;
      });
    }
  };

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
            <div className="grid gap-2 grid-cols-3">
              <Input
                id="first_name"
                placeholder="First name"
                className={getFieldClasses('first_name', "text-sm placeholder:text-muted-foreground")}
                value={formData.first_name}
                onChange={(e) => handleFieldChange('first_name', e.target.value)}
              />
              <Input
                id="last_name"
                placeholder="Last name"
                className={getFieldClasses('last_name', "text-sm placeholder:text-muted-foreground")}
                value={formData.last_name}
                onChange={(e) => handleFieldChange('last_name', e.target.value)}
              />
              <Select 
                value={formData.gender} 
                onValueChange={(value) => handleFieldChange('gender', value)}
              >
                <SelectTrigger className={getFieldClasses('gender', "text-sm")}>
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 grid-cols-3">
              <SearchableSelect
                options={countries}
                value={formData.countryCode}
                onValueChange={(value) => {
                  handleFieldChange('country', value);
                  setFormData(prev => ({ ...prev, countryCode: value, stateCode: "", city: "" }));
                }}
                placeholder="Country"
                invalid={hasRedBorder('country')}
              />
              <SearchableSelect
                options={states}
                value={formData.stateCode}
                onValueChange={(value) => {
                  handleFieldChange('state', value);
                  setFormData(prev => ({ ...prev, stateCode: value, city: "" }));
                }}
                placeholder="State/Region"
                disabled={!formData.countryCode}
                invalid={hasRedBorder('state')}
              />
              <SearchableSelect
                options={cities}
                value={formData.city}
                onValueChange={(value) => handleFieldChange('city', value)}
                placeholder="Enter city name"
                disabled={!formData.stateCode}
                invalid={hasRedBorder('city')}
              />
            </div>

            <div className="grid gap-2 grid-cols-3">
              <Select 
                value={formData.birth_day} 
                onValueChange={(value) => handleFieldChange('birth_day', value)}
              >
                <SelectTrigger className={getFieldClasses('birth_day', "text-sm")}>
                  <SelectValue placeholder="Day of birth" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                value={formData.birth_month} 
                onValueChange={(value) => handleFieldChange('birth_month', value)}
              >
                <SelectTrigger className={getFieldClasses('birth_month', "text-sm")}>
                  <SelectValue placeholder="Month of birth" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                value={formData.birth_year} 
                onValueChange={(value) => handleFieldChange('birth_year', value)}
              >
                <SelectTrigger className={getFieldClasses('birth_year', "text-sm")}>
                  <SelectValue placeholder="Year of birth" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 60 }, (_, i) => {
                    const year = new Date().getFullYear() - 18 - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 grid-cols-2">
              <Select 
                value={formData.marital_status} 
                onValueChange={(value) => handleFieldChange('marital_status', value)}
              >
                <SelectTrigger className={getFieldClasses('marital_status', "text-sm")}>
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
                value={formData.has_children?.toString()} 
                onValueChange={(value) => handleFieldChange('has_children', value === 'true')}
              >
                <SelectTrigger className={getFieldClasses('has_children', "text-sm")}>
                  <SelectValue placeholder="Do you have children?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 grid-cols-3">
              <Select 
                value={formData.measurement_system} 
                onValueChange={(value) => handleFieldChange('measurement_system', value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric (cm, kg)</SelectItem>
                  <SelectItem value="imperial">Imperial (ft, lbs)</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={formData.height_cm} 
                onValueChange={(value) => handleFieldChange('height_cm', value)}
              >
                <SelectTrigger className={getFieldClasses('height_cm', "text-sm")}>
                  <SelectValue placeholder="Height (cm)" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 51 }, (_, i) => {
                    const height = 140 + i;
                    return (
                      <SelectItem key={height} value={height.toString()}>
                        {height} cm
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Select 
                value={formData.weight_kg} 
                onValueChange={(value) => handleFieldChange('weight_kg', value)}
              >
                <SelectTrigger className={getFieldClasses('weight_kg', "text-sm")}>
                  <SelectValue placeholder="Weight (kg)" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 111 }, (_, i) => {
                    const weight = 40 + i;
                    return (
                      <SelectItem key={weight} value={weight.toString()}>
                        {weight} kg
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex flex-row gap-4 items-start justify-between">
                {/* Left text column */}
                <div className="flex flex-col justify-center items-start space-y-2 text-sm text-muted-foreground flex-shrink-0 mt-2">
                  <span className="font-bold">Upload Photos</span>
                  <span className="text-red-600">no makeup</span>
                  <span className="text-red-600">no filters</span>
                  <span className="text-red-600">no nudes</span>
                  <span className="text-red-600">no color correction</span>
                </div>

                {/* Right photo upload areas */}
                <div className="flex flex-row gap-4 items-start">
                  {/* Portrait Photo */}
                  <div className="relative w-32 md:w-40">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhoto1Upload}
                      className="hidden"
                      id="photo1-upload"
                    />
                    <label htmlFor="photo1-upload" className="cursor-pointer block">
                      {photo1File ? (
                        <div className="p-2 relative">
                          <img
                            src={URL.createObjectURL(photo1File)}
                            alt="Portrait photo preview"
                            className="w-full h-32 md:h-40 object-contain rounded bg-white"
                          />
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPhoto1File(null);
                              handleFieldChange('photo1', null);
                            }}
                            className="absolute top-1 right-1 w-6 h-6 bg-gray-500 hover:bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold transition-colors shadow-md"
                          >
                            ×
                          </button>
                          <div className="mt-2 text-center">
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                document.getElementById('photo1-upload')?.click();
                              }}
                              className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 transition-colors"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 text-center">
                          <div className={`h-32 md:h-40 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden aspect-[4/5] border-2 border-dashed cursor-pointer hover:border-primary transition-colors ${hasRedBorder('photo1') ? 'border-red-500' : 'border-muted-foreground/25'}`}>
                            <img 
                              src="/lovable-uploads/1147be30-a1d2-466f-a9a8-067f4628cbb2.png" 
                              alt="Portrait placeholder" 
                              className="absolute inset-0 w-full h-full object-cover opacity-40 filter grayscale brightness-75"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">portrait photo</p>
                          
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              document.getElementById('photo1-upload')?.click();
                            }}
                            className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 transition-colors"
                          >
                            Upload
                          </button>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Full Length Photo */}
                  <div className="relative w-32 md:w-40">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhoto2Upload}
                      className="hidden"
                      id="photo2-upload"
                    />
                    <label htmlFor="photo2-upload" className="cursor-pointer block">
                      {photo2File ? (
                        <div className="p-2 relative">
                          <img
                            src={URL.createObjectURL(photo2File)}
                            alt="Full length photo preview"
                            className="w-full h-32 md:h-40 object-contain rounded bg-white"
                          />
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPhoto2File(null);
                              handleFieldChange('photo2', null);
                            }}
                            className="absolute top-1 right-1 w-6 h-6 bg-gray-500 hover:bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold transition-colors shadow-md"
                          >
                            ×
                          </button>
                          <div className="mt-2 text-center">
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                document.getElementById('photo2-upload')?.click();
                              }}
                              className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 transition-colors"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                       ) : (
                        <div className="p-2 text-center">
                          <div className={`h-32 md:h-40 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden aspect-[4/5] border-2 border-dashed cursor-pointer hover:border-primary transition-colors ${hasRedBorder('photo2') ? 'border-red-500' : 'border-muted-foreground/25'}`}>
                            <img 
                              src="/lovable-uploads/009d20f0-cac7-4c08-9bc9-146617664bc3.png" 
                              alt="Full body placeholder" 
                              className="absolute inset-0 w-full h-full object-contain opacity-50 filter grayscale brightness-50"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">full length photo</p>
                          
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              document.getElementById('photo2-upload')?.click();
                            }}
                            className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 transition-colors"
                          >
                            Upload
                          </button>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit application"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};