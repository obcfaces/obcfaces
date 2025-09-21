import { useState, useEffect, useMemo } from "react";
import { Country, State } from 'country-state-city';
import HeightDropdownOneScrollPick from "@/components/ui/height-filter-dropdown";
import WeightFilterDropdown from "@/components/ui/weight-filter-dropdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Phone, Facebook } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SearchableSelect from "@/components/ui/searchable-select";
import { getCitiesForLocation } from '@/lib/location-utils';

interface AdminEditApplicationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string | null;
  applicationData?: any;
  onSave?: () => void;
}

export const AdminEditApplicationModal = ({
  isOpen,
  onOpenChange,
  applicationId,
  applicationData,
  onSave
}: AdminEditApplicationModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  // Load form data from existing application
  const loadApplicationData = () => {
    if (!applicationData) return {
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
      photo1_url: null,
      photo2_url: null,
      phone: "",
      facebook_url: "",
    };

    let appData = applicationData;
    if (applicationData.application_data) {
      appData = { ...applicationData, ...applicationData.application_data };
    }

    // Handle birthdate from multiple possible sources
    let birthdate = null;
    if (appData.birthdate) {
      birthdate = new Date(appData.birthdate);
    } else if (appData.birth_year && appData.birth_month && appData.birth_day) {
      birthdate = new Date(appData.birth_year, appData.birth_month - 1, appData.birth_day);
    }

    return {
      first_name: appData.first_name || "",
      last_name: appData.last_name || "",
      country: appData.country || "",
      countryCode: appData.country || "",
      state: appData.state || "",
      stateCode: appData.state || "",
      city: appData.city || "",
      gender: appData.gender || "",
      birth_day: birthdate ? birthdate.getDate().toString() : (appData.birth_day?.toString() || ""),
      birth_month: birthdate ? (birthdate.getMonth() + 1).toString() : (appData.birth_month?.toString() || ""),
      birth_year: birthdate ? birthdate.getFullYear().toString() : (appData.birth_year?.toString() || ""),
      marital_status: appData.marital_status || "",
      has_children: appData.has_children as boolean | undefined,
      height_cm: appData.height_cm ? appData.height_cm.toString() : "",
      weight_kg: appData.weight_kg ? appData.weight_kg.toString() : "",
      photo1_url: appData.photo1_url || appData.photo_1_url || null,
      photo2_url: appData.photo2_url || appData.photo_2_url || null,
      phone: appData.phone?.number || "",
      facebook_url: appData.facebook_url || "",
    };
  };

  const [formData, setFormData] = useState(loadApplicationData);

  // Update form data when application data changes
  useEffect(() => {
    if (applicationData) {
      setFormData(loadApplicationData());
    }
  }, [applicationData]);

  // Photo files
  const [photo1File, setPhoto1File] = useState<File | null>(null);
  const [photo2File, setPhoto2File] = useState<File | null>(null);

  // Validation state
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  const hasRedBorder = (fieldName: string) => {
    return submitted && invalidFields.has(fieldName);
  };

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
      if (invalidFields.has('photo2')) {
        setInvalidFields(prev => {
          const newSet = new Set(prev);
          newSet.delete('photo2');
          return newSet;
        });
      }
    }
  };

  // Get all countries
  const countries = useMemo(() => {
    const allCountries = Country.getAllCountries().map(country => ({
      value: country.isoCode,
      label: country.name
    }));
    
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
  }, [formData.countryCode, formData.stateCode, states]);

  // Upload photo to Supabase storage
  const uploadPhoto = async (file: File, fileName: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${fileName}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('contest-photos')
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('contest-photos')
        .getPublicUrl(uniqueFileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  // Validation
  const validateForm = () => {
    const errors = new Set<string>();

    if (!formData.first_name.trim()) errors.add('first_name');
    if (!formData.last_name.trim()) errors.add('last_name');
    if (!formData.countryCode) errors.add('country');
    if (!formData.city.trim()) errors.add('city');
    if (!formData.gender) errors.add('gender');
    if (!formData.birth_day || !formData.birth_month || !formData.birth_year) errors.add('birthdate');
    if (!formData.marital_status) errors.add('marital_status');
    if (formData.has_children === undefined) errors.add('has_children');
    if (!formData.height_cm) errors.add('height');
    if (!formData.weight_kg) errors.add('weight');
    
    // Check if we have existing photos or new uploads
    const hasPhoto1 = photo1File || formData.photo1_url;
    const hasPhoto2 = photo2File || formData.photo2_url;
    
    if (!hasPhoto1) errors.add('photo1');
    if (!hasPhoto2) errors.add('photo2');

    setInvalidFields(errors);
    return errors.size === 0;
  };

  // Save form
  const handleSave = async () => {
    setSubmitted(true);
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!applicationId) {
      toast({
        title: "Error",
        description: "No application ID provided",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Upload new photos if provided
      let photo1Url = formData.photo1_url;
      let photo2Url = formData.photo2_url;

      if (photo1File) {
        const uploadedUrl1 = await uploadPhoto(photo1File, `admin_edit_photo1_${applicationId}`);
        if (uploadedUrl1) photo1Url = uploadedUrl1;
      }

      if (photo2File) {
        const uploadedUrl2 = await uploadPhoto(photo2File, `admin_edit_photo2_${applicationId}`);
        if (uploadedUrl2) photo2Url = uploadedUrl2;
      }

      // Build application data
      const applicationDataToSave = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        country: formData.countryCode,
        state: formData.stateCode,
        city: formData.city.trim(),
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
        photo_1_url: photo1Url, // For compatibility
        photo_2_url: photo2Url, // For compatibility
        ...(formData.phone && {
          phone: {
            number: formData.phone,
            country_code: formData.countryCode
          }
        }),
        ...(formData.facebook_url && { facebook_url: formData.facebook_url }),
        admin_edited: true,
        admin_edited_at: new Date().toISOString()
      };

      // Update the application
      const { error } = await supabase
        .from('contest_applications')
        .update({
          application_data: applicationDataToSave,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application updated successfully"
      });

      onSave?.();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error saving application:', error);
      toast({
        title: "Error",
        description: `Failed to save application: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Application - Admin</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className={getFieldClasses('first_name')}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className={getFieldClasses('last_name')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="birth_day">Birth Day *</Label>
                  <Select value={formData.birth_day} onValueChange={(value) => setFormData({...formData, birth_day: value})}>
                    <SelectTrigger className={getFieldClasses('birthdate')}>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 31}, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="birth_month">Birth Month *</Label>
                  <Select value={formData.birth_month} onValueChange={(value) => setFormData({...formData, birth_month: value})}>
                    <SelectTrigger className={getFieldClasses('birthdate')}>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="birth_year">Birth Year *</Label>
                  <Select value={formData.birth_year} onValueChange={(value) => setFormData({...formData, birth_year: value})}>
                    <SelectTrigger className={getFieldClasses('birthdate')}>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 50}, (_, i) => {
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

              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                  <SelectTrigger className={getFieldClasses('gender')}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Location</h3>
              
              <div>
                <Label htmlFor="country">Country *</Label>
                <SearchableSelect
                  options={countries}
                  value={formData.countryCode}
                  onValueChange={(value) => setFormData({...formData, countryCode: value, country: value, stateCode: "", city: ""})}
                  placeholder="Select country"
                  invalid={hasRedBorder('country')}
                />
              </div>

              {states.length > 0 && (
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <SearchableSelect
                    options={states}
                    value={formData.stateCode}
                    onValueChange={(value) => setFormData({...formData, stateCode: value, state: value, city: ""})}
                    placeholder="Select state/province"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="city">City *</Label>
                <SearchableSelect
                  options={cities}
                  value={formData.city}
                  onValueChange={(value) => setFormData({...formData, city: value})}
                  placeholder="Select or type city"
                  allowCustom={true}
                  invalid={hasRedBorder('city')}
                />
              </div>
            </div>

            {/* Family Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Family Status</h3>
              
              <div>
                <Label htmlFor="marital_status">Marital Status *</Label>
                <Select value={formData.marital_status} onValueChange={(value) => setFormData({...formData, marital_status: value})}>
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

              <div>
                <Label htmlFor="has_children">Do you have children? *</Label>
                <Select 
                  value={formData.has_children === undefined ? "" : formData.has_children.toString()} 
                  onValueChange={(value) => setFormData({...formData, has_children: value === "true"})}
                >
                  <SelectTrigger className={getFieldClasses('has_children')}>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Physical Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Physical Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height *</Label>
                  <HeightDropdownOneScrollPick
                    value={formData.height_cm ? `${formData.height_cm} cm` : undefined}
                    className={getFieldClasses('height')}
                    onSelect={(value) => {
                      if (value.system === "cm") {
                        const cm = value.label.replace(' cm', '');
                        setFormData({...formData, height_cm: cm});
                      } else {
                        const ftIn = value.label;
                        const [feet, inches] = ftIn.replace('"', '').split("'").map(Number);
                        const totalInches = feet * 12 + inches;
                        const cm = Math.round(totalInches * 2.54);
                        setFormData({...formData, height_cm: cm.toString()});
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight *</Label>
                  <WeightFilterDropdown
                    value={formData.weight_kg ? `${formData.weight_kg} kg` : undefined}
                    className={getFieldClasses('weight')}
                    onSelect={(value) => {
                      if (value.system === "kg") {
                        const kg = value.label.replace(' kg', '');
                        setFormData({...formData, weight_kg: kg});
                      } else {
                        const lbs = parseFloat(value.label.replace(' lbs', ''));
                        const kg = Math.round(lbs / 2.205);
                        setFormData({...formData, weight_kg: kg.toString()});
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="facebook_url">Facebook Profile URL</Label>
                <div className="flex items-center space-x-2">
                  <Facebook className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="facebook_url"
                    value={formData.facebook_url}
                    onChange={(e) => setFormData({...formData, facebook_url: e.target.value})}
                    placeholder="https://facebook.com/yourprofile"
                  />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Photos *</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Face Photo (ID Style) *</Label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${hasRedBorder('photo1') ? 'border-red-500' : 'border-gray-300'}`}>
                    {formData.photo1_url && !photo1File && (
                      <img src={formData.photo1_url} alt="Current photo 1" className="w-full h-32 object-cover rounded mb-2" />
                    )}
                    {photo1File && (
                      <img src={URL.createObjectURL(photo1File)} alt="New photo 1" className="w-full h-32 object-cover rounded mb-2" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhoto1Upload}
                      className="hidden"
                      id="photo1-upload"
                    />
                    <label htmlFor="photo1-upload" className="cursor-pointer flex flex-col items-center">
                      <Camera className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {photo1File || formData.photo1_url ? 'Change Photo' : 'Upload Photo'}
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label>Full Body Photo *</Label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${hasRedBorder('photo2') ? 'border-red-500' : 'border-gray-300'}`}>
                    {formData.photo2_url && !photo2File && (
                      <img src={formData.photo2_url} alt="Current photo 2" className="w-full h-32 object-cover rounded mb-2" />
                    )}
                    {photo2File && (
                      <img src={URL.createObjectURL(photo2File)} alt="New photo 2" className="w-full h-32 object-cover rounded mb-2" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhoto2Upload}
                      className="hidden"
                      id="photo2-upload"
                    />
                    <label htmlFor="photo2-upload" className="cursor-pointer flex flex-col items-center">
                      <Camera className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {photo2File || formData.photo2_url ? 'Change Photo' : 'Upload Photo'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};