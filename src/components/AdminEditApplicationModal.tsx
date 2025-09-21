import { useState, useEffect, useMemo } from "react";
import { Country, State } from 'country-state-city';
import HeightDropdownOneScrollPick from "@/components/ui/height-filter-dropdown";
import WeightFilterDropdown from "@/components/ui/weight-filter-dropdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Phone, Mail, Facebook, Instagram } from "lucide-react";
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
      height_ft: "",
      weight_kg: "",
      measurement_system: "metric",
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
      height_ft: "",
      weight_kg: appData.weight_kg ? appData.weight_kg.toString() : "",
      measurement_system: "metric",
    };
  };

  const [formData, setFormData] = useState(loadApplicationData);
  
  // Track selected height and weight display formats
  const [selectedHeight, setSelectedHeight] = useState<string>("");
  const [selectedWeight, setSelectedWeight] = useState<string>("");

  // Contact form state
  const [selectedContactMethod, setSelectedContactMethod] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    contact: "",
    message: "",
    countryCode: "",
    facebookUrl: ""
  });

  // Update form data when application data changes
  useEffect(() => {
    if (applicationData) {
      const newFormData = loadApplicationData();
      setFormData(newFormData);
      
      // Set selected height/weight display
      if (newFormData.height_cm) {
        setSelectedHeight(`${newFormData.height_cm} cm`);
      }
      if (newFormData.weight_kg) {
        setSelectedWeight(`${newFormData.weight_kg} kg`);
      }

      // Load contact data
      let appData = applicationData;
      if (applicationData.application_data) {
        appData = { ...applicationData, ...applicationData.application_data };
      }
      
      if (appData.phone || appData.facebook_url) {
        setContactForm({
          name: `${appData.first_name || ''} ${appData.last_name || ''}`.trim(),
          contact: appData.phone?.number || '',
          message: '',
          countryCode: appData.phone?.country_code || appData.country || '',
          facebookUrl: appData.facebook_url || ''
        });
        
        if (appData.phone?.number) {
          setSelectedContactMethod('phone');
        } else if (appData.facebook_url) {
          setSelectedContactMethod('facebook');
        }
      }
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

  // Field change handler
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Remove from invalid fields when user starts typing
    if (invalidFields.has(field)) {
      setInvalidFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }
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
    if (!formData.birth_day || !formData.birth_month || !formData.birth_year) {
      errors.add('birth_day');
      errors.add('birth_month'); 
      errors.add('birth_year');
    }
    if (!formData.marital_status) errors.add('marital_status');
    if (formData.has_children === undefined) errors.add('has_children');
    if (!formData.height_cm) errors.add('height_cm');
    if (!formData.weight_kg) errors.add('weight_kg');
    
    // Check if we have existing photos or new uploads
    const currentAppData = applicationData?.application_data || applicationData || {};
    const hasPhoto1 = photo1File || currentAppData.photo1_url || currentAppData.photo_1_url;
    const hasPhoto2 = photo2File || currentAppData.photo2_url || currentAppData.photo_2_url;
    
    if (!hasPhoto1) errors.add('photo1');
    if (!hasPhoto2) errors.add('photo2');

    setInvalidFields(errors);
    return errors.size === 0;
  };

  // Save form
  const handleSubmit = async () => {
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
      const currentAppData = applicationData?.application_data || applicationData || {};
      let photo1Url = currentAppData.photo1_url || currentAppData.photo_1_url;
      let photo2Url = currentAppData.photo2_url || currentAppData.photo_2_url;

      if (photo1File) {
        const uploadedUrl1 = await uploadPhoto(photo1File, `admin_edit_photo1_${applicationId}`);
        if (uploadedUrl1) photo1Url = uploadedUrl1;
      }

      if (photo2File) {
        const uploadedUrl2 = await uploadPhoto(photo2File, `admin_edit_photo2_${applicationId}`);
        if (uploadedUrl2) photo2Url = uploadedUrl2;
      }

      // Build application data exactly like the original form
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
        // Add contact data if provided
        ...(selectedContactMethod === 'phone' && contactForm.contact && {
          phone: {
            number: contactForm.contact,
            country_code: contactForm.countryCode
          }
        }),
        ...(selectedContactMethod === 'facebook' && contactForm.facebookUrl && { 
          facebook_url: contactForm.facebookUrl 
        }),
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

      // Also update weekly_contest_participants if this user is in current contest
      const { error: weeklyError } = await supabase
        .from('weekly_contest_participants')
        .update({
          application_data: applicationDataToSave
        })
        .eq('user_id', applicationData?.user_id);

      if (weeklyError) {
        console.warn('Could not update weekly contest participant data:', weeklyError);
      }

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

  // Get current photo URLs
  const getCurrentPhoto1Url = () => {
    if (photo1File) return URL.createObjectURL(photo1File);
    const currentAppData = applicationData?.application_data || applicationData || {};
    return currentAppData.photo1_url || currentAppData.photo_1_url;
  };

  const getCurrentPhoto2Url = () => {
    if (photo2File) return URL.createObjectURL(photo2File);
    const currentAppData = applicationData?.application_data || applicationData || {};
    return currentAppData.photo2_url || currentAppData.photo_2_url;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-center">Edit Application - Admin</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh] px-6">
          <div className="space-y-4 pb-6">
            {/* Name fields */}
            <div className="grid gap-2 grid-cols-2">
              <Input
                placeholder="First name"
                value={formData.first_name}
                onChange={(e) => handleFieldChange('first_name', e.target.value)}
                className={getFieldClasses('first_name', "text-sm")}
              />
              <Input
                placeholder="Last name"
                value={formData.last_name}
                onChange={(e) => handleFieldChange('last_name', e.target.value)}
                className={getFieldClasses('last_name', "text-sm")}
              />
            </div>

            {/* Gender */}
            <Select 
              value={formData.gender} 
              onValueChange={(value) => handleFieldChange('gender', value)}
            >
              <SelectTrigger className={getFieldClasses('gender', "text-sm")}>
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
              </SelectContent>
            </Select>

            {/* Location */}
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
                placeholder="City"
                disabled={!formData.stateCode}
                invalid={hasRedBorder('city')}
                allowCustom={true}
                emptyMessage="No cities found. Type to add custom city."
              />
            </div>

            {/* Birth date */}
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

            {/* Marital status and children */}
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

            {/* Height and Weight */}
            <div className="grid gap-2 grid-cols-2">
              <HeightDropdownOneScrollPick 
                value={selectedHeight || undefined}
                className={getFieldClasses('height_cm', "")}
                onSelect={(value) => {
                  setSelectedHeight(value.label);
                  if (value.system === "cm") {
                    const cm = value.label.replace(' cm', '');
                    handleFieldChange('height_cm', cm);
                  } else {
                    const ftIn = value.label;
                    const [feet, inches] = ftIn.replace('"', '').split("'").map(Number);
                    const totalInches = feet * 12 + inches;
                    const cm = Math.round(totalInches * 2.54);
                    handleFieldChange('height_cm', cm.toString());
                  }
                }}
              />
              <WeightFilterDropdown 
                value={selectedWeight || undefined}
                className={getFieldClasses('weight_kg', "")}
                onSelect={(value) => {
                  setSelectedWeight(value.label);
                  if (value.system === "kg") {
                    const kg = value.label.replace(' kg', '');
                    handleFieldChange('weight_kg', kg);
                  } else {
                    const lbs = parseFloat(value.label.replace(' lbs', ''));
                    const kg = Math.round(lbs / 2.205);
                    handleFieldChange('weight_kg', kg.toString());
                  }
                }}
              />
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-center mb-2">Upload your photos</div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Photo 1 */}
                <div className="space-y-2">
                  <Label className="text-xs text-center block">Portrait photo</Label>
                  <div className={`relative border-2 border-dashed rounded-lg overflow-hidden aspect-[4/5] ${hasRedBorder('photo1') ? 'border-red-500' : 'border-gray-300'}`}>
                    {getCurrentPhoto1Url() ? (
                      <img 
                        src={getCurrentPhoto1Url()} 
                        alt="Photo 1" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Camera className="w-8 h-8 mb-2" />
                        <span className="text-xs">Upload</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhoto1Upload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Photo 2 */}
                <div className="space-y-2">
                  <Label className="text-xs text-center block">Body photo</Label>
                  <div className={`relative border-2 border-dashed rounded-lg overflow-hidden aspect-[4/5] ${hasRedBorder('photo2') ? 'border-red-500' : 'border-gray-300'}`}>
                    {getCurrentPhoto2Url() ? (
                      <img 
                        src={getCurrentPhoto2Url()} 
                        alt="Photo 2" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Camera className="w-8 h-8 mb-2" />
                        <span className="text-xs">Upload</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhoto2Upload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Method Selection */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-center">Contact method (optional)</div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={selectedContactMethod === 'phone' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedContactMethod(selectedContactMethod === 'phone' ? null : 'phone')}
                  className="text-xs"
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Phone
                </Button>
                <Button
                  type="button"
                  variant={selectedContactMethod === 'facebook' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedContactMethod(selectedContactMethod === 'facebook' ? null : 'facebook')}
                  className="text-xs"
                >
                  <Facebook className="w-3 h-3 mr-1" />
                  Facebook
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedContactMethod(null)}
                  className="text-xs"
                >
                  Skip
                </Button>
              </div>

              {/* Phone Contact Form */}
              {selectedContactMethod === 'phone' && (
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                  <div>
                    <Label htmlFor="contact_name" className="text-xs">Name</Label>
                    <Input
                      id="contact_name"
                      placeholder="Your name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone_number" className="text-xs">Phone Number</Label>
                    <Input
                      id="phone_number"
                      placeholder="Your phone number"
                      value={contactForm.contact}
                      onChange={(e) => setContactForm(prev => ({ ...prev, contact: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Facebook Contact Form */}
              {selectedContactMethod === 'facebook' && (
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                  <div>
                    <Label htmlFor="facebook_name" className="text-xs">Name</Label>
                    <Input
                      id="facebook_name"
                      placeholder="Your name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebook_url" className="text-xs">Facebook Profile URL</Label>
                    <Input
                      id="facebook_url"
                      placeholder="https://facebook.com/yourprofile"
                      value={contactForm.facebookUrl}
                      onChange={(e) => setContactForm(prev => ({ ...prev, facebookUrl: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-between p-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};