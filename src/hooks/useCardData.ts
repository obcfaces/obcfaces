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
        // Use user_id based approach if available, fallback to name-based
        if (profileId) {
          // Use new user_id based system
          const baseContentId = `contestant-user-${profileId}`;
          const photoContentPattern = `contestant-user-${profileId}-%`;
          
          // Load likes using new format
          const { data: likesData } = await supabase
            .from('likes')
            .select('user_id')
            .eq('content_type', 'contest')
            .or(`content_id.eq.${baseContentId},content_id.like.${photoContentPattern}`);

          const totalLikes = likesData?.length || 0;
          const isUserLiked = userId ? likesData?.some(like => like.user_id === userId) || false : false;

          // Load comments using new format
          const { data: commentsData } = await supabase
            .from('photo_comments')
            .select('user_id')
            .eq('content_type', 'contest')
            .or(`content_id.eq.${baseContentId},content_id.like.${photoContentPattern}`);

          const totalComments = commentsData?.length || 0;
          const hasUserCommented = userId ? commentsData?.some(comment => comment.user_id === userId) || false : false;

          setData({
            likes: totalLikes,
            comments: totalComments,
            isLiked: isUserLiked,
            hasCommented: hasUserCommented
          });
        } else {
          // Fallback to name-based system for older data
          const normalizedName = participantName.trim();
          
          const { data: allLikes } = await supabase
            .from("likes")
            .select("content_id, user_id")
            .eq("content_type", "contest")
            .or(`content_id.ilike.%${normalizedName}%`);

          const participantLikes = allLikes?.filter(like => 
            like.content_id.includes(normalizedName) &&
            (like.content_id.includes('contestant-card-') || like.content_id.includes('contestant-photo-'))
          ) || [];

          const totalLikes = participantLikes.length;
          const isUserLiked = userId ? participantLikes.some(like => like.user_id === userId) : false;

          const { data: allComments } = await supabase
            .from("photo_comments")
            .select("content_id, user_id")
            .eq("content_type", "contest")
            .or(`content_id.ilike.%${normalizedName}%`);

          const participantComments = allComments?.filter(comment => 
            comment.content_id.includes(normalizedName)
          ) || [];

          const totalComments = participantComments.length;
          const hasUserCommented = userId ? participantComments.some(comment => comment.user_id === userId) : false;

          setData({
            likes: totalLikes,
            comments: totalComments,
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
    if (participantName) {
      const loadCardData = async () => {
        setLoading(true);
        
        try {
          const normalizedName = participantName.trim();
          
          const { data: allLikes } = await supabase
            .from("likes")
            .select("content_id, user_id")
            .eq("content_type", "contest")
            .or(`content_id.ilike.%${normalizedName}%`);

          const participantLikes = allLikes?.filter(like => 
            like.content_id.includes(normalizedName) &&
            (like.content_id.includes('contestant-card-') || like.content_id.includes('contestant-photo-'))
          ) || [];

          const totalLikes = participantLikes.length;
          const isUserLiked = userId ? participantLikes.some(like => like.user_id === userId) : false;

          const { data: allComments } = await supabase
            .from("photo_comments")
            .select("content_id, user_id")
            .eq("content_type", "contest")
            .or(`content_id.ilike.%${normalizedName}%`);

          const participantComments = allComments?.filter(comment => 
            comment.content_id.includes(normalizedName)
          ) || [];

          const totalComments = participantComments.length;
          const hasUserCommented = userId ? participantComments.some(comment => comment.user_id === userId) : false;

          setData({
            likes: totalLikes,
            comments: totalComments,
            isLiked: isUserLiked,
            hasCommented: hasUserCommented
          });
        } catch (error) {
          console.error('Error refreshing card data:', error);
        } finally {
          setLoading(false);
        }
      };

      loadCardData();
    }
  }};
};