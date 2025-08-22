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
    };
    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => setUser(session?.user || null)
    );

    return () => subscription.unsubscribe();
  }, []);

  // Загрузка разговоров
  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data: participantData, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);
      
      const conversationsWithDetails = await Promise.all(
        conversationIds.map(async (convId) => {
          // Получаем другого участника
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', convId)
            .neq('user_id', user.id)
            .single();

          if (!otherParticipant) return null;

          // Получаем профиль другого пользователя
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, first_name, last_name')
            .eq('id', otherParticipant.user_id)
            .single();

          if (!profile) return null;

          // Получаем последнее сообщение
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('id, content, sender_id, created_at')
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
        title: "Ошибка",
        description: "Не удалось создать разговор",
        variant: "destructive"
      });
      return null;
    }
  };

  // Загрузка сообщений
  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
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

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      
      setNewMessage('');
      loadMessages(selectedConversation);
      loadConversations(); // Обновляем список для показа нового последнего сообщения
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
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
    console.log('Effect triggered - user:', !!user, 'recipient:', searchParams.get('recipient'));
    
    if (!user) return;

    const recipientId = searchParams.get('recipient');
    if (recipientId) {
      console.log('Processing recipient:', recipientId);
      
      const initConversation = async () => {
        console.log('Creating/finding conversation...');
        const conversationId = await createOrFindConversation(recipientId);
        console.log('Got conversation ID:', conversationId);
        
        if (conversationId) {
          console.log('Setting selected conversation:', conversationId);
          setSelectedConversation(conversationId);
          
          console.log('Loading messages...');
          await loadMessages(conversationId);
          
          console.log('Loading conversations...');
          await loadConversations();
          
          console.log('Process completed');
        }
        
        // Очищаем URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('recipient');
        navigate(`/messages?${newSearchParams.toString()}`, { replace: true });
      };
      
      initConversation();
    } else {
      console.log('No recipient, loading conversations normally');
      loadConversations();
    }
  }, [user, searchParams]);

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
           'Пользователь';
  };

  // Фильтрация разговоров
  const filteredConversations = conversations.filter(conv => {
    const displayName = getDisplayName(conv.other_user).toLowerCase();
    return displayName.includes(searchQuery.toLowerCase());
  });

  // Получение выбранного разговора
  const selectedConv = conversations.find(conv => conv.id === selectedConversation);
  
  // Debug logging
  console.log('Current state:');
  console.log('- selectedConversation:', selectedConversation);
  console.log('- conversations:', conversations.length);
  console.log('- selectedConv:', !!selectedConv);
  console.log('- user:', !!user);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Необходима авторизация</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Список разговоров */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r ${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col`}>
        {/* Заголовок */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold">Сообщения</h1>
          <div className="mt-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск разговоров..."
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
              {searchQuery ? 'Разговоры не найдены' : 'Нет разговоров'}
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
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.other_user.avatar_url || ''} />
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
                        {conversation.last_message?.content || "Начните разговор"}
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
      <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversation && selectedConv ? (
          <>
            {/* Заголовок чата */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConversation(null)}
                className="md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConv.other_user.avatar_url || ''} />
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
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
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
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Поле ввода */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Введите сообщение..."
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
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Выберите разговор</h3>
              <p className="text-muted-foreground">
                Выберите разговор из списка слева, чтобы начать общение
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;