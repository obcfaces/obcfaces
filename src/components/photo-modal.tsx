import { useState, useEffect, useRef } from "react";
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
  const { toast } = useToast();
  
  // Use card data hook for contestant data
  const cardData = useCardData(contestantName, user?.id);

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

  const handleDislike = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    const contentId = `contestant-${contestantName}`;
    
    try {
      if (isDisliked) {
        // Remove dislike - for now use likes table with negative indicator
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("content_type", "contest-dislike")
          .eq("content_id", contentId);
        
        setDislikesCount(prev => prev - 1);
        setIsDisliked(false);
      } else {
        // Add dislike - for now use likes table with negative indicator
        await supabase
          .from("likes")
          .insert({
            user_id: user.id,
            content_type: "contest-dislike",
            content_id: contentId,
          });
        
        setDislikesCount(prev => prev + 1);
        setIsDisliked(true);
      }
    } catch (error) {
      console.error('Error handling dislike:', error);
    }
  };

  const handleRate = async (newRating: number) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      const { error } = await supabase
        .from("contestant_ratings")
        .upsert({
          user_id: user.id,
          contestant_name: contestantName,
          rating: newRating,
        });

      if (error) {
        console.error('Error saving rating:', error);
        return;
      }

      setUserRating(newRating);
      setShowThanks(true);
      
      setTimeout(() => {
        setShowThanks(false);
      }, 1000);

      onRate?.(newRating);
    } catch (error) {
      console.error('Error saving rating:', error);
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

          {/* Contest info section */}
          <div className="bg-background flex flex-col flex-shrink-0 w-full h-[40dvh] min-h-0">
            {/* Winner Badge */}
            {isWinner && (
              <div className="bg-blue-100 text-blue-700 px-4 py-2 text-sm font-semibold flex justify-start items-center border-b">
                <span>🏆 WINNER   + 5000 PHP</span>
              </div>
            )}
            
            {/* Header with name and country */}
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
                
                {/* Rating badge */}
                {isVoted && !isEditing && !showThanks && rank > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="bg-contest-blue text-white px-2 py-1.5 rounded-bl-lg text-base sm:text-lg font-bold shadow-sm cursor-pointer hover:bg-contest-blue/90 transition-colors">
                        {rating.toFixed(1)}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <div className="text-sm">
                        You rated {userRating.toFixed(0)} — <button 
                          className="text-contest-blue hover:underline" 
                          onClick={() => setIsEditing(true)}
                        >
                          change
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {/* Voting section */}
            <div className="relative flex-1 bg-card">
              {!isVoted && !showThanks && (
                <div className="h-full bg-gray-100 flex items-center justify-center">
                  <div className="flex items-center gap-6">
                    <span className="text-2xl font-medium text-gray-800">Vote</span>
                    <div className="scale-[2]">
                      <StarRating 
                        rating={0}
                        isVoted={false}
                        readonly={false}
                        hideText={true}
                        onRate={(newRating) => {
                          handleRate(newRating);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Thank you message */}
              {showThanks && (
                <div className="h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-800">Thank you! Rated {userRating.toFixed(0)}</span>
                </div>
              )}
              
              {/* Re-voting overlay */}
              {isVoted && isEditing && !showThanks && (
                <div className="h-full bg-gray-300 flex items-center justify-center">
                  <div className="-translate-x-2 flex items-center gap-6">
                    <span className="text-2xl font-medium text-gray-800 mr-8">Vote</span>
                    <div className="scale-[2]">
                      <StarRating 
                        rating={rating}
                        isVoted={false}
                        variant="white"
                        hideText={true}
                        onRate={(newRating) => {
                          setUserRating(newRating);
                          setIsEditing(false);
                          handleRate(newRating);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Empty space after voting */}
              {isVoted && !isEditing && !showThanks && (
                <div className="h-full"></div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="border-t border-contest-border px-4 py-2 flex items-center justify-evenly gap-4">
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors",
                  currentPhotoLikes.isLiked && "text-contest-blue"
                )}
                onClick={handleLike}
                aria-label="Like"
              >
                <ThumbsUp className="w-4 h-4 text-primary" strokeWidth={1} />
                <span className="hidden sm:inline">Like</span>
                {currentPhotoLikes.count > 0 && <span>{currentPhotoLikes.count}</span>}
              </button>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors",
                  isDisliked && "text-red-500"
                )}
                onClick={handleDislike}
                aria-label="Dislike"
              >
                <ThumbsDown className="w-4 h-4" strokeWidth={1} />
                <span className="hidden sm:inline">Dislike</span>
                <span>{dislikesCount}</span>
              </button>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors",
                  currentPhotoComments.length > 0 && "text-contest-blue"
                )}
                onClick={focusCommentInput}
                aria-label="Comments"
              >
                <MessageCircle className="w-4 h-4 text-primary" strokeWidth={1} />
                <span className="hidden sm:inline">Comment</span>
                <span>{currentPhotoComments.length}</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleShare}
                aria-label="Share"
              >
                <Share2 className="w-4 h-4" strokeWidth={1} />
                <span className="hidden sm:inline">Share</span>
              </button>
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