import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CardData {
  likes: number;
  comments: number;
  isLiked: boolean;
  hasCommented: boolean;
}

export const useCardData = (participantName: string, userId?: string) => {
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

    const loadCardData = async () => {
      setLoading(true);
      
      try {
        // Normalize participant name for consistent searching
        const normalizedName = participantName.trim();
        
        // Load all likes for this participant (card + photos)
        const { data: allLikes } = await supabase
          .from("likes")
          .select("content_id, user_id")
          .eq("content_type", "contest")
          .or(`content_id.ilike.%${normalizedName}%`);

        // Filter and count likes for this specific participant
        const participantLikes = allLikes?.filter(like => 
          like.content_id.includes(normalizedName) &&
          (like.content_id.includes('contestant-card-') || like.content_id.includes('contestant-photo-'))
        ) || [];

        const totalLikes = participantLikes.length;
        const isUserLiked = userId ? participantLikes.some(like => like.user_id === userId) : false;

        // Load all comments for this participant
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
  }, [participantName, userId]);

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