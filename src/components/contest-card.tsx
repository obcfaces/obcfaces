import { useState } from "react";
import { Heart, MessageCircle, Star, Pencil, Send, Share, Share2, ExternalLink, Upload, ArrowUpRight } from "lucide-react";

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
  isVoted,
  isWinner,
  prize,
  viewMode = 'compact',
  onRate,
  profileId
}: ContestantCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isLiked, setIsLiked] = useState<boolean[]>([false, false]);
  const [likesCount, setLikesCount] = useState<number[]>([
    Math.floor(Math.random() * 50) + 5,
    Math.floor(Math.random() * 50) + 5,
  ]);
  const [commentsCount] = useState<number[]>([
    Math.floor(Math.random() * 20) + 1,
    Math.floor(Math.random() * 20) + 1,
  ]);
  const { toast } = useToast();

  const handleLike = (index: number) => {
    const wasLiked = isLiked[index]
    setIsLiked((prev) => {
      const next = [...prev]
      next[index] = !wasLiked
      return next
    })
    setLikesCount((prev) => {
      const next = [...prev]
      next[index] = wasLiked ? next[index] - 1 : next[index] + 1
      return next
    })
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
          {isWinner && (
            <div className="absolute top-2 left-4 bg-contest-blue text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 z-10">
              🏆 WINNER
            </div>
          )}
          
          {/* Name in top left - only after voting */}
           {(isVoted && !showThanks && !isEditing) && (
             <div className="absolute top-2 left-4 z-20">
              <h3 className="text-xl font-semibold text-contest-text">{profileId ? (<Link to={`/u/${profileId}`} className="hover:text-primary underline-offset-2 hover:underline">{name}</Link>) : name}, {age} <span className="text-sm text-muted-foreground font-normal">({weight} kg · {height} cm)</span></h3>
              <div className="text-contest-blue text-sm">{country} · {city}</div>
            </div>
          )}
          
          {/* Rank, rating and location in top right corner - show rank always if rank > 0 */}
          {rank > 0 && (
            <div className="absolute top-0 right-0 z-20 flex flex-col items-end">
              <div className="flex items-center gap-1">
                <div className="text-xl font-bold text-contest-blue">#{rank}</div>
                <div 
                  className="bg-contest-blue text-white px-2 py-1.5 rounded-bl-lg text-lg font-bold shadow-md cursor-pointer hover:bg-contest-blue/90 transition-colors"
                  onClick={() => setIsEditing(true)}
                >
                  {rating.toFixed(1)}
                </div>
              </div>
              <div className="text-right pr-2 pt-1">
                
                {isWinner && prize && (
                  <div className="text-contest-blue font-bold text-sm mt-1">
                    {prize}
                  </div>
                )}
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
                      setUserRating(rating);
                      setShowThanks(true);
                      setTimeout(() => {
                        setShowThanks(false);
                        onRate?.(rating);
                      }, 1000);
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
                      setUserRating(rating);
                      setIsEditing(false);
                      onRate?.(rating);
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
                <Heart className="w-4 h-4" />
                <span className="hidden min-[280px]:inline">Like</span>
                <span>{likesCount[0] + likesCount[1]}</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => openModal(0)}
                aria-label="Comments"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden min-[280px]:inline">Comment</span>
                <span>{commentsCount[0] + commentsCount[1]}</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={async () => { try { if ((navigator as any).share) { await (navigator as any).share({ title: name, url: window.location.href }); } else if (navigator.clipboard) { await navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied" }); } } catch {} }}
                aria-label="Share"
              >
                 <Share2 className="w-4 h-4" />
                 <span className="hidden min-[280px]:inline">Share</span>
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
        />
      </>
    );
  }

  return (
    <>
      <Card className="bg-card border-contest-border relative overflow-hidden flex h-32 sm:h-36 md:h-40">
        {isWinner && (
          <div className="absolute top-1 left-2 bg-contest-blue text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 z-10">
            🏆 WINNER
          </div>
        )}
        
        {/* Rating badge in top right corner - only if rank > 0 */}
        {isVoted && !isEditing && !showThanks && rank > 0 && (
          <div className="absolute top-0 right-0 z-10 flex flex-col items-end">
            <Popover>
              <PopoverTrigger asChild>
                <div className="bg-contest-blue text-white px-2 py-1.5 rounded-bl-lg text-base sm:text-lg font-bold shadow-md cursor-pointer hover:bg-contest-blue/90 transition-colors">
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
            {rank > 0 && (
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
        <div className="flex-1 p-1.5 sm:p-2 md:p-3 flex flex-col relative">
          {/* Voting overlay - shown by default when not voted and not editing */}
          {!isVoted && !isEditing && !showThanks && (
            <div className="absolute inset-0 bg-gray-300 rounded-r flex flex-col items-center justify-center gap-3">
              <span className="text-lg sm:text-xl font-medium text-gray-800">Vote</span>
              <div className="scale-[1.7] sm:scale-[2.2]">
                <StarRating 
                  rating={0} 
                  isVoted={false}
                  variant="white"
                  hideText={true}
                  onRate={(rating) => {
                    setUserRating(rating);
                    setShowThanks(true);
                    // Show thank you message for 1 second, then show contestant info
                    setTimeout(() => {
                      setShowThanks(false);
                      onRate?.(rating);
                    }, 1000);
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
              <div className="scale-[1.7] sm:scale-[2.2]">
                <StarRating 
                  rating={0} 
                  isVoted={false}
                  variant="white"
                  hideText={true}
                  onRate={(rating) => {
                    setUserRating(rating);
                    setIsEditing(false);
                    onRate?.(rating);
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Contestant info - shown after voting instead of normal content */}
          {isVoted && !isEditing && !showThanks && (
            <div className="absolute inset-0 bg-white rounded-r flex flex-col justify-between p-2 sm:p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1 mr-2">
                   <h3 className="font-semibold text-contest-text text-base sm:text-lg truncate">{profileId ? (<Link to={`/u/${profileId}`} className="hover:text-primary underline-offset-2 hover:underline">{name}</Link>) : name}, {age}</h3>
                   <div className="text-xs sm:text-sm text-muted-foreground font-normal">{weight} kg · {height} cm</div>
                   <div className="text-sm sm:text-base text-contest-blue truncate">
                     {country} · {city}
                   </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  {isWinner && prize && (
                    <div className="text-contest-blue font-bold text-xs">
                      {prize}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors",
                    (isLiked[0] || isLiked[1]) && "text-contest-blue"
                  )}
                  onClick={() => handleLike(0)}
                  aria-label="Like"
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Like</span>
                  <span>{likesCount[0] + likesCount[1]}</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => openModal(0)}
                  aria-label="Comments"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Comment</span>
                  <span>{commentsCount[0] + commentsCount[1]}</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={async () => {
                    try {
                      if ((navigator as any).share) {
                        await (navigator as any).share({ title: name, url: window.location.href });
                      } else if (navigator.clipboard) {
                        await navigator.clipboard.writeText(window.location.href);
                        toast({ title: "Link copied" });
                      }
                    } catch {}
                  }}
                  aria-label="Share"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Share</span>
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
      />
    </>
  );
}