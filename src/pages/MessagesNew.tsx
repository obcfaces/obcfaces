import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, User, Search, ArrowLeft } from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_deleted: boolean;
}

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
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { markAsRead } = useUnreadMessages();

  // Initialize user
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => setUser(session?.user || null)
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load conversations when user is available
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Handle recipient parameter for creating new conversation
  useEffect(() => {
    const recipientId = searchParams.get('recipient');
    if (recipientId && user && conversations.length >= 0) { // Allow even with 0 conversations
      console.log('Auto-creating/opening conversation with recipient:', recipientId);
      createOrOpenConversation(recipientId);
      
      // Clear the recipient parameter from URL after processing
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('recipient');
      navigate(`/messages?${newSearchParams.toString()}`, { replace: true });
    }
  }, [searchParams, user, conversations]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      // Get conversations with full details in one query
      const { data: conversationData, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner(id),
          user_id
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      if (!conversationData || conversationData.length === 0) {
        setConversations([]);
        return;
      }

      // Process each conversation
      const processedConversations = await Promise.all(
        conversationData.map(async (conv) => {
          try {
            // Get other participant
            const { data: otherParticipant } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', conv.conversation_id)
              .neq('user_id', user.id)
              .single();

            if (!otherParticipant) return null;

            // Get other user profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, first_name, last_name')
              .eq('id', otherParticipant.user_id)
              .single();

            if (!profile) return null;

            // Get last message
            const { data: lastMessage } = await supabase
              .from('messages')
              .select('content, created_at, sender_id')
              .eq('conversation_id', conv.conversation_id)
              .eq('is_deleted', false)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Get unread count
            const { data: unreadCount } = await supabase.rpc('get_conversation_unread_count', {
              conversation_id_param: conv.conversation_id,
              user_id_param: user.id
            });

            return {
              id: conv.conversation_id,
              other_user: {
                id: profile.id,
                display_name: profile.display_name || '',
                avatar_url: profile.avatar_url,
                first_name: profile.first_name,
                last_name: profile.last_name
              },
              last_message: lastMessage,
              unread_count: unreadCount || 0
            };
          } catch (error) {
            console.error('Error processing conversation:', error);
            return null;
          }
        })
      );

      const validConversations = processedConversations.filter(Boolean) as Conversation[];
      setConversations(validConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const createOrOpenConversation = async (recipientId: string) => {
    if (!user || recipientId === user.id) return;

    console.log('Creating/opening conversation with:', recipientId);

    try {
      // First check if conversation already exists in loaded conversations
      const existingConv = conversations.find(conv => conv.other_user.id === recipientId);
      if (existingConv) {
        console.log('Found existing conversation:', existingConv.id);
        setSelectedConversation(existingConv.id);
        loadMessages(existingConv.id);
        return;
      }

      // Get recipient profile data first
      const { data: recipientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, first_name, last_name')
        .eq('id', recipientId)
        .single();

      if (profileError) {
        console.error('Error fetching recipient profile:', profileError);
        throw profileError;
      }

      // Create new conversation using the RPC function
      const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: recipientId
      });

      if (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }

      if (conversationId && recipientProfile) {
        console.log('Created/found conversation:', conversationId);
        
        // Create a temporary conversation object to show immediately
        const tempConversation: Conversation = {
          id: conversationId,
          other_user: {
            id: recipientProfile.id,
            display_name: recipientProfile.display_name || '',
            avatar_url: recipientProfile.avatar_url,
            first_name: recipientProfile.first_name,
            last_name: recipientProfile.last_name
          },
          last_message: undefined,
          unread_count: 0
        };

        // Add to conversations list immediately
        setConversations(prev => {
          const exists = prev.find(conv => conv.id === conversationId);
          if (exists) {
            return prev;
          }
          return [tempConversation, ...prev];
        });
        
        // Immediately set as selected and load messages
        setSelectedConversation(conversationId);
        loadMessages(conversationId);
        
        // Refresh conversations in background to get accurate data
        setTimeout(() => {
          const currentSelectedId = conversationId; // Preserve the selected conversation
          loadConversations().then(() => {
            // Ensure the conversation remains selected after refresh
            setSelectedConversation(currentSelectedId);
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать разговор. Попробуйте еще раз.",
        variant: "destructive"
      });
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

      // Mark as read
      markConversationAsRead(conversationId);

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

  const markConversationAsRead = async (conversationId: string) => {
    if (!user) return;
    
    try {
      await supabase.rpc('mark_conversation_as_read', {
        conversation_id_param: conversationId,
        user_id_param: user.id
      });
      
      markAsRead(conversationId);
      loadConversations();
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          content: messageContent,
          message_type: 'text'
        });

      if (error) throw error;
      
      // Refresh conversations to update last message
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
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
                  onClick={() => {
                    setSelectedConversation(conversation.id);
                    loadMessages(conversation.id);
                  }}
                  className={`p-3 cursor-pointer hover:bg-muted/50 border-b transition-colors ${
                    selectedConversation === conversation.id ? 'bg-muted' : ''
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
                        <p className="font-medium text-sm truncate">
                          {getDisplayName(conversation.other_user)}
                        </p>
                        {conversation.last_message && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
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

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${selectedConversation ? 'block' : 'hidden md:flex'}`}>
          {selectedConversation && selectedConv ? (
            <>
              {/* Chat Header */}
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
                  <AvatarImage src={selectedConv.other_user.avatar_url} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h2 className="font-semibold text-sm">
                    {getDisplayName(selectedConv.other_user)}
                  </h2>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {loadingMessages ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Начните разговор!</p>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
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
    </div>
  );
};

export default Messages;