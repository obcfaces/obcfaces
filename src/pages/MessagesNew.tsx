import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Send, User, Search, ArrowLeft } from "lucide-react";

interface Conversation {
  id: string;
  other_user: {
    id: string;
    display_name: string;
    avatar_url?: string;
    first_name?: string;
    last_name?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_deleted: boolean;
}

const Messages = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load conversations when user is set
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Handle recipient parameter for direct messaging
  useEffect(() => {
    const recipientId = searchParams.get('recipient');
    if (recipientId && user) {
      createOrOpenConversation(recipientId);
    }
  }, [searchParams, user]);

  const createOrOpenConversation = async (recipientId: string) => {
    try {
      const { data: convId, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: recipientId
      });

      if (error) throw error;
      
      setSelectedConversation(convId);
      await loadConversations(); // Refresh conversations list
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать разговор",
        variant: "destructive"
      });
    }
  };

  const loadConversations = async () => {
    if (!user) return;

    try {
      // Get user's conversations with participant info
      const { data: userConversations, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner(
            id,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const conversationsWithDetails = await Promise.all(
        (userConversations || []).map(async (conv) => {
          // Get other participant
          const { data: otherParticipants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.conversation_id)
            .neq('user_id', user.id);

          if (!otherParticipants || otherParticipants.length === 0) {
            return null;
          }

          const otherUserId = otherParticipants[0].user_id;

          // Get other user's profile
          const { data: otherUserProfile } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, first_name, last_name')
            .eq('id', otherUserId)
            .single();

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.conversation_id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.conversation_id)
            .neq('sender_id', user.id);

          return {
            id: conv.conversation_id,
            other_user: {
              id: otherUserProfile?.id || '',
              display_name: otherUserProfile?.display_name || '',
              avatar_url: otherUserProfile?.avatar_url,
              first_name: otherUserProfile?.first_name,
              last_name: otherUserProfile?.last_name
            },
            last_message: lastMessage,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails.filter(conv => conv !== null && conv.other_user.id));
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Set up realtime listener
      const channel = supabase
        .channel(`conversation-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    
    // Optimistically add message to UI
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage.trim(),
      sender_id: user.id,
      created_at: new Date().toISOString(),
      is_deleted: false
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    const messageToSend = newMessage.trim();
    setNewMessage("");
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          content: messageToSend,
          message_type: 'text'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? data : msg
      ));
      
      loadConversations(); // Refresh to update last message
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(messageToSend); // Restore message in input
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  const getDisplayName = (otherUser: Conversation['other_user']) => {
    return otherUser.display_name || 
           `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.trim() || 
           'Пользователь';
  };

  const filteredConversations = conversations.filter(conv => {
    const displayName = getDisplayName(conv.other_user).toLowerCase();
    return displayName.includes(searchQuery.toLowerCase());
  });

  const selectedConv = conversations.find(conv => conv.id === selectedConversation);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Messages | OBC</title>
        <meta name="description" content="Chat with other users" />
        <link rel="canonical" href="/messages" />
      </Helmet>

      <div className="flex h-screen">
        {/* Conversations List */}
        <div className={`w-full md:w-80 border-r ${selectedConversation ? 'hidden md:block' : 'block'}`}>
          <div className="p-4 border-b">
            <h1 className="text-xl font-semibold mb-3">Сообщения</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск разговоров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-140px)]">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {conversations.length === 0 ? "Нет сообщений" : "Нет результатов"}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                    selectedConversation === conversation.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.other_user.avatar_url} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {getDisplayName(conversation.other_user)}
                        </p>
                        {conversation.last_message && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      {conversation.last_message && (
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.last_message.sender_id === user.id && "Вы: "}
                          {conversation.last_message.content}
                        </p>
                      )}
                    </div>
                    {conversation.unread_count > 0 && (
                      <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${selectedConversation ? 'block' : 'hidden md:flex'}`}>
          {selectedConversation && selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConv.other_user.avatar_url} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {getDisplayName(selectedConv.other_user)}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex flex-col h-full">
                <ScrollArea className="flex-1 p-4 pb-20">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Начните разговор
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwn = message.sender_id === user.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-3 py-2 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
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
                  )}
                </ScrollArea>
              </div>

              {/* Message Input - Fixed at bottom of screen */}
              <div className="fixed bottom-0 left-0 right-0 md:left-80 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-50">
                <div className="flex gap-2 max-w-4xl mx-auto">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Написать сообщение..."
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Выберите разговор</h2>
                <p>Выберите разговор из списка слева для начала общения</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;