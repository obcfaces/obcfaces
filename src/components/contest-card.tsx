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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  isRealContestant = false
}: ContestantCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [userRating, setUserRating] = useState(() => {
    try {
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) return 0;
      const savedRating = localStorage.getItem(`rating-${name}-${currentUserId}`);
      return savedRating ? parseFloat(savedRating) : 0;
    } catch {
      return 0;
    }
  });
  const [isLiked, setIsLiked] = useState<boolean[]>([false, false]);
  const [isDisliked, setIsDisliked] = useState(false);
  const [hasCommented, setHasCommented] = useState(false);
  const [likesCount, setLikesCount] = useState<number[]>([0, 0]);
  const [dislikesCount, setDislikesCount] = useState<number>(0);
  const [commentsCount, setCommentsCount] = useState<number[]>([0, 0]);
  const [user, setUser] = useState<any>(null);
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
  const { toast } = useToast();

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

  // Load user's likes, counts and ratings on component mount
  useEffect(() => {
    const loadUserData = async () => {
      // Load total likes count for all photos and card - search for all possible name variations
      const { data: allLikes } = await supabase
        .from("likes")
        .select("content_id")
        .eq("content_type", "contest")
        .or(`content_id.ilike.contestant-photo-%${name}%,content_id.ilike.contestant-card-%${name}%`);
      
      // Filter and count likes for different content types
      const photo0Likes = allLikes?.filter(like => 
        like.content_id.includes(`contestant-photo-`) && 
        like.content_id.includes(name) && 
        like.content_id.endsWith('-0')
      ).length || 0;
      
      const photo1Likes = allLikes?.filter(like => 
        like.content_id.includes(`contestant-photo-`) && 
        like.content_id.includes(name) && 
        like.content_id.endsWith('-1')
      ).length || 0;
      
      const cardLikesCount = allLikes?.filter(like => 
        like.content_id.includes(`contestant-card-`) && 
        like.content_id.includes(name) &&
        !like.content_id.includes('-0') &&
        !like.content_id.includes('-1')
      ).length || 0;
      
      const totalLikes = photo0Likes + photo1Likes + cardLikesCount;

      // Load total comments count for both photos
      const { data: totalComments } = await supabase
        .from("photo_comments")
        .select("content_id")
        .eq("content_type", "contest")
        .in("content_id", [`contestant-photo-${name}-0`, `contestant-photo-${name}-1`]);
      
      if (totalComments) {
        const photo0Comments = totalComments.filter(comment => comment.content_id === `contestant-photo-${name}-0`).length;
        const photo1Comments = totalComments.filter(comment => comment.content_id === `contestant-photo-${name}-1`).length;
        setCommentsCount([photo0Comments, photo1Comments]);
      }
      
      // Set total likes count for all users (logged and not logged)
      setLikesCount([totalLikes, 0]);
      
      if (user) {
        // Load user's likes for the card
        const { data: userCardLike } = await supabase
          .from("likes")
          .select("id")
          .eq("user_id", user.id)
          .eq("content_type", "contest")
          .eq("content_id", `contestant-card-${name}`)
          .maybeSingle();
        
        // Load user's likes for individual photos
        const { data: userPhotoLikes } = await supabase
          .from("likes")
          .select("content_id")
          .eq("user_id", user.id)
          .eq("content_type", "contest")
          .in("content_id", [`contestant-photo-${name}-0`, `contestant-photo-${name}-1`]);
        
        // User has liked if they liked the card OR any photo
        const hasLikedPhoto0 = userPhotoLikes?.some(like => like.content_id === `contestant-photo-${name}-0`) || false;
        const hasLikedPhoto1 = userPhotoLikes?.some(like => like.content_id === `contestant-photo-${name}-1`) || false;
        const hasLikedCard = !!userCardLike;
        const hasAnyLike = hasLikedCard || hasLikedPhoto0 || hasLikedPhoto1;
        
        setIsLiked([hasAnyLike, hasAnyLike]);
        
        // Check if user has commented on this contestant
        const { data: userComments } = await supabase
          .from("photo_comments")
          .select("id")
          .eq("user_id", user.id)
          .eq("content_type", "contest")
          .in("content_id", [`contestant-photo-${name}-0`, `contestant-photo-${name}-1`])
          .limit(1);
        
        setHasCommented(!!userComments && userComments.length > 0);
        
        // Load user's rating (if any)
        const savedRating = localStorage.getItem(`rating-${name}-${user.id}`);
        if (savedRating && parseFloat(savedRating) > 0) {
          const ratingValue = parseFloat(savedRating);
          setUserRating(ratingValue);
          setIsVoted(true); // Mark as voted if rating exists
        }
      }
    };
    
    loadUserData();
  }, [user, name]);

  const handleLike = async (index: number) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    // Use card content_id instead of photo content_id for card likes
    const contentId = `contestant-card-${name}`;
    const wasLiked = isLiked[0]; // Card likes are stored in first index
    
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
      
      // Update both indices to the same value since it's a card like
      setIsLiked([!wasLiked, !wasLiked]);
      
      // Update likes count by recalculating total
      const currentCardLikes = wasLiked ? -1 : 1; // Change in card likes
      setLikesCount((prev) => {
        const next = [...prev];
        next[0] = prev[0] + currentCardLikes; // Update total count
        return next;
      });
      
    } catch (error) {
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
      
      // Try regular insert first to see if that works
      const { data, error } = await supabase
        .from('contestant_ratings')
        .insert(ratingData)
        .select();
      
      console.log('Rating save result:', { data, error });
      
      if (error) {
        console.error('Insert failed with error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // If insert fails due to conflict, try upsert
        const { data: upsertData, error: upsertError } = await supabase
          .from('contestant_ratings')
          .upsert(ratingData, { 
            onConflict: 'user_id,contestant_name',
            ignoreDuplicates: false 
          })
          .select();
          
        console.log('Upsert result:', { upsertData, upsertError });
        
        if (upsertError) {
          console.error('Upsert also failed:', upsertError);
          toast({ description: "Ошибка при сохранении оценки: " + upsertError.message });
          return;
        }
      }
      
      // Also keep in localStorage for immediate feedback
      localStorage.setItem(`rating-${name}-${user.id}`, rating.toString());
      
      console.log('Rating saved successfully, calling onRate callback');
      
      setShowThanks(true);
      setTimeout(() => {
        setShowThanks(false);
        onRate?.(rating);
      }, 1000);
    } catch (error) {
      console.error('Error saving rating:', error);
      toast({ description: "Ошибка при сохранении оценки" });
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
        <Card className="bg-card border-contest-border relative overflow-hidden">
          
          {/* Name in top left - only after voting */}
           {(isVoted && !showThanks && !isEditing) && (
             <div className="absolute top-2 left-4 z-20">
              <h3 className="text-xl font-semibold text-contest-text">{profileId ? (<Link to={`/u/${profileId}`} className="hover:text-primary underline-offset-2 hover:underline">{name}</Link>) : name}, {age} <span className="text-sm text-muted-foreground font-normal">({weight} kg · {height} cm)</span></h3>
              <div className="text-contest-blue text-sm">{country} · {city}</div>
            </div>
          )}
          
          {/* Rank, rating and location in top right corner - show rank always if rank > 0 and user has voted */}
          {rank > 0 && isVoted && (
            <div className="absolute top-0 right-0 z-20 flex flex-col items-end">
              <div className="flex items-center gap-1">
                <div className="text-xl font-bold text-contest-blue">#{rank}</div>
                <div 
                  className="bg-contest-blue text-white px-2 py-1.5 rounded-bl-lg text-lg font-bold shadow-sm cursor-pointer hover:bg-contest-blue/90 transition-colors"
                  onClick={() => setIsEditing(true)}
                >
                  {rating.toFixed(1)}
                </div>
              </div>
              <div className="text-right pr-2 pt-1">
                
              </div>
            </div>
          )}
          
          
          {/* Header with voting overlay logic */}
          <div className="relative p-4 border-b border-contest-border h-[72px]">
            {/* Voting overlay - shown by default when not voted and not editing */}
            {!isVoted && !isEditing && !showThanks && (
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
                      console.log('StarRating onRate called with rating:', rating);
                      console.log('User state:', user);
                      handleRate(rating);
                    }}
                  />
                </div>
              </div>
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
                 <ThumbsUp className="w-4 h-4" strokeWidth={1} />
                 <span className="hidden sm:inline">Like</span>
                 {(likesCount[0] + likesCount[1] > 0) && <span>{likesCount[0] + likesCount[1]}</span>}
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
                <MessageCircle className="w-4 h-4" strokeWidth={1} />
                <span className="hidden sm:inline">Comment</span>
                {(commentsCount[0] + commentsCount[1] > 0) && <span>{commentsCount[0] + commentsCount[1]}</span>}
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
      <Card className="bg-card border-contest-border relative overflow-hidden flex h-36 sm:h-40 md:h-44">
        {isWinner && (
          <div className="absolute bottom-0 left-0 w-[193px] sm:w-[225px] md:w-[257px] bg-blue-100 text-blue-700 pl-2 pr-2 py-1 text-xs font-semibold flex items-center justify-start z-20">
            <span>🏆 WINNER   + 5000 PHP</span>
          </div>
        )}
        
        {/* Rating badge in top right corner - only if rank > 0 */}
        {isVoted && !isEditing && !showThanks && rank > 0 && (
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
            {rank > 0 && isVoted && (
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
          {!isVoted && !isEditing && !showThanks && (
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
          {isVoted && isEditing && !showThanks && (
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
                     {country} · {city}
                   </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                </div>
              </div>
              
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
                    <ThumbsUp className="w-3.5 h-3.5" strokeWidth={1} />
                    <span className="hidden xl:inline">Like</span>
                    {(likesCount[0] + likesCount[1] > 0) && <span>{likesCount[0] + likesCount[1]}</span>}
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
                    <MessageCircle className="w-3.5 h-3.5" strokeWidth={1} />
                    <span className="hidden xl:inline">Comment</span>
                    {(commentsCount[0] + commentsCount[1] > 0) && <span>{commentsCount[0] + commentsCount[1]}</span>}
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