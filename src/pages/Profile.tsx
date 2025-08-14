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
import c1 from "@/assets/contestant-1.jpg";
import c2 from "@/assets/contestant-2.jpg";
import c3 from "@/assets/contestant-3.jpg";
import c1face from "@/assets/contestant-1-face.jpg";

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
    if (!currentUserId || currentUserId !== id) return;
    
    setLoadingLikes(true);
    try {
      // Mock liked items for now
      const mockLikedItems = [
        {
          likeId: "1",
          contentType: "contest" as const,
          contentId: "c1",
          authorName: "Elena Kozlova",
          authorProfileId: "profile-1",
          time: "2 часа назад",
          likes: 44,
          comments: 8
        },
        {
          likeId: "2",
          contentType: "post" as const,
          contentId: "p1",
          authorName: "Maria Smirnova",
          authorProfileId: "profile-2",
          time: "5 часов назад",
          content: "Beautiful sunset from my window",
          imageSrc: c2,
          likes: 23,
          comments: 4
        }
      ];
      setLikedItems(mockLikedItems);
    } catch (error) {
      console.error("Error loading liked items:", error);
    } finally {
      setLoadingLikes(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      loadLikedItems();
    }
  }, [isOwner, currentUserId, id]);

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
              <AvatarImage src={profile.avatar_url || ""} alt={`Avatar of ${profile.display_name || "User"}`} />
              <AvatarFallback className="text-lg">
                {(profile.display_name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{profile.display_name || "Пользователь"}</h1>
                  {(profile.city || profile.country) && (
                    <p className="text-muted-foreground">
                      {[profile.city, profile.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {!isOwner && (
                    <div className="flex items-center gap-6 mt-2">
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
                <div className="flex items-center gap-2">
                  {isOwner ? (
                    <Button asChild>
                      <Link to="/account">Редактировать профиль</Link>
                    </Button>
                  ) : (
                    <>
                      <Button variant={isFollowing ? "secondary" : "default"} onClick={handleFollowToggle} disabled={loadingFollow}>
                        {isFollowing ? "Отписаться" : "Подписаться"}
                      </Button>
                      <Button variant="outline" onClick={handleMessage}>Сообщение</Button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3">
                {isOwner ? (
                  isEditingBio ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full min-h-24 rounded-md border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={bioDraft}
                        onChange={(e) => setBioDraft(e.target.value)}
                        placeholder="Расскажите о себе…"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleBioSave} disabled={savingBio}>Сохранить</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setIsEditingBio(false); setBioDraft(data?.bio ?? ""); }}>Отмена</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {data?.bio ? (
                        <p>{data.bio}</p>
                      ) : (
                        <button className="underline" onClick={() => setIsEditingBio(true)}>Добавить текст "О себе"</button>
                      )}
                    </div>
                  )
                ) : (
                  profile.bio ? <p className="text-sm text-muted-foreground">{profile.bio}</p> : null
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="posts" className="mt-4">
            <TabsList className="w-full sm:w-auto bg-transparent p-0 rounded-none justify-start gap-8 border-b border-border">
              <TabsTrigger value="posts" className="px-0 mr-6 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground">Посты</TabsTrigger>
              <TabsTrigger value="photos" className="px-0 mr-6 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground">Фото</TabsTrigger>
              {isOwner && (
                <TabsTrigger value="likes" className="px-0 mr-6 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground">Лайки</TabsTrigger>
              )}
              <TabsTrigger value="about" className="px-0 h-auto pb-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground">Инфо</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4 mt-4">
              {samplePosts.map((p) => (
                <PostCard key={p.id} {...p} />
              ))}
            </TabsContent>

            <TabsContent value="photos" className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 sm:gap-3">
                {[c1, c2, c3, c1, c2, c3].map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    loading="lazy"
                    alt={`Фото ${idx + 1} — ${profile.display_name ?? "пользователь"}`}
                    className="w-full h-32 sm:h-36 object-cover rounded-none sm:rounded-md"
                  />
                ))}
              </div>
            </TabsContent>

            {isOwner && (
              <TabsContent value="likes" className="mt-4 -mx-6">
                {loadingLikes ? (
                  <p className="text-muted-foreground text-center py-8 px-6">Загрузка лайков...</p>
                ) : likedItems.length > 0 ? (
                  <div className="px-0 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-1 sm:gap-3">
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
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 px-6">
                    <p className="text-muted-foreground">Вы еще ничего не лайкали</p>
                    <p className="text-sm text-muted-foreground mt-2">Лайкните посты и фото, чтобы они отображались здесь</p>
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="about" className="mt-4">
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
    </div>
  );
};

export default Profile;