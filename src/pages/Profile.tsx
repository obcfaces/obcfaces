import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "@/components/profile/PostCard";
import c1 from "@/assets/contestant-1.jpg";
import c2 from "@/assets/contestant-2.jpg";
import c3 from "@/assets/contestant-3.jpg";

interface ProfileRow {
  display_name: string | null;
  birthdate: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  avatar_url?: string | null;
  city?: string | null;
  country?: string | null;
}

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, birthdate, height_cm, weight_kg, avatar_url, city, country")
        .eq("id", id)
        .maybeSingle();
      setData(data ?? null);
      setLoading(false);
    };
    load();
  }, [id]);

  const title = data?.display_name ? `${data.display_name} — Профиль` : "Профиль пользователя";
  const description = data?.display_name ? `Личная страница ${data.display_name}` : "Личная страница пользователя";

  const initials = useMemo(() => {
    const name = data?.display_name ?? "User";
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? "U").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
  }, [data?.display_name]);

  const samplePosts = useMemo(
    () => [
      {
        id: "p1",
        authorName: data?.display_name ?? "Пользователь",
        authorAvatarUrl: data?.avatar_url ?? undefined,
        time: "2 ч. назад",
        content: "Сегодня тренировка прошла на ура! Готовлюсь к следующим соревнованиям.",
        imageSrc: c2,
        likes: 24,
        comments: 5,
      },
      {
        id: "p2",
        authorName: data?.display_name ?? "Пользователь",
        authorAvatarUrl: data?.avatar_url ?? undefined,
        time: "Вчера",
        content: "Спасибо всем за поддержку! Маленькие шаги приводят к большим победам.",
        likes: 18,
        comments: 3,
      },
    ], [data?.display_name, data?.avatar_url]
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
        ) : !data ? (
          <div>
            <header className="mb-4">
              <h1 className="text-2xl font-semibold">Профиль пользователя</h1>
              <p className="text-sm text-muted-foreground">Личная страница участника</p>
            </header>
            <p className="text-muted-foreground mb-3">Профиль не найден или приватен.</p>
            <Link to="/" className="text-primary underline">На главную</Link>
          </div>
        ) : (
          <>
            <header className="mb-4">
              <div className="h-40 sm:h-56 w-full rounded-lg bg-muted" role="img" aria-label="Обложка профиля" />
              <div className="-mt-8 sm:-mt-10 flex items-end gap-4 px-2 sm:px-4">
                <Avatar className="h-20 w-20 ring-2 ring-background">
                  <AvatarImage src={data.avatar_url ?? undefined} alt={`Аватар ${data.display_name ?? "пользователя"}`} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="pb-2">
                  <h1 className="text-2xl font-semibold leading-tight">{data.display_name ?? "Профиль пользователя"}</h1>
                  <p className="text-sm text-muted-foreground">
                    {data.city ? `${data.city}` : "Город не указан"}
                    {data.country ? `, ${data.country}` : ""}
                  </p>
                </div>
              </div>
            </header>

            <Tabs defaultValue="posts" className="mt-4">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="posts">Посты</TabsTrigger>
                <TabsTrigger value="photos">Фото</TabsTrigger>
                <TabsTrigger value="about">Инфо</TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="space-y-4 mt-4">
                {samplePosts.map((p) => (
                  <PostCard key={p.id} {...p} />
                ))}
              </TabsContent>

              <TabsContent value="photos" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[c1, c2, c3, c1, c2, c3].map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      loading="lazy"
                      alt={`Фото ${idx + 1} — ${data.display_name ?? "пользователь"}`}
                      className="w-full h-32 sm:h-36 object-cover rounded-md"
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="about" className="mt-4">
                <article className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">Имя:</span> {data.display_name ?? "—"}</p>
                    <p><span className="text-muted-foreground">Дата рождения:</span> {data.birthdate ?? "—"}</p>
                  </div>
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">Рост:</span> {data.height_cm ? `${data.height_cm} см` : "—"}</p>
                    <p><span className="text-muted-foreground">Вес:</span> {data.weight_kg ? `${data.weight_kg} кг` : "—"}</p>
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

