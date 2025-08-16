import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        await loadUnreadCount(session.user.id);
      } else {
        // Demo data for preview
        setUnreadCount(3);
      }
    };

    getCurrentUser();
  }, []);

  const loadUnreadCount = async (userId: string) => {
    try {
      // Get all conversations for the user
      const { data: conversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (!conversations) return;

      let totalUnread = 0;

      // For each conversation, count unread messages
      // For now, we'll use a simple approach since we don't have last_read_at yet
      for (const conv of conversations) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.conversation_id)
          .neq('sender_id', userId);

        totalUnread += count || 0;
      }

      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // Set up real-time listener for new messages
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          // If it's not our message, increment unread count
          if (payload.new.sender_id !== currentUserId) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const markAsRead = (conversationId: string) => {
    // This would update the last_read_at timestamp for the conversation
    // For now, just decrement the count for demo purposes
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return { unreadCount, markAsRead };
};