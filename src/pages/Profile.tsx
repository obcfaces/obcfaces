import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProfileRow {
  display_name: string | null;
  birthdate: string | null;
  height_cm: number | null;
  weight_kg: number | null;
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
        .select("display_name, birthdate, height_cm, weight_kg")
        .eq("id", id)
        .maybeSingle();
      setData(data ?? null);
      setLoading(false);
    };
    load();
  }, [id]);

  const title = data?.display_name ? `${data.display_name} — Профиль` : "Профиль пользователя";
  const description = data?.display_name ? `Личная страница ${data.display_name}` : "Личная страница пользователя";

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${window.location.origin}/u/${id ?? ""}`} />
      </Helmet>
      <section className="container mx-auto max-w-2xl py-10 px-4">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">{data?.display_name ?? "Профиль пользователя"}</h1>
          <p className="text-sm text-muted-foreground">Личная страница участника</p>
        </header>
        {loading ? (
          <p className="text-muted-foreground">Загрузка…</p>
        ) : !data ? (
          <div>
            <p className="text-muted-foreground mb-3">Профиль не найден или приватен.</p>
            <Link to="/" className="text-primary underline">На главную</Link>
          </div>
        ) : (
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
        )}
      </section>
    </main>
  );
};

export default Profile;
