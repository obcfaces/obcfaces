import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ThumbsUp, MessageCircle, Send, Share2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import LoginModalContent from "@/components/login-modal-content";

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  currentIndex: number;
  profileId: string;
  profileName: string;
}

export function ProfilePhotoModal({ 
  isOpen, 
  onClose, 
  photos, 
  currentIndex, 
  profileId,
  profileName
}: ProfilePhotoModalProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [photoComments, setPhotoComments] = useState<Record<number, Comment[]>>({});
  const [photoLikes, setPhotoLikes] = useState<Record<number, { count: number; isLiked: boolean }>>({});
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast } = useToast();
  
  const commentsListRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load comments and likes when modal opens or photo changes
  useEffect(() => {
    if (!isOpen) return;
    
    const loadPhotoData = async () => {
      const contentId = `profile-photo-${profileId}-${activeIndex}`;
      
      // Load comments for current photo
      const { data: comments } = await supabase
        .from('photo_comments')
        .select('*')
        .eq('content_type', 'profile')
        .eq('content_id', contentId)
        .order('created_at', { ascending: false });

      if (comments) {
        // Get user profiles separately
        const userIds = [...new Set(comments.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);

        const formattedComments: Comment[] = comments.map(comment => {
          const profile = profiles?.find(p => p.id === comment.user_id);
          return {
            id: comment.id,
            author: profile?.display_name || 'User',
            text: comment.comment_text,
            timestamp: new Date(comment.created_at).toLocaleString()
          };
        });
        
        setPhotoComments(prev => ({
          ...prev,
          [activeIndex]: formattedComments
        }));
      }

      // Load likes for current photo
      const { data: totalLikes } = await supabase
        .from("likes")
        .select("user_id")
        .eq("content_type", "profile")
        .eq("content_id", contentId);
      
      const { data: userLike } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", user?.id || '')
        .eq("content_type", "profile")
        .eq("content_id", contentId)
        .maybeSingle();
      
      setPhotoLikes(prev => ({
        ...prev,
        [activeIndex]: {
          count: totalLikes?.length || 0,
          isLiked: !!userLike
        }
      }));
    };

    loadPhotoData();
  }, [isOpen, activeIndex, profileId, user]);

  // Reset activeIndex when currentIndex changes
  useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex]);

  const nextPhoto = () => {
    setActiveIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleLike = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    const contentId = `profile-photo-${profileId}-${activeIndex}`;
    const wasLiked = photoLikes[activeIndex]?.isLiked || false;
    
    try {
      if (wasLiked) {
        // Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("content_type", "profile")
          .eq("content_id", contentId);
      } else {
        // Like
        await supabase
          .from("likes")
          .insert({
            user_id: user.id,
            content_type: "profile",
            content_id: contentId,
          });
      }
      
      setPhotoLikes(prev => ({
        ...prev,
        [activeIndex]: {
          count: wasLiked ? (prev[activeIndex]?.count || 0) - 1 : (prev[activeIndex]?.count || 0) + 1,
          isLiked: !wasLiked
        }
      }));
      
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (commentText.trim()) {
      const contentId = `profile-photo-${profileId}-${activeIndex}`;
      
      try {
        // Save comment to database
        const { error } = await supabase
          .from('photo_comments')
          .insert({
            user_id: user.id,
            content_type: 'profile',
            content_id: contentId,
            comment_text: commentText.trim()
          });

        if (error) {
          console.error('Error saving comment:', error);
          toast({
            title: "Ошибка",
            description: "Не удалось сохранить комментарий",
            duration: 3000,
          });
          return;
        }

        // Add comment to local state for immediate feedback
        const newComment: Comment = {
          id: `temp-${Date.now()}`,
          author: "Вы",
          text: commentText.trim(),
          timestamp: "только что"
        };
        setPhotoComments(prev => ({
          ...prev,
          [activeIndex]: [newComment, ...(prev[activeIndex] || [])]
        }));
        
        setCommentText("");
        
        // Reset textarea height back to one line after submit
        if (textareaRef.current) {
          textareaRef.current.style.height = '44px';
        }
        
        // Reload comments to get fresh data from database
        setTimeout(() => {
          const loadCommentsAgain = async () => {
            const { data: freshComments } = await supabase
              .from('photo_comments')
              .select('*')
              .eq('content_type', 'profile')
              .eq('content_id', contentId)
              .order('created_at', { ascending: false });
            
            if (freshComments) {
              const userIds = [...new Set(freshComments.map(c => c.user_id))];
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, display_name')
                .in('id', userIds);

              const formattedComments: Comment[] = freshComments.map(comment => {
                const profile = profiles?.find(p => p.id === comment.user_id);
                return {
                  id: comment.id,
                  author: profile?.display_name || 'User',
                  text: comment.comment_text,
                  timestamp: new Date(comment.created_at).toLocaleString()
                };
              });
              
              setPhotoComments(prev => ({
                ...prev,
                [activeIndex]: formattedComments
              }));
            }
          };
          loadCommentsAgain();
        }, 500);
        
        toast({
          title: "Комментарий добавлен",
          description: "Ваш комментарий был добавлен",
          duration: 1000,
        });
      } catch (error) {
        console.error('Error saving comment:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить комментарий",
          duration: 3000,
        });
      }
    }
  };

  const focusCommentInput = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    textareaRef.current?.focus();
    if (commentsListRef.current) {
      commentsListRef.current.scrollTo({
        top: commentsListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/u/${profileId}`;
    const shareTitle = `Фото ${profileName}`;
    const shareDescription = `Посмотрите фото ${profileName}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Ссылка скопирована",
          description: "Ссылка была скопирована в буфер обмена",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Touch handlers for swipe functionality
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      nextPhoto();
    } else if (distance < -minSwipeDistance) {
      prevPhoto();
    }
  };

  const currentPhotoComments = photoComments[activeIndex] || [];
  const currentPhotoLikes = photoLikes[activeIndex] || { count: 0, isLiked: false };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 overflow-hidden">
          <div className="absolute top-4 right-4 z-60">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex h-full">
            {/* Left side - Photo */}
            <div className="flex-1 flex items-center justify-center relative">
              {photos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full z-40"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}

              <div 
                className="max-w-full max-h-full flex items-center justify-center"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <img
                  src={photos[activeIndex]}
                  alt={`Фото ${activeIndex + 1} — ${profileName}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {photos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full z-40"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {/* Photo indicators */}
              {photos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {photos.map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        idx === activeIndex ? "bg-white" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right side - Comments and interactions */}
            <div className="w-80 bg-background flex flex-col">
              {/* User info */}
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-lg">{profileName}</h3>
                <p className="text-sm text-muted-foreground">
                  Фото {activeIndex + 1} из {photos.length}
                </p>
              </div>

              {/* Comments */}
              <div className="flex-1 overflow-y-auto p-4" ref={commentsListRef}>
                <div className="space-y-3">
                  {currentPhotoComments.map((comment) => (
                    <div key={comment.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  ))}
                  {currentPhotoComments.length === 0 && (
                    <p className="text-muted-foreground text-center">
                      Пока нет комментариев. Будьте первым!
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-4 border-t border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      className={cn(
                        "flex items-center gap-2",
                        currentPhotoLikes.isLiked && "text-red-500"
                      )}
                    >
                      <ThumbsUp 
                        className={cn(
                          "h-5 w-5",
                          currentPhotoLikes.isLiked && "fill-current"
                        )}
                      />
                      {currentPhotoLikes.count}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={focusCommentInput}
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="h-5 w-5" />
                      {currentPhotoComments.length}
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>

                {/* Comment input */}
                <div className="flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Добавить комментарий..."
                    className="flex-1 resize-none min-h-[44px] max-h-32"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleCommentSubmit();
                      }
                    }}
                  />
                  <Button
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim()}
                    size="icon"
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="w-full max-w-md">
          <LoginModalContent 
            onClose={() => setShowLoginModal(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}