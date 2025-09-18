import { useState, useEffect } from "react";
import { ThumbsUp, MessageCircle, Star, Pencil, Send, Share, Share2, ExternalLink, Upload, ArrowUpRight, ThumbsDown, Crown } from "lucide-react";

import winnerPaymentImage from "@/assets/winner-payment.jpg";
import winnerVideo from "@/assets/winner-video.mp4";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { PhotoModal } from "@/components/photo-modal";
import { MiniStars } from "@/components/mini-stars";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn, getCountryDisplayName } from "@/lib/utils";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCardData } from "@/hooks/useCardData";
import { useParticipantData } from "@/hooks/useParticipantData";
import LoginModalContent from "@/components/login-modal-content";
import { ShareModal } from "@/components/share-modal";
import { useShare } from "@/hooks/useShare";
import { CompactCardLayout } from "@/components/CompactCardLayout";
import { FullCardLayout } from "@/components/FullCardLayout";

interface ContestantCardProps {
  rank: number;
  name: string;
  country: string;
  city: string;
  age: number;
  weight: number;
  height: number;
  rating: number;
  faceImage: string;
  fullBodyImage: string;
  additionalPhotos?: string[];
  isVoted?: boolean;
  isWinner?: boolean;
  prize?: string;
  viewMode?: 'compact' | 'full';
  onRate?: (rating: number) => void;
  profileId?: string;
  showDislike?: boolean;
  isRealContestant?: boolean; // New prop for real contestants
  averageRating?: number; // Add average rating prop
  totalVotes?: number; // Add total votes prop
  isExample?: boolean; // Add example flag prop
  isThisWeek?: boolean; // Add prop to identify THIS WEEK contests
  user?: any; // Add user prop to avoid individual auth calls
}

