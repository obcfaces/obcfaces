import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SearchableSelect from "@/components/ui/searchable-select";
import countries from "world-countries";
import { getCitiesForLocation } from "@/lib/location-utils";

interface ContestParticipationModalProps {
  children: React.ReactNode;
}

export const ContestParticipationModal = ({ children }: ContestParticipationModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'auth' | 'profile'>('auth');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Auth form data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Profile form data
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    country: "",
    state: "",
    city: "",
    gender: "",
    birthdate: "",
    marital_status: "",
    has_children: false,
    height_cm: "",
    weight_kg: "",
  });

  const [photo1File, setPhoto1File] = useState<File | null>(null);
  const [photo2File, setPhoto2File] = useState<File | null>(null);

  // Location data
  const countryOptions = countries.map(country => ({
    name: country.name.common,
    isoCode: country.cca2
  })).sort((a, b) => a.name.localeCompare(b.name));

  const selectedCountry = countryOptions.find(c => c.isoCode === formData.country);
  const cities = getCitiesForLocation(formData.country, formData.state, selectedCountry?.name);

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
            state: profile.state || "",
            city: profile.city || "",
            gender: profile.gender || "",
            birthdate: profile.birthdate || "",
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
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            title: "Ошибка входа",
            description: error.message,
            variant: "destructive",
          });
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
          toast({
            title: "Ошибка регистрации",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Регистрация успешна",
          description: "Проверьте почту для подтверждения",
        });
      }
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
          birthdate: formData.birthdate,
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'auth' ? 'Вход в систему' : 'Форма участия в конкурсе'}
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'auth' ? (
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              >
                {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Имя *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Фамилия *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Страна *</Label>
              <SearchableSelect
                placeholder="Выберите страну"
                options={countryOptions.map(c => ({ value: c.isoCode, label: c.name }))}
                value={formData.country}
                onValueChange={(value) => setFormData({...formData, country: value, state: "", city: ""})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">Штат/Область</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Город</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Пол *</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите пол" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Мужской</SelectItem>
                    <SelectItem value="female">Женский</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthdate">Дата рождения *</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marital_status">Семейное положение</Label>
              <Select value={formData.marital_status} onValueChange={(value) => setFormData({...formData, marital_status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите семейное положение" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Холост/Не замужем</SelectItem>
                  <SelectItem value="married">Женат/Замужем</SelectItem>
                  <SelectItem value="divorced">Разведен(а)</SelectItem>
                  <SelectItem value="widowed">Вдовец/Вдова</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Есть ли дети?</Label>
              <Select value={formData.has_children.toString()} onValueChange={(value) => setFormData({...formData, has_children: value === 'true'})}>
                <SelectTrigger>
                  <SelectValue placeholder="Есть ли дети?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Нет</SelectItem>
                  <SelectItem value="true">Да</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Рост (см)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height_cm}
                  onChange={(e) => setFormData({...formData, height_cm: e.target.value})}
                  placeholder="170"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Вес (кг)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
                  placeholder="65.5"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Фотографии (обязательно 2 фото)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="photo1">Фото 1 *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
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
                        <p className="text-sm text-gray-500">Нажмите для выбора</p>
                      )}
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo2">Фото 2 *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
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
                        <p className="text-sm text-gray-500">Нажмите для выбора</p>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !photo1File || !photo2File}>
              Отправить заявку на участие
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};