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
  const [isUserVoted, setIsUserVoted] = useState(isVoted);
  const { toast } = useToast();
  
  // Use card data hook for contestant data
  const cardData = useCardData(contestantName, user?.id);

  // Load user's current rating
  useEffect(() => {
    const loadUserRating = async () => {
      if (!user?.id) return;

      try {
        const { data: userRatingData } = await supabase
          .from('contestant_ratings')
          .select('rating')
          .eq('user_id', user.id)
          .eq('contestant_name', contestantName)
          .single();

        if (userRatingData) {
          setUserRating(userRatingData.rating);
          setIsUserVoted(true);
        }
      } catch (error) {
        console.log('No existing rating found');
      }
    };

    loadUserRating();
  }, [user?.id, contestantName]);

  // Refs for scrolling
  const commentsListRef = useRef<HTMLDivElement>(null);

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
        
        // Call the callback to mark as commented in parent component
        onCommentSubmit?.();
        
        toast({
          title: "Comment added",
          description: "Your comment was added",
          duration: 1000,
        });
      } catch (error) {
        console.error('Error saving comment:', error);
      }
    }
  };

  const focusCommentInput = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    // Show toast or could open a comments modal
    toast({
      title: "Comments",
      description: "Comments feature coming soon",
      duration: 2000,
    });
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
          contestant_user_id: profileId,
          rating: newRating,
        }, {
          onConflict: 'user_id,contestant_user_id'
        });

      if (error) {
        console.error('Error saving rating:', error);
        return;
      }

      setUserRating(newRating);
      setIsUserVoted(true);
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

          {/* Main content - Full screen photo with overlay */}
          <div className="h-full w-full relative max-w-full">
            <div className="relative flex items-center justify-center w-full h-full overflow-hidden">

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
                className="w-full h-full object-cover touch-manipulation select-none"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                draggable={false}
              />

              {/* Thumbnail navigation */}
              {photos.length > 1 && (
                <div className="absolute bottom-32 right-4 flex items-center gap-2 z-40">
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

              {/* Overlay info panel */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 text-white z-40">
                
                {/* Winner Badge */}
                {isWinner && (
                  <div className="bg-blue-500/80 text-white px-3 py-1.5 rounded-lg text-sm font-semibold mb-3 inline-block backdrop-blur-sm">
                    🏆 WINNER + 5000 PHP
                  </div>
                )}
                
                {/* Profile info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate text-white">
                      {contestantName}
                      {age ? `, ${age}` : ""}
                    </h3>
                    <div className="text-sm text-white/90 flex items-center gap-3">
                      {country && <span>{country}</span>}
                      {weight && <span>{weight} кг</span>}
                      {height && <span>{height} см</span>}
                    </div>
                  </div>
                  
                  {/* Rating badge */}
                  {isUserVoted && !isEditing && !showThanks && rank > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="bg-blue-500 text-white px-3 py-2 rounded-lg text-lg font-bold shadow-sm cursor-pointer hover:bg-blue-600 transition-colors backdrop-blur-sm">
                          {rating.toFixed(1)}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3">
                        <div className="text-sm">
                          You rated {userRating.toFixed(0)} — <button 
                            className="text-blue-600 hover:underline" 
                            onClick={() => setIsEditing(true)}
                          >
                            change
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Voting section */}
                {!isUserVoted && !showThanks && (
                  <div className="mb-4 bg-black/30 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-lg font-medium text-white">Vote</span>
                      <div className="scale-110">
                        <StarRating 
                          rating={0}
                          isVoted={false}
                          readonly={false}
                          hideText={true}
                          variant="white"
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
                  <div className="mb-4 bg-green-500/80 rounded-lg p-3 backdrop-blur-sm text-center">
                    <span className="text-lg font-medium text-white">Thank you! Rated {userRating.toFixed(0)}</span>
                  </div>
                )}
                
                {/* Re-voting overlay */}
                {isUserVoted && isEditing && !showThanks && (
                  <div className="mb-4 bg-black/30 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-lg font-medium text-white">Vote</span>
                      <div className="scale-110">
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

                {/* Action buttons */}
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors",
                      currentPhotoLikes.isLiked && "text-red-400"
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
                    className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors"
                    onClick={focusCommentInput}
                    aria-label="Comments"
                  >
                    <MessageCircle className="w-5 h-5" strokeWidth={1} />
                    <span>{currentPhotoComments.length}</span>
                  </button>
                  
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors"
                    onClick={handleShare}
                    aria-label="Share"
                  >
                    <Share2 className="w-5 h-5" strokeWidth={1} />
                  </button>
                </div>
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