export function ContestantCard({
  rank,
  name,
  country,
  city,
  age,
  weight,
  height,
  rating,
  faceImage,
  fullBodyImage,
  additionalPhotos = [],
  isVoted: propIsVoted,
  isWinner,
  prize,
  viewMode = 'compact',
  onRate,
  profileId,
  showDislike = false,
  isRealContestant = false,
  averageRating = 0,
  totalVotes = 0,
  isExample = false,
  isThisWeek = false,
  user: propUser
}: ContestantCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isLiked, setIsLiked] = useState<boolean[]>([false, false]);
  const [isDisliked, setIsDisliked] = useState(false);
  const [hasCommented, setHasCommented] = useState(false);
  // Use propUser directly instead of local state to prevent recursion
  const [dislikesCount, setDislikesCount] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  // Local state for immediate rating updates
  const [localAverageRating, setLocalAverageRating] = useState(averageRating);
  const [localTotalVotes, setLocalTotalVotes] = useState(totalVotes);
  const [previousUserRating, setPreviousUserRating] = useState(0);
  
  // Use unified card data hook with stable dependencies
  const { data: cardData, loading: cardDataLoading, refresh: refreshCardData } = useCardData(name, propUser?.id, profileId);

  // Initialize local state when props change
  useEffect(() => {
    setLocalAverageRating(averageRating);
    setLocalTotalVotes(totalVotes);
  }, [averageRating, totalVotes]);
  
  
  // TEMPORARILY DISABLED ALL EFFECTS AND PROP SYNC TO STOP RECURSION
  // Sync local state with props only once on mount to prevent recursion
  // useEffect(() => {
  //   setLocalAverageRating(averageRating);
  //   setLocalTotalVotes(totalVotes);
  // }, []); // Empty dependency array - only run once on mount

  // Local state should only be updated through user interactions, not props changes
  // This prevents infinite recursion from prop updates

  // TEMPORARILY DISABLED - Check if user is admin
  // useEffect(() => {
  //   const checkAdminStatus = async () => {
  //     if (!user?.id) return;
      
  //     try {
  //       const { data: roles } = await supabase
  //         .from('user_roles')
  //         .select('role')
  //         .eq('user_id', user.id);
        
  //       setIsAdmin(roles?.some(r => r.role === 'admin' || r.role === 'moderator') || false);
  //     } catch (error) {
  //       console.error('Error checking admin status:', error);
  //       setIsAdmin(false);
  //     }
  //   };

  //   checkAdminStatus();
  // }, [user?.id]);

  // TEMPORARILY DISABLED - Load user's current rating using secure function with user_id
  // useEffect(() => {
  //   const loadUserRating = async () => {
  //     if (!user?.id || !profileId) return;

  //     try {
  //       const { data: userRating } = await supabase
  //         .rpc('get_user_rating_for_participant', { 
  //           participant_id_param: profileId 
  //         });

  //       if (userRating !== null && typeof userRating === 'number') {
  //         setUserRating(userRating);
  //         setPreviousUserRating(userRating); // Store the current rating as previous
  //         setIsVoted(true);
  //       } else {
  //         setUserRating(0);
  //         setPreviousUserRating(0);
  //       }
  //     } catch (error) {
  //       console.error('Error loading user rating:', error);
  //     }
  //   };

  //   loadUserRating();
  // }, [user?.id, profileId]);
  // Initialize isVoted state without complex initialization
  const [isVoted, setIsVoted] = useState(propIsVoted || false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isShareModalOpen, shareData, openShareModal, closeShareModal } = useShare();

  // Remove problematic useEffect that was causing infinite recursion

  const loadUserExistingRating = async (userId: string) => {
    if (!profileId) return;
    
    try {
      // Check if user has already rated this participant
      const { data: existingRating } = await supabase
        .rpc('get_user_rating_for_participant', { 
          participant_id_param: profileId 
        });

      if (existingRating && typeof existingRating === 'number' && existingRating > 0) {
        setUserRating(existingRating);
        setIsVoted(true);
        console.log(`Loaded existing rating ${existingRating} for user ${userId} and participant ${profileId}`);
      } else {
        // Also check localStorage as fallback
        const localRating = localStorage.getItem(`rating-${name}-${userId}`);
        if (localRating && parseInt(localRating) > 0) {
          setUserRating(parseInt(localRating));
          setIsVoted(true);
          console.log(`Loaded existing rating ${localRating} from localStorage for ${name}`);
        }
      }
    } catch (error) {
      console.error('Error loading user existing rating:', error);
    }
  };

  // Load user's existing rating when user changes
  useEffect(() => {
    if (propUser?.id && profileId) {
      loadUserExistingRating(propUser.id);
    } else {
      // Reset rating if no user
      setUserRating(0);
      setIsVoted(false);
    }
  }, [propUser?.id, profileId, name]);

  // Login modal removed auto-close

  // TEMPORARILY DISABLED - Load user voting status and setup dislikes - only run when we have a stable user
  // useEffect(() => {
  //   if (!user?.id) return; // Exit early if no user
    
  //   const loadUserVotingData = async () => {
  //     // Load user's likes status for card
  //     const { data: userLikes } = await supabase
  //       .from("likes")
  //       .select("content_id")
  //       .eq("content_type", "contest")
  //       .eq("user_id", user.id)
  //       .eq("content_id", `contestant-card-${name}`);
      
  //     if (userLikes && userLikes.length > 0) {
  //       setIsLiked([true, true]); // Set both to true if user liked the card
  //     } else {
  //       setIsLiked([false, false]);
  //     }

  //     // Load user's comments status
  //     const contentIds = profileId 
  //       ? [`contestant-user-${profileId}-0`, `contestant-user-${profileId}-1`]
  //       : [`contestant-photo-${name}-0`, `contestant-photo-${name}-1`];
        
  //     const { data: userComments } = await supabase
  //       .from("photo_comments")
  //       .select("content_id")
  //       .eq("content_type", "contest")
  //       .eq("user_id", user.id)
  //       .in("content_id", contentIds);
      
  //     if (userComments && userComments.length > 0) {
  //       setHasCommented(true);
  //     }

  //     // Load dislike votes for next week
  //     const { data: dislikeVotes } = await supabase
  //       .from("next_week_votes")
  //       .select("vote_type")
  //       .eq("candidate_name", name)
  //       .eq("vote_type", "dislike");
      
  //     if (dislikeVotes) {
  //       setDislikesCount(dislikeVotes.length);
  //     }

  //     // Check if current user disliked
  //     const { data: userDislike } = await supabase
  //       .from("next_week_votes")
  //       .select("vote_type")
  //       .eq("candidate_name", name)
  //       .eq("user_id", user.id)
  //       .eq("vote_type", "dislike");
      
  //     if (userDislike && userDislike.length > 0) {
  //       setIsDisliked(true);
  //     }
  //   };

  //   loadUserVotingData();
  // }, [user?.id, name, profileId]); // Only depend on user.id, not the full user object

  const handleLike = async (index: number) => {
    if (!propUser) {
      setShowLoginModal(true);
      return;
    }
    
    // Use consistent content_id format for both saving and loading
    const contentId = profileId ? `contestant-user-${profileId}` : `contestant-card-${name}`;
    const wasLiked = isLiked[0]; // Card likes are stored in first index
    
    // Optimistic UI update
    setIsLiked([!wasLiked, !wasLiked]);
    
    try {
      if (wasLiked) {
        // Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", propUser.id)
          .eq("content_type", "contest")
          .eq("content_id", contentId);
      } else {
        // Like
        await supabase
          .from("likes")
          .insert({
            user_id: propUser.id,
            content_type: "contest",
            content_id: contentId,
          });
      }
      
      // Don't refresh card data immediately to prevent recursion
      // The UI updates optimistically already
      
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked([wasLiked, wasLiked]);
      toast({ description: "Failed to perform action" });
    }
  };

  const handleDislike = () => {
    if (!propUser) {
      setShowLoginModal(true);
      return;
    }
    
    setIsDisliked(prev => !prev);
    setDislikesCount(prev => isDisliked ? prev - 1 : prev + 1);
  };

  const handleRate = async (rating: number) => {
    console.log('handleRate called with:', { rating, name, userId: propUser?.id, profileId });
    
    if (!propUser) {
      setShowLoginModal(true);
      return;
    }

    // Prevent rating example cards
    if (profileId === "00000000-0000-0000-0000-000000000000" || name === "Example Card") {
      toast({ description: "Cannot rate example cards" });
      return;
    }

    // Prevent rating past weeks (только THIS WEEK можно голосовать)
    if (!isThisWeek) {
      toast({ description: "Voting is only allowed for current week contests" });
      return;
    }
    
    // Update local state immediately for instant feedback
    setUserRating(rating);
    setIsVoted(true);
    
    // Calculate new average rating immediately
    const newTotalVotes = previousUserRating === 0 ? localTotalVotes + 1 : localTotalVotes;
    const newSum = (localAverageRating * localTotalVotes) - previousUserRating + rating;
    const newAverageRating = newTotalVotes > 0 ? newSum / newTotalVotes : 0;
    
    setLocalAverageRating(newAverageRating);
    setLocalTotalVotes(newTotalVotes);
    setPreviousUserRating(rating);
    
    // Show thanks message briefly
    setShowThanks(true);
    setTimeout(() => {
      setShowThanks(false);
      setIsEditing(false); // Exit editing mode after rating
    }, 1500);
    
    try {
      const ratingData = {
        user_id: propUser.id,
        contestant_name: name,
        contestant_user_id: profileId || null,
        rating: rating
      };
      
      console.log('Saving rating to database:', ratingData);
      
      // Use upsert to handle one rating per user per contestant
      const { data, error } = await supabase
        .from('contestant_ratings')
        .upsert(ratingData, { 
          onConflict: 'user_id,contestant_user_id',
          ignoreDuplicates: false 
        })
        .select();
      
      console.log('Rating upsert result:', { data, error });
      
      if (error) {
        console.error('Upsert failed with error:', error);
        toast({ description: "Error saving rating: " + error.message });
        // Revert local state on error
        setUserRating(0);
        setIsVoted(false);
        setShowThanks(false);
        return;
      }
      
      // Store in localStorage for persistence
      localStorage.setItem(`rating-${name}-${propUser.id}`, rating.toString());
      
      // Call onRate callback if provided (for parent component to refresh rankings)
      if (onRate) {
        onRate(rating);
      }
      
      console.log('Rating saved successfully');
    } catch (error) {
      console.error('Error saving rating:', error);
      toast({ description: "Error saving rating" });
      // Revert local state on error
      setUserRating(0);
      setIsVoted(false);
      setShowThanks(false);
    }
  };

  const handleComment = () => {
    if (!propUser) {
      setShowLoginModal(true);
      return;
    }
    
    openModal(0);
  };

  // Function to mark as commented (called from PhotoModal when comment is submitted)
  const markAsCommented = () => {
    if (propUser) {
      localStorage.setItem(`commented-${name}-${propUser.id}`, 'true');
      setHasCommented(true);
    }
  };



  const allPhotos = isWinner 
    ? [faceImage, fullBodyImage, ...additionalPhotos, winnerPaymentImage, winnerVideo]
    : [faceImage, fullBodyImage, ...additionalPhotos];

  const openModal = (photoIndex: number) => {
    setModalStartIndex(photoIndex);
    setIsModalOpen(true);
  };

  if (viewMode === 'full') {
    return (
      <>
        <Card className={`${isExample ? 'border-yellow-400 border-2 bg-yellow-50/50' : isWinner ? 'border-contest-blue border-2' : 'bg-card border-contest-border'} relative overflow-hidden`}>
          {/* Rank number in top left corner - show in past weeks for all users */}
          {rank > 0 && !isExample && totalVotes > 0 && !isThisWeek && (
            <div className="absolute top-0 left-0 z-20 flex items-center">
              <div className="bg-black/70 text-white px-1 py-0.5 rounded-br text-xs font-bold">
                {rank}
              </div>
            </div>
          )}
           
             {/* Rating in top right corner - show for all users in past weeks */}
             {rank > 0 && !isExample && !isThisWeek && (
               <div className="absolute top-0 right-0 z-20 flex items-center">
                 <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                   <PopoverTrigger asChild>
                     <div className="bg-contest-blue text-white px-2 py-1.5 rounded-bl-lg text-lg font-bold cursor-pointer hover:bg-contest-blue/90 transition-colors">
                       {localAverageRating > 0 ? localAverageRating.toFixed(1) : '0.0'}
                     </div>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-3">
                     <div className="text-sm">
                       {userRating > 0 ? 
                         `Your rating: ${userRating}` : 
                         `No rating`
                       }{isThisWeek && ` — `}<button 
                         className={`text-contest-blue hover:underline ${!isThisWeek ? 'hidden' : ''}`}
                         onClick={() => {
                           setIsEditing(true);
                           setIsPopoverOpen(false);
                         }}
                       >
                         change
                       </button>
                     </div>
                   </PopoverContent>
                 </Popover>
               </div>
             )}
          
          
          {/* Header with content or voting overlay */}
          <div className="relative px-6 py-3 border-b border-contest-border h-[80px]">
            {/* Show different content based on user auth status and contest type */}
            {isThisWeek && !propUser && !isExample ? (
              /* Unauthorized users in THIS WEEK section only see voting (but not for test cards) */
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center h-full">
                <div className="flex items-center gap-12">
                  <span className="text-lg font-medium text-gray-800">Vote</span>
                  <div className="scale-[2]">
                    <StarRating 
                      rating={userRating}
                      isVoted={false}
                      onRate={handleRate}
                      readonly={false}
                      hideText={true}
                      variant="white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Authorized users or non-THIS WEEK sections see full content */
              !isEditing && !showThanks && (
                <div className="flex items-center justify-between h-full">
                  <div>
                    <h3 className="text-xl font-semibold text-contest-text">
                      {profileId ? (
                        <Link to={`/u/${profileId}`} className="hover:text-primary underline-offset-2 hover:underline">
                          {name}
                        </Link>
                      ) : name}
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      {age} yo · {weight} kg · {height} cm
                    </div>
                    <div className="text-contest-blue text-sm">{getCountryDisplayName(country)} · {city}</div>
                  </div>
                  {/* Remove rating display from header since it's now in corner */}
                </div>
              )
            )}
            
            {/* Thank you message - shown for 1 second after voting */}
            {showThanks && (
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center gap-3 h-full">
                <span className="text-lg font-medium text-gray-800">Thank you! Rated {userRating.toFixed(0)}</span>
              </div>
            )}
            
            {/* Re-voting overlay - shown when editing existing vote */}
            {isVoted && isEditing && !showThanks && (
            <div className="absolute inset-0 bg-gray-300 flex items-center justify-center h-full">
              <div className="-translate-x-2 flex items-center gap-6">
                <span className="text-2xl font-medium text-gray-800 mr-8">Vote</span>
                <div className="scale-[2]">
                   <StarRating 
                     rating={0}
                     isVoted={false}
                    variant="white"
                    hideText={true}
                    onRate={(rating) => {
                      console.log('Edit mode StarRating onRate called with rating:', rating);
                      console.log('User state:', propUser);
                      if (!propUser) {
                        setShowLoginModal(true);
                        return;
                      }
                      setUserRating(rating);
                      localStorage.setItem(`rating-${name}-${propUser.id}`, rating.toString());
                      setIsEditing(false);
                      handleRate(rating); // ИСПРАВЛЕНО: вызываем handleRate для сохранения в БД
                    }}
                  />
                </div>
              </div>
            </div>
            )}
            
            {/* Empty space after voting */}
            {isVoted && !isEditing && !showThanks && (
              <div className="h-full">
              </div>
            )}
          </div>
          
           {/* Photos section */}
           <div className="relative">
              {/* Example text area with photo requirements */}
              {isExample && (
                <div className="bg-yellow-400 text-black px-4 py-3">
                  <div className="text-sm font-semibold mb-3">How your photos should look:</div>
                  <div className="grid grid-cols-2 gap-6 text-xs">
                    <div className="space-y-1">
                      <div>• Look like an ID photo</div>
                      <div>• No makeup</div>
                      <div>• No filters</div>
                      <div>• No glasses allowed</div>
                    </div>
                    <div className="space-y-1">
                      <div>• Whole body from head to toe</div>
                      <div>• Wear tight/fitted clothes. No dresses, skirts, heels</div>
                      <div>• No bags or backpacks</div>
                    </div>
                  </div>
                </div>
              )}
             
             <div className="grid grid-cols-2 gap-px">
               {/* Winner Badge - overlaid on photos like in profile */}
               {isWinner && (
                 <div className="absolute top-0 left-0 right-0 z-20 bg-blue-100 text-blue-700 px-2 py-1 text-xs font-semibold flex justify-start items-center">
                   <span>🏆 WINNER   + 5000 PHP</span>
                 </div>
               )}
               
                <div className="relative">
                  <img 
                    src={faceImage} 
                    alt={`${name} face`}
                    className="w-full aspect-[4/5] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openModal(0)}
                  />
                  {/* Example Badge in corner of first photo */}
                  {isExample && (
                    <div className="absolute top-1 left-1 bg-yellow-500 text-white px-1.5 py-0.5 text-xs font-bold rounded">
                      Example
                    </div>
                  )}
                </div>
              <div className="relative">
                <img 
                  src={fullBodyImage} 
                  alt={`${name} full body`}
                  className="w-full aspect-[4/5] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openModal(1)}
                />
                {additionalPhotos.length > 0 && (
                  <div 
                    className="absolute bottom-0.5 right-0.5 bg-black/40 text-white/80 text-xs px-1 py-0.5 rounded cursor-pointer hover:bg-black/60 transition-colors"
                    onClick={() => openModal(2)}
                  >
                    +{additionalPhotos.length}
                  </div>
                )}
              </div>
            </div>
           </div>
           {!isExample && (
             <div className="border-t border-contest-border px-4 py-2 flex items-center justify-evenly gap-4">
                <button
                 type="button"
                 className={cn(
                   "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors",
                   (isLiked[0] || isLiked[1]) && "text-contest-blue"
                 )}
                 onClick={() => handleLike(0)}
                 aria-label="Like"
               >
                  <ThumbsUp className={cn("w-4 h-4", (isLiked[0] || isLiked[1]) ? "text-blue-500" : "text-gray-500")} strokeWidth={1} />
                  <span className={cn("hidden sm:inline", (isLiked[0] || isLiked[1]) ? "text-blue-500" : "text-gray-500")}>Like</span>
                    <span className={cn((isLiked[0] || isLiked[1]) ? "text-blue-500" : "text-gray-500")}>{cardData.likes}</span>
               </button>
               {showDislike && (
                 <button
                   type="button"
                   className={cn(
                     "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors",
                     isDisliked && "text-red-500"
                   )}
                   onClick={handleDislike}
                   aria-label="Dislike"
                 >
                   <ThumbsDown className="w-4 h-4" />
                   <span className="hidden sm:inline">Dislike</span>
                   <span>{dislikesCount}</span>
                 </button>
               )}
               <button
                 type="button"
                 className={cn(
                   "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors",
                   hasCommented && "text-contest-blue"
                 )}
                 onClick={handleComment}
                 aria-label="Comments"
               >
                 <MessageCircle className={cn("w-4 h-4", hasCommented ? "text-contest-blue" : "text-gray-500")} strokeWidth={1} />
                 <span className="hidden sm:inline">Comment</span>
                  <span>{cardData.comments}</span>
               </button>
               <button
                 type="button"
                 className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                 onClick={() => openShareModal({
                   title: `${name} - Beauty Contest`,
                   url: profileId ? `https://obcface.com/u/${profileId}` : `https://obcface.com`,
                   description: `Check out ${name}, ${age} from ${city}, ${country} in this beauty contest!`
                 })}
                 aria-label="Share"
               >
                  <Share2 className="w-4 h-4" strokeWidth={1} />
                  <span className="hidden sm:inline">Share</span>
               </button>
            </div>
           )}
         </Card>

        <PhotoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          photos={allPhotos}
          currentIndex={modalStartIndex}
          contestantName={name}
          age={age}
          weight={weight}
          height={height}
          country={country}
          city={city}
          onCommentSubmit={markAsCommented}
          shareContext={{
            title: `${name} - Beauty Contest`,
            url: profileId ? `https://obcface.com/u/${profileId}` : `https://obcface.com`,
            description: `Check out ${name}, ${age} from ${city}, ${country} in this beauty contest!`
          }}
          rating={rating}
          isVoted={isVoted}
          rank={rank}
          profileId={profileId}
          isWinner={isWinner}
          onRate={handleRate}
        />

        {/* Login Modal */}
        <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
          <DialogContent className="sm:max-w-lg">
            <LoginModalContent onClose={() => setShowLoginModal(false)} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      
      <Card className={`${isExample ? 'border-yellow-400 border-2 bg-yellow-50/50' : isWinner ? 'border-contest-blue border-2' : 'bg-card border-contest-border'} relative overflow-hidden ${isWinner ? 'flex flex-col' : 'h-36 sm:h-40 md:h-44'}`}>
        {isWinner && (
          <div className="absolute top-0 left-0 w-[193px] sm:w-[225px] md:w-[257px] bg-blue-100 text-blue-700 pl-2 pr-2 py-1 text-xs font-semibold flex items-center justify-start z-20">
            <span>🏆 WINNER   + 5000 PHP</span>
          </div>
        )}
        
        {/* Rating badge in top right corner - show for everyone except unauthenticated users in THIS WEEK */}
        {isVoted && !isEditing && !showThanks && !isExample && (propUser || !isThisWeek) && (
          <div className="absolute top-0 right-0 z-10 flex flex-col items-end">
             <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
               <PopoverTrigger asChild>
                  <div className="bg-contest-blue text-white px-1.5 py-1 rounded-bl-lg text-sm sm:text-base font-bold shadow-sm cursor-pointer hover:bg-contest-blue/90 transition-colors relative">
                     {isWinner && (
                       <Crown className="w-4 h-4 text-yellow-400 absolute -top-5 left-1/2 transform -translate-x-1/2" />
                     )}
                      {(() => {
                        // Для всех пользователей (включая админов) показываем средний рейтинг
                        return localAverageRating > 0 ? localAverageRating.toFixed(1) : '0.0';
                      })()}
                  </div>
               </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <div className="text-sm">
                    {userRating > 0 ? 
                      `Your rating: ${userRating}` : 
                      `No rating`
                    }{isThisWeek && ` — `}<button 
                      className={`text-contest-blue hover:underline ${!isThisWeek ? 'hidden' : ''}`}
                      onClick={() => {
                        setIsEditing(true);
                        setIsPopoverOpen(false);
                      }}
                    >
                      change
                    </button>
                  </div>
                </PopoverContent>
             </Popover>
          </div>
        )}
        
        {/* First row: Main two photos with additional photos indicator */}
        <div className={`${isWinner && viewMode !== 'compact' ? 'w-full' : 'flex h-full'} relative gap-px`}>
          {/* Winner cards have different layout only in full mode */}
          {isWinner && viewMode !== 'compact' ? (
            <div className="flex flex-col">
              <FullCardLayout
                name={name}
                age={age}
                weight={weight}
                height={height}
                country={country}
                city={city}
                profileId={profileId}
                faceImage={faceImage}
                fullBodyImage={fullBodyImage}
                additionalPhotos={additionalPhotos}
                isVoted={isVoted}
                isEditing={isEditing}
                showThanks={showThanks}
                isExample={isExample}
                isThisWeek={isThisWeek}
                isWinner={isWinner}
                rank={rank}
                userRating={userRating}
                localAverageRating={localAverageRating}
                isPopoverOpen={isPopoverOpen}
                setIsPopoverOpen={setIsPopoverOpen}
                cardData={cardData}
                isLiked={isLiked}
                hasCommented={hasCommented}
                isDisliked={isDisliked}
                dislikesCount={dislikesCount}
                showDislike={showDislike}
                propUser={propUser}
                openModal={openModal}
                handleLike={handleLike}
                handleComment={markAsCommented}
                handleDislike={handleDislike}
                openShareModal={openShareModal}
                handleRate={handleRate}
                setShowLoginModal={setShowLoginModal}
                setUserRating={setUserRating}
                setIsEditing={setIsEditing}
              />
            </div>
          ) : (
            /* Regular cards layout (including winners in compact mode) */
            <CompactCardLayout
              name={name}
              age={age}
              weight={weight}
              height={height}
              country={country}
              city={city}
              profileId={profileId}
              faceImage={faceImage}
              fullBodyImage={fullBodyImage}
              additionalPhotos={additionalPhotos}
              isVoted={isVoted}
              isEditing={isEditing}
              showThanks={showThanks}
              isExample={isExample}
              isThisWeek={isThisWeek}
              isWinner={isWinner}
              rank={rank}
              userRating={userRating}
              localAverageRating={localAverageRating}
              cardData={cardData}
              isLiked={isLiked}
              hasCommented={hasCommented}
              isDisliked={isDisliked}
              dislikesCount={dislikesCount}
              showDislike={showDislike}
              propUser={propUser}
              openModal={openModal}
              handleLike={handleLike}
              handleComment={markAsCommented}
              handleDislike={handleDislike}
              openShareModal={openShareModal}
              handleRate={handleRate}
              setShowLoginModal={setShowLoginModal}
              setUserRating={setUserRating}
              setIsEditing={setIsEditing}
            />
          )}
        </div>
        
        {/* Divider line between rows */}
        {isWinner && <div className="border-t border-gray-400 w-full"></div>}
        
        {/* Second row for winner cards only */}
        {isWinner && (
          <>
            <div className="flex h-36 sm:h-40 md:h-44 relative gap-px">
              {/* Payment photo */}
              <div className="relative">
                <img 
                  src={winnerPaymentImage} 
                  alt="Payment receipt"
                  className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openModal(isWinner ? additionalPhotos.length + 2 : 2)}
                />
              </div>
              
              {/* Video - clickable */}
              <div className="relative">
                <video 
                  src={winnerVideo}
                  className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  controls={false}
                  muted
                  onClick={() => openModal(isWinner ? additionalPhotos.length + 3 : 3)}
                />
              </div>
              
              {/* Testimonial text */}
              <div className="flex-1 p-3 flex flex-col items-center justify-center">
                <p className="text-sm text-gray-700 italic text-center mb-3">
                  "I never imagined this could be real. I'm so happy I won! All I had to do was fill out the form. Anyone can do it!"
                </p>
                <p className="text-xs text-gray-600 font-bold italic self-end uppercase">{name}</p>
              </div>
            </div>
            
            {/* Winner cards end after second row - no extra content area */}
          </>
        )}
      </Card>

      <PhotoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        photos={allPhotos}
        currentIndex={modalStartIndex}
        contestantName={name}
        age={age}
        weight={weight}
        height={height}
        country={country}
        city={city}
        onCommentSubmit={markAsCommented}
        shareContext={{
          title: `${name} - Beauty Contest`,
          url: profileId ? `https://obcface.com/u/${profileId}` : `https://obcface.com`,
          description: `Check out ${name}, ${age} from ${city}, ${country} in this beauty contest!`
        }}
        rating={rating}
        isVoted={isVoted}
        rank={rank}
        profileId={profileId}
        isWinner={isWinner}
        onRate={handleRate}
      />

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-lg">
          <LoginModalContent onClose={() => setShowLoginModal(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={closeShareModal}
        title={shareData.title}
        url={shareData.url}
        description={shareData.description}
      />
    </>
  );
}