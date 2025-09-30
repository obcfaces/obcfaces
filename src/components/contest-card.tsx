import { useState, useEffect } from "react";
import { ThumbsUp, MessageCircle, Star, Pencil, Send, Share, Share2, ExternalLink, Upload, ArrowUpRight, ThumbsDown, Crown } from "lucide-react";
import { useWinnerContent } from "@/hooks/useWinnerContent";

import winnerPaymentImage from "@/assets/winner-payment.jpg";
import winnerVideo from "@/assets/winner-video.mp4";
import winnerPaymentImageApril from "@/assets/winner-payment-april.jpg";
import winnerVideoApril from "@/assets/winner-video-april.mp4";
import jasminPaymentProof from "@/assets/jasmin-payment-proof.png";

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
  weekOffset?: number; // Add prop to identify which week offset this card is from
  hideCardActions?: boolean; // Add prop to hide like/dislike actions in card
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
  user: propUser,
  weekOffset = 0,
  hideCardActions = false
}: ContestantCardProps) {
  // Debug log to check weekOffset value and prevent excessive re-renders
  console.log(`ContestantCard ${name}: weekOffset = ${weekOffset}, isWinner = ${isWinner}, userId = ${propUser?.id || 'none'}`);
  
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
  
  // Local state for immediate rating updates - initialize from props
  const [localAverageRating, setLocalAverageRating] = useState(averageRating);
  const [localTotalVotes, setLocalTotalVotes] = useState(totalVotes);
  const [previousUserRating, setPreviousUserRating] = useState(0);
  
  // Use unified card data hook with stable dependencies
  const { data: cardData, loading: cardDataLoading, refresh: refreshCardData } = useCardData(name, propUser?.id, profileId);
  
  // Get winner content for this participant
  const { winnerContent } = useWinnerContent(profileId, propUser?.id);

  // Initialize local state when props change
  useEffect(() => {
    setLocalAverageRating(averageRating);
    setLocalTotalVotes(totalVotes);
  }, [averageRating, totalVotes]);
  
  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!propUser?.id) return;
      
      try {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', propUser.id);
        
        setIsAdmin(roles?.some(r => r.role === 'admin' || r.role === 'moderator') || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [propUser?.id]);

  // Load user's current rating using secure function with user_id
  useEffect(() => {
    const loadUserRating = async () => {
      if (!propUser?.id || !profileId) return;

      try {
        const { data: userRating } = await supabase
          .rpc('get_user_rating_for_participant', { 
            participant_id_param: profileId 
          });

        if (userRating !== null && typeof userRating === 'number') {
          setUserRating(userRating);
          setPreviousUserRating(userRating); // Store the current rating as previous
          setIsVoted(true);
        } else {
          setUserRating(0);
          setPreviousUserRating(0);
        }
      } catch (error) {
        console.error('Error loading user rating:', error);
      }
    };

    loadUserRating();
  }, [propUser?.id, profileId]);
  
  // Initialize isVoted state without complex initialization
  const [isVoted, setIsVoted] = useState(propIsVoted || false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isShareModalOpen, shareData, openShareModal, closeShareModal } = useShare();

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

  // Load user voting status and setup dislikes - only run when we have a stable user
  useEffect(() => {
    if (!propUser?.id) return; // Exit early if no user
    
    const loadUserVotingData = async () => {
      // Load user's likes status for card
      const { data: userLikes } = await supabase
        .from("likes")
        .select("content_id")
        .eq("content_type", "contest")
        .eq("user_id", propUser.id)
        .eq("content_id", `contestant-card-${name}`);
      
      if (userLikes && userLikes.length > 0) {
        setIsLiked([true, true]); // Set both to true if user liked the card
      } else {
        setIsLiked([false, false]);
      }

      // Load user's comments status
      const contentIds = profileId 
        ? [`contestant-user-${profileId}-0`, `contestant-user-${profileId}-1`]
        : [`contestant-photo-${name}-0`, `contestant-photo-${name}-1`];
        
      const { data: userComments } = await supabase
        .from("photo_comments")
        .select("content_id")
        .eq("content_type", "contest")
        .eq("user_id", propUser.id)
        .in("content_id", contentIds);
      
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
        .eq("user_id", propUser.id)
        .eq("vote_type", "dislike");
      
      if (userDislike && userDislike.length > 0) {
        setIsDisliked(true);
      }
    };

    loadUserVotingData();
  }, [propUser?.id, name, profileId]); // Only depend on propUser.id, not the full user object

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
        participant_id: profileId, // Use participant_id for the rating
        rating: rating
      };
      
      console.log('Saving rating to database:', ratingData);
      
      // Use upsert to handle one rating per user per participant
      const { data, error } = await supabase
        .from('contestant_ratings')
        .upsert(ratingData, { 
          onConflict: 'user_id,participant_id',
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

  // Helper function to resolve asset names to actual imports
  const resolveAsset = (assetName: string) => {
    switch (assetName) {
      case 'jasmin-payment-proof':
        return jasminPaymentProof;
      case 'winner-payment-april':
        return winnerPaymentImageApril;
      case 'winner-video-april':
        return winnerVideoApril;
      case 'winner-payment':
        return winnerPaymentImage;
      case 'winner-video':
        return winnerVideo;
      default:
        return assetName; // Return as-is if it's already a URL
    }
  };

  const allPhotos = isWinner && winnerContent
    ? [faceImage, fullBodyImage, ...additionalPhotos, 
       resolveAsset(winnerContent.payment_proof_url), 
       resolveAsset(winnerContent.testimonial_video_url)]
    : [faceImage, fullBodyImage, ...additionalPhotos];

  const openModal = (photoIndex: number) => {
    setModalStartIndex(photoIndex);
    setIsModalOpen(true);
  };

  if (viewMode === 'full') {
    return (
      <>
        <Card className={`${isExample ? 'border-yellow-400 border-2 bg-yellow-50/50' : isWinner ? 'border-contest-blue border-2' : 'bg-card border-contest-border'} relative overflow-hidden`}>
          {/* Rank number in top left corner - show in past weeks for all users and current week after voting */}
          {rank > 0 && !isExample && totalVotes > 0 && (!isThisWeek || isVoted) && (
            <div className="absolute top-0 left-0 z-20 flex items-center">
              <div className="bg-black/70 text-white px-1 py-0.5 rounded-br text-xs font-bold">
                {rank}
              </div>
            </div>
          )}
           
              {/* Rating in top right corner - show for all users in past weeks and current week after voting */}
              {rank > 0 && !isExample && (!isThisWeek || isVoted) && !hideCardActions && (
                <div className="absolute top-0 right-0 z-20 flex items-center">
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <div className="bg-contest-blue text-white px-2 py-1.5 rounded-bl-lg text-sm sm:text-base font-bold cursor-pointer hover:bg-contest-blue/90 transition-colors">
                        {localAverageRating > 0 ? localAverageRating.toFixed(1) : '0.0'}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" side="left">
                      <div className="text-xs text-gray-600">
                        {localTotalVotes} vote{localTotalVotes !== 1 ? 's' : ''}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            
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
        hideCardActions={hideCardActions}
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