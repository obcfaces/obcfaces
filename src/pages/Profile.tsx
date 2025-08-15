import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import PostCard from "@/components/profile/PostCard";
import LikedItem from "@/components/profile/LikedItem";
import { PhotoModal } from "@/components/photo-modal";
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
  birthdate: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  avatar_url?: string | null;
  city?: string | null;
  country?: string | null;
  bio?: string | null;
}

const Profile = () => {
  const { id } = useParams<{ id: string }>();
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
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(true);
  const [likesViewMode, setLikesViewMode] = useState<'compact' | 'full'>('compact');
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Sample photos for gallery
  const profilePhotos = [c1, c2, c3, c1, c2, c3];

  // Demo profile for fallback
  const demoProfile: ProfileRow = {
    display_name: "Anna Petrova",
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
          .select("display_name, birthdate, height_cm, weight_kg, avatar_url, city, country, bio")
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
                <h1 className="text-2xl font-bold">{profile.display_name || "Пользователь"}</h1>
                {(profile.city || profile.country) && (
                  <p className="text-muted-foreground">
                    {[profile.city, profile.country].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                🏆 Join Contest
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">Create</Button>
              <Button variant="outline">Edit Profile</Button>
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
          <Tabs defaultValue="likes" className="mt-8">
            <TabsList className="w-full sm:w-auto bg-transparent p-0 rounded-none justify-start gap-8 border-b border-border">
              <TabsTrigger value="likes" className="px-0 mr-6 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground">Likes</TabsTrigger>
              <TabsTrigger value="posts" className="px-0 mr-6 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground">Posts</TabsTrigger>
              <TabsTrigger value="photos" className="px-0 mr-6 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground">Photos</TabsTrigger>
              <TabsTrigger value="about" className="px-0 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground">About</TabsTrigger>
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

            <TabsContent value="about" className="mt-8">
              <article className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p><span className="text-muted-foreground">Имя:</span> {profile.display_name ?? "—"}</p>
                  <p><span className="text-muted-foreground">Дата рождения:</span> {profile.birthdate ?? "—"}</p>
                </div>
                <div className="space-y-2">
                  <p><span className="text-muted-foreground">Рост:</span> {profile.height_cm ? `${profile.height_cm} см` : "—"}</p>
                  <p><span className="text-muted-foreground">Вес:</span> {profile.weight_kg ? `${profile.weight_kg} кг` : "—"}</p>
                </div>
              </article>
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