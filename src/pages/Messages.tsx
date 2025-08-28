import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, User, Search } from 'lucide-react';

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
}

interface Conversation {
  id: string;
  other_user: UserProfile;
  last_message?: Message;
  unread_count: number;
}

const Messages = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { markAsRead } = useUnreadMessages();

  // Инициализация пользователя
  useEffect(() => {
    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
      
      // Загружаем разговоры сразу после получения пользователя
      if (session?.user) {
        loadConversations();
      }
    };
    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Загрузка разговоров
  const loadConversations = async () => {
    if (!user) {
      return;
    }

    try {
      const { data: participantData, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error in loadConversations:', error.message);
        toast({
          title: "Error",
          description: "Failed to load conversations: " + error.message,
          variant: "destructive"
        });
        return;
      }

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);
      
      const conversationsWithDetails = await Promise.all(
        conversationIds.map(async (convId) => {
          // Получаем другого участника
          const { data: otherParticipant, error: participantError } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', convId)
            .neq('user_id', user.id)
            .single();

          if (!otherParticipant) {
            return null;
          }

          // Получаем профиль другого пользователя
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, first_name, last_name')
            .eq('id', otherParticipant.user_id)
            .single();

          if (!profile) {
            return null;
          }

          // Получаем последнее сообщение
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('id, content, sender_id, conversation_id, created_at')
            .eq('conversation_id', convId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Получаем количество непрочитанных
          const { data: unreadCount } = await supabase.rpc('get_conversation_unread_count', {
            conversation_id_param: convId,
            user_id_param: user.id
          });

          return {
            id: convId,
            other_user: profile,
            last_message: lastMessage,
            unread_count: unreadCount || 0
          };
        })
      );

      const validConversations = conversationsWithDetails.filter(Boolean) as Conversation[];
      setConversations(validConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Создание или поиск разговора
  const createOrFindConversation = async (recipientId: string): Promise<string | null> => {
    if (!user || recipientId === user.id) return null;

    try {
      const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: recipientId
      });

      if (error) throw error;
      return conversationId;
    } catch (error) {
      console.error('Error creating/finding conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive"
      });
      return null;
    }
  };

  // Загрузка сообщений
  const loadMessages = async (conversationId: string) => {
    try {
      console.log('Loading messages for conversation:', conversationId);
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, sender_id, conversation_id, created_at')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('Loaded messages:', data);
      setMessages(data || []);
      
      // Отмечаем как прочитанное
      markAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Отправка сообщения
  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Оптимистичное обновление - сразу добавляем сообщение
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      sender_id: user.id,
      conversation_id: selectedConversation,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSending(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          content: messageContent
        });

      if (error) throw error;
      
      // Real-time подписка заменит временное сообщение на реальное
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Убираем временное сообщение при ошибке
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageContent); // Возвращаем текст обратно
      
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  // Обработка Enter для отправки
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Обработка recipient из URL
  useEffect(() => {
    if (!user) return;

    const recipientId = searchParams.get('recipient');
    if (recipientId && !selectedConversation) {
      const initConversation = async () => {
        const conversationId = await createOrFindConversation(recipientId);
        
        if (conversationId) {
          setSelectedConversation(conversationId);
          await loadMessages(conversationId);
          await loadConversations();
        }
        
        // Очищаем URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('recipient');
        navigate(`/messages?${newSearchParams.toString()}`, { replace: true });
      };
      
      initConversation();
    } else if (!recipientId && conversations.length === 0) {
      loadConversations();
    }
  }, [user, searchParams.get('recipient')]);

  // Real-time подписка на новые сообщения с обработкой ошибок
  useEffect(() => {
    if (!user) return;

    try {
      const channel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            const newMessage = payload.new as Message;
            
            // Обновляем сообщения если это текущий разговор
            if (selectedConversation === newMessage.conversation_id) {
              setMessages(prev => [...prev, newMessage]);
              
              // Отмечаем как прочитанное если сообщение от другого пользователя
              if (newMessage.sender_id !== user.id) {
                markAsRead(newMessage.conversation_id);
              }
            }
            
            // Обновляем список разговоров для показа нового последнего сообщения
            loadConversations();
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('Failed to subscribe to message updates');
          }
        });

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.warn('Error removing messages channel:', error);
        }
      };
    } catch (error) {
      console.warn('Realtime messages subscription failed:', error);
      return () => {};
    }
  }, [user, selectedConversation, markAsRead]);

  // Автоскролл к низу при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Форматирование времени
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Получение имени пользователя
  const getDisplayName = (user: UserProfile) => {
    return user.display_name || 
           `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
           'User';
  };

  // Фильтрация разговоров
  const filteredConversations = conversations.filter(conv => {
    const displayName = getDisplayName(conv.other_user).toLowerCase();
    return displayName.includes(searchQuery.toLowerCase());
  });

  // Получение выбранного разговора
  const selectedConv = conversations.find(conv => conv.id === selectedConversation);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Authorization required</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-background">
      {/* Список разговоров */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r ${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col`}>
        {/* Заголовок */}
        <div className="p-4 border-b">
          <div className="mt-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Список разговоров */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? 'No conversations found' : 'No conversations'}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  setSelectedConversation(conversation.id);
                  loadMessages(conversation.id);
                }}
                className={`p-3 cursor-pointer border-b hover:bg-muted/50 transition-colors ${
                  selectedConversation === conversation.id ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage 
                      src={conversation.other_user.avatar_url || ''} 
                      className="object-cover w-full h-full"
                    />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">
                        {getDisplayName(conversation.other_user)}
                      </h3>
                      {conversation.last_message && (
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conversation.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message?.content || "Start conversation"}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Область чата */}
      <div className={`flex-1 ${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col h-screen`}>
        {selectedConversation && selectedConv ? (
          <>
            {/* Заголовок чата */}
            <div className="p-4 border-b flex items-center gap-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConversation(null)}
                className="md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage 
                  src={selectedConv.other_user.avatar_url || ''} 
                  className="object-cover w-full h-full"
                />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="font-semibold">
                  {getDisplayName(selectedConv.other_user)}
                </h2>
              </div>
            </div>

            {/* Сообщения */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No messages. Start a conversation!
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.sender_id === user.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Поле ввода - зафиксировано внизу */}
            <div className="p-4 border-t flex-shrink-0 bg-background sticky bottom-0">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || sending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-lg font-medium mb-2">Select a conversation</div>
              <p>Choose a conversation from the left to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;