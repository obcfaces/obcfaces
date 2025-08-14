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
  
  // State for likes
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, birthdate, height_cm, weight_kg, avatar_url, city, country, bio")
        .eq("id", id)
        .maybeSingle();
      setData(data ?? null);
      setLoading(false);
    };
    load();
  }, [id]);

  // Get current user id
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  // Keep bio draft in sync
  useEffect(() => {
    setBioDraft(data?.bio ?? "");
  }, [data?.bio]);

// Demo profile fallback when profile is not found
const demoProfile: ProfileRow = {
  display_name: "Name Chall",
  birthdate: null,
  height_cm: 182,
  weight_kg: 53,
  avatar_url: c1face,
  city: "Negros",
  country: "Philippines",
  bio: "Участвую в текущем голосовании. Спасибо за поддержку!"
};
const profile: ProfileRow = data ?? demoProfile;

// Load followers/following counts
useEffect(() => {
  if (!id) return;
  const loadCounts = async () => {
  const { data, error } = await supabase.rpc('get_follow_stats', { target_user_id: id });
  if (!error && data && Array.isArray(data) && data[0]) {
    setFollowersCount((data[0] as any).followers_count ?? 0);
    setFollowingCount((data[0] as any).following_count ?? 0);
  } else if (!error && data && (data as any).followers_count !== undefined) {
    // Fallback if supabase returns a single object in future versions
    setFollowersCount((data as any).followers_count ?? 0);
    setFollowingCount((data as any).following_count ?? 0);
  } else {
    setFollowersCount(0);
    setFollowingCount(0);
  }
  };
  loadCounts();
}, [id]);

  // Check following state for current user
  useEffect(() => {
    if (!id || !currentUserId || currentUserId === id) {
      setIsFollowing(false);
      return;
    }
  (async () => {
    try {
      const { data } = await supabase.rpc('is_following', { target_user_id: id });
      setIsFollowing(Boolean(data));
    } catch {
      setIsFollowing(false);
    }
  })();
  }, [id, currentUserId]);

  const isOwner = currentUserId === (id ?? null);

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      toast({ description: "Войдите, чтобы подписываться." });
      return;
    }
    if (!id) return;
    setLoadingFollow(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .match({ follower_id: currentUserId, followee_id: id });
        if (error) throw error;
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, followee_id: id });
        if (error) throw error;
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
      }
    } catch (e) {
      toast({ description: "Не удалось выполнить действие. Попробуйте позже." });
    } finally {
      setLoadingFollow(false);
    }
  };

  const handleMessage = () => {
    toast({ description: "Сообщения скоро будут доступны." });
  };

  const handleBioSave = async () => {
    if (!currentUserId || !isOwner) return;
    setSavingBio(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bio: bioDraft })
        .eq("id", currentUserId);
      if (error) throw error;
      setData((prev) => (prev ? { ...prev, bio: bioDraft } : prev));
      setIsEditingBio(false);
      toast({ description: "Описание обновлено." });
    } catch (e) {
      toast({ description: "Не удалось сохранить описание." });
    } finally {
      setSavingBio(false);
    }
  };

  // Load user's liked items
  const loadLikedItems = async () => {
    if (!isOwner || !currentUserId) return;
    
    setLoadingLikes(true);
    try {
      const { data, error } = await supabase
        .from("likes")
        .select("id, content_type, content_id, created_at")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Create mock data for liked items since we don't have actual content tables
      const mockLikedItems = (data || []).map((like, index) => ({
        likeId: like.id,
        contentType: like.content_type,
        contentId: like.content_id,
        authorName: profile.display_name ?? "Пользователь",
        authorAvatarUrl: profile.avatar_url,
        authorProfileId: id, // Add profile ID for linking
        time: new Date(like.created_at).toLocaleDateString('ru-RU'),
        content: like.content_type === 'post' 
          ? `Это ${like.content_type === 'post' ? 'пост' : 'контент'}, который вам понравился`
          : undefined,
        imageSrc: like.content_type === 'photo' ? [c1, c2, c3][index % 3] : undefined,
        likes: Math.floor(Math.random() * 50) + 5,
        comments: Math.floor(Math.random() * 20) + 1,
      }));
      
      setLikedItems(mockLikedItems);
    } catch (error) {
      console.error("Error loading liked items:", error);
    } finally {
      setLoadingLikes(false);
    }
  };

  // Load likes when owner visits their own profile and refresh when needed
  useEffect(() => {
    if (isOwner && currentUserId) {
      loadLikedItems();
    }
  }, [isOwner, currentUserId]);

  // Listen for likes updates to refresh the list
  useEffect(() => {
    if (!isOwner || !currentUserId) return;

    const channel = supabase
      .channel('likes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `user_id=eq.${currentUserId}`
        },
        () => {
          loadLikedItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOwner, currentUserId]);

  const handleUnlike = (likeId: string) => {
    setLikedItems(prev => prev.filter(item => item.likeId !== likeId));
  };

const title = profile.display_name ? `${profile.display_name} — Профиль` : "Профиль пользователя";
const description = profile.display_name ? `Личная страница ${profile.display_name}` : "Личная страница пользователя";

const initials = useMemo(() => {
  const name = profile.display_name ?? "User";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "U").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}, [profile.display_name]);

const samplePosts = useMemo(
  () => [
    {
      id: "p1",
      authorName: profile.display_name ?? "Пользователь",
      authorAvatarUrl: profile.avatar_url ?? undefined,
      authorProfileId: id,
      time: "2 ч. назад",
      content: "Сегодня тренировка прошла на ура! Готовлюсь к следующим соревнованиям.",
      imageSrc: c2,
      likes: 24,
      comments: 5,
    },
    {
      id: "p2",
      authorName: profile.display_name ?? "Пользователь",
      authorAvatarUrl: profile.avatar_url ?? undefined,
      authorProfileId: id,
      time: "Вчера",
      content: "Спасибо всем за поддержку! Маленькие шаги приводят к большим победам.",
      likes: 18,
      comments: 3,
    },
  ], [profile.display_name, profile.avatar_url, id]
);

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${window.location.origin}/u/${id ?? ""}`} />
      </Helmet>

      <section className="container mx-auto max-w-3xl py-8 px-4">
{loading ? (
          <p className="text-muted-foreground">Загрузка…</p>
        ) : (
          <>

            <header className="mb-4 px-0 sm:px-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 ring-2 ring-background">
                  <AvatarImage src={profile.avatar_url ?? undefined} alt={`Аватар ${profile.display_name ?? "пользователя"}`} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-semibold leading-tight">{profile.display_name ?? "Профиль пользователя"}</h1>
                  <p className="text-sm text-muted-foreground">
                    {profile.city ? `${profile.city}` : "Город не указан"}
                    {profile.country ? `, ${profile.country}` : ""}
                  </p>
                </div>
              </div>
            </header>

            <div className="px-0 sm:px-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {isOwner && (
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
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
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
                        <Button size="sm" variant="ghost" onClick={() => { setIsEditingBio(false); setBioDraft(data.bio ?? ""); }}>Отмена</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {data.bio ? (
                        <p>{data.bio}</p>
                      ) : (
                        <button className="underline" onClick={() => setIsEditingBio(true)}>Добавить текст “О себе”</button>
                      )}
                    </div>
                  )
                ) : (
                  profile.bio ? <p className="text-sm text-muted-foreground">{profile.bio}</p> : null
                )}
              </div>
            </div>

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
          </>
        )}
      </section>
    </main>
  );
};

export default Profile;

