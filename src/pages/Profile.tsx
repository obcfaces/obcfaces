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
import { LogOut, Eye, EyeOff, UserIcon, MapPin, Pencil, Lock, MessageCircle, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import PostCard from "@/components/profile/PostCard";
import LikedItem from "@/components/profile/LikedItem";
import { PhotoModal } from "@/components/photo-modal";
import { ProfilePhotoModal } from "@/components/profile-photo-modal";
import { ContestParticipationModal } from "@/components/contest-participation-modal";
import CreatePostModal from "@/components/create-post-modal";
import { REJECTION_REASONS } from "@/components/reject-reason-modal";
import c1 from "@/assets/contestant-1.jpg";
import c2 from "@/assets/contestant-2.jpg";
import c3 from "@/assets/contestant-3.jpg";
import c1face from "@/assets/contestant-1-face.jpg";
import c2face from "@/assets/contestant-2-face.jpg";
import c3face from "@/assets/contestant-3-face.jpg";
import { AlignJustify, Grid2X2, Edit } from "lucide-react";

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
  console.log('Profile: Component rendering');
  
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  
  // Participation photo editing states
  const [editingParticipation, setEditingParticipation] = useState(false);
  const [participantPhoto1File, setParticipantPhoto1File] = useState<File | null>(null);
  const [participantPhoto2File, setParticipantPhoto2File] = useState<File | null>(null);
  const [uploadingParticipantPhotos, setUploadingParticipantPhotos] = useState(false);
  
  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalData, setEditModalData] = useState<any>(null);
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
  const [contestApplication, setContestApplication] = useState<any>(null);
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

  const profile = data;
  const isOwner = currentUserId && currentUserId === id;

  // ALL useEffect hooks MUST be at the top level, before any conditional returns
  
  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!id) {
        console.log('Profile: No user ID provided');
        return;
      }
      
      console.log('Profile: Loading profile for ID:', id);
      setLoading(true);
      
      try {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("display_name, first_name, last_name, birthdate, height_cm, weight_kg, avatar_url, city, country, bio, gender")
          .eq("id", id)
          .maybeSingle();
        
        if (error) {
          console.error('Profile: Error loading profile:', error);
          setData(null);
        } else {
          console.log('Profile: Loaded profile data:', profileData);
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
        }
        
        // Load real follower/following counts
        try {
          const { data: followStats, error: followError } = await supabase.rpc('get_follow_stats', { target_user_id: id });
          if (followError) {
            console.error('Profile: Error loading follow stats:', followError);
          } else if (followStats && followStats.length > 0) {
            setFollowersCount(followStats[0]?.followers_count || 0);
            setFollowingCount(followStats[0]?.following_count || 0);
          } else {
            setFollowersCount(0);
            setFollowingCount(0);
          }
        } catch (followStatsError) {
          console.error('Profile: Error in follow stats:', followStatsError);
          setFollowersCount(0);
          setFollowingCount(0);
        }
      } catch (error) {
        console.error("Profile: Error loading profile:", error);
        setData(null);
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

  // Load posts
  useEffect(() => {
    const loadUserPosts = async () => {
      if (!id) return;
      
      setLoadingPosts(true);
      try {
        const { data: posts, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error loading posts:', error);
        } else {
          setUserPosts(posts || []);
        }
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadUserPosts();
  }, [id]);

  // Load liked items
  useEffect(() => {
    const loadLikedItems = async () => {
      if (!id) return;
      
      setLoadingLikes(true);
      try {
        const { data: likes, error } = await supabase
          .from('likes')
          .select('*')
          .eq('user_id', id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error loading likes:', error);
        } else {
          setLikedItems(likes || []);
        }
      } catch (error) {
        console.error('Error loading likes:', error);
      } finally {
        setLoadingLikes(false);
      }
    };

    if (activeTab === 'likes') {
      loadLikedItems();
    }
  }, [id, activeTab]);

  // Show loading state if profile data is not loaded yet
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  // If no profile data found after loading
  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Профиль не найден</h2>
          <p className="text-muted-foreground">Пользователь с таким ID не существует</p>
        </div>
      </div>
    );
  }

  // Handler functions
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
      toast({ description: "Error changing subscription" });
    } finally {
      setLoadingFollow(false);
    }
  };

  const handleMessage = () => {
    if (!currentUserId) {
      toast({ description: "Войдите в систему для отправки сообщений" });
      return;
    }
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
      toast({ description: "Bio saved" });
    } catch (error) {
      toast({ description: "Error saving bio" });
    } finally {
      setSavingBio(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{profile?.display_name || "Профиль пользователя"}</title>
        <meta name="description" content={`Профиль ${profile?.display_name || "пользователя"}`} />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-card rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback>
                <UserIcon className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">
                {profile?.display_name || "Пользователь"}
              </h1>
              
              {profile?.country && (
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.country}</span>
                </div>
              )}

              <div className="flex gap-6 text-sm text-muted-foreground mb-4">
                <div>
                  <span className="font-semibold text-foreground">{followersCount}</span> подписчиков
                </div>
                <div>
                  <span className="font-semibold text-foreground">{followingCount}</span> подписок
                </div>
              </div>

              {/* Action Buttons */}
              {!isOwner && currentUserId && (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleFollowToggle}
                    disabled={loadingFollow}
                    variant={isFollowing ? "outline" : "default"}
                  >
                    {isFollowing ? "Отписаться" : "Подписаться"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleMessage}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Сообщение
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">Посты</TabsTrigger>
            <TabsTrigger value="about">О себе</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            {loadingPosts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Загрузка постов...</p>
              </div>
            ) : userPosts.length > 0 ? (
              <div className="grid gap-4">
                {userPosts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    id={post.id}
                    authorName={profile?.display_name || "Пользователь"}
                    authorAvatarUrl={profile?.avatar_url}
                    authorProfileId={id}
                    time={post.created_at}
                    content={post.content || ''}
                    likes={post.likes || 0}
                    comments={post.comments || 0}
                    mediaUrls={post.photos || []}
                    isOwnPost={isOwner}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Постов пока нет</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="space-y-4">
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Информация о пользователе</h3>
              <div className="space-y-3 text-sm">
                {profile?.gender && (
                  <div>
                    <span className="text-muted-foreground">Пол:</span>
                    <span className="ml-2">{profile.gender}</span>
                  </div>
                )}
                {profile?.birthdate && (
                  <div>
                    <span className="text-muted-foreground">Дата рождения:</span>
                    <span className="ml-2">{new Date(profile.birthdate).toLocaleDateString()}</span>
                  </div>
                )}
                {profile?.height_cm && (
                  <div>
                    <span className="text-muted-foreground">Рост:</span>
                    <span className="ml-2">{profile.height_cm} см</span>
                  </div>
                )}
                {profile?.weight_kg && (
                  <div>
                    <span className="text-muted-foreground">Вес:</span>
                    <span className="ml-2">{profile.weight_kg} кг</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;