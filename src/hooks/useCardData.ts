import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CardData {
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  hasCommented: boolean;
  hasShared: boolean;
}

export const useCardData = (participantName: string, userId?: string, profileId?: string) => {
  const [data, setData] = useState<CardData>({
    likes: 0,
    comments: 0,
    shares: 0,
    isLiked: false,
    hasCommented: false,
    hasShared: false
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
        console.log('Loading card data for:', participantName, 'profileId:', profileId, 'userId:', userId);
        
        // Use user_id based approach if available, fallback to name-based
        if (profileId) {
          // Use new user_id based system
          const baseContentId = `contestant-user-${profileId}`;
          const photoContentPattern = `contestant-user-${profileId}-%`;
          
          console.log('Using profileId system. baseContentId:', baseContentId, 'photoContentPattern:', photoContentPattern);
          
          // Load likes using new format
          const { data: likesData, error: likesError } = await supabase
            .from('likes')
            .select('user_id')
            .eq('content_type', 'contest')
            .or(`content_id.eq.${baseContentId},content_id.like.${photoContentPattern}`);

          console.log('Likes data:', likesData, 'error:', likesError);

          const totalLikes = likesData?.length || 0;
          const isUserLiked = userId ? likesData?.some(like => like.user_id === userId) || false : false;

          // Load comments using new format
          const { data: commentsData, error: commentsError } = await supabase
            .from('photo_comments')
            .select('user_id')
            .eq('content_type', 'contest')
            .or(`content_id.eq.${baseContentId},content_id.like.${photoContentPattern}`);

          console.log('Comments data:', commentsData, 'error:', commentsError);

          const totalComments = commentsData?.length || 0;
          const hasUserCommented = userId ? commentsData?.some(comment => comment.user_id === userId) || false : false;

          // Load shares using new format  
          const { data: sharesData, error: sharesError } = await supabase
            .from('shares')
            .select('user_id')
            .eq('content_type', 'contest')
            .or(`content_id.eq.${baseContentId},content_id.like.${photoContentPattern}`);

          console.log('Shares data:', sharesData, 'error:', sharesError);

          const totalShares = sharesData?.length || 0;
          const hasUserShared = userId ? sharesData?.some(share => share.user_id === userId) || false : false;

          console.log('Final card data:', { likes: totalLikes, comments: totalComments, shares: totalShares, isLiked: isUserLiked, hasCommented: hasUserCommented, hasShared: hasUserShared });

          setData({
            likes: totalLikes,
            comments: totalComments,
            shares: totalShares,
            isLiked: isUserLiked,
            hasCommented: hasUserCommented,
            hasShared: hasUserShared
          });
        } else {
          // Fallback to name-based system for older data
          const normalizedName = participantName.trim();
          
          console.log('Using name-based system for:', normalizedName);
          
          const { data: allLikes, error: likesError } = await supabase
            .from("likes")
            .select("content_id, user_id")
            .eq("content_type", "contest")
            .or(`content_id.ilike.%${normalizedName}%`);

          console.log('All likes for name:', allLikes, 'error:', likesError);

          const participantLikes = allLikes?.filter(like => 
            like.content_id.includes(normalizedName) &&
            (like.content_id.includes('contestant-card-') || like.content_id.includes('contestant-photo-'))
          ) || [];

          console.log('Filtered participant likes:', participantLikes);

          const totalLikes = participantLikes.length;
          const isUserLiked = userId ? participantLikes.some(like => like.user_id === userId) : false;

          const { data: allComments, error: commentsError } = await supabase
            .from("photo_comments")
            .select("content_id, user_id")
            .eq("content_type", "contest")
            .or(`content_id.ilike.%${normalizedName}%`);

          console.log('All comments for name:', allComments, 'error:', commentsError);

          const participantComments = allComments?.filter(comment => 
            comment.content_id.includes(normalizedName)
          ) || [];

          console.log('Filtered participant comments:', participantComments);

          const totalComments = participantComments.length;
          const hasUserCommented = userId ? participantComments.some(comment => comment.user_id === userId) : false;

          console.log('Final name-based card data:', { likes: totalLikes, comments: totalComments, isLiked: isUserLiked, hasCommented: hasUserCommented });

          setData({
            likes: totalLikes,
            comments: totalComments,
            shares: 0,
            isLiked: isUserLiked,
            hasCommented: hasUserCommented,
            hasShared: false
          });
        }
      } catch (error) {
        console.error('Error loading card data:', error);
        setData({
          likes: 0,
          comments: 0,
          shares: 0,
          isLiked: false,
          hasCommented: false,
          hasShared: false
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
            shares: 0,
            isLiked: isUserLiked,
            hasCommented: hasUserCommented,
            hasShared: false
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