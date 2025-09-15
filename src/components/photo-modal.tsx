import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, ChevronLeft, ChevronRight, ThumbsUp, MessageCircle, Send, Share2, ThumbsDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import LoginModalContent from "@/components/login-modal-content";
import { useCardData } from "@/hooks/useCardData";
import { StarRating } from "@/components/ui/star-rating";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Comment {
  id: number;
  author: string;
  authorId: string;
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
  shareContext?: {
    title: string;
    url: string;
    description: string;
  };
  rating?: number;
  isVoted?: boolean;
  rank?: number;
  profileId?: string;
  isWinner?: boolean;
  onRate?: (rating: number) => void;
}

export function PhotoModal({ 
  isOpen, 
  onClose, 
  photos, 
  currentIndex, 
  contestantName, 
  age, 
  weight, 
  height, 
  country, 
  city, 
  onCommentSubmit,
  shareContext,
  rating = 0,
  isVoted = false,
  rank = 0,
  profileId,
  isWinner = false,
  onRate
}: PhotoModalProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [photoComments, setPhotoComments] = useState<Record<number, Comment[]>>({});
  const [photoLikes, setPhotoLikes] = useState<Record<number, { count: number; isLiked: boolean }>>({});
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isUserVoted, setIsUserVoted] = useState(isVoted);
  const { toast } = useToast();
  
  // Use card data hook for contestant data
  const cardData = useCardData(contestantName, user?.id);

  // Load user's current rating using secure function with user_id
  useEffect(() => {
    const loadUserRating = async () => {
      if (!user?.id || !profileId) return;

      try {
        const { data: userRating } = await supabase
          .rpc('get_user_rating_for_participant', { 
            participant_id_param: profileId 
          });

        if (userRating !== null && typeof userRating === 'number') {
          setUserRating(userRating);
          setIsUserVoted(true);
        }
      } catch (error) {
        console.error('Error loading user rating:', error);
      }
    };

    loadUserRating();
  }, [user?.id, profileId]);

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
      // Load comments for current photo using user_id based approach
      const contentId = profileId ? `contestant-user-${profileId}-${activeIndex}` : `contestant-photo-${contestantName}-${activeIndex}`;
      
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
            authorId: comment.user_id,
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
    
    const contentId = profileId ? `contestant-user-${profileId}-${activeIndex}` : `contestant-photo-${contestantName}-${activeIndex}`;
    const wasLiked = photoLikes[activeIndex]?.isLiked || false;
    
    // Optimistic update first for immediate UI feedback
    setPhotoLikes(prev => ({
      ...prev,
      [activeIndex]: {
        count: wasLiked ? (prev[activeIndex]?.count || 0) - 1 : (prev[activeIndex]?.count || 0) + 1,
        isLiked: !wasLiked
      }
    }));
    
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
      
    } catch (error) {
      console.error('Error handling like:', error);
      // Revert optimistic update on error
      setPhotoLikes(prev => ({
        ...prev,
        [activeIndex]: {
          count: wasLiked ? (prev[activeIndex]?.count || 0) + 1 : (prev[activeIndex]?.count || 0) - 1,
          isLiked: wasLiked
        }
      }));
    }
  };

  const handleCommentSubmit = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (commentText.trim()) {
      const contentId = profileId ? `contestant-user-${profileId}-${activeIndex}` : `contestant-photo-${contestantName}-${activeIndex}`;
      
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
          authorId: user.id,
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
                  authorId: comment.user_id,
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

  const handleShare = async () => {
    if (shareContext) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: shareContext.title,
            text: shareContext.description,
            url: shareContext.url,
          });
        } else {
          await navigator.clipboard.writeText(shareContext.url);
          toast({
            title: "Link copied",
            description: "The link has been copied to your clipboard",
            duration: 2000,
          });
        }
      } catch (error) {
        console.error('Error sharing:', error);
      }
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
        <div className="fixed inset-0 z-50 bg-black overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-[60] w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close"
          >
            <X className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </button>

          {/* Photo container - top half */}
          <div className="relative w-full h-1/2 flex items-center justify-center bg-black"
               onTouchStart={onTouchStart}
               onTouchMove={onTouchMove}
               onTouchEnd={onTouchEnd}>
            
            {/* Check if current item is video */}
            {photos[activeIndex]?.includes('winner-video.mp4') || photos[activeIndex]?.toLowerCase().includes('.mp4') || photos[activeIndex]?.toLowerCase().includes('.webm') || photos[activeIndex]?.toLowerCase().includes('.mov') ? (
              <video
                src={photos[activeIndex]}
                className="max-w-full max-h-full w-auto h-auto object-contain"
                controls
                autoPlay={false}
                preload="metadata"
                style={{ outline: 'none' }}
              />
            ) : (
              <img
                src={photos[activeIndex]}
                alt={`${contestantName} photo ${activeIndex + 1}`}
                className="max-w-full max-h-full w-auto h-auto object-contain"
                draggable={false}
              />
            )}

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

            {photos.length > 1 && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
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

          {/* Info overlay - bottom half */}
          <div className="w-full h-1/2 bg-white flex flex-col">
              {/* Winner Badge */}
              {isWinner && (
                <div className="bg-blue-100 text-blue-700 px-4 py-2 text-sm font-semibold flex justify-start items-center border-b">
                  <span>🏆 WINNER   + 5000 PHP</span>
                </div>
              )}
              
              {/* Header with name and icons */}
              <div className="p-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-black">
                      {contestantName}
                      {age ? `, ${age}` : ""}
                      {(weight || height) ? (
                        <span className="ml-1 text-sm text-gray-600 font-normal">
                          (
                          {weight ? `${weight} kg` : ""}
                          {(weight && height) ? " · " : ""}
                          {height ? `${height} cm` : ""}
                          )
                        </span>
                      ) : null}
                    </h3>
                    <div className="text-sm text-blue-600">
                      {country}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-2 text-sm",
                        currentPhotoLikes.isLiked ? "text-blue-600" : "text-gray-600"
                      )}
                      onClick={handleLike}
                    >
                        <ThumbsUp className={cn(
                          "w-5 h-5",
                          photoLikes[activeIndex]?.isLiked ? "text-blue-500" : "text-gray-500"
                        )} strokeWidth={1} />
                      <span className={cn(photoLikes[activeIndex]?.isLiked ? "text-blue-500" : "text-gray-500")}>{currentPhotoLikes.count}</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm text-gray-600"
                      onClick={focusCommentInput}
                    >
                      <MessageCircle className="w-5 h-5" strokeWidth={1} />
                      <span>{currentPhotoComments.length}</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm text-gray-600"
                      onClick={handleShare}
                    >
                      <Share2 className="w-5 h-5" strokeWidth={1} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Comments section */}
              <div className="flex-1 overflow-y-auto min-h-0 px-4" ref={commentsListRef}>
                <div className="space-y-3 py-3">
                  {currentPhotoComments.map((comment) => (
                    <div key={comment.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/u/${comment.authorId}`} 
                          className="font-medium text-sm hover:text-primary underline-offset-2 hover:underline"
                        >
                          {comment.author}
                        </Link>
                        <span className="text-xs text-gray-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-800">{comment.text}</p>
                    </div>
                  ))}
                  {currentPhotoComments.length === 0 && (
                    <p className="text-gray-500 text-center py-4 text-sm">
                      No comments yet. Be the first!
                    </p>
                  )}
                </div>
              </div>

              {/* Comment input */}
              <div className="border-t p-4 flex-shrink-0">
                <div className="flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment for this photo..."
                    className="flex-1 resize-none min-h-[44px] max-h-[44px] text-sm overflow-hidden"
                    rows={1}
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