import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { MessageCircle, Search, Phone, Video, Info, Send, Paperclip, Smile, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  message_type: string;
}

interface Chat {
  id: string;
  name: string;
  avatar_url?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online: boolean;
  other_user_id: string;
}

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [chats, setChats] = useState<Chat[]>([
    // Demo data for preview
    {
      id: "demo-1",
      name: "Анна Петрова",
      avatar_url: "/lovable-uploads/009d20f0-cac7-4c08-9bc9-146617664bc3.png",
      last_message: "Привет! Как дела? Готовишься к конкурсу?",
      last_message_time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      unread_count: 2,
      is_online: true,
      other_user_id: "demo-user-1"
    },
    {
      id: "demo-2",
      name: "Дмитрий Иванов",
      avatar_url: "/lovable-uploads/1147be30-a1d2-466f-a9a8-067f4628cbb2.png",
      last_message: "Спасибо за совет! Буду использовать эти упражнения 💪",
      last_message_time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      unread_count: 0,
      is_online: false,
      other_user_id: "demo-user-2"
    },
    {
      id: "demo-3",
      name: "Елена Смирнова",
      avatar_url: "/lovable-uploads/c4e9d90c-eeda-44db-94e3-08c6a959f1a5.png",
      last_message: "Увидимся завтра на тренировке!",
      last_message_time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      unread_count: 1,
      is_online: true,
      other_user_id: "demo-user-3"
    }
  ]);
  const [messages, setMessages] = useState<Message[]>([
    // Demo messages for chat demo-1
    {
      id: "msg-1",
      sender_id: "demo-user-1",
      content: "Привет! Как дела?",
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      message_type: "text"
    },
    {
      id: "msg-2", 
      sender_id: "current-user",
      content: "Привет! Все отлично, готовлюсь к конкурсу 😊",
      created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      message_type: "text"
    },
    {
      id: "msg-3",
      sender_id: "demo-user-1", 
      content: "Это здорово! Какие упражнения делаешь?",
      created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      message_type: "text"
    },
    {
      id: "msg-4",
      sender_id: "current-user",
      content: "Сейчас фокусируюсь на кардио и силовых тренировках. А ты как готовишься?",
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      message_type: "text"
    },
    {
      id: "msg-5",
      sender_id: "demo-user-1",
      content: "Тоже самое! Плюс правильное питание очень важно 🥗",
      created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      message_type: "text"
    },
    {
      id: "msg-6",
      sender_id: "current-user", 
      content: "Абсолютно согласен! Можешь поделиться своим рационом?",
      created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      message_type: "text"
    },
    {
      id: "msg-7",
      sender_id: "demo-user-1",
      content: "Конечно! Завтрак: овсянка с ягодами, обед: курица с овощами, ужин: рыба с салатом",
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      message_type: "text"
    },
    {
      id: "msg-8",
      sender_id: "current-user",
      content: "Звучит отлично! Спасибо за советы 👍",
      created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      message_type: "text"
    },
    {
      id: "msg-9",
      sender_id: "demo-user-1",
      content: "Готовишься к конкурсу?",
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      message_type: "text"
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Get current user and handle URL params
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        await loadConversations(session.user.id);
        
        // Check if there's a chat parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const chatId = urlParams.get('chat');
        if (chatId) {
          setSelectedChat(chatId);
        }
      } else {
        // For demo purposes, set a demo user ID
        setCurrentUserId("current-user");
        // Auto-select first chat for demo
        setSelectedChat("demo-1");
      }
      setLoading(false);
    };

    getCurrentUser();
  }, []);

  // Load conversations
  const loadConversations = async (userId: string) => {
    try {
      const { data: conversations, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner(
            id,
            updated_at
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      // For each conversation, get the other participant and last message
      const chatPromises = conversations?.map(async (conv) => {
        // Get other participant
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.conversation_id)
          .neq('user_id', userId)
          .single();

        // Get participant profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, first_name, last_name')
          .eq('id', otherParticipant?.user_id)
          .single();

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', conv.conversation_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const displayName = profile?.display_name || 
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 
          'Unknown User';

        return {
          id: conv.conversation_id,
          name: displayName,
          avatar_url: profile?.avatar_url,
          last_message: lastMessage?.content || 'No messages yet',
          last_message_time: lastMessage?.created_at || conv.conversations.updated_at,
          unread_count: 0, // TODO: Implement unread count
          is_online: false, // TODO: Implement online status
          other_user_id: otherParticipant?.user_id || ''
        };
      }) || [];

      const chatsData = await Promise.all(chatPromises);
      setChats(chatsData.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      ));
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversationId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Handle chat selection
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedChatData = chats.find(chat => chat.id === selectedChat);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUserId) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedChat,
          sender_id: currentUserId,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage("");
      await loadMessages(selectedChat);
      
      // Update conversations list to reflect new message
      if (currentUserId) {
        await loadConversations(currentUserId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Messages | OBC</title>
          <meta name="description" content="Chat with other contest participants" />
          <link rel="canonical" href="/messages" />
        </Helmet>

        {selectedChat ? (
          // Mobile Chat View
          <div className="flex flex-col h-screen">
            {/* Mobile Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3 bg-background sticky top-0 z-10">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedChat(null)}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              {selectedChatData && (
                <>
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={selectedChatData.avatar_url} alt={selectedChatData.name} />
                    <AvatarFallback>
                      {selectedChatData.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-medium text-sm truncate">{selectedChatData.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedChatData.is_online ? 'Active now' : 'Last seen recently'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Messages Area */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl animate-fade-in ${
                      message.sender_id === currentUserId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === currentUserId
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}>
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Mobile Message Input */}
            <div className="p-3 border-t border-border bg-background sticky bottom-0">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="pr-10 rounded-full border-2 focus:border-primary"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  size="icon"
                  className="rounded-full h-10 w-10 hover-scale"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Mobile Chat List
          <div className="flex flex-col h-screen">
            {/* Mobile Header */}
            <div className="p-4 border-b border-border bg-background sticky top-0 z-10">
              <h1 className="text-xl font-semibold mb-3">Messages</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full"
                />
              </div>
            </div>

            {/* Mobile Chat List */}
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredChats.length > 0 ? filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChat(chat.id)}
                      className="p-4 cursor-pointer hover:bg-accent transition-colors active:bg-accent/50 animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={chat.avatar_url} alt={chat.name} />
                            <AvatarFallback className="text-lg">
                              {chat.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {chat.is_online && (
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-base truncate">{chat.name}</h3>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatTime(chat.last_message_time)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">{chat.last_message}</p>
                            {chat.unread_count > 0 && (
                              <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center ml-2 shrink-0">
                                {chat.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center">
                      <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                      <p className="text-muted-foreground">Start a conversation with someone!</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Messages | OBC</title>
        <meta name="description" content="Chat with other contest participants" />
        <link rel="canonical" href="/messages" />
      </Helmet>

      <div className="flex h-screen">
        {/* Sidebar - Chat List */}
        <div className="w-80 border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <h1 className="text-xl font-semibold mb-3">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading conversations...</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredChats.length > 0 ? filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                      selectedChat === chat.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={chat.avatar_url} alt={chat.name} />
                          <AvatarFallback>
                            {chat.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {chat.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm truncate">{chat.name}</h3>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(chat.last_message_time)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">{chat.last_message}</p>
                          {chat.unread_count > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {chat.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No conversations yet</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChatData ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedChatData.avatar_url} alt={selectedChatData.name} />
                      <AvatarFallback>
                        {selectedChatData.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {selectedChatData.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-medium">{selectedChatData.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedChatData.is_online ? 'Active now' : 'Last seen recently'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.sender_id === currentUserId
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === currentUserId
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}>
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="pr-10"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">Choose from your existing conversations or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;