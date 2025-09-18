import { useState, useEffect, useMemo } from "react";
import { Country, State } from 'country-state-city';
import HeightDropdownOneScrollPick from "@/components/ui/height-filter-dropdown";
import WeightFilterDropdown from "@/components/ui/weight-filter-dropdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Eye, EyeOff, Phone, Mail, Facebook, Instagram } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SearchableSelect from "@/components/ui/searchable-select";
import { getCitiesForLocation } from '@/lib/location-utils';
import testContestantFace from "@/assets/example-face-photo.jpg";
import testContestantFull from "@/assets/example-full-photo.jpg";

interface ContestParticipationModalProps {
  children?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  editMode?: boolean;
  existingData?: any;
}

export const ContestParticipationModal = ({ 
  children, 
  isOpen: controlledIsOpen, 
  onOpenChange: controlledOnOpenChange, 
  editMode = false, 
  existingData 
}: ContestParticipationModalProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledOnOpenChange || setInternalIsOpen;
  const [currentStep, setCurrentStep] = useState<'auth' | 'profile'>('auth');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [currentApplicationId, setCurrentApplicationId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string>("");
  const { toast } = useToast();

  // Contact form state
  const [selectedContactMethod, setSelectedContactMethod] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    contact: "",
    message: "",
    countryCode: "",
    facebookUrl: ""
  });

  // Facebook URL validation
  const validateFacebookUrl = (url: string) => {
    if (!url) return false;
    const facebookRegex = /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\/.+/i;
    return facebookRegex.test(url);
  };

  // Auth form data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Cache key for localStorage
  const FORM_CACHE_KEY = 'contest_form_cache';

  // Load cached form data or existing data for edit mode
  const loadCachedFormData = () => {
    // If in edit mode, prioritize existing data
    if (editMode && existingData) {
      console.log('Loading existing data for edit mode:', existingData);
      let applicationData = existingData;
      
      // If existingData has application_data, use it
      if (existingData.application_data) {
        applicationData = { ...existingData, ...existingData.application_data };
      }
      
      console.log('Processing application data:', applicationData);
      
      // Handle birthdate from multiple possible sources
      let birthdate = null;
      if (applicationData.birthdate) {
        birthdate = new Date(applicationData.birthdate);
      } else if (applicationData.birth_year && applicationData.birth_month && applicationData.birth_day) {
        birthdate = new Date(applicationData.birth_year, applicationData.birth_month - 1, applicationData.birth_day);
      }
      
      console.log('Parsed birthdate:', birthdate);

      // Load existing contact data for the contact form
      if (applicationData.phone || applicationData.facebook_url) {
        // Validate existing Facebook URL - only load if it's valid
        const existingFacebookUrl = applicationData.facebook_url || '';
        const validFacebookUrl = validateFacebookUrl(existingFacebookUrl) ? existingFacebookUrl : '';
        
        setContactForm({
          name: `${applicationData.first_name || ''} ${applicationData.last_name || ''}`.trim(),
          contact: applicationData.phone?.number || '',
          message: '',
          countryCode: applicationData.phone?.country_code || applicationData.country || '',
          facebookUrl: validFacebookUrl
        });
      }
      
      return {
        first_name: applicationData.first_name || "",
        last_name: applicationData.last_name || "",
        country: applicationData.country || "",
        countryCode: applicationData.country || "",
        state: applicationData.state || "",
        stateCode: applicationData.state || "",
        city: applicationData.city || "",
        gender: applicationData.gender || "",
        birth_day: birthdate ? birthdate.getDate().toString() : (applicationData.birth_day?.toString() || ""),
        birth_month: birthdate ? (birthdate.getMonth() + 1).toString() : (applicationData.birth_month?.toString() || ""),
        birth_year: birthdate ? birthdate.getFullYear().toString() : (applicationData.birth_year?.toString() || ""),
        marital_status: applicationData.marital_status || "",
        has_children: applicationData.has_children as boolean | undefined,
        height_cm: applicationData.height_cm ? applicationData.height_cm.toString() : "",
        height_ft: "",
        weight_kg: applicationData.weight_kg ? applicationData.weight_kg.toString() : "",
        measurement_system: "metric",
      };
      
      // Initialize contact form with existing data
      setTimeout(() => {
        setContactForm({
          name: `${applicationData.first_name || ''} ${applicationData.last_name || ''}`.trim(),
          contact: applicationData.phone?.number || '',
          message: '',
          countryCode: applicationData.phone?.country_code || applicationData.country || '',
          facebookUrl: applicationData.facebook_url || ''
        });
      }, 0);
    }
    
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
      height_ft: "",
      weight_kg: "",
      measurement_system: "metric",
    };
  };

  // Load user's last application data from database
  const loadLastApplicationData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: applications, error } = await supabase
        .from('contest_applications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Failed to load last application:', error);
        return null;
      }

      if (applications && applications.length > 0) {
        const lastApp = applications[0];
        console.log('Loading last application data:', lastApp);
        
        const applicationData = lastApp.application_data as any || {};
        
        // Handle birthdate from multiple possible sources
        let birthdate = null;
        if (applicationData.birthdate) {
          birthdate = new Date(applicationData.birthdate);
        } else if (applicationData.birth_year && applicationData.birth_month && applicationData.birth_day) {
          birthdate = new Date(applicationData.birth_year, applicationData.birth_month - 1, applicationData.birth_day);
        }

        // Load contact information if available
        if (applicationData.phone || applicationData.facebook_url) {
          // Validate existing Facebook URL - only load if it's valid
          const existingFacebookUrl = applicationData.facebook_url || '';
          const validFacebookUrl = validateFacebookUrl(existingFacebookUrl) ? existingFacebookUrl : '';
          
          setContactForm({
            name: `${applicationData.first_name || ''} ${applicationData.last_name || ''}`.trim(),
            contact: applicationData.phone?.number || '',
            message: '',
            countryCode: applicationData.phone?.country_code || applicationData.country || '',
            facebookUrl: validFacebookUrl
          });
        }
        
        return {
          first_name: applicationData.first_name || "",
          last_name: applicationData.last_name || "",
          country: applicationData.country || "",
          countryCode: applicationData.country || "",
          state: applicationData.state || "",
          stateCode: applicationData.state || "",
          city: applicationData.city || "",
          gender: applicationData.gender || "",
          birth_day: birthdate ? birthdate.getDate().toString() : (applicationData.birth_day?.toString() || ""),
          birth_month: birthdate ? (birthdate.getMonth() + 1).toString() : (applicationData.birth_month?.toString() || ""),
          birth_year: birthdate ? birthdate.getFullYear().toString() : (applicationData.birth_year?.toString() || ""),
          marital_status: applicationData.marital_status || "",
          has_children: applicationData.has_children as boolean | undefined,
          height_cm: applicationData.height_cm ? applicationData.height_cm.toString() : "",
          height_ft: "",
          weight_kg: applicationData.weight_kg ? applicationData.weight_kg.toString() : "",
          measurement_system: "metric",
          // Include photo URLs for display
          photo1_url: applicationData.photo1_url || applicationData.photo_1_url || null,
          photo2_url: applicationData.photo2_url || applicationData.photo_2_url || null,
        };
      }
    } catch (error) {
      console.warn('Error loading last application:', error);
    }
    return null;
  };

  // Profile form data
  const [formData, setFormData] = useState(loadCachedFormData);
  
  // Track selected height and weight display formats
  const [selectedHeight, setSelectedHeight] = useState<string>("");
  const [selectedWeight, setSelectedWeight] = useState<string>("");

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
        // Check storage quota before saving
        const testKey = 'test-storage';
        try {
          localStorage.setItem(testKey, 'test');
          localStorage.removeItem(testKey);
        } catch (quotaError) {
          console.warn('Storage quota exceeded, skipping photo cache');
          return;
        }
        
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
    if (!formData.countryCode) return [];
    
    // Get states from library for the selected country
    const countryStates = State.getStatesOfCountry(formData.countryCode);
    console.log('All states for Philippines:', countryStates.map(s => `${s.name} (${s.isoCode})`));
    
    return countryStates.map(state => ({
      value: state.isoCode,
      label: state.name
    }));
  }, [formData.countryCode]);

  const cities = useMemo(() => {
    if (!formData.countryCode) return [];
    console.log('Cities calculation - State Code:', formData.stateCode, 'Country Code:', formData.countryCode);
    console.log('Selected state name from form data:', states.find(s => s.value === formData.stateCode)?.label);
    const cityList = getCitiesForLocation(formData.countryCode, formData.stateCode);
    console.log('Cities returned:', cityList);
    return cityList
      .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
      .map(city => ({
        value: city,
        label: city
      }));
  }, [formData.countryCode, formData.stateCode, states]);

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

  // Process image to maintain 4:5 aspect ratio (width:height) with side padding if needed
  const processImageAspectRatio = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const targetAspectRatio = 4 / 5; // width:height = 4:5
        
        // If image is narrower than 4:5 ratio, add padding on sides
        if (aspectRatio < targetAspectRatio) {
          // Image is too narrow, need to add horizontal padding (make it wider)
          const targetHeight = img.height;
          const targetWidth = img.height * targetAspectRatio; // width = height * (4/5)
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          // Fill with white background (padding)
          ctx!.fillStyle = '#ffffff';
          ctx!.fillRect(0, 0, targetWidth, targetHeight);
          
          // Center the original image horizontally
          const offsetX = (targetWidth - img.width) / 2;
          ctx!.drawImage(img, offsetX, 0, img.width, img.height);
        } else {
          // For images with aspect ratio >= 4:5, keep original
          canvas.width = img.width;
          canvas.height = img.height;
          ctx!.drawImage(img, 0, 0);
        }
        
        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(processedFile);
          } else {
            resolve(file);
          }
        }, file.type, 0.9);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload photo to Supabase storage
  const uploadPhoto = async (file: File, photoNumber: number): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Process image for proper aspect ratio
    const processedFile = await processImageAspectRatio(file);

    // Create file path with user folder structure for RLS to work
    const fileName = `${session.user.id}/photo${photoNumber}-${Date.now()}.${processedFile.name.split('.').pop()}`;
    
    const { error: uploadError } = await supabase.storage
      .from('contest-photos')
      .upload(fileName, processedFile);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('contest-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  // Profile form submission with validation
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started', { formData });
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
    // Facebook URL validation will be handled in contact form step
    
    // Validate photos - check for new uploads or existing photos from previous applications
    if (editMode) {
      // In edit mode, photos are optional (user can keep existing ones)
      // Only validate if there are no existing photos and no new photos
      const hasExistingPhoto1 = (existingData?.application_data as any)?.photo1_url;
      const hasExistingPhoto2 = (existingData?.application_data as any)?.photo2_url;
      
      if (!photo1File && !hasExistingPhoto1) newInvalidFields.add('photo1');
      if (!photo2File && !hasExistingPhoto2) newInvalidFields.add('photo2');
    } else {
      // In new application mode, check for new uploads or photos from previous applications
      const hasPhoto1 = photo1File || (formData as any)?.photo1_url;
      const hasPhoto2 = photo2File || (formData as any)?.photo2_url;
      
      if (!hasPhoto1) newInvalidFields.add('photo1');
      if (!hasPhoto2) newInvalidFields.add('photo2');
    }

    console.log('Validation completed', { 
      invalidFields: Array.from(newInvalidFields),
      hasValidationErrors: newInvalidFields.size > 0
    });

    setInvalidFields(newInvalidFields);

    // If there are validation errors, stop here
    if (newInvalidFields.size > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields marked in red.",
        variant: "destructive"
      });
      return;
    }

    // All fields are valid, proceed with submission
    console.log('Starting form submission process');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Auth session check', { hasSession: !!session?.user });
      
      if (!session?.user) {
        throw new Error('You must be logged in to submit an application');
      }

      // In edit mode, check if application is still editable
      // Allow editing of all application statuses including rejected ones
      // Users should be able to fix and resubmit rejected applications
      if (editMode && existingData) {
        // Only prevent editing if the status is permanently denied (not rejected)
        if (existingData.status === 'denied') {
          toast({
            title: "Cannot Edit",
            description: "This application can no longer be edited. You can submit a new application instead.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
      }

      // Check if user already has an approved application (only for new applications)
      if (!editMode) {
        console.log('Checking for existing approved applications');
        const { data: existingApplication, error: checkError } = await supabase
          .from('contest_applications')
          .select('id, status')
          .eq('user_id', session.user.id)
          .in('status', ['approved'])
          .maybeSingle();

        console.log('Existing application check result', { existingApplication, checkError });

        if (existingApplication) {
          toast({
            title: "Application Already Approved",
            description: "You already have an approved application. You can submit a new one for the next contest period.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
      }

      // Upload photos or keep existing ones
      let photo1Url = null;
      let photo2Url = null;

      // In edit mode, start with existing photo URLs
      if (editMode && existingData) {
        photo1Url = (existingData?.application_data as any)?.photo1_url || null;
        photo2Url = (existingData?.application_data as any)?.photo2_url || null;
      } else {
        // For new applications, start with photos from previous application if available
        photo1Url = (formData as any)?.photo1_url || null;
        photo2Url = (formData as any)?.photo2_url || null;
      }

      // Upload new photos if provided (they will override existing ones)
      if (photo1File) {
        photo1Url = await uploadPhoto(photo1File, 1);
      }

      if (photo2File) {
        photo2Url = await uploadPhoto(photo2File, 2);
      }

      // Save application to database
      console.log('Saving application with contact form data:', contactForm);
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
        // Include contact information
        facebook_url: contactForm.facebookUrl || '',
        phone: contactForm.contact && contactForm.countryCode ? {
          country_code: contactForm.countryCode,
          phone_code: Country.getCountryByCode(contactForm.countryCode)?.phonecode || '63',
          number: contactForm.contact,
          full_number: `+${Country.getCountryByCode(contactForm.countryCode)?.phonecode || '63'}${contactForm.contact.replace(/\s/g, '')}`
        } : null,
      };
      
      console.log('Final application data to save:', applicationData);

      let dbError = null;

      if (editMode && existingData) {
        // Update existing application
        const { error } = await supabase
          .from('contest_applications')
          .update({
            application_data: applicationData,
            status: 'pending',
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
        
        dbError = error;
      } else {
        // Insert new application and get the returned data
        console.log('Inserting new application to database');
        const { data: insertedData, error } = await supabase
          .from('contest_applications')
          .insert({
            user_id: session.user.id,
            application_data: applicationData,
            status: 'pending'
          })
          .select('id')
          .single();
        
        console.log('Database insert result', { insertedData, error });
        dbError = error;
        
        // Store the application ID for later use in contact form
        if (insertedData) {
          setCurrentApplicationId(insertedData.id);
        }
      }

      if (dbError) {
        console.error('Database error details:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('Application saved successfully, updating profile');

      // Update user profile to mark as contest participant and add all form data
      const birthDate = `${formData.birth_year}-${formData.birth_month.padStart(2, '0')}-${formData.birth_day.padStart(2, '0')}`;
      const age = new Date().getFullYear() - parseInt(formData.birth_year);
      
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
        birthdate: birthDate,
        age: age,
        country: countries.find(c => c.value === formData.countryCode)?.label || formData.countryCode,
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

      // Update weekly contest participant data if user is already in current week's contest
      if (editMode) {
        const { error: participantUpdateError } = await supabase
          .from('weekly_contest_participants')
          .update({
            application_data: applicationData
          })
          .eq('user_id', session.user.id);

        if (participantUpdateError) {
          console.warn('Failed to update weekly contest participant:', participantUpdateError);
        }
      }

      toast({
        title: "Success!",
        description: editMode ? "Your application has been updated successfully." : "Your contest application has been submitted successfully."
      });

      // Clear cache after successful submission
      clearFormCache();
      
      // Trigger update event to refresh participation data in profile (for both edit and new)
      if (editMode) {
        // Store the application ID for contact form in edit mode
        if (existingData) {
          setCurrentApplicationId(existingData.id);
        }
      }
      
      // Set submission success to show contact form for both new and edited applications
      setSubmissionSuccess(true);
    } catch (error: any) {
      console.error('Submission error:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      console.log('Form submission completed, setting loading to false');
      setIsLoading(false);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setInvalidFields(new Set());
      
      const initializeForm = async () => {
        let formDataToLoad;
        
        // If in edit mode, prioritize existing data
        if (editMode && existingData) {
          console.log('Edit mode detected, loading existing data:', existingData);
          formDataToLoad = loadCachedFormData();
          // Load contact information from existing data
          if (existingData.application_data) {
            const appData = existingData.application_data as any;
            setContactForm({
              name: "",
              contact: appData.phone?.number || "",
              message: "",
              countryCode: appData.phone?.country_code || "",
              facebookUrl: appData.facebook_url || ""
            });
          }
        } else if (editMode && !existingData) {
          console.log('Edit mode but no existing data, showing error');
          throw new Error('Failed to load application data.');
        } else {
          // For new applications, try to load last application data first
          const lastAppData = await loadLastApplicationData();
          if (lastAppData) {
            formDataToLoad = lastAppData;
            console.log('Loaded last application data:', lastAppData);
          } else {
            // Fall back to cached data if no last application
            formDataToLoad = loadCachedFormData();
          }
        }
        
        setFormData(formDataToLoad);
        
        // Set display values for height and weight dropdowns
        if (formDataToLoad.height_cm) {
          setSelectedHeight(`${formDataToLoad.height_cm} cm`);
        }
        if (formDataToLoad.weight_kg) {
          setSelectedWeight(`${formDataToLoad.weight_kg} kg`);
        }
      };
      
      initializeForm();
      
      // Set display values for height and weight dropdowns for edit mode
      if (editMode && existingData) {
        console.log('Loading existing data for edit mode:', existingData);
        let applicationData = existingData;
        if (existingData.application_data) {
          applicationData = { ...existingData, ...existingData.application_data };
          console.log('Application data found:', existingData.application_data);
          
          // Load contact information
          const appData = existingData.application_data as any;
          if (appData.phone || appData.facebook_url) {
            console.log('Loading contact data:', { phone: appData.phone, facebook_url: appData.facebook_url });
            setContactForm({
              name: "",
              contact: appData.phone?.number || "",
              message: "",
              countryCode: appData.phone?.country_code || "",
              facebookUrl: appData.facebook_url || ""
            });
          }
        }
        
        // Log photo URLs for debugging
        console.log('Photo URLs in existingData:', {
          photo_1_url: existingData.photo_1_url,
          photo_2_url: existingData.photo_2_url,
          photo1_url: existingData.photo1_url,
          photo2_url: existingData.photo2_url,
          application_data_photo1: existingData.application_data?.photo1_url,
          application_data_photo2: existingData.application_data?.photo2_url,
          applicationData_photo1: applicationData.photo1_url,
          applicationData_photo2: applicationData.photo2_url
        });
      }
      
      // Load cached photos only if not in edit mode
      if (!editMode) {
        const cachedPhoto1 = loadPhotoFromCache(1);
        const cachedPhoto2 = loadPhotoFromCache(2);
        if (cachedPhoto1) setPhoto1File(cachedPhoto1);
        if (cachedPhoto2) setPhoto2File(cachedPhoto2);
      } else if (existingData) {
        // In edit mode, photos are already uploaded
        setPhoto1File(null);
        setPhoto2File(null);
      }
      
      const checkAuth = async () => {
        console.log('Checking authentication status');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Auth check result', { hasSession: !!session?.user });
        if (session) {
          setCurrentStep('profile');
        } else {
          setCurrentStep('auth');
        }
      };
      checkAuth();
    }
  }, [isOpen, editMode]); // Removed existingData from dependencies to prevent infinite loops
  
  // Handle existingData changes separately to avoid infinite loops
  useEffect(() => {
    if (editMode && existingData && isOpen) {
      console.log('ExistingData changed, updating contact form:', existingData);
      if (existingData.application_data) {
        const appData = existingData.application_data as any;
        setContactForm({
          name: "",
          contact: appData.phone?.number || "",
          message: "",
          countryCode: appData.phone?.country_code || "",
          facebookUrl: appData.facebook_url || ""
        });
      }
    }
  }, [editMode, isOpen]); // Removed existingData from dependencies to prevent infinite loops

  // Save form data to cache
  const saveFormDataToCache = (data: typeof formData) => {
    try {
      // Clear existing cache if quota exceeded to prevent infinite loops
      const testKey = 'test-storage';
      try {
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
      } catch (quotaError) {
        console.warn('Storage quota exceeded, clearing form cache');
        clearFormCache();
        return;
      }
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
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        // Reset states when modal closes
        setSubmissionSuccess(false);
        setCurrentApplicationId(null);
        setSelectedContactMethod(null);
        setContactForm({ name: "", contact: "", message: "", countryCode: "", facebookUrl: "" });
      }
    }}>
      {/* Only show DialogTrigger if not in controlled mode */}
      {controlledIsOpen === undefined && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="w-full max-w-4xl mx-auto max-h-[95vh] bg-background p-0 overflow-hidden">
        <div className="px-6 py-4 border-b">
          <DialogHeader>
            <DialogTitle>
              {currentStep === 'auth' ? 'Sign in' : ''}
            </DialogTitle>
          </DialogHeader>
        </div>
        
        <ScrollArea className="flex-1 max-h-[calc(95vh-100px)]">
          <div className="px-6 py-4">
            {currentStep === 'auth' ? (
              <form onSubmit={handleAuth} className="space-y-3 max-w-xs mx-auto">
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

            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isLoading}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    setAuthError("");
                    
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'facebook',
                      options: {
                        redirectTo: `${window.location.origin}/`,
                      }
                    });
                    
                    if (error) {
                      setAuthError(error.message);
                    }
                  } catch (error) {
                    setAuthError('Facebook authentication failed');
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Login with Facebook
              </Button>
            </div>
          </form>
        ) : submissionSuccess ? (
          <div className="space-y-4">
            {/* Contact for Prize Transfer Section */}
            <div>
              <h3 className="text-md font-semibold mb-4 text-center">
                Add your contact info in case you win.
              </h3>
              
              {/* Facebook Account Input */}
              <div className="mb-4">
                <Label htmlFor="facebook-url" className="text-sm font-medium text-muted-foreground mb-2 block">
                  Facebook Profile Link <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="facebook-url"
                  type="url"
                  placeholder="https://facebook.com/yourprofile"
                  value={contactForm.facebookUrl || ''}
                  onChange={(e) => {
                    console.log('Facebook URL changed:', e.target.value);
                    setContactForm({...contactForm, facebookUrl: e.target.value});
                    // Remove validation error when user starts typing
                    if (invalidFields.has('facebookUrl')) {
                      setInvalidFields(prev => {
                        const newSet = new Set(prev);
                        newSet.delete('facebookUrl');
                        return newSet;
                      });
                    }
                  }}
                  className="w-full h-10"
                  required
                />
              </div>
              
              {/* Phone Input */}
              <div className="mb-4">
                <div className="flex border border-input rounded-md bg-background overflow-hidden h-10">
                  {/* Country Code Selector */}
                  <div className="w-24 border-r border-border">
                    <SearchableSelect
                      value={contactForm.countryCode || formData.countryCode}
                      onValueChange={(value) => setContactForm({...contactForm, countryCode: value})}
                      options={Country.getAllCountries().map((country) => ({
                        value: country.isoCode,
                        label: `${country.flag} +${country.phonecode} ${country.name}`
                      }))}
                      placeholder=""
                      customTriggerRenderer={(value, options) => {
                        const selectedCountry = Country.getCountryByCode(value);
                        if (!selectedCountry) return '';
                        
                        const phoneCode = `+${selectedCountry.phonecode}`;
                        const shouldWrap = phoneCode.length > 4;
                        
                        return (
                          <span className={shouldWrap ? "whitespace-normal break-words leading-tight" : "whitespace-nowrap"}>
                            {selectedCountry.flag} {phoneCode}
                          </span>
                        );
                      }}
                    />
                  </div>
                  
                  {/* Phone Number Input */}
                  <div className="flex-1">
                    <Input
                      id="contact-phone"
                      value={contactForm.contact}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length >= 3) {
                          value = value.substring(0, 3) + ' ' + value.substring(3);
                        }
                        if (value.length >= 7) {
                          value = value.substring(0, 7) + ' ' + value.substring(7, 11);
                        }
                        setContactForm({...contactForm, contact: value});
                      }}
                      placeholder="123 456 7890"
                      className="text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-3 rounded-l-none h-full"
                      type="tel"
                      inputMode="numeric"
                      maxLength={12}
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                type="button" 
                size="sm"
                       onClick={async () => {
                          // Validate phone number
                          if (!contactForm.contact.trim()) {
                            toast({
                              title: "Please fill all fields",
                              description: "Phone number is required.",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          // Validate Facebook URL
                          if (!contactForm.facebookUrl?.trim()) {
                            toast({
                              title: "Please fill all fields",
                              description: "Facebook profile link is required.",
                              variant: "destructive"
                            });
                            return;
                          } else if (!validateFacebookUrl(contactForm.facebookUrl)) {
                            toast({
                              title: "Invalid Facebook URL",
                              description: "Please enter a valid Facebook profile URL.",
                              variant: "destructive"
                            });
                            return;
                          }

                         try {
                           const { data: { session } } = await supabase.auth.getSession();
                           if (!session) {
                             toast({
                               title: "Error",
                               description: "Authentication required.",
                               variant: "destructive"
                             });
                             return;
                           }

                             // Use the specific application ID from the current submission
                             if (!currentApplicationId) {
                               toast({
                                 title: "Error",
                                 description: "No application found to update.",
                                 variant: "destructive"
                               });
                               return;
                             }

                             // Get the specific application by ID
                             const { data: application, error: fetchError } = await supabase
                               .from('contest_applications')
                               .select('application_data')
                               .eq('id', currentApplicationId)
                               .single();

                             if (fetchError || !application) {
                              toast({
                                title: "Error",
                                description: "Application not found.",
                                variant: "destructive"
                              });
                              return;
                            }

                           // Get the selected country info
                           const selectedCountry = Country.getCountryByCode(contactForm.countryCode || formData.countryCode);
                           
                             // Add phone and Facebook data to application
                             const currentData = application.application_data as Record<string, any> || {};
                             const updatedApplicationData = {
                               ...currentData,
                               phone: {
                                 country_code: contactForm.countryCode || formData.countryCode,
                                 phone_code: selectedCountry?.phonecode || '63',
                                 number: contactForm.contact,
                                 full_number: `+${selectedCountry?.phonecode || '63'}${contactForm.contact.replace(/\s/g, '')}`
                               },
                               facebook_url: contactForm.facebookUrl || ''
                             };

                             // Update the specific application with contact data
                             // This will trigger the save_application_history() function automatically
                             const { error: updateError } = await supabase
                               .from('contest_applications')
                               .update({
                                 application_data: updatedApplicationData,
                                 updated_at: new Date().toISOString(),
                                 notes: `Contact information updated: ${contactForm.contact ? 'Phone updated' : ''} ${contactForm.facebookUrl ? 'Facebook updated' : ''}`.trim()
                               })
                               .eq('id', currentApplicationId);

                           if (updateError) {
                             toast({
                               title: "Error",
                               description: "Failed to save contact information.",
                               variant: "destructive"
                             });
                             return;
                           }
                        
                            toast({
                              title: "Contact information saved",
                              description: "We will contact you in case of victory."
                            });
                            
                            // Close modal after successful contact update
                            setIsOpen(false);
                            
                            // Reset states 
                            setSubmissionSuccess(false);
                            setCurrentApplicationId(null);
                            setSelectedContactMethod(null);
                            setContactForm({ name: "", contact: "", message: "", countryCode: "", facebookUrl: "" });
                            
                            // Dispatch event for profile updates if this was from edit mode
                            if (editMode) {
                              window.dispatchEvent(new CustomEvent('participationUpdated', { 
                                detail: { 
                                  contactUpdated: true,
                                  updatedAt: new Date().toISOString()
                                } 
                              }));
                            }
                         } catch (error) {
                           console.error('Contact save error:', error);
                           toast({
                             title: "Error",
                             description: "Failed to save contact information.",
                             variant: "destructive"
                           });
                         }
                       }}
                     >
                       Submit
                     </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-3">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">Contest Registration Form</h2>
            </div>
            
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
                placeholder="City"
                disabled={!formData.stateCode}
                invalid={hasRedBorder('city')}
                allowCustom={true}
                emptyMessage="No cities found. Type to add custom city."
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

            <div className="grid gap-2 grid-cols-2">
              <HeightDropdownOneScrollPick 
                value={selectedHeight || undefined}
                className={getFieldClasses('height_cm', "")}
                onSelect={(value) => {
                  setSelectedHeight(value.label);
                  if (value.system === "cm") {
                    // Extract number from "XXX cm"
                    const cm = value.label.replace(' cm', '');
                    handleFieldChange('height_cm', cm);
                  } else {
                    // Convert ft'in" to cm
                    const ftIn = value.label; // e.g., "5'10""
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
                    // Extract number from "XXX kg"
                    const kg = value.label.replace(' kg', '');
                    handleFieldChange('weight_kg', kg);
                  } else {
                    // Convert lbs to kg
                    const lbs = parseFloat(value.label.replace(' lbs', ''));
                    const kg = Math.round(lbs / 2.205);
                    handleFieldChange('weight_kg', kg.toString());
                  }
                }}
              />
            </div>

            {/* Example card showing requirements */}
            <div className="mb-6 border-2 border-yellow-300 rounded-lg overflow-hidden bg-yellow-50">
              <div className="bg-yellow-200 text-black px-4 py-3 relative">
                <div className="text-sm font-semibold mb-3 text-center">How your photos should look:</div>
                <div className="grid grid-cols-2 gap-4 relative">
                  {/* Vertical divider line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-yellow-400 transform -translate-x-1/2"></div>
                  <div className="text-center">
                    <div className="text-xs font-medium mb-2">Portrait photo</div>
                    <div className="space-y-1 text-xs">
                      <div className="text-red-600">Look like an ID photo</div>
                      <div className="text-red-600">No makeup, no filters</div>
                      <div className="text-red-600">No glasses allowed</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium mb-2">Body photo</div>
                    <div className="space-y-1 text-xs">
                      <div className="text-red-600">Whole body from head to toe.</div>
                      <div className="text-red-600">Tight-clothed.</div>
                      <div className="text-red-600">No dresses, no skirts.</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px relative">
                {/* Vertical divider line for photos */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 transform -translate-x-1/2 z-10"></div>
                <div className="relative">
                  <img 
                    src={testContestantFace}
                    alt="Example face photo"
                    className="w-full aspect-[4/5] object-cover"
                  />
                </div>
                <div className="relative">
                  <img 
                    src={testContestantFull}
                    alt="Example full body photo"
                    className="w-full aspect-[4/5] object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex flex-row items-start">
                {/* Fixed photo upload areas */}
                <div className="flex flex-row gap-4 items-start w-full">
                  {/* Portrait Photo */}
                  <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Portrait</p>
                    <div className="text-xs text-red-500 space-y-1 text-center mb-2">
                      <div>Look like an ID photo</div>
                      <div>No makeup, no filters</div>
                      <div>No glasses allowed.</div>
                    </div>
                    <div className="relative w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhoto1Upload}
                        className="hidden"
                        id="photo1-upload"
                      />
                      <label htmlFor="photo1-upload" className="cursor-pointer block">
                        {photo1File || (editMode && (existingData?.application_data as any)?.photo1_url) || (formData as any)?.photo1_url ? (
                          <div className="p-2 relative">
                            <img
                              src={
                                photo1File ? URL.createObjectURL(photo1File) : 
                                (editMode && (existingData?.application_data as any)?.photo1_url) ? (existingData?.application_data as any)?.photo1_url :
                                (formData as any)?.photo1_url
                              }
                              alt="Portrait photo preview"
                              className="w-full aspect-[4/5] object-cover rounded bg-white"
                            />
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
                                {photo1File ? 'Change' : 'Change Photo'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 text-center">
                            <div className={`aspect-[4/5] rounded-lg mb-2 flex items-center justify-center relative overflow-hidden border-2 border-dashed cursor-pointer hover:border-primary transition-colors ${hasRedBorder('photo1') ? 'border-red-500' : 'border-muted-foreground/25'}`}>
                              <img 
                                src="/lovable-uploads/1147be30-a1d2-466f-a9a8-067f4628cbb2.png" 
                                alt="Portrait placeholder" 
                                className="absolute inset-0 w-full h-full object-cover opacity-40 filter grayscale brightness-75"
                              />
                            </div>
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
                        
                        {/* Remove the old current photo display since we show it above now */}
                      </label>
                    </div>
                  </div>

                  {/* Full Length Photo */}
                  <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">full length</p>
                    <div className="text-xs text-red-500 space-y-1 text-center mb-2">
                      <div className="whitespace-nowrap">Whole body from head to toe.</div>
                      <div>Tight-clothed.</div>
                      <div>No dresses, no skirts.</div>
                    </div>
                    <div className="relative w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhoto2Upload}
                        className="hidden"
                        id="photo2-upload"
                      />
                      <label htmlFor="photo2-upload" className="cursor-pointer block">
                        {photo2File || (editMode && (existingData?.application_data as any)?.photo2_url) || (formData as any)?.photo2_url ? (
                          <div className="p-2 relative">
                            <img
                              src={
                                photo2File ? URL.createObjectURL(photo2File) : 
                                (editMode && (existingData?.application_data as any)?.photo2_url) ? (existingData?.application_data as any)?.photo2_url :
                                (formData as any)?.photo2_url
                              }
                              alt="Full length photo preview"
                              className="w-full aspect-[4/5] object-cover rounded bg-white"
                            />
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
                                {photo2File ? 'Change' : 'Change Photo'}
                              </button>
                            </div>
                          </div>
                         ) : (
                          <div className="p-2 text-center">
                            <div className={`aspect-[4/5] rounded-lg mb-2 flex items-center justify-center relative overflow-hidden border-2 border-dashed cursor-pointer hover:border-primary transition-colors ${hasRedBorder('photo2') ? 'border-red-500' : 'border-muted-foreground/25'}`}>
                              <img 
                                src="/lovable-uploads/009d20f0-cac7-4c08-9bc9-146617664bc3.png" 
                                alt="Full body placeholder" 
                                className="absolute inset-0 w-full h-full object-contain opacity-50 filter grayscale brightness-50"
                              />
                            </div>
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
                        
                        {/* Remove the old current photo display since we show it above now */}
                      </label>
                    </div>
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
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};