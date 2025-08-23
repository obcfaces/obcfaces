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
      // Instead of using profile-photo-specific content_id, 
      // we'll load stats from the user's posts that contain this photo
      
      // Load all posts from this user to find which post contains this photo
      const { data: userPosts } = await supabase
        .from('posts')
        .select('id, media_urls')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });

      // Find the post that contains the current photo
      let matchingPostId = null;
      if (userPosts) {
        for (const post of userPosts) {
          if (post.media_urls && post.media_urls.includes(photos[activeIndex])) {
            matchingPostId = post.id;
            break;
          }
        }
      }

      if (matchingPostId) {
        // Load comments for the post
        const { data: comments } = await supabase
          .from('photo_comments')
          .select('*')
          .eq('content_type', 'post')
          .eq('content_id', matchingPostId)
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

        // Load likes for the post
        const { data: totalLikes } = await supabase
          .from("post_likes")
          .select("user_id")
          .eq("post_id", matchingPostId);
        
        const { data: userLike } = await supabase
          .from("post_likes")
          .select("id")
          .eq("user_id", user?.id || '')
          .eq("post_id", matchingPostId)
          .maybeSingle();
        
        setPhotoLikes(prev => ({
          ...prev,
          [activeIndex]: {
            count: totalLikes?.length || 0,
            isLiked: !!userLike
          }
        }));
      } else {
        // If no matching post found, show empty state
        setPhotoComments(prev => ({
          ...prev,
          [activeIndex]: []
        }));
        setPhotoLikes(prev => ({
          ...prev,
          [activeIndex]: { count: 0, isLiked: false }
        }));
      }
    };

    loadPhotoData();
  }, [isOpen, activeIndex, profileId, user, photos]);

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
    
    // Find the post that contains this photo
    const { data: userPosts } = await supabase
      .from('posts')
      .select('id, media_urls')
      .eq('user_id', profileId);

    let matchingPostId = null;
    if (userPosts) {
      for (const post of userPosts) {
        if (post.media_urls && post.media_urls.includes(photos[activeIndex])) {
          matchingPostId = post.id;
          break;
        }
      }
    }

    if (!matchingPostId) return;
    
    const wasLiked = photoLikes[activeIndex]?.isLiked || false;
    
    try {
      if (wasLiked) {
        // Unlike
        await supabase
          .from("post_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", matchingPostId);
      } else {
        // Like
        await supabase
          .from("post_likes")
          .insert({
            user_id: user.id,
            post_id: matchingPostId,
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
      // Find the post that contains this photo
      const { data: userPosts } = await supabase
        .from('posts')
        .select('id, media_urls')
        .eq('user_id', profileId);

      let matchingPostId = null;
      if (userPosts) {
        for (const post of userPosts) {
          if (post.media_urls && post.media_urls.includes(photos[activeIndex])) {
            matchingPostId = post.id;
            break;
          }
        }
      }

      if (!matchingPostId) {
        toast({
          title: "Ошибка",
          description: "Не удалось найти пост с этим фото",
          duration: 3000,
        });
        return;
      }
      
      try {
        // Save comment to database
        const { error } = await supabase
          .from('photo_comments')
          .insert({
            user_id: user.id,
            content_type: 'post',
            content_id: matchingPostId,
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
              .eq('content_type', 'post')
              .eq('content_id', matchingPostId)
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
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-[60] w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close"
          >
            <X className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </button>

          {/* Main content */}
          <div className="h-full w-full flex flex-col max-w-full">
            {/* Photo section */}
            <div className="relative flex items-center justify-center transition-all duration-300 pt-2 md:pt-4 w-full h-[70dvh] overflow-hidden">

              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:text-white/90 transition-colors w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur flex items-center justify-center"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-7 h-7" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:text-white/90 transition-colors w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur flex items-center justify-center"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-7 h-7" />
                  </button>
                </>
              )}

              <img
                src={photos[activeIndex]}
                alt={`${profileName} photo ${activeIndex + 1}`}
                className="max-w-full max-h-full object-contain touch-manipulation select-none"
                style={{ 
                  width: 'auto', 
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                draggable={false}
              />

              {/* Thumbnail navigation */}
              {photos.length > 1 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  {photos.map((src, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Go to photo ${index + 1}`}
                      className={cn(
                        "relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden ring-1 ring-white/40 border border-white/20 transition-all",
                        index === activeIndex ? "ring-2 ring-white opacity-100" : "opacity-70 hover:opacity-100"
                      )}
                    >
                      <img
                        src={src}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile info section */}
            <div className="bg-background flex flex-col flex-shrink-0 w-full h-[30dvh] min-h-0">
              {/* Header with name and action icons */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg truncate">
                      {profileName}
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      Фото {activeIndex + 1} из {photos.length}
                    </div>
                  </div>
                  
                  {/* Action icons in header like in contests */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors",
                        currentPhotoLikes.isLiked && "text-red-500"
                      )}
                      onClick={handleLike}
                      aria-label="Like"
                    >
                      <ThumbsUp className={cn(
                        "w-4 h-4",
                        currentPhotoLikes.isLiked && "fill-current"
                      )} strokeWidth={1} />
                      {currentPhotoLikes.count > 0 && <span>{currentPhotoLikes.count}</span>}
                    </button>
                    
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={focusCommentInput}
                      aria-label="Comments"
                    >
                      <MessageCircle className="w-4 h-4" strokeWidth={1} />
                      {currentPhotoComments.length > 0 && <span>{currentPhotoComments.length}</span>}
                    </button>
                    
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={handleShare}
                      aria-label="Share"
                    >
                      <Share2 className="w-4 h-4" strokeWidth={1} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments section */}
              <div className="flex-1 overflow-y-auto" ref={commentsListRef}>
                <div className="p-4 space-y-3">
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
                    <div className="p-4 text-center">
                      <p className="text-muted-foreground text-sm">
                        Пока нет комментариев. Будьте первым!
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action buttons and comment input */}
              <div className="border-t">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
                        currentPhotoLikes.isLiked && "text-red-500"
                      )}
                      onClick={handleLike}
                      aria-label="Like"
                    >
                      <ThumbsUp className={cn(
                        "w-5 h-5",
                        currentPhotoLikes.isLiked && "fill-current"
                      )} strokeWidth={1} />
                      <span>{currentPhotoLikes.count}</span>
                    </button>
                    
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={focusCommentInput}
                      aria-label="Comments"
                    >
                      <MessageCircle className="w-5 h-5" strokeWidth={1} />
                      <span>{currentPhotoComments.length}</span>
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={handleShare}
                    aria-label="Share"
                  >
                    <Share2 className="w-5 h-5" strokeWidth={1} />
                  </button>
                </div>

                {/* Comment input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      ref={textareaRef}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment for this photo..."
                      className="flex-1 resize-none min-h-[44px] max-h-32 text-sm"
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