import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CardData {
  likes: number;
  comments: number;
  isLiked: boolean;
  hasCommented: boolean;
}

export const useCardData = (participantName: string, userId?: string, profileId?: string) => {
  const [data, setData] = useState<CardData>({
    likes: 0,
    comments: 0,
    isLiked: false,
    hasCommented: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!participantName) {
      setLoading(false);
      return;
    }

    // Reset data to avoid stale cache
    setData({
      likes: 0,
      comments: 0,
      isLiked: false,
      hasCommented: false
    });

    const loadCardData = async () => {
      setLoading(true);
      
      try {
        // Use secure RPC function that doesn't expose user IDs
        if (profileId) {
          // Use new secure function for user_id based system
          const { data: stats, error } = await supabase
            .rpc('get_participant_content_stats', { 
              profile_id_param: profileId,
              requesting_user_id: userId || null
            });

          if (error) throw error;

          const statsData = stats?.[0];
          setData({
            likes: Number(statsData?.total_likes) || 0,
            comments: Number(statsData?.total_comments) || 0,
            isLiked: statsData?.user_has_liked || false,
            hasCommented: statsData?.user_has_commented || false
          });
        } else {
          // Fallback to name-based system for older data
          // Use like_counts table for aggregate data instead of querying likes directly
          const normalizedName = participantName.trim();
          
          // Get aggregate like count from like_counts table
          const baseContentId = `contestant-card-${normalizedName}`;
          const { data: likeCountData } = await supabase
            .from("like_counts")
            .select("like_count")
            .eq("content_type", "contest")
            .eq("content_id", baseContentId)
            .maybeSingle();

          // Check if current user has liked (only query their own data)
          let isUserLiked = false;
          if (userId) {
            const { data: userLike } = await supabase
              .from("likes")
              .select("id")
              .eq("user_id", userId)
              .eq("content_type", "contest")
              .ilike("content_id", `%${normalizedName}%`)
              .maybeSingle();
            
            isUserLiked = !!userLike;
          }

          // For comments, count from photo_comments table
          const { count: commentsCount } = await supabase
            .from("photo_comments")
            .select("*", { count: 'exact', head: true })
            .eq("content_type", "contest")
            .ilike("content_id", `%${normalizedName}%`);

          // Check if current user has commented
          let hasUserCommented = false;
          if (userId) {
            const { data: userComment } = await supabase
              .from("photo_comments")
              .select("id")
              .eq("user_id", userId)
              .eq("content_type", "contest")
              .ilike("content_id", `%${normalizedName}%`)
              .maybeSingle();
            
            hasUserCommented = !!userComment;
          }

          setData({
            likes: likeCountData?.like_count || 0,
            comments: commentsCount || 0,
            isLiked: isUserLiked,
            hasCommented: hasUserCommented
          });
        }
      } catch (error) {
        console.error('Error loading card data:', error);
        setData({
          likes: 0,
          comments: 0,
          isLiked: false,
          hasCommented: false
        });
      } finally {
        setLoading(false);
      }
    };

    loadCardData();
  }, [participantName, userId, profileId]);

  return { data, loading, refresh: () => {
    if (participantName && profileId) {
      const refreshData = async () => {
        setLoading(true);
        
        try {
          // Use secure RPC function for refresh
          const { data: stats, error } = await supabase
            .rpc('get_participant_content_stats', { 
              profile_id_param: profileId,
              requesting_user_id: userId || null
            });

          if (error) throw error;

          const statsData = stats?.[0];
          setData({
            likes: Number(statsData?.total_likes) || 0,
            comments: Number(statsData?.total_comments) || 0,
            isLiked: statsData?.user_has_liked || false,
            hasCommented: statsData?.user_has_commented || false
          });
        } catch (error) {
          console.error('Error refreshing card data:', error);
        } finally {
          setLoading(false);
        }
      };

      refreshData();
    }
  }};
};