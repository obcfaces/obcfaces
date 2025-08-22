import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      console.log('useUnreadMessages: Getting current user...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('useUnreadMessages: Session:', session?.user?.id || 'No user');
      
      if (session?.user) {
        setCurrentUserId(session.user.id);
        await loadUnreadCount(session.user.id);
      } else {
        setUnreadCount(0);
      }
    };

    getCurrentUser();
  }, []);

  const loadUnreadCount = async (userId: string) => {
    try {
      console.log('useUnreadMessages: Loading unread count for user:', userId);
      
      // Use the new database function to get accurate unread count
      const { data, error } = await supabase.rpc('get_unread_messages_count', {
        user_id_param: userId
      });

      console.log('useUnreadMessages: Unread count result:', { data, error });

      if (error) {
        console.error('useUnreadMessages: Error fetching unread count:', error);
        return;
      }

      const count = data || 0;
      console.log('useUnreadMessages: Setting unread count to:', count);
      setUnreadCount(count);
    } catch (error) {
      console.error('useUnreadMessages: Error loading unread count:', error);
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
          console.log('New message received:', payload.new);
          // Only increment if it's not our message AND we're a participant in this conversation
          if (payload.new.sender_id !== currentUserId) {
            // Reload the actual count instead of incrementing to avoid false positives
            loadUnreadCount(currentUserId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const markAsRead = async (conversationId: string) => {
    if (!currentUserId) return;
    
    try {
      await supabase.rpc('mark_conversation_as_read', {
        conversation_id_param: conversationId,
        user_id_param: currentUserId
      });
      
      // Refresh unread count after marking as read
      await loadUnreadCount(currentUserId);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  return { unreadCount, markAsRead };
};