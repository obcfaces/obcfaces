import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { UserIcon } from "lucide-react";

interface UserFollowersProps {
  userId: string;
  currentUserId: string | null;
}

interface Follower {
  follower_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const UserFollowers = ({ userId, currentUserId }: UserFollowersProps) => {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadFollowers = async () => {
      try {
        const { data: followersData, error } = await supabase
          .from("follows")
          .select(`
            follower_id,
            follower_profile:profiles!follows_follower_id_fkey (
              display_name,
              avatar_url
            )
          `)
          .eq("followee_id", userId);

        if (error) throw error;
        
        const formattedFollowers = followersData?.map(item => ({
          follower_id: item.follower_id,
          profiles: item.follower_profile || { display_name: null, avatar_url: null }
        })) || [];
        
        setFollowers(formattedFollowers);

        // Check following status for current user
        if (currentUserId) {
          const followerIds = followersData?.map(f => f.follower_id) || [];
          const { data: followingData } = await supabase
            .from("follows")
            .select("followee_id")
            .eq("follower_id", currentUserId)
            .in("followee_id", followerIds);

          const followingSet = new Set(followingData?.map(f => f.followee_id) || []);
          const statusMap: Record<string, boolean> = {};
          followerIds.forEach(id => {
            statusMap[id] = followingSet.has(id);
          });
          setFollowingStatus(statusMap);
        }
      } catch (error) {
        console.error("Error loading followers:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFollowers();
  }, [userId, currentUserId]);

  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
      const isCurrentlyFollowing = followingStatus[targetUserId];
      
      if (isCurrentlyFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("followee_id", targetUserId);
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, followee_id: targetUserId });
      }

      setFollowingStatus(prev => ({
        ...prev,
        [targetUserId]: !isCurrentlyFollowing
      }));
    } catch (error) {
      console.error("Error toggling follow:", error);
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

  if (followers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Пока нет подписчиков</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {followers.map((follower) => (
        <div key={follower.follower_id} className="flex items-center justify-between p-4 border border-border rounded-lg">
          <Link 
            to={`/u/${follower.follower_id}`}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={follower.profiles?.avatar_url || ""} />
              <AvatarFallback>
                <UserIcon className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {follower.profiles?.display_name || "Пользователь"}
              </p>
            </div>
          </Link>
          
          {currentUserId && currentUserId !== follower.follower_id && (
            <Button
              variant={followingStatus[follower.follower_id] ? "outline" : "default"}
              size="sm"
              onClick={() => handleFollowToggle(follower.follower_id)}
            >
              {followingStatus[follower.follower_id] ? "Отписаться" : "Подписаться"}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};