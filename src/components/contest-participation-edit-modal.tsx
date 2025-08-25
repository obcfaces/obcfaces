import { useState, useEffect, useMemo } from "react";
import { Country, State } from 'country-state-city';
import HeightDropdownOneScrollPick from "@/components/ui/height-filter-dropdown";
import WeightFilterDropdown from "@/components/ui/weight-filter-dropdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SearchableSelect from "@/components/ui/searchable-select";
import { getCitiesForLocation } from '@/lib/location-utils';

interface ContestParticipationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const ContestParticipationEditModal = ({ isOpen, onClose, userId }: ContestParticipationEditModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  // Profile form data with pre-filled values
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
    has_children: undefined as boolean | undefined,
    height_cm: "",
    weight_kg: "",
  });

  // Photo files
  const [photo1File, setPhoto1File] = useState<File | null>(null);
  const [photo2File, setPhoto2File] = useState<File | null>(null);
  
  // Current photo URLs for display
  const [currentPhoto1Url, setCurrentPhoto1Url] = useState<string>("");
  const [currentPhoto2Url, setCurrentPhoto2Url] = useState<string>("");

  // Simple validation state
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

  // Photo upload handlers
  const handlePhoto1Upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhoto1File(file);
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
      ...(philippines ? [philippines] : []),
      { value: "separator", label: "", disabled: true, divider: true },
      ...otherCountries
    ];
  }, []);

  const states = useMemo(() => {
    if (!formData.countryCode) return [];
    
    const countryStates = State.getStatesOfCountry(formData.countryCode);
    
    return countryStates.map(state => ({
      value: state.isoCode,
      label: state.name
    }));
  }, [formData.countryCode]);

  const cities = useMemo(() => {
    if (!formData.countryCode) return [];
    const cityList = getCitiesForLocation(formData.countryCode, formData.stateCode);
    return cityList
      .sort((a, b) => a.localeCompare(b))
      .map(city => ({
        value: city,
        label: city
      }));
  }, [formData.countryCode, formData.stateCode]);

  // Load existing data when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      loadExistingData();
    }
  }, [isOpen, userId]);

  const loadExistingData = async () => {
    if (!userId) return;

    try {
      // Load profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Load contest application data
      const { data: applicationData, error: applicationError } = await supabase
        .from('contest_applications')
        .select('application_data')
        .eq('user_id', userId)
        .single();

      if (applicationError && applicationError.code !== 'PGRST116') {
        throw applicationError;
      }

      const appData = applicationData?.application_data as any || {};
      
      // Parse birthdate
      const birthdate = profileData.birthdate ? new Date(profileData.birthdate) : null;
      
      // Pre-fill form with existing data
      setFormData({
        first_name: profileData.first_name || appData.first_name || "",
        last_name: profileData.last_name || appData.last_name || "",
        country: profileData.country || "",
        countryCode: appData.country || "",
        state: profileData.state || appData.state || "",
        stateCode: appData.state || "",
        city: profileData.city || appData.city || "",
        gender: profileData.gender || appData.gender || "",
        birth_day: birthdate ? birthdate.getDate().toString() : (appData.birth_day?.toString() || ""),
        birth_month: birthdate ? (birthdate.getMonth() + 1).toString() : (appData.birth_month?.toString() || ""),
        birth_year: birthdate ? birthdate.getFullYear().toString() : (appData.birth_year?.toString() || ""),
        marital_status: profileData.marital_status || appData.marital_status || "",
        has_children: profileData.has_children !== undefined ? profileData.has_children : appData.has_children,
        height_cm: profileData.height_cm?.toString() || appData.height_cm?.toString() || "",
        weight_kg: profileData.weight_kg?.toString() || appData.weight_kg?.toString() || "",
      });

      // Set current photo URLs
      setCurrentPhoto1Url(profileData.photo_1_url || appData.photo1_url || "");
      setCurrentPhoto2Url(profileData.photo_2_url || appData.photo2_url || "");
      
    } catch (error: any) {
      console.error('Error loading existing data:', error);
      toast({
        title: "Error",
        description: "Failed to load existing data",
        variant: "destructive"
      });
    }
  };

  // Upload photo to Supabase storage
  const uploadPhoto = async (file: File, photoNumber: number): Promise<string> => {
    if (!userId) throw new Error('User ID required');

    const fileName = `${userId}/photo${photoNumber}-${Date.now()}.${file.name.split('.').pop()}`;
    
    const { error: uploadError } = await supabase.storage
      .from('contest-photos')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('contest-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  // Handle field changes
  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Remove field from invalid set when user types
    if (invalidFields.has(field)) {
      setInvalidFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setSubmitted(true);

    // Validate required fields
    const newInvalidFields = new Set<string>();
    
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

    setInvalidFields(newInvalidFields);

    if (newInvalidFields.size > 0) {
      return;
    }

    setIsLoading(true);

    try {
      // Upload new photos if provided
      let photo1Url = currentPhoto1Url;
      let photo2Url = currentPhoto2Url;

      if (photo1File) {
        photo1Url = await uploadPhoto(photo1File, 1);
      }
      if (photo2File) {
        photo2Url = await uploadPhoto(photo2File, 2);
      }

      // Update application data
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

      // Update contest application
      const { error: applicationError } = await supabase
        .from('contest_applications')
        .update({
          application_data: applicationData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (applicationError) throw applicationError;

      // Update profile
      const profileUpdateData = {
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
        country: countries.find(c => c.value === formData.countryCode)?.label || formData.countryCode,
        state: formData.stateCode,
        city: formData.city
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId);

      if (profileError) {
        console.warn('Failed to update profile:', profileError);
      }

      toast({
        title: "Success!",
        description: "Your contest application has been updated successfully."
      });

      onClose();
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      setInvalidFields(new Set());
      setPhoto1File(null);
      setPhoto2File(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contest Application</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleFieldChange('first_name', e.target.value)}
                className={getFieldClasses('first_name')}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleFieldChange('last_name', e.target.value)}
                className={getFieldClasses('last_name')}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <div>
              <Label>Country *</Label>
              <SearchableSelect
                options={countries}
                value={formData.countryCode}
                onValueChange={(value) => {
                  handleFieldChange('countryCode', value);
                  handleFieldChange('stateCode', '');
                  handleFieldChange('city', '');
                }}
                placeholder="Select country"
              />
            </div>
            
            {formData.countryCode && (
              <div>
                <Label>State/Province *</Label>
                <SearchableSelect
                  options={states}
                  value={formData.stateCode}
                  onValueChange={(value) => {
                    handleFieldChange('stateCode', value);
                    handleFieldChange('city', '');
                  }}
                  placeholder="Select state/province"
                />
              </div>
            )}
            
            {formData.stateCode && (
              <div>
                <Label>City *</Label>
                <SearchableSelect
                  options={cities}
                  value={formData.city}
                  onValueChange={(value) => handleFieldChange('city', value)}
                  placeholder="Select city"
                />
              </div>
            )}
          </div>

          {/* Personal Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleFieldChange('gender', value)}>
                <SelectTrigger className={getFieldClasses('gender')}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Marital Status *</Label>
              <Select value={formData.marital_status} onValueChange={(value) => handleFieldChange('marital_status', value)}>
                <SelectTrigger className={getFieldClasses('marital_status')}>
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Birth Date */}
          <div>
            <Label>Birth Date *</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select value={formData.birth_day} onValueChange={(value) => handleFieldChange('birth_day', value)}>
                <SelectTrigger className={getFieldClasses('birth_day')}>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={formData.birth_month} onValueChange={(value) => handleFieldChange('birth_month', value)}>
                <SelectTrigger className={getFieldClasses('birth_month')}>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(0, i).toLocaleString('en', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={formData.birth_year} onValueChange={(value) => handleFieldChange('birth_year', value)}>
                <SelectTrigger className={getFieldClasses('birth_year')}>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 50 }, (_, i) => {
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
          </div>

          {/* Children */}
          <div>
            <Label>Do you have children? *</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="has_children"
                  checked={formData.has_children === true}
                  onChange={() => handleFieldChange('has_children', true)}
                />
                Yes
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="has_children"
                  checked={formData.has_children === false}
                  onChange={() => handleFieldChange('has_children', false)}
                />
                No
              </label>
            </div>
          </div>

          {/* Physical Measurements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Height *</Label>
              <HeightDropdownOneScrollPick
                value={formData.height_cm}
                onSelect={(data) => handleFieldChange('height_cm', data.label)}
              />
            </div>
            
            <div>
              <Label>Weight *</Label>
              <WeightFilterDropdown
                value={formData.weight_kg}
                onSelect={(data) => handleFieldChange('weight_kg', data.label)}
              />
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-4">
            <Label>Photos</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Portrait Photo</Label>
                {currentPhoto1Url && !photo1File && (
                  <img 
                    src={currentPhoto1Url} 
                    alt="Current portrait" 
                    className="w-full h-48 object-cover rounded border"
                  />
                )}
                {photo1File && (
                  <img 
                    src={URL.createObjectURL(photo1File)} 
                    alt="New portrait" 
                    className="w-full h-48 object-cover rounded border"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhoto1Upload}
                  className="cursor-pointer"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Full Length Photo</Label>
                {currentPhoto2Url && !photo2File && (
                  <img 
                    src={currentPhoto2Url} 
                    alt="Current full length" 
                    className="w-full h-48 object-cover rounded border"
                  />
                )}
                {photo2File && (
                  <img 
                    src={URL.createObjectURL(photo2File)} 
                    alt="New full length" 
                    className="w-full h-48 object-cover rounded border"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhoto2Upload}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};