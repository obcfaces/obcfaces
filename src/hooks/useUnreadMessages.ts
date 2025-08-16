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
        // Demo data for preview
        console.log('useUnreadMessages: Setting demo count to 3');
        setUnreadCount(3);
      }
    };

    getCurrentUser();
  }, []);

  const loadUnreadCount = async (userId: string) => {
    try {
      console.log('useUnreadMessages: Loading unread count for user:', userId);
      
      // Get all conversations for the user
      const { data: conversations, error: convError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      console.log('useUnreadMessages: Conversations query result:', { conversations, convError });

      if (convError) {
        console.error('useUnreadMessages: Error fetching conversations:', convError);
        return;
      }

      if (!conversations || conversations.length === 0) {
        console.log('useUnreadMessages: No conversations found');
        setUnreadCount(0);
        return;
      }

      let totalUnread = 0;

      // For each conversation, count unread messages
      // For now, we'll use a simple approach since we don't have last_read_at yet
      for (const conv of conversations) {
        const { count, error: msgError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.conversation_id)
          .neq('sender_id', userId);

        console.log('useUnreadMessages: Messages count for conversation', conv.conversation_id, ':', { count, msgError });
        
        if (msgError) {
          console.error('useUnreadMessages: Error counting messages:', msgError);
          continue;
        }

        totalUnread += count || 0;
      }

      console.log('useUnreadMessages: Total unread count:', totalUnread);
      setUnreadCount(totalUnread);
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