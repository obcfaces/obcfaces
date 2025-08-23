import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchableSelect from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogOut, Eye, EyeOff, UserIcon, MapPin, Pencil, Lock, MessageCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import PostCard from "@/components/profile/PostCard";
import LikedItem from "@/components/profile/LikedItem";
import { PhotoModal } from "@/components/photo-modal";
import { ContestParticipationModal } from "@/components/contest-participation-modal";
import CreatePostModal from "@/components/create-post-modal";
import c1 from "@/assets/contestant-1.jpg";
import c2 from "@/assets/contestant-2.jpg";
import c3 from "@/assets/contestant-3.jpg";
import c1face from "@/assets/contestant-1-face.jpg";
import c2face from "@/assets/contestant-2-face.jpg";
import c3face from "@/assets/contestant-3-face.jpg";
import { AlignJustify, Grid2X2 } from "lucide-react";

interface ProfileRow {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  birthdate: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  avatar_url?: string | null;
  city?: string | null;
  country?: string | null;
  bio?: string | null;
  gender?: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [data, setData] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    display_name: '',
    gender: '',
    gender_privacy: 'public',
    country: '',
    country_privacy: 'public',
    birthdate: '',
    birthdate_privacy: 'only_me',
    bio: '',
    email: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [savingProfile, setSavingProfile] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);
  const [passwordInvalidFields, setPasswordInvalidFields] = useState<Set<string>>(new Set());
  const [savingPassword, setSavingPassword] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(true);
  const [likesViewMode, setLikesViewMode] = useState<'compact' | 'full'>('compact');
  const [likesCountryFilter, setLikesCountryFilter] = useState<string>("all");
  const [participationItems, setParticipationItems] = useState<any[]>([]);
  const [loadingParticipation, setLoadingParticipation] = useState(true);
  const [participationViewMode, setParticipationViewMode] = useState<'compact' | 'full'>('compact');
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [profilePhotoModalOpen, setProfilePhotoModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsViewMode, setPostsViewMode] = useState<'compact' | 'full'>('full');
  const [profilePhotos, setProfilePhotos] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  // Demo profile for fallback
  const demoProfile: ProfileRow = {
    display_name: "Anna Petrova",
    first_name: "Anna",
    last_name: "Petrova",
    birthdate: "1999-03-15",
    height_cm: 165,
    weight_kg: 55,
    avatar_url: c1face,
    city: "Moscow",
    country: "Russia",
    bio: "Model and photographer. Love traveling and discovering new places. Always looking for inspiration in everyday moments."
  };

  // Country options
  const countryOptions = [
    { value: "Philippines", label: "Philippines" },
    { value: "Indonesia", label: "Indonesia" },
    { value: "Malaysia", label: "Malaysia" },
    { value: "Singapore", label: "Singapore" },
    { value: "Thailand", label: "Thailand" },
    { value: "Vietnam", label: "Vietnam" },
    { value: "Myanmar", label: "Myanmar" },
    { value: "Cambodia", label: "Cambodia" },
    { value: "Laos", label: "Laos" },
    { value: "Brunei", label: "Brunei" },
    { value: "Russia", label: "Russia" },
    { value: "Ukraine", label: "Ukraine" },
    { value: "Belarus", label: "Belarus" },
    { value: "Kazakhstan", label: "Kazakhstan" },
    { value: "USA", label: "United States" },
    { value: "Canada", label: "Canada" },
    { value: "Mexico", label: "Mexico" },
    { value: "Brazil", label: "Brazil" },
    { value: "Argentina", label: "Argentina" },
    { value: "Colombia", label: "Colombia" },
    { value: "Venezuela", label: "Venezuela" },
    { value: "Peru", label: "Peru" },
    { value: "Chile", label: "Chile" },
    { value: "Ecuador", label: "Ecuador" },
    { value: "Bolivia", label: "Bolivia" },
    { value: "Paraguay", label: "Paraguay" },
    { value: "Uruguay", label: "Uruguay" },
    { value: "Germany", label: "Germany" },
    { value: "France", label: "France" },
    { value: "Italy", label: "Italy" },
    { value: "Spain", label: "Spain" },
    { value: "Poland", label: "Poland" },
    { value: "Netherlands", label: "Netherlands" },
    { value: "Belgium", label: "Belgium" },
    { value: "Switzerland", label: "Switzerland" },
    { value: "Austria", label: "Austria" },
    { value: "Czech Republic", label: "Czech Republic" },
    { value: "Hungary", label: "Hungary" },
    { value: "Romania", label: "Romania" },
    { value: "Bulgaria", label: "Bulgaria" },
    { value: "Greece", label: "Greece" },
    { value: "Portugal", label: "Portugal" },
    { value: "Sweden", label: "Sweden" },
    { value: "Norway", label: "Norway" },
    { value: "Denmark", label: "Denmark" },
    { value: "Finland", label: "Finland" },
    { value: "UK", label: "United Kingdom" },
    { value: "Ireland", label: "Ireland" },
    { value: "China", label: "China" },
    { value: "Japan", label: "Japan" },
    { value: "South Korea", label: "South Korea" },
    { value: "India", label: "India" },
    { value: "Australia", label: "Australia" },
    { value: "New Zealand", label: "New Zealand" },
    { value: "South Africa", label: "South Africa" },
    { value: "Egypt", label: "Egypt" },
    { value: "Morocco", label: "Morocco" },
    { value: "Nigeria", label: "Nigeria" },
    { value: "Kenya", label: "Kenya" },
    { value: "Other", label: "Other" }
  ];

  const profile = data || demoProfile;
  const isOwner = currentUserId && currentUserId === id;

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("display_name, first_name, last_name, birthdate, height_cm, weight_kg, avatar_url, city, country, bio, gender")
          .eq("id", id)
          .maybeSingle();
        
        setData(profileData);
        setBioDraft(profileData?.bio ?? "");
        
        // Initialize edit form with loaded data
        setEditForm({
          display_name: profileData?.display_name || '',
          gender: profileData?.gender || '',
          gender_privacy: 'public',
          country: profileData?.country || '',
          country_privacy: 'public',
          birthdate: profileData?.birthdate || '',
          birthdate_privacy: 'only_me',
          bio: profileData?.bio || '',
          email: ''
        });
        
        // Load real follower/following counts
        const { data: followStats } = await supabase.rpc('get_follow_stats', { target_user_id: id });
        if (followStats && followStats.length > 0) {
          setFollowersCount(followStats[0]?.followers_count || 0);
          setFollowingCount(followStats[0]?.following_count || 0);
        } else {
          setFollowersCount(0);
          setFollowingCount(0);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['posts', 'photos', 'participation', 'about'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Check following status
  useEffect(() => {
    if (!currentUserId || !id || currentUserId === id) return;
    
    const checkFollowStatus = async () => {
      const { data: isFollowingData } = await supabase.rpc('is_following', { target_user_id: id });
      setIsFollowing(isFollowingData || false);
    };
    
    checkFollowStatus();
  }, [currentUserId, id]);

  const handleFollowToggle = async () => {
    if (!currentUserId || currentUserId === id) return;
    
    setLoadingFollow(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('followee_id', id);
        
        if (error) throw error;
        
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
        toast({ description: "Отписались" });
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUserId, followee_id: id });
        
        if (error) throw error;
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast({ description: "Подписались" });
      }
    } catch (error) {
      toast({ description: "Ошибка при изменении подписки" });
    } finally {
      setLoadingFollow(false);
    }
  };

  const handleMessage = () => {
    if (!currentUserId) {
      toast({ description: "Войдите в систему для отправки сообщений" });
      return;
    }
    // Navigate to messages page with recipient parameter using React Router
    navigate(`/messages?recipient=${id}`);
  };

  const handleBioSave = async () => {
    if (!currentUserId || currentUserId !== id) return;
    
    setSavingBio(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bio: bioDraft })
        .eq("id", id);
      
      if (error) throw error;
      
      setData(prev => prev ? { ...prev, bio: bioDraft } : null);
      setIsEditingBio(false);
      toast({ description: "Био сохранено" });
    } catch (error) {
      toast({ description: "Ошибка при сохранении био" });
    } finally {
      setSavingBio(false);
    }
  };

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

  // Load current user email
  useEffect(() => {
    const loadCurrentUserEmail = async () => {
      if (currentUserId && currentUserId === id) {
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email || '';
        setCurrentUserEmail(userEmail);
        
        // Update the editForm with the email
        setEditForm(prev => ({ ...prev, email: userEmail }));
      }
    };
    loadCurrentUserEmail();
  }, [currentUserId, id]);

  const initEditForm = () => {
    setEditForm({
      display_name: data?.display_name || '',
      gender: data?.gender || '',
      gender_privacy: 'public',
      country: data?.country || '',
      country_privacy: 'public',
      birthdate: data?.birthdate || '',
      birthdate_privacy: 'only_me',
      bio: data?.bio || '',
      email: currentUserEmail
    });
    setIsEditingProfile(true);
    setSubmitted(false);
    setInvalidFields(new Set());
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!currentUserId) return null;
    
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({ description: "Ошибка загрузки фото" });
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    
    // Remove field from invalid set when user types
    if (invalidFields.has(field)) {
      setInvalidFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }
  };

  const handlePasswordFormChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    
    // Remove field from invalid set when user types
    if (passwordInvalidFields.has(field)) {
      setPasswordInvalidFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }
  };

  const handleChangePassword = async () => {
    setPasswordSubmitted(true);

    // Validate password form
    const newInvalidFields = new Set<string>();
    if (!passwordForm.currentPassword.trim()) newInvalidFields.add('currentPassword');
    if (!passwordForm.newPassword.trim()) newInvalidFields.add('newPassword');
    if (!passwordForm.confirmPassword.trim()) newInvalidFields.add('confirmPassword');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newInvalidFields.add('confirmPassword');
    }

    setPasswordInvalidFields(newInvalidFields);

    if (newInvalidFields.size > 0) {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast({ description: "Пароли не совпадают" });
      }
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      
      if (error) throw error;
      
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSubmitted(false);
      setPasswordInvalidFields(new Set());
      toast({ description: "Пароль изменен" });
    } catch (error: any) {
      toast({ description: error.message || "Ошибка при смене пароля" });
    } finally {
      setSavingPassword(false);
    }
  };

  // Check if a password field should have red border
  const hasPasswordRedBorder = (fieldName: string) => {
    return passwordSubmitted && passwordInvalidFields.has(fieldName);
  };

  // Get CSS classes for password form fields
  const getPasswordFieldClasses = (fieldName: string, baseClasses: string = "") => {
    if (hasPasswordRedBorder(fieldName)) {
      return `${baseClasses} border border-red-500`.trim();
    }
    return baseClasses;
  };

  const handleSaveProfile = async () => {
    if (!currentUserId || currentUserId !== id) return;
    
    setSubmitted(true);

    // Validate required fields
    const newInvalidFields = new Set<string>();
    if (!editForm.display_name.trim()) newInvalidFields.add('display_name');
    if (!editForm.gender) newInvalidFields.add('gender');
    if (!editForm.country.trim()) newInvalidFields.add('country');
    if (editForm.email && !editForm.email.trim()) newInvalidFields.add('email');

    setInvalidFields(newInvalidFields);

    if (newInvalidFields.size > 0) {
      return;
    }
    
    setSavingProfile(true);
    try {
      // Upload avatar if a new one was selected
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // Update profile data
      const updates: any = {
        display_name: editForm.display_name,
        gender: editForm.gender,
        country: editForm.country,
        bio: editForm.bio
      };

      // Add birthdate if provided
      if (editForm.birthdate) {
        updates.birthdate = editForm.birthdate;
      }

      // Add avatar URL if we have one
      if (avatarUrl) {
        updates.avatar_url = avatarUrl;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id);
      
      if (profileError) throw profileError;

      // Update email if provided and different from current
      if (editForm.email && editForm.email !== currentUserEmail) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editForm.email
        });
        if (emailError) throw emailError;
      }
      
      setData(prev => prev ? { ...prev, ...updates } : null);
      setIsEditingProfile(false);
      toast({ description: "Профиль сохранен" });
    } catch (error: any) {
      toast({ description: error.message || "Ошибка при сохранении профиля" });
    } finally {
      setSavingProfile(false);
    }
  };

  const logout = async () => {
    setLogoutLoading(true);
    try {
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } catch (error) {
      toast({ description: "Ошибка при выходе" });
    } finally {
      setLogoutLoading(false);
    }
  };

  const loadLikedItems = async () => {
    if (!currentUserId) return;
    
    setLoadingLikes(true);
    try {
      const { data: likes, error } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedLikes = likes?.map(like => {
        const timeAgo = new Date(like.created_at).toLocaleString('ru-RU');
        
        if (like.content_type === 'next_week_candidate') {
          // Parse the JSON content for next week candidates
          const candidateData = JSON.parse(like.content_id);
          return {
            likeId: like.id,
            contentType: 'next_week_candidate' as const,
            contentId: like.content_id,
            authorName: candidateData.name,
            authorProfileId: 'next-week',
            time: timeAgo,
            content: `${candidateData.country}, ${candidateData.city} • ${candidateData.age} лет • ${candidateData.height}см • ${candidateData.weight}кг`,
            imageSrc: candidateData.faceImage,
            likes: Math.floor(Math.random() * 150), // Mock likes count
            comments: Math.floor(Math.random() * 30), // Mock comments count
            candidateData
          };
        } else {
          // Handle other content types (posts, contests, etc.)
          // Use same names as in next-week section
          const nextWeekNames = [
            "Victoria Morales", "Alejandra Silva", "Andrea Vargas", "Natalia Castillo",
            "Daniela Ruiz", "Paula Jimenez", "Carolina Perez", "Mariana Santos", 
            "Fernanda Diaz", "Adriana Castro"
          ];
          const participantTypes = ["candidate", "finalist", "winner"] as const;
          const mockImages = [c1face, c2face, c3face];
          const randomImageIndex = Math.floor(Math.random() * mockImages.length);
          const randomNameIndex = Math.floor(Math.random() * nextWeekNames.length);
          const randomTypeIndex = Math.floor(Math.random() * participantTypes.length);
          
          return {
            likeId: like.id,
            contentType: like.content_type as 'contest' | 'post',
            contentId: like.content_id,
            authorName: nextWeekNames[randomNameIndex], // Use same names as in next week section
            authorProfileId: "profile-" + like.content_id,
            time: timeAgo,
            likes: Math.floor(Math.random() * 100), // Mock likes count
            comments: Math.floor(Math.random() * 20), // Mock comments count
            imageSrc: mockImages[randomImageIndex], // Use random contestant image
            participantType: participantTypes[randomTypeIndex], // Add participant type
            candidateData: {
              name: nextWeekNames[randomNameIndex],
              age: 20 + Math.floor(Math.random() * 10),
              weight: 45 + Math.floor(Math.random() * 15),
              height: 155 + Math.floor(Math.random() * 20),
              country: 'Philippines',
              city: 'Manila',
              faceImage: mockImages[randomImageIndex],
              fullBodyImage: mockImages[randomImageIndex],
              participantType: participantTypes[randomTypeIndex]
            }
          };
        }
      }) || [];

      setLikedItems(formattedLikes);
    } catch (error) {
      console.error("Error loading liked items:", error);
      setLikedItems([]);
    } finally {
      setLoadingLikes(false);
    }
  };

  useEffect(() => {
    loadLikedItems();
  }, [currentUserId, id]);

  const handleUnlike = (likeId: string) => {
    setLikedItems(prev => prev.filter(item => item.likeId !== likeId));
  };

  const loadParticipationItems = async () => {
    if (!currentUserId) return;
    
    setLoadingParticipation(true);
    try {
      console.log('Loading participation for user:', currentUserId);
      
      // Сначала получаем профиль пользователя
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();

      console.log('Profile data:', profileData);
      console.log('Profile error:', error);

      if (error) {
        console.error('Error fetching profile:', error);
        setParticipationItems([]);
        setLoadingParticipation(false);
        return;
      }

      if (!profileData) {
        console.log('No profile found for user');
        setParticipationItems([]);
        setLoadingParticipation(false);
        return;
      }

      // Проверяем, является ли пользователь участником конкурса
      console.log('is_contest_participant:', profileData.is_contest_participant);
      
      if (!profileData.is_contest_participant) {
        console.log('User is not a contest participant');
        setParticipationItems([]);
        setLoadingParticipation(false);
        return;
      }

      // Создаем карточку участия пользователя на основе его профиля
      const participationCard = {
        likeId: `participation-${currentUserId}`,
        contentType: 'contest' as const,
        contentId: currentUserId,
        authorName: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Участник',
        authorProfileId: currentUserId,
        time: new Date(profileData.created_at).toLocaleString('ru-RU'),
        likes: Math.floor(Math.random() * 200) + 50, // Mock likes
        comments: Math.floor(Math.random() * 40) + 5, // Mock comments
        imageSrc: profileData.photo_1_url || c1face, // Use first photo as main display
        participantType: (profileData.participant_type as 'candidate' | 'finalist' | 'winner') || 'candidate',
        candidateData: {
          name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Участник',
          age: profileData.age || 25,
          weight: profileData.weight_kg || 55,
          height: profileData.height_cm || 165,
          country: [profileData.country, profileData.state, profileData.city].filter(Boolean).join(', ') || 'Philippines',
          city: profileData.city || 'Manila',
          faceImage: profileData.photo_1_url || c1face, // Formal photo (first image)
          fullBodyImage: profileData.photo_2_url || c1, // Casual photo (second image)
          participantType: (profileData.participant_type as 'candidate' | 'finalist' | 'winner') || 'candidate'
        }
      };

      console.log('Created participation card:', participationCard);
      setParticipationItems([participationCard]);
    } catch (error) {
      console.error("Error loading participation items:", error);
      setParticipationItems([]);
    } finally {
      setLoadingParticipation(false);
    }
  };

  // Load user posts
  const loadUserPosts = async () => {
    if (!id) return;
    
    setLoadingPosts(true);
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      // Получаем профиль автора для каждого поста
      const postsWithProfiles = await Promise.all(
        (posts || []).map(async (post) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', post.user_id)
            .single();
          
          return { ...post, profiles: profile };
        })
      );

      if (error) {
        console.error('Error loading posts:', error);
        return;
      }

      setUserPosts(postsWithProfiles || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Load photos from user posts
  const loadProfilePhotos = async () => {
    if (!id) return;
    
    setLoadingPhotos(true);
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('media_urls, media_types')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract all image URLs from posts
      const allPhotos: string[] = [];
      posts?.forEach(post => {
        if (post.media_urls && post.media_types) {
          post.media_urls.forEach((url: string, index: number) => {
            // Only include images, not videos
            if (post.media_types[index] === 'image') {
              allPhotos.push(url);
            }
          });
        }
      });

      setProfilePhotos(allPhotos);
    } catch (error) {
      console.error('Error loading profile photos:', error);
      setProfilePhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handlePostCreated = () => {
    // Reload posts and photos after creating a new one
    loadUserPosts();
    loadProfilePhotos();
  };

  useEffect(() => {
    loadParticipationItems();
  }, [currentUserId, id]);

  useEffect(() => {
    loadUserPosts();
    loadProfilePhotos();
  }, [id]);

  const handleRemoveParticipation = (participationId: string) => {
    setParticipationItems(prev => prev.filter(item => item.likeId !== participationId));
  };


  // Sample posts data
  const samplePosts = [
    {
      id: "1",
      authorName: profile.display_name || "User",
      time: "2 часа назад",
      content: "Beautiful day for a photoshoot! 📸",
      imageSrc: c1,
      likes: 24,
      comments: 3
    },
    {
      id: "2",
      authorName: profile.display_name || "User",
      time: "1 день назад",
      content: "Working on new looks. What do you think?",
      imageSrc: c2,
      likes: 45,
      comments: 8
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-6 py-8">
          <p>Загрузка...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{profile.display_name || "Профиль пользователя"} | OBC</title>
        <meta 
          name="description" 
          content={`Профиль ${profile.display_name || "пользователя"} на OBC. ${profile.bio || ""}`} 
        />
        <link rel="canonical" href={`/u/${id}`} />
      </Helmet>

      <main className="container mx-auto px-6 py-8">
        <section className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center gap-4 relative">
              <Avatar className="w-32 h-32">
                <AvatarImage 
                  src={profile.avatar_url || ""} 
                  alt={`Avatar of ${profile.display_name || "User"}`}
                  className="object-cover"
                />
                <AvatarFallback className="text-lg">
                  {(profile.display_name || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
               <div className="flex-1">
                <h1 className="text-2xl font-bold">
                  {profile.display_name || 
                    (profile.first_name && profile.last_name 
                      ? `${profile.first_name} ${profile.last_name}` 
                      : "Пользователь")
                  }
                 </h1>
                 
                 {/* Instagram-style stats */}
                 <div className="flex items-center gap-6 mt-2">
                   <div className="text-center">
                     <div className="font-semibold text-sm">{userPosts.length}</div>
                     <div className="text-xs text-muted-foreground">posts</div>
                   </div>
                   <div className="text-center">
                     <div className="font-semibold text-sm">{followersCount}</div>
                     <div className="text-xs text-muted-foreground">followers</div>
                   </div>
                   <div className="text-center">
                     <div className="font-semibold text-sm">{followingCount}</div>
                     <div className="text-xs text-muted-foreground">following</div>
                   </div>
                 </div>

                  {profile.bio && (
                    <p className="text-sm text-muted-foreground mt-2 italic leading-relaxed">
                      {profile.bio}
                    </p>
                  )}
                </div>
                {isOwner && (
                  <button
                    onClick={logout}
                    disabled={logoutLoading}
                    className="absolute top-0 right-0 p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    title="Выйти"
                  >
                    {logoutLoading ? (
                      <div className="w-[18px] h-[18px] border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogOut size={18} />
                    )}
                  </button>
                )}
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              {isOwner && (
                <ContestParticipationModal>
                   <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                     🏆 Join & Win 5,000 PHP
                   </Button>
                 </ContestParticipationModal>
              )}
                {isOwner && (
                  <CreatePostModal onPostCreated={handlePostCreated}>
                    <Button variant="outline">Add Post</Button>
                  </CreatePostModal>
                )}
               {!isOwner && (
                 <>
                   <Button 
                     variant={isFollowing ? "secondary" : "default"} 
                     onClick={handleFollowToggle}
                     disabled={loadingFollow}
                     className="min-w-[120px]"
                   >
                     {loadingFollow ? "..." : isFollowing ? "Unfollow" : "Follow"}
                   </Button>
                   <Button variant="outline" onClick={handleMessage} className="min-w-[120px]">
                     <MessageCircle className="w-4 h-4 mr-1 text-primary" strokeWidth={1} />
                     Message
                   </Button>
                 </>
               )}
            </div>


          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="w-full bg-transparent p-0 rounded-none justify-start gap-2 sm:gap-8 border-b border-border flex-wrap">
              <TabsTrigger value="posts" className="px-0 mr-2 sm:mr-6 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground text-sm sm:text-base">Posts</TabsTrigger>
              <TabsTrigger value="photos" className="px-0 mr-2 sm:mr-6 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground text-sm sm:text-base">Photos</TabsTrigger>
              <TabsTrigger value="participation" className="px-0 mr-2 sm:mr-6 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground text-sm sm:text-base">Participation</TabsTrigger>
              <TabsTrigger value="about" className="px-0 mr-2 sm:mr-6 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground text-sm sm:text-base">About</TabsTrigger>
            </TabsList>


            <TabsContent value="posts" className="space-y-4 mt-8 -mx-6">
              {loadingPosts ? (
                <div className="text-center py-8 px-6">
                  <p className="text-muted-foreground">Загрузка постов...</p>
                </div>
              ) : userPosts.length > 0 ? (
                <div className="px-0 sm:px-6 space-y-4">
                  {userPosts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      id={post.id}
                      authorName={post.profiles?.display_name || "Пользователь"}
                      time={new Date(post.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      content={post.caption || ""}
                      imageSrc={post.media_urls?.[0] || ""}
                      likes={post.likes_count || 0}
                      comments={post.comments_count || 0}
                      mediaUrls={post.media_urls || []}
                      mediaTypes={post.media_types || []}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-6">
                  <p className="text-muted-foreground">
                    {isOwner ? "У вас пока нет постов" : "У пользователя пока нет постов"}
                  </p>
                  {isOwner && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Создайте свой первый пост, нажав "Add Post"
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="photos" className="mt-8">
              {loadingPhotos ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Загрузка фотографий...</p>
                </div>
              ) : profilePhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {profilePhotos.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedPhotoIndex(idx);
                        setProfilePhotoModalOpen(true);
                      }}
                      className="relative group cursor-pointer"
                    >
                      <img
                        src={src}
                        loading="lazy"
                        alt={`Фото ${idx + 1} — ${profile.display_name ?? "пользователь"}`}
                        className="w-full h-32 sm:h-36 object-cover rounded-md group-hover:opacity-90 transition-opacity"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {isOwner ? "У вас пока нет фотографий в постах" : "У пользователя пока нет фотографий"}
                  </p>
                  {isOwner && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Фотографии будут появляться здесь, когда вы добавите их в посты
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="participation" className="mt-8 -mx-6">
              {loadingParticipation ? (
                <p className="text-muted-foreground text-center py-8 px-6">Загрузка участий...</p>
              ) : participationItems.length > 0 ? (
                <div className="px-0 sm:px-6">
                  {/* View mode toggle buttons */}
                  <div className="flex justify-end items-center gap-1 mb-4 px-6 sm:px-0 -mt-[15px]">
                    <button
                      type="button"
                      onClick={() => setParticipationViewMode("compact")}
                      aria-pressed={participationViewMode === "compact"}
                      aria-label="List view"
                      className="p-1 rounded-md hover:bg-accent transition-colors"
                    >
                      <AlignJustify 
                        size={28} 
                        strokeWidth={1}
                        className={participationViewMode === "compact" ? "text-primary" : "text-muted-foreground"}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setParticipationViewMode("full")}
                      aria-pressed={participationViewMode === "full"}
                      aria-label="Grid view"
                      className="p-1 rounded-md hover:bg-accent transition-colors"
                    >
                      <Grid2X2 
                        size={28} 
                        strokeWidth={1}
                        className={participationViewMode === "full" ? "text-primary" : "text-muted-foreground"}
                      />
                    </button>
                  </div>
                  
                  {/* Participation items grid */}
                  <div className={`grid gap-1 sm:gap-3 ${
                    participationViewMode === 'compact' 
                      ? 'grid-cols-1' 
                      : 'grid-cols-1 lg:grid-cols-2'
                  }`}>
                    {participationItems.map((item) => (
                      <LikedItem
                        key={item.likeId}
                        likeId={item.likeId}
                        contentType={item.contentType}
                        contentId={item.contentId}
                        authorName={item.authorName}
                        authorAvatarUrl={item.authorAvatarUrl}
                        authorProfileId={item.authorProfileId}
                        time={item.time}
                        content={item.content}
                        imageSrc={item.imageSrc}
                        likes={item.likes}
                        comments={item.comments}
                        onUnlike={handleRemoveParticipation}
                        viewMode={participationViewMode}
                        candidateData={item.candidateData}
                        participantType={item.participantType}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 px-6">Нет участий в конкурсах</p>
              )}
            </TabsContent>

            <TabsContent value="about" className="mt-8">
              {isEditingProfile ? (
                <div className="max-w-xs space-y-3">
                  {/* Avatar Upload */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Profile Photo</Label>
                    <div className="flex justify-center">
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <label htmlFor="avatar-upload" className="cursor-pointer block">
                        {avatarFile ? (
                          <div className="relative">
                            <Avatar className="h-32 w-32">
                              <AvatarImage 
                                src={avatarPreview || ""} 
                                alt="Profile photo preview"
                                className="h-full w-full object-cover"
                              />
                              <AvatarFallback className="text-sm">
                                {(editForm.display_name || profile.display_name || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setAvatarFile(null);
                                setAvatarPreview(null);
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 hover:bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold transition-colors shadow-md"
                            >
                              ×
                            </button>
                            <div className="mt-2 text-center">
                              <button 
                                type="button" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  document.getElementById('avatar-upload')?.click();
                                }}
                                className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                              >
                                Change
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Avatar className="h-32 w-32 border-2 border-dashed border-muted-foreground/25 hover:border-primary transition-colors cursor-pointer">
                              <AvatarImage 
                                src={profile.avatar_url || ""} 
                                alt="Current profile"
                                className="h-full w-full object-cover opacity-60"
                              />
                              <AvatarFallback className="text-sm opacity-60">
                                {(profile.display_name || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-xs text-muted-foreground mt-2 mb-2">JPG, PNG up to 5MB</p>
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                document.getElementById('avatar-upload')?.click();
                              }}
                              className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                            >
                              Choose File
                            </button>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Input 
                      placeholder="Display Name" 
                      className={getFieldClasses('display_name', "text-sm placeholder:text-muted-foreground")}
                      value={editForm.display_name} 
                      onChange={(e) => handleEditFormChange('display_name', e.target.value)} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Select value={editForm.gender} onValueChange={(value) => handleEditFormChange('gender', value)}>
                      <SelectTrigger className={getFieldClasses('gender', "text-sm")}>
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <SearchableSelect
                          value={editForm.country}
                          onValueChange={(value) => handleEditFormChange('country', value)}
                          options={countryOptions}
                          placeholder="Country"
                          invalid={hasRedBorder('country')}
                        />
                      </div>
                      <div className="w-20">
                        <Select value={editForm.country_privacy} onValueChange={(value) => handleEditFormChange('country_privacy', value)}>
                          <SelectTrigger className="text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">🌍 Everyone</SelectItem>
                            <SelectItem value="only_me">🔒 Only me</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Input 
                      placeholder="About Me" 
                      className="text-sm placeholder:text-muted-foreground"
                      value={editForm.bio} 
                      onChange={(e) => handleEditFormChange('bio', e.target.value)} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Input 
                      type="email"
                      placeholder="Email" 
                      className={getFieldClasses('email', "text-sm placeholder:text-muted-foreground")}
                      value={editForm.email} 
                      onChange={(e) => handleEditFormChange('email', e.target.value)} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-sm text-primary">
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Input 
                              type="password"
                              placeholder="Current Password" 
                              className={getPasswordFieldClasses('currentPassword', "text-sm placeholder:text-muted-foreground")}
                              value={passwordForm.currentPassword} 
                              onChange={(e) => handlePasswordFormChange('currentPassword', e.target.value)} 
                            />
                          </div>
                          <div>
                            <Input 
                              type="password"
                              placeholder="New Password" 
                              className={getPasswordFieldClasses('newPassword', "text-sm placeholder:text-muted-foreground")}
                              value={passwordForm.newPassword} 
                              onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)} 
                            />
                          </div>
                          <div>
                            <Input 
                              type="password"
                              placeholder="Confirm New Password" 
                              className={getPasswordFieldClasses('confirmPassword', "text-sm placeholder:text-muted-foreground")}
                              value={passwordForm.confirmPassword} 
                              onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)} 
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                setShowPasswordModal(false);
                                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                setPasswordSubmitted(false);
                                setPasswordInvalidFields(new Set());
                              }}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleChangePassword} disabled={savingPassword}>
                              {savingPassword ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Profile Photo Section */}
                  {isOwner && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-16 w-16">
                            <AvatarImage 
                              src={avatarPreview || profile.avatar_url || ""} 
                              alt="Profile photo"
                              className="object-cover"
                            />
                            <AvatarFallback className="text-lg">
                              {(profile.display_name || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-foreground">Profile photo</div>
                            <div className="text-xs text-muted-foreground">JPG, PNG up to 5MB</div>
                          </div>
                        </div>
                        {editingField === 'avatar' ? (
                          <div className="flex items-center gap-2">
                            <input
                              id="avatar-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setAvatarFile(file);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setAvatarPreview(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <button 
                              type="button" 
                              onClick={() => document.getElementById('avatar-upload')?.click()}
                              className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                            >
                              Choose
                            </button>
                            <button
                              onClick={() => {
                                setEditingField(null);
                                setAvatarPreview(null);
                                setAvatarFile(null);
                              }}
                              className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80 transition-colors"
                            >
                              Cancel
                            </button>
                            {avatarFile && (
                              <button
                                onClick={async () => {
                                  if (!avatarFile) return;
                                  setUploadingAvatar(true);
                                  try {
                                    const fileExt = avatarFile.name.split('.').pop();
                                    const fileName = `avatar.${fileExt}`;
                                    const filePath = `${currentUserId}/${fileName}`;

                                    // Upload to Supabase Storage
                                    const { error: uploadError } = await supabase.storage
                                      .from('avatars')
                                      .upload(filePath, avatarFile, { upsert: true });

                                    if (uploadError) throw uploadError;

                                    // Get public URL
                                    const { data: { publicUrl } } = supabase.storage
                                      .from('avatars')
                                      .getPublicUrl(filePath);

                                    // Update profile
                                    const { error: updateError } = await supabase
                                      .from('profiles')
                                      .update({ avatar_url: publicUrl })
                                      .eq('id', currentUserId);

                                    if (updateError) throw updateError;

                                    // Update local state
                                    setData(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
                                    setEditingField(null);
                                    setAvatarPreview(null);
                                    setAvatarFile(null);
                                  } catch (error) {
                                    console.error('Error updating avatar:', error);
                                  } finally {
                                    setUploadingAvatar(false);
                                  }
                                }}
                                disabled={uploadingAvatar}
                                className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                              >
                                {uploadingAvatar ? 'Uploading...' : 'Save'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingField('avatar');
                            }}
                            className="p-1 hover:bg-accent rounded-md transition-colors"
                            aria-label="Edit profile photo"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {/* Display Name - only show to owner */}
                      {isOwner && (
                        <div className="flex items-center py-3 border-b border-border">
                          <div className="flex-1">
                            {editingField === 'display_name' ? (
                              <div className="space-y-2">
                                <Input 
                                  placeholder="Display Name" 
                                  className="text-sm placeholder:text-muted-foreground"
                                  value={editForm.display_name} 
                                  onChange={(e) => handleEditFormChange('display_name', e.target.value)} 
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm"
                                    onClick={() => {
                                      setEditingField(null);
                                      setEditForm(prev => ({ ...prev, display_name: profile.display_name || '' }));
                                    }}
                                    variant="outline"
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={async () => {
                                      await handleSaveProfile();
                                      setEditingField(null);
                                    }}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm text-muted-foreground">Display Name</div>
                                <div className="text-sm font-medium text-foreground">
                                  {profile?.display_name || "Add display name"}
                                </div>
                              </div>
                            )}
                          </div>
                          {editingField !== 'display_name' && (
                            <button
                              onClick={() => {
                                setEditingField('display_name');
                                setEditForm(prev => ({ ...prev, display_name: profile.display_name || '' }));
                              }}
                              className="p-1 hover:bg-accent rounded-md transition-colors ml-3"
                              aria-label="Edit display name"
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Email */}
                      {isOwner && (
                        <div className="flex items-center py-3 border-b border-border">
                          <div className="flex-1">
                            {editingField === 'email' ? (
                              <div className="space-y-2">
                                <Input 
                                  type="email"
                                  placeholder="Email" 
                                  className="text-sm placeholder:text-muted-foreground"
                                  value={editForm.email} 
                                  onChange={(e) => handleEditFormChange('email', e.target.value)} 
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm"
                                    onClick={() => {
                                      setEditingField(null);
                                      setEditForm(prev => ({ ...prev, email: currentUserEmail || '' }));
                                    }}
                                    variant="outline"
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={async () => {
                                      await handleSaveProfile();
                                      setEditingField(null);
                                    }}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm text-muted-foreground">Email</div>
                                <div className="text-sm font-medium text-foreground">
                                  {editForm.email || "Add email"}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <Lock className="h-3 w-3" />
                                  <span>Only me</span>
                                </div>
                              </div>
                            )}
                          </div>
                          {editingField !== 'email' && (
                            <button
                              onClick={() => {
                                setEditingField('email');
                                setEditForm(prev => ({ ...prev, email: currentUserEmail || '' }));
                              }}
                              className="p-1 hover:bg-accent rounded-md transition-colors ml-3"
                              aria-label="Edit email"
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      )}


                      {/* Gender - only show if not "only_me" or if owner */}
                      {(isOwner || editForm.gender_privacy !== 'only_me') && (
                        <div className="flex items-center py-2 border-b border-border">
                          <div className="flex-1">
                             {editingField === 'gender' && isOwner ? (
                               <div className="space-y-2">
                                 <Select value={editForm.gender} onValueChange={(value) => handleEditFormChange('gender', value)}>
                                   <SelectTrigger className="text-sm">
                                     <SelectValue placeholder="Gender" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="male">Male</SelectItem>
                                     <SelectItem value="female">Female</SelectItem>
                                   </SelectContent>
                                 </Select>
                                 <Select value={editForm.gender_privacy} onValueChange={(value) => handleEditFormChange('gender_privacy', value)}>
                                   <SelectTrigger className="text-sm">
                                     <SelectValue placeholder="Privacy" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="public">🌐 Public</SelectItem>
                                     <SelectItem value="friends">👥 Friends</SelectItem>
                                     <SelectItem value="only_me">🔒 Only me</SelectItem>
                                   </SelectContent>
                                 </Select>
                                 <div className="flex gap-2">
                                   <Button 
                                     size="sm"
                                     onClick={() => {
                                       setEditingField(null);
                                       setEditForm(prev => ({ ...prev, gender: data?.gender || '', gender_privacy: 'public' }));
                                     }}
                                     variant="outline"
                                   >
                                     Cancel
                                   </Button>
                                   <Button 
                                     size="sm"
                                     onClick={async () => {
                                       await handleSaveProfile();
                                       setEditingField(null);
                                     }}
                                   >
                                     Save
                                   </Button>
                                 </div>
                               </div>
                             ) : (
                               <div>
                                 <div className="flex items-center">
                                   <span className="text-sm text-muted-foreground">Gender</span>
                                   <span className="ml-3 text-sm font-medium text-foreground">
                                     {profile?.gender ? (profile.gender === 'male' ? 'Male' : 'Female') : "Add gender"}
                                   </span>
                                 </div>
                                 {/* Hide privacy settings for non-owners */}
                                 {isOwner && (
                                   <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                     <Lock className="h-3 w-3" />
                                     <span>
                                       {editForm.gender_privacy === 'public' ? 'Public' : 
                                        editForm.gender_privacy === 'friends' ? 'Friends' : 'Only me'}
                                     </span>
                                   </div>
                                 )}
                               </div>
                            )}
                          </div>
                           {isOwner && editingField !== 'gender' && (
                             <button
                               onClick={() => {
                                 setEditingField('gender');
                                 setEditForm(prev => ({ ...prev, gender: data?.gender || '', gender_privacy: 'public' }));
                               }}
                              className="p-1 hover:bg-accent rounded-md transition-colors ml-3"
                              aria-label="Edit gender"
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      )}

                       {/* Date of birth - only show if not "only_me" or if owner */}
                       {(isOwner || editForm.birthdate_privacy !== 'only_me') && (
                         <div className="flex items-center py-2 border-b border-border">
                           <div className="flex-1">
                             {editingField === 'birthdate' && isOwner ? (
                                <div className="space-y-2">
                                  <Input 
                                    type="date"
                                    className="text-sm"
                                    value={editForm.birthdate || ''} 
                                    onChange={(e) => handleEditFormChange('birthdate', e.target.value)}
                                    autoFocus
                                  />
                                 <Select value={editForm.birthdate_privacy} onValueChange={(value) => handleEditFormChange('birthdate_privacy', value)}>
                                   <SelectTrigger className="text-sm">
                                     <SelectValue placeholder="Privacy" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="public">🌐 Public</SelectItem>
                                     <SelectItem value="friends">👥 Friends</SelectItem>
                                     <SelectItem value="only_me">🔒 Only me</SelectItem>
                                   </SelectContent>
                                 </Select>
                                 <div className="flex gap-2">
                                    <Button 
                                      size="sm"
                                      onClick={() => {
                                        setEditingField(null);
                                        setEditForm(prev => ({ ...prev, birthdate: data?.birthdate || '', birthdate_privacy: 'only_me' }));
                                      }}
                                      variant="outline"
                                    >
                                      Cancel
                                   </Button>
                                   <Button 
                                     size="sm"
                                     onClick={async () => {
                                       await handleSaveProfile();
                                       setEditingField(null);
                                     }}
                                   >
                                     Save
                                   </Button>
                                 </div>
                               </div>
                             ) : (
                               <div>
                                 <div className="flex items-center">
                                   <span className="text-sm text-muted-foreground">Date of birth</span>
                                   <span className="ml-3 text-sm font-medium text-foreground">
                                     {profile?.birthdate ? new Date(profile.birthdate).toLocaleDateString('en-GB', {
                                       day: 'numeric',
                                       month: 'long',
                                       year: 'numeric'
                                     }) : "Add date of birth"}
                                   </span>
                                 </div>
                                 {/* Hide privacy settings for non-owners */}
                                 {isOwner && (
                                   <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                     <Lock className="h-3 w-3" />
                                     <span>
                                       {editForm.birthdate_privacy === 'public' ? 'Public' : 
                                        editForm.birthdate_privacy === 'friends' ? 'Friends' : 'Only me'}
                                     </span>
                                   </div>
                                 )}
                               </div>
                             )}
                           </div>
                           {isOwner && editingField !== 'birthdate' && (
                              <button
                                onClick={() => {
                                  setEditingField('birthdate');
                                  setEditForm(prev => ({ ...prev, birthdate: data?.birthdate || '', birthdate_privacy: 'only_me' }));
                                }}
                                className="p-1 hover:bg-accent rounded-md transition-colors ml-3"
                                aria-label="Edit date of birth"
                              >
                               <Pencil className="h-4 w-4 text-muted-foreground" />
                             </button>
                           )}
                         </div>
                       )}
                      
                      {/* Country - only show if not "only_me" or if owner */}
                      {(isOwner || editForm.country_privacy !== 'only_me') && (
                        <div className="flex items-center py-2 border-b border-border">
                          <div className="flex-1">
                            {editingField === 'country' && isOwner ? (
                              <div className="space-y-2">
                                <SearchableSelect
                                  value={editForm.country}
                                  onValueChange={(value) => handleEditFormChange('country', value)}
                                  options={countryOptions}
                                  placeholder="Country"
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm"
                                    onClick={() => {
                                      setEditingField(null);
                                      setEditForm(prev => ({ ...prev, country: profile.country || '' }));
                                    }}
                                    variant="outline"
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={async () => {
                                      await handleSaveProfile();
                                      setEditingField(null);
                                    }}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center">
                                  <span className="text-sm text-muted-foreground">Country</span>
                                  <span className="ml-3 text-sm font-medium text-foreground">
                                    {profile?.country || "Add country"}
                                  </span>
                                </div>
                                {/* Hide privacy settings for non-owners */}
                                {isOwner && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Lock className="h-3 w-3" />
                                    <span>
                                      {editForm.country_privacy === 'public' ? 'Public' : 
                                       editForm.country_privacy === 'friends' ? 'Friends' : 'Only me'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {isOwner && editingField !== 'country' && (
                            <button
                              onClick={() => {
                                setEditingField('country');
                                setEditForm(prev => ({ ...prev, country: profile.country || '' }));
                              }}
                              className="p-1 hover:bg-accent rounded-md transition-colors ml-3"
                              aria-label="Edit country"
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Bio - only show to owner */}
                      {isOwner && (
                        <div className="flex items-center py-3">
                          <div className="flex-1">
                            {editingField === 'bio' ? (
                              <div className="space-y-2">
                                <Input 
                                  placeholder="About Me" 
                                  className="text-sm placeholder:text-muted-foreground"
                                  value={editForm.bio} 
                                  onChange={(e) => handleEditFormChange('bio', e.target.value)} 
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                   <Button 
                                     size="sm"
                                     onClick={() => {
                                       setEditingField(null);
                                       setEditForm(prev => ({ ...prev, bio: data?.bio || '' }));
                                    }}
                                    variant="outline"
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={async () => {
                                      await handleSaveProfile();
                                      setEditingField(null);
                                    }}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm text-muted-foreground">About Me</div>
                                <div className="text-sm font-medium text-foreground">
                                  {profile?.bio || "Add bio"}
                                </div>
                              </div>
                            )}
                          </div>
                          {editingField !== 'bio' && (
                             <button
                               onClick={() => {
                                 setEditingField('bio');
                                 setEditForm(prev => ({ ...prev, bio: data?.bio || '' }));
                              }}
                              className="p-1 hover:bg-accent rounded-md transition-colors ml-3"
                              aria-label="Edit bio"
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      )}

                      {!profile?.display_name && !profile?.gender && !profile?.country && !profile?.bio && !isOwner && (
                        <p className="text-muted-foreground text-center py-8">Нет информации для отображения</p>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {/* Photo Modal */}
      <PhotoModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        photos={profilePhotos}
        currentIndex={selectedPhotoIndex}
        contestantName={profile.display_name || "Пользователь"}
        age={profile.birthdate ? new Date().getFullYear() - new Date(profile.birthdate).getFullYear() : undefined}
        weight={profile.weight_kg || undefined}
        height={profile.height_cm || undefined}
        country={profile.country || undefined}
        city={profile.city || undefined}
      />

      {/* Profile Photo Modal */}
      <ProfilePhotoModal
        isOpen={profilePhotoModalOpen}
        onClose={() => setProfilePhotoModalOpen(false)}
        photos={profilePhotos}
        currentIndex={selectedPhotoIndex}
        profileId={id || ""}
        profileName={profile.display_name || "Пользователь"}
      />

    </div>
  );
};

export default Profile;