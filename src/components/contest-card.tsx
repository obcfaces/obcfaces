import { useState, useEffect } from "react";
import { ThumbsUp, MessageCircle, Star, Pencil, Send, Share, Share2, ExternalLink, Upload, ArrowUpRight, ThumbsDown } from "lucide-react";

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
  isExample = false
}: ContestantCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isLiked, setIsLiked] = useState<boolean[]>([false, false]);
  const [isDisliked, setIsDisliked] = useState(false);
  const [hasCommented, setHasCommented] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dislikesCount, setDislikesCount] = useState<number>(0);
  
  // Use unified card data hook
  const { data: cardData, loading: cardDataLoading } = useCardData(name, user?.id);

  // Load user's current rating using secure function
  useEffect(() => {
    const loadUserRating = async () => {
      if (!user?.id) return;

      try {
        const { data: userRating } = await supabase
          .rpc('get_user_rating', { 
            contestant_name_param: name 
          });

        if (userRating !== null) {
          setUserRating(userRating);
          setIsVoted(true);
        }
      } catch (error) {
        console.error('Error loading user rating:', error);
      }
    };

    loadUserRating();
  }, [user?.id, name]);
  // Initialize isVoted state synchronously by checking localStorage
  const [isVoted, setIsVoted] = useState(() => {
    if (propIsVoted) return true;
    try {
      // Check for current user ID first
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) return false;
      
      // Check for saved rating
      const savedRating = localStorage.getItem(`rating-${name}-${currentUserId}`);
      return !!savedRating && parseFloat(savedRating) > 0;
    } catch {
      return false;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isShareModalOpen, shareData, openShareModal, closeShareModal } = useShare();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      // Store current user ID for synchronous access
      if (newUser?.id) {
        localStorage.setItem('currentUserId', newUser.id);
      } else {
        localStorage.removeItem('currentUserId');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      // Store current user ID for synchronous access
      if (newUser?.id) {
        localStorage.setItem('currentUserId', newUser.id);
      } else {
        localStorage.removeItem('currentUserId');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login modal removed auto-close

  // Load user voting status and setup dislikes
  useEffect(() => {
    const loadUserVotingData = async () => {
      if (!user) return;

      // Load user's likes status for photos
      const { data: userLikes } = await supabase
        .from("likes")
        .select("content_id")
        .eq("content_type", "contest")
        .eq("user_id", user.id)
        .in("content_id", [`contestant-photo-${name}-0`, `contestant-photo-${name}-1`]);
      
      if (userLikes) {
        setIsLiked([
          userLikes.some(like => like.content_id === `contestant-photo-${name}-0`),
          userLikes.some(like => like.content_id === `contestant-photo-${name}-1`)
        ]);
      }

      // Load user's comments status
      const { data: userComments } = await supabase
        .from("photo_comments")
        .select("content_id")
        .eq("content_type", "contest")
        .eq("user_id", user.id)
        .in("content_id", [`contestant-photo-${name}-0`, `contestant-photo-${name}-1`]);
      
      if (userComments && userComments.length > 0) {
        setHasCommented(true);
      }

      // Load dislike votes for next week
      const { data: dislikeVotes } = await supabase
        .from("next_week_votes")
        .select("vote_type")
        .eq("candidate_name", name)
        .eq("vote_type", "dislike");
      
      if (dislikeVotes) {
        setDislikesCount(dislikeVotes.length);
      }

      // Check if current user disliked
      const { data: userDislike } = await supabase
        .from("next_week_votes")
        .select("vote_type")
        .eq("candidate_name", name)
        .eq("user_id", user.id)
        .eq("vote_type", "dislike");
      
      if (userDislike && userDislike.length > 0) {
        setIsDisliked(true);
      }
    };

    loadUserVotingData();
  }, [name, user]);

  const handleLike = async (index: number) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    // Use card content_id instead of photo content_id for card likes
    const contentId = `contestant-card-${name}`;
    const wasLiked = isLiked[0]; // Card likes are stored in first index
    
    // Optimistic UI update
    setIsLiked([!wasLiked, !wasLiked]);
    
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
      // Revert optimistic update on error
      setIsLiked([wasLiked, wasLiked]);
      toast({ description: "Failed to perform action" });
    }
  };

  const handleDislike = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    setIsDisliked(prev => !prev);
    setDislikesCount(prev => isDisliked ? prev - 1 : prev + 1);
  };

  const handleRate = async (rating: number) => {
    console.log('handleRate called with:', { rating, name, userId: user?.id, profileId });
    
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    setUserRating(rating);
    setIsVoted(true); // Mark as voted
    
    try {
      const ratingData = {
        user_id: user.id,
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
        return;
      }
      
      // Also keep in localStorage for immediate feedback
      localStorage.setItem(`rating-${name}-${user.id}`, rating.toString());
      
      console.log('Rating saved successfully, calling onRate callback');
      
      setUserRating(rating);
      setIsVoted(true);
      setShowThanks(true);
      setTimeout(() => {
        setShowThanks(false);
        onRate?.(rating);
      }, 1000);
    } catch (error) {
      console.error('Error saving rating:', error);
      toast({ description: "Error saving rating" });
    }
  };

  const handleComment = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    openModal(0);
  };

  // Function to mark as commented (called from PhotoModal when comment is submitted)
  const markAsCommented = () => {
    if (user) {
      localStorage.setItem(`commented-${name}-${user.id}`, 'true');
      setHasCommented(true);
    }
  };



  const allPhotos = [faceImage, fullBodyImage, ...additionalPhotos];

  const openModal = (photoIndex: number) => {
    setModalStartIndex(photoIndex);
    setIsModalOpen(true);
  };

  if (viewMode === 'full') {
    return (
      <>
        <Card className={`${isExample ? 'border-yellow-400 border-2 bg-yellow-50/50' : 'bg-card border-contest-border'} relative overflow-hidden`}>
          
          
          {/* Rank and rating in top right corner - hidden for example cards */}
          {rank > 0 && isVoted && !isExample && (
            <div className="absolute top-0 right-0 z-20 flex items-center">
              <div className="text-xl font-bold text-contest-blue bg-white px-2 py-1.5 rounded-bl-lg shadow-sm">
                #{rank}
              </div>
              <div className="bg-contest-blue text-white px-2 py-1.5 rounded-bl-lg text-lg font-bold">
                {averageRating > 0 ? averageRating.toFixed(1) : userRating.toFixed(1)}
              </div>
            </div>
          )}
          
          
          {/* Header with content or voting overlay */}
          <div className="relative p-4 border-b border-contest-border h-[72px]">
            {/* Default content - name and rating info */}
            {!isEditing && !showThanks && (
              <div className="flex items-center justify-between h-full">
                <div>
                  <h3 className="text-xl font-semibold text-contest-text">
                    {profileId ? (
                      <Link to={`/u/${profileId}`} className="hover:text-primary underline-offset-2 hover:underline">
                        {name}
                      </Link>
                    ) : name}, {age}
                    <span className="text-sm text-muted-foreground font-normal ml-2">
                      ({weight} kg · {height} cm)
                    </span>
                  </h3>
                  <div className="text-contest-blue text-sm">{getCountryDisplayName(country)} · {city}</div>
                </div>
                {/* Remove rating display from header since it's now in corner */}
              </div>
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
                    rating={rating}
                    isVoted={false}
                    variant="white"
                    hideText={true}
                    onRate={(rating) => {
                      console.log('Edit mode StarRating onRate called with rating:', rating);
                      console.log('User state:', user);
                      if (!user) {
                        setShowLoginModal(true);
                        return;
                      }
                      setUserRating(rating);
                      localStorage.setItem(`rating-${name}-${user.id}`, rating.toString());
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
                  <div className="text-lg font-semibold text-center mb-2">Example Card</div>
                  <div className="text-sm opacity-80 text-center mb-3">This is how your card will look</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div></div>
                    <div>
                      <div className="text-sm font-semibold mb-2">How your photos should look:</div>
                      <div className="text-xs space-y-1">
                        <div>• No makeup</div>
                        <div>• No filter</div>
                        <div>• No photo editing</div>
                        <div>• No glasses</div>
                        <div>• Tight-fitting clothes</div>
                      </div>
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
                  <ThumbsUp className={cn("w-4 h-4", (isLiked[0] || isLiked[1]) ? "text-blue-500 fill-blue-500" : "text-gray-500")} strokeWidth={1} />
                  <span className={cn("hidden sm:inline", (isLiked[0] || isLiked[1]) ? "text-blue-500" : "text-gray-500")}>Like</span>
                   {cardData.likes > 0 && <span className={cn((isLiked[0] || isLiked[1]) ? "text-blue-500" : "text-gray-500")}>{cardData.likes}</span>}
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
                 <MessageCircle className="w-4 h-4 text-primary" strokeWidth={1} />
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
      <Card className={`${isExample ? 'border-yellow-400 border-2 bg-yellow-50/50' : 'bg-card border-contest-border'} relative overflow-hidden flex h-36 sm:h-40 md:h-44`}>
        {isWinner && (
          <div className="absolute bottom-0 left-0 w-[193px] sm:w-[225px] md:w-[257px] bg-blue-100 text-blue-700 pl-2 pr-2 py-1 text-xs font-semibold flex items-center justify-start z-20">
            <span>🏆 WINNER   + 5000 PHP</span>
          </div>
        )}
        
        {/* Rating badge in top right corner - hidden for example cards */}
        {isVoted && !isEditing && !showThanks && rank > 0 && !isExample && (
          <div className="absolute top-0 right-0 z-10 flex flex-col items-end">
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
          </div>
        )}
        
        {/* Main two photos with additional photos indicator */}
        <div className="flex-shrink-0 flex h-full relative gap-px">
          <div className="relative">
            <img 
              src={faceImage} 
              alt={`${name} face`}
              className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => openModal(0)}
            />
            {/* Example Badge on photo for compact view */}
            {isExample && (
              <div className="absolute top-0 left-0 bg-yellow-500 text-white px-1 py-0.5 text-xs font-bold">
                Example
              </div>
            )}
            {rank > 0 && isVoted && !isExample && (
              <div className="absolute top-0 left-0 bg-black/70 text-white text-xs font-bold px-1 py-0.5 rounded-br">
                {rank}
              </div>
            )}
          </div>
          <div className="relative">
            <img 
              src={fullBodyImage} 
              alt={`${name} full body`}
              className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
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
            {/* Actions for full body photo in compact mode - only show when voted */}
            {isVoted && !isEditing && !showThanks && additionalPhotos.length > 0 && (
              <div className="absolute bottom-0.5 right-0.5 bg-black/40 text-white/80 text-xs px-1 py-0.5 rounded cursor-pointer hover:bg-black/60 transition-colors"
                onClick={() => openModal(2)}
              >
                +{additionalPhotos.length}
              </div>
            )}
          </div>
        </div>
        
        {/* Content area with potential voting overlay */}
        <div className="flex-1 p-1 sm:p-2 md:p-3 flex flex-col relative">
          {/* Voting overlay - shown by default when not voted and not editing */}
          {!isVoted && !isEditing && !showThanks && !isExample && (
            <div className="absolute inset-0 bg-gray-300 rounded-r flex flex-col items-center justify-center gap-3">
              <span className="text-lg sm:text-xl font-medium text-gray-800">Vote</span>
               <div className="scale-[1.5] sm:scale-[1.8]">
                <StarRating 
                  rating={0} 
                  isVoted={false}
                  variant="white"
                  hideText={true}
                  onRate={(rating) => {
                    console.log('Compact StarRating onRate called with rating:', rating);
                    console.log('User state:', user);
                    handleRate(rating);
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Thank you message - shown for 1 second after voting */}
          {showThanks && (
            <div className="absolute inset-0 bg-gray-200 rounded-r flex items-center justify-center px-4">
              <div className="text-center">
                <div className="text-base font-medium text-gray-800 mb-1">Thank you. Rated</div>
                <div className="text-xl font-bold text-gray-800">{userRating.toFixed(0)}</div>
              </div>
            </div>
          )}
          
          {/* Re-voting overlay - shown when editing existing vote */}
          {isVoted && isEditing && !showThanks && !isExample && (
            <div className="absolute inset-0 bg-gray-300 rounded-r flex flex-col items-center justify-center gap-3">
              <span className="text-lg sm:text-xl font-medium text-gray-800">Vote</span>
              <div className="scale-[1.5] sm:scale-[1.8]">
                <StarRating 
                  rating={0} 
                  isVoted={false}
                  variant="white"
                  hideText={true}
                  onRate={(rating) => {
                    console.log('Compact edit mode StarRating onRate called with rating:', rating);
                    console.log('User state:', user);
                    if (!user) {
                      setShowLoginModal(true);
                      return;
                    }
                    setUserRating(rating);
                    localStorage.setItem(`rating-${name}-${user.id}`, rating.toString());
                    setIsEditing(false);
                    handleRate(rating); // ИСПРАВЛЕНО: вызываем handleRate для сохранения в БД
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Contestant info - shown after voting instead of normal content */}
          {isVoted && !isEditing && !showThanks && (
            <div className="absolute inset-0 bg-white rounded-r flex flex-col justify-between p-1 sm:p-2 md:p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1 mr-2">
                   <h3 className="font-semibold text-contest-text text-base sm:text-lg truncate">{profileId ? (<Link to={`/u/${profileId}`} className="hover:text-primary underline-offset-2 hover:underline">{name}</Link>) : name}, {age}</h3>
                   <div className="text-xs sm:text-sm text-muted-foreground font-normal">{weight} kg · {height} cm</div>
                   <div className="text-sm sm:text-base text-contest-blue truncate">
                     {getCountryDisplayName(country)} · {city}
                   </div>
                   {isExample && (
                      <div className="absolute inset-0 bg-yellow-100 border-2 border-yellow-300 rounded-lg flex items-start justify-start z-10 pt-2 pl-2">
                        <div className="text-left text-gray-800">
                          <h4 className="font-bold text-sm mb-1">How your photos should look:</h4>
                          <div className="text-xs space-y-0.5">
                            <div>• No makeup</div>
                            <div>• No filter</div>
                            <div>• No photo editing</div>
                            <div>• No glasses</div>
                            <div>• Tight-fitting clothes</div>
                          </div>
                        </div>
                      </div>
                   )}
                </div>
                
                <div className="text-right flex-shrink-0">
                </div>
              </div>
              
              {!isExample && (
                <div className="flex items-center justify-end gap-2 sm:gap-4">
                   <button
                     type="button"
                     className={cn(
                       "inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors",
                       (isLiked[0] || isLiked[1]) && "text-contest-blue"
                     )}
                     onClick={() => handleLike(0)}
                     aria-label="Like"
                   >
                      <ThumbsUp className={cn("w-3.5 h-3.5", (isLiked[0] || isLiked[1]) ? "text-blue-500 fill-blue-500" : "text-gray-500")} strokeWidth={1} />
                      <span className={cn("hidden xl:inline", (isLiked[0] || isLiked[1]) ? "text-blue-500" : "text-gray-500")}>Like</span>
                       {cardData.likes > 0 && <span className={cn((isLiked[0] || isLiked[1]) ? "text-blue-500" : "text-gray-500")}>{cardData.likes}</span>}
                   </button>
                  {showDislike && (
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors",
                        isDisliked && "text-red-500"
                      )}
                      onClick={handleDislike}
                      aria-label="Dislike"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">Dislike</span>
                      <span>{dislikesCount}</span>
                    </button>
                  )}
                   <button
                     type="button"
                     className={cn(
                       "inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors",
                       hasCommented && "text-contest-blue"
                     )}
                     onClick={handleComment}
                     aria-label="Comments"
                   >
                      <MessageCircle className="w-3.5 h-3.5 text-primary" strokeWidth={1} />
                      <span className="hidden xl:inline">Comment</span>
                      <span>{cardData.comments}</span>
                   </button>
                   <button
                     type="button"
                     className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                     onClick={() => openShareModal({
                       title: `${name} - Beauty Contest`,
                       url: profileId ? `https://obcface.com/u/${profileId}` : `https://obcface.com`,
                       description: `Check out ${name}, ${age} from ${city}, ${country} in this beauty contest!`
                     })}
                     aria-label="Share"
                   >
                     <Share2 className="w-3.5 h-3.5" strokeWidth={1} />
                     <span className="hidden sm:inline">Share</span>
                   </button>
                </div>
              )}
            </div>
          )}
          
          {/* Normal content - completely hidden, not used anymore */}
          <div className="hidden"></div>
        </div>
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