import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Eye, EyeOff, UserIcon, MapPin } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import PostCard from "@/components/profile/PostCard";
import LikedItem from "@/components/profile/LikedItem";
import { PhotoModal } from "@/components/photo-modal";
import { ContestParticipationModal } from "@/components/contest-participation-modal";
import c1 from "@/assets/contestant-1.jpg";
import c2 from "@/assets/contestant-2.jpg";
import c3 from "@/assets/contestant-3.jpg";
import c1face from "@/assets/contestant-1-face.jpg";
import c2face from "@/assets/contestant-2-face.jpg";
import c3face from "@/assets/contestant-3-face.jpg";
import listIcon from "@/assets/icons/sdisplay-list.png";
import listActiveIcon from "@/assets/icons/sdisplay-list-active.png";
import tableIcon from "@/assets/icons/sdisplay-table.png";
import tableActiveIcon from "@/assets/icons/sdisplay-table-active.png";

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
  const [editForm, setEditForm] = useState({
    display_name: '',
    gender: '',
    country: '',
    bio: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [savingProfile, setSavingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(true);
  const [likesViewMode, setLikesViewMode] = useState<'compact' | 'full'>('compact');
  const [participationItems, setParticipationItems] = useState<any[]>([]);
  const [loadingParticipation, setLoadingParticipation] = useState(true);
  const [participationViewMode, setParticipationViewMode] = useState<'compact' | 'full'>('compact');
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Sample photos for gallery
  const profilePhotos = [c1, c2, c3, c1, c2, c3];

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
        
        // Get follower/following counts (mock for now)
        setFollowersCount(Math.floor(Math.random() * 1000) + 100);
        setFollowingCount(Math.floor(Math.random() * 500) + 50);
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

  // Check following status
  useEffect(() => {
    if (!currentUserId || !id || currentUserId === id) return;
    // Mock following status for now
    setIsFollowing(Math.random() > 0.5);
  }, [currentUserId, id]);

  const handleFollowToggle = async () => {
    if (!currentUserId || currentUserId === id) return;
    
    setLoadingFollow(true);
    try {
      // Toggle following status (mock for now)
      const newFollowingStatus = !isFollowing;
      setIsFollowing(newFollowingStatus);
      setFollowersCount(prev => newFollowingStatus ? prev + 1 : prev - 1);
      
      toast({ 
        description: newFollowingStatus ? "Подписались" : "Отписались"
      });
    } catch (error) {
      toast({ 
        description: "Ошибка при изменении подписки" 
      });
    } finally {
      setLoadingFollow(false);
    }
  };

  const handleMessage = () => {
    toast({ description: "Функция сообщений в разработке" });
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

  const initEditForm = () => {
    setEditForm({
      display_name: profile.display_name || '',
      gender: data?.gender || '',
      country: profile.country || '',
      bio: profile.bio || '',
      email: currentUserId ? '' : '', // We'll need to get this from auth
      password: ''
    });
    setIsEditingProfile(true);
    setActiveTab('About');
    setSubmitted(false);
    setInvalidFields(new Set());
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
      // Update profile data
      const updates: any = {
        display_name: editForm.display_name,
        gender: editForm.gender,
        country: editForm.country,
        bio: editForm.bio
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id);
      
      if (profileError) throw profileError;

      // Update email if provided
      if (editForm.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editForm.email
        });
        if (emailError) throw emailError;
      }

      // Update password if provided
      if (editForm.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: editForm.password
        });
        if (passwordError) throw passwordError;
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

  useEffect(() => {
    loadParticipationItems();
  }, [currentUserId, id]);

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
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                <AvatarImage src={profile.avatar_url || ""} alt={`Avatar of ${profile.display_name || "User"}`} />
                <AvatarFallback className="text-lg">
                  {(profile.display_name || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
               <div>
                <h1 className="text-2xl font-bold">
                  {profile.first_name && profile.last_name 
                    ? `${profile.first_name} ${profile.last_name}` 
                    : (profile.display_name || "Пользователь")
                  }
                </h1>
                {profile.country && (
                  <p className="text-muted-foreground">
                    {profile.country}
                  </p>
                )}
               </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ContestParticipationModal>
                <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                  🏆 Join Contest
                </Button>
              </ContestParticipationModal>
               <Button variant="outline">Add Post</Button>
               {isOwner && (
                 <Button variant="outline" onClick={initEditForm}>Edit Profile</Button>
               )}
            </div>

            {!isOwner && (
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-xl font-semibold">{followersCount}</div>
                  <div className="text-sm text-muted-foreground">Подписчики</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold">{followingCount}</div>
                  <div className="text-sm text-muted-foreground">Подписки</div>
                </div>
              </div>
            )}

          </div>

          {/* Tabs */}
          <Tabs defaultValue="likes" value={isEditingProfile ? "about" : activeTab} className="mt-8">
            <TabsList className="w-full bg-transparent p-0 rounded-none justify-start gap-2 sm:gap-8 border-b border-border overflow-x-auto">
              <TabsTrigger value="likes" className="px-0 mr-2 sm:mr-6 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground text-sm sm:text-base whitespace-nowrap">Likes</TabsTrigger>
              <TabsTrigger value="posts" className="px-0 mr-2 sm:mr-6 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground text-sm sm:text-base whitespace-nowrap">Posts</TabsTrigger>
              <TabsTrigger value="photos" className="px-0 mr-2 sm:mr-6 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground text-sm sm:text-base whitespace-nowrap">Photos</TabsTrigger>
              <TabsTrigger value="participation" className="px-0 mr-2 sm:mr-6 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground text-sm sm:text-base whitespace-nowrap">Participation</TabsTrigger>
              <TabsTrigger value="about" className="px-0 mr-2 sm:mr-6 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground text-sm sm:text-base whitespace-nowrap">About</TabsTrigger>
              {isOwner && (
                <button
                  onClick={logout}
                  disabled={logoutLoading}
                  className="px-0 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  title="Выйти"
                >
                  {logoutLoading ? (
                    <div className="w-[18px] h-[18px] border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut size={18} />
                  )}
                </button>
              )}
            </TabsList>

            <TabsContent value="likes" className="mt-8 -mx-6">
                {loadingLikes ? (
                  <p className="text-muted-foreground text-center py-8 px-6">Загрузка лайков...</p>
                ) : likedItems.length > 0 ? (
                  <div className="px-0 sm:px-6">
                    {/* View mode toggle buttons */}
                    <div className="flex justify-end items-center gap-1 mb-4 px-6 sm:px-0">

                      <button
                        type="button"
                        onClick={() => setLikesViewMode("compact")}
                        aria-pressed={likesViewMode === "compact"}
                        aria-label="List view"
                        className="p-1 rounded-md hover:bg-accent transition-colors"
                      >
                        <img
                          src={likesViewMode === "compact" ? listActiveIcon : listIcon}
                          alt="List view icon"
                          width={28}
                          height={28}
                          loading="lazy"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setLikesViewMode("full")}
                        aria-pressed={likesViewMode === "full"}
                        aria-label="Grid view"
                        className="p-1 rounded-md hover:bg-accent transition-colors"
                      >
                        <img
                          src={likesViewMode === "full" ? tableActiveIcon : tableIcon}
                          alt="Grid view icon"
                          width={28}
                          height={28}
                          loading="lazy"
                        />
                      </button>
                    </div>
                    
                    {/* Liked items grid */}
                    <div className={`grid gap-1 sm:gap-3 ${
                      likesViewMode === 'compact' 
                        ? 'grid-cols-1' 
                        : 'grid-cols-1 lg:grid-cols-2'
                    }`}>
                      {likedItems.map((item) => (
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
                          onUnlike={handleUnlike}
                          viewMode={likesViewMode}
                          candidateData={item.candidateData}
                          participantType={item.participantType}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 px-6">
                    <p className="text-muted-foreground">Вы еще ничего не лайкали</p>
                    <p className="text-sm text-muted-foreground mt-2">Лайкните посты и фото, чтобы они отображались здесь</p>
                  </div>
                )}
              </TabsContent>

            <TabsContent value="posts" className="space-y-4 mt-8 -mx-6">
              <div className="px-0 sm:px-6 space-y-4">
                {samplePosts.map((p) => (
                  <PostCard key={p.id} {...p} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="photos" className="mt-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {profilePhotos.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPhotoIndex(idx);
                      setPhotoModalOpen(true);
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
            </TabsContent>

            <TabsContent value="participation" className="mt-8 -mx-6">
              {loadingParticipation ? (
                <p className="text-muted-foreground text-center py-8 px-6">Загрузка участий...</p>
              ) : participationItems.length > 0 ? (
                <div className="px-0 sm:px-6">
                  {/* View mode toggle buttons */}
                  <div className="flex justify-end items-center gap-1 mb-4 px-6 sm:px-0">
                    <button
                      type="button"
                      onClick={() => setParticipationViewMode("compact")}
                      aria-pressed={participationViewMode === "compact"}
                      aria-label="List view"
                      className="p-1 rounded-md hover:bg-accent transition-colors"
                    >
                      <img
                        src={participationViewMode === "compact" ? listActiveIcon : listIcon}
                        alt="List view icon"
                        width={28}
                        height={28}
                        loading="lazy"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setParticipationViewMode("full")}
                      aria-pressed={participationViewMode === "full"}
                      aria-label="Grid view"
                      className="p-1 rounded-md hover:bg-accent transition-colors"
                    >
                      <img
                        src={participationViewMode === "full" ? tableActiveIcon : tableIcon}
                        alt="Grid view icon"
                        width={28}
                        height={28}
                        loading="lazy"
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
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Input 
                      placeholder="Имя на сайте" 
                      className={getFieldClasses('display_name', "text-sm placeholder:text-muted-foreground")}
                      value={editForm.display_name} 
                      onChange={(e) => handleEditFormChange('display_name', e.target.value)} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Select value={editForm.gender} onValueChange={(value) => handleEditFormChange('gender', value)}>
                      <SelectTrigger className={getFieldClasses('gender', "text-sm")}>
                        <SelectValue placeholder="Пол" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Мужской</SelectItem>
                        <SelectItem value="female">Женский</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Input 
                      placeholder="Страна" 
                      className={getFieldClasses('country', "text-sm placeholder:text-muted-foreground")}
                      value={editForm.country} 
                      onChange={(e) => handleEditFormChange('country', e.target.value)} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Input 
                      placeholder="О себе" 
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
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Новый пароль (оставьте пустым если не хотите менять)" 
                        className="pr-10 text-sm placeholder:text-muted-foreground"
                        value={editForm.password} 
                        onChange={(e) => handleEditFormChange('password', e.target.value)} 
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
                  
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Отмена
                    </Button>
                    <Button onClick={handleSaveProfile}>
                      Сохранить
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">{profile?.bio || "Информация о себе не указана"}</p>
                  {profile?.gender && (
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{profile.gender === 'male' ? 'Мужской' : 'Женский'}</span>
                    </div>
                  )}
                  {profile?.country && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{profile.country}</span>
                    </div>
                  )}
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
    </div>
  );
};

export default Profile;