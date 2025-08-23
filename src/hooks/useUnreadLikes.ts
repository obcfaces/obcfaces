import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadLikes = () => {
  const [unreadLikesCount, setUnreadLikesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUnreadLikes = async () => {
      try {
        console.log('useUnreadLikes: Getting current user...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log('useUnreadLikes: No session found');
          setUnreadLikesCount(0);
          setIsLoading(false);
          return;
        }

        console.log('useUnreadLikes: Session:', session.user.id);
        console.log('useUnreadLikes: Loading unread likes count for user:', session.user.id);

        // Get users who liked me (recent likes)
        const { data: likedMeData, error: likedMeError } = await supabase
          .rpc('get_users_who_liked_me', { target_user_id: session.user.id });

        if (likedMeError) {
          console.error('useUnreadLikes: Error fetching likes:', likedMeError);
          setUnreadLikesCount(0);
          setIsLoading(false);
          return;
        }

        // Count likes from the last 24 hours as "unread"
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const recentLikes = (likedMeData || []).filter((like: any) => 
          new Date(like.created_at) > oneDayAgo
        );

        console.log('useUnreadLikes: Recent likes found:', recentLikes.length);
        setUnreadLikesCount(recentLikes.length);
        setIsLoading(false);
      } catch (error) {
        console.error('useUnreadLikes: Unexpected error:', error);
        setUnreadLikesCount(0);
        setIsLoading(false);
      }
    };

    loadUnreadLikes();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        loadUnreadLikes();
      }
    });

    // Subscribe to real-time likes updates
    const likesChannel = supabase
      .channel('likes-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes'
        },
        () => {
          console.log('useUnreadLikes: New like detected, refreshing count');
          loadUnreadLikes();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(likesChannel);
    };
  }, []);

  return { unreadLikesCount, isLoading };
};