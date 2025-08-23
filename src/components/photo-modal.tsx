import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ThumbsUp, MessageCircle, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import LoginModalContent from "@/components/login-modal-content";

interface Comment {
  id: number;
  author: string;
  text: string;
  timestamp: string;
}

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  currentIndex: number;
  contestantName: string;
  age?: number;
  weight?: number;
  height?: number;
  country?: string;
  city?: string;
  onCommentSubmit?: () => void;
}

export function PhotoModal({ isOpen, onClose, photos, currentIndex, contestantName, age, weight, height, country, city, onCommentSubmit }: PhotoModalProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [photoComments, setPhotoComments] = useState<Record<number, Comment[]>>({});
  const [photoLikes, setPhotoLikes] = useState<Record<number, { count: number; isLiked: boolean }>>({});
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast } = useToast();

  // Refs for focusing comment input and scrolling
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
      // Load comments for current photo
      const contentId = `contestant-photo-${contestantName}-${activeIndex}`;
      
      // Try without join first to see if basic query works
      const { data: comments, error: commentsError } = await supabase
        .from('photo_comments')
        .select('*')
        .eq('content_type', 'contest')
        .eq('content_id', contentId)
        .order('created_at', { ascending: false });

      console.log('Comments query result:', { comments, commentsError, contentId });

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
            id: parseInt(comment.id.slice(-8), 16),
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
        .eq("content_type", "contest")
        .eq("content_id", contentId);
      
      const { data: userLike } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", user?.id || '')
        .eq("content_type", "contest")
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
  }, [isOpen, activeIndex, contestantName, user]);

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
    
    const contentId = `contestant-photo-${contestantName}-${activeIndex}`;
    const wasLiked = photoLikes[activeIndex]?.isLiked || false;
    
    try {
      if (wasLiked) {
        // Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("content_type", "contest")
          .eq("content_id", contentId);
      } else {
        // Like
        await supabase
          .from("likes")
          .insert({
            user_id: user.id,
            content_type: "contest",
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
      const contentId = `contestant-photo-${contestantName}-${activeIndex}`;
      
      try {
        // Save comment to database
        const { error } = await supabase
          .from('photo_comments')
          .insert({
            user_id: user.id,
            content_type: 'contest',
            content_id: contentId,
            comment_text: commentText.trim()
          });

        if (error) {
          console.error('Error saving comment:', error);
          toast({
            title: "Error",
            description: "Failed to save comment",
            duration: 3000,
          });
          return;
        }

        // Add comment to local state for immediate feedback
        const newComment: Comment = {
          id: Date.now(),
          author: "You",
          text: commentText.trim(),
          timestamp: "just now"
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
        
        // Call the callback to mark as commented in parent component
        onCommentSubmit?.();
        
        // Reload comments to get fresh data from database
        setTimeout(() => {
          const loadCommentsAgain = async () => {
            const { data: freshComments } = await supabase
              .from('photo_comments')
              .select('*')
              .eq('content_type', 'contest')
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
                  id: parseInt(comment.id.slice(-8), 16),
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
          title: "Comment added",
          description: "Your comment was added",
          duration: 1000,
        });
      } catch (error) {
        console.error('Error saving comment:', error);
        toast({
          title: "Error",
          description: "Failed to save comment",
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
    // Ensure comments panel is scrolled to the latest position
    if (commentsListRef.current) {
      commentsListRef.current.scrollTo({
        top: commentsListRef.current.scrollHeight,
        behavior: "smooth",
      });
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
      // Swipe left - next photo
      nextPhoto();
    } else if (distance < -minSwipeDistance) {
      // Swipe right - previous photo  
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
            <div className={cn(
              "relative flex items-center justify-center transition-all duration-300 pt-2 md:pt-4",
              "w-full h-[60dvh] overflow-hidden"
            )}>

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
              alt={`${contestantName} photo ${activeIndex + 1}`}
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

            {/* actions moved to header */}


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

          {/* Comments section - Desktop: sidebar, Mobile: bottom panel */}
          <div className={cn(
            "bg-background relative flex flex-col flex-shrink-0 w-full",
            "h-[40dvh] min-h-0"
          )}>
              <div className="p-4 border-b">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-contest-text truncate">
                      {contestantName}
                      {age ? `, ${age}` : ""}
                      {(weight || height) ? (
                        <span className="ml-1 text-xs sm:text-sm text-muted-foreground font-normal">
                          (
                          {weight ? `${weight} kg` : ""}
                          {(weight && height) ? " · " : ""}
                          {height ? `${height} cm` : ""}
                          )
                        </span>
                      ) : null}
                    </h3>
                    <div className="text-sm text-contest-blue truncate">
                      {country}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "text-muted-foreground hover:text-foreground transition-colors",
                        currentPhotoLikes.isLiked && "text-contest-blue"
                      )}
                      onClick={handleLike}
                      aria-label="Like"
                    >
                      <ThumbsUp className="w-4 h-4 mr-1 text-primary" strokeWidth={1} />
                      {currentPhotoLikes.count}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "text-muted-foreground hover:text-foreground transition-colors",
                        currentPhotoComments.length > 0 && "text-contest-blue"
                      )}
                      onClick={focusCommentInput}
                      aria-label="Open comment field"
                    >
                      <MessageCircle className="w-4 h-4 mr-1 text-primary" strokeWidth={1} />
                      {currentPhotoComments.length}
                    </Button>
                  </div>
                </div>
              </div>

              <div ref={commentsListRef} className="flex-1 overflow-y-auto p-4 pb-24 md:pb-28 space-y-3 min-h-0">
                {currentPhotoComments.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm">
                    No comments yet for this photo
                  </p>
                ) : (
                  currentPhotoComments.map((comment) => (
                    <div key={comment.id} className="space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="sticky bottom-0 left-0 right-0 p-3 md:p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-2 md:pb-3 flex items-end gap-2 md:gap-3">
                <Textarea
                  ref={textareaRef}
                  placeholder="Write a comment for this photo..."
                  value={commentText}
                  rows={1}
                  onChange={(e) => {
                    setCommentText(e.target.value);
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    // Limit height to prevent layout shifts and photo enlargement
                    const maxH = Math.min(120, Math.floor(window.innerHeight * 0.15));
                    el.style.height = Math.min(el.scrollHeight, maxH) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCommentSubmit();
                    }
                  }}
                  className="flex-1 resize-none overflow-y-auto text-base md:text-sm min-h-[44px] max-h-[120px]"
                  aria-label="Comment for current photo"
                />
                <Button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim()}
                  size="icon"
                  className="shrink-0 rounded-full h-10 w-10 bg-contest-blue text-white hover:bg-contest-blue/90"
                  aria-label="Send comment"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-lg">
          <LoginModalContent onClose={() => setShowLoginModal(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}