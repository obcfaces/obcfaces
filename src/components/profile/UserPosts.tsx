import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PostCard from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";

interface UserPostsProps {
  userId: string;
  isOwner: boolean;
}

export const UserPosts = ({ userId, isOwner }: UserPostsProps) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const { data: postsData, error } = await supabase
          .from("posts")
          .select(`
            *,
            profiles:user_id (
              display_name,
              avatar_url
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPosts(postsData || []);
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {isOwner ? "У вас пока нет постов" : "У пользователя пока нет постов"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          id={post.id}
          authorName={post.profiles?.display_name || "Пользователь"}
          authorAvatarUrl={post.profiles?.avatar_url}
          authorProfileId={post.user_id}
          time={new Date(post.created_at).toLocaleDateString()}
          content={post.caption || ""}
          mediaUrls={post.media_urls}
          mediaTypes={post.media_types}
          likes={post.likes_count || 0}
          comments={post.comments_count || 0}
        />
      ))}
    </div>
  );
};