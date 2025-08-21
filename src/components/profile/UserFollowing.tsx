import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { UserIcon } from "lucide-react";

interface UserFollowingProps {
  userId: string;
  currentUserId: string | null;
}

interface Following {
  followee_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const UserFollowing = ({ userId, currentUserId }: UserFollowingProps) => {
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFollowing = async () => {
      try {
        const { data: followingData, error } = await supabase
          .from("follows")
          .select(`
            followee_id,
            followee_profile:profiles!follows_followee_id_fkey (
              display_name,
              avatar_url
            )
          `)
          .eq("follower_id", userId);

        if (error) throw error;
        
        const formattedFollowing = followingData?.map(item => ({
          followee_id: item.followee_id,
          profiles: item.followee_profile || { display_name: null, avatar_url: null }
        })) || [];
        
        setFollowing(formattedFollowing);
      } catch (error) {
        console.error("Error loading following:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFollowing();
  }, [userId]);

  const handleUnfollow = async (targetUserId: string) => {
    if (!currentUserId || currentUserId !== userId) return;

    try {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("followee_id", targetUserId);

      setFollowing(prev => prev.filter(f => f.followee_id !== targetUserId));
    } catch (error) {
      console.error("Error unfollowing:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {currentUserId === userId ? "Вы ни на кого не подписаны" : "Пользователь ни на кого не подписан"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {following.map((follow) => (
        <div key={follow.followee_id} className="flex items-center justify-between p-4 border border-border rounded-lg">
          <Link 
            to={`/u/${follow.followee_id}`}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={follow.profiles?.avatar_url || ""} />
              <AvatarFallback>
                <UserIcon className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {follow.profiles?.display_name || "Пользователь"}
              </p>
            </div>
          </Link>
          
          {currentUserId === userId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUnfollow(follow.followee_id)}
            >
              Отписаться
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};