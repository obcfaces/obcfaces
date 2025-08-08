import { useState } from "react";
import { Heart, MessageCircle, Star, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { PhotoModal } from "@/components/photo-modal";
import { MiniStars } from "@/components/mini-stars";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  onRate?: (rating: number) => void;
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
  onRate
}: ContestantCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 50) + 5); // Random initial likes
  const [commentsCount] = useState(Math.floor(Math.random() * 20) + 1); // Random initial comments

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const allPhotos = [faceImage, fullBodyImage, ...additionalPhotos];

  const openModal = (photoIndex: number) => {
    setModalStartIndex(photoIndex);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className="bg-card border-contest-border relative overflow-hidden flex h-32 sm:h-36 md:h-40">
        {isWinner && (
          <div className="absolute top-2 right-2 bg-contest-blue text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 z-10">
            🏆 WINNER
          </div>
        )}
        
        {/* Main two photos with additional photos indicator */}
        <div className="flex-shrink-0 flex h-full relative">
          <div className="relative">
            <img 
              src={faceImage} 
              alt={`${name} face`}
              className="w-24 sm:w-28 md:w-32 h-full object-cover border-r border-contest-border cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => openModal(0)}
            />
            <div className="absolute top-0 left-0 bg-black/70 text-white text-xs font-bold px-1 py-0.5 rounded-br">
              {rank}
            </div>
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
          </div>
        </div>
        
        {/* Content area with potential voting overlay */}
        <div className="flex-1 p-1.5 sm:p-2 md:p-3 flex flex-col relative">
          {/* Voting overlay - shown by default when not voted and not editing */}
          {!isVoted && !isEditing && !showThanks && (
            <div className="absolute inset-0 bg-gray-200 rounded-r flex flex-col items-center justify-center gap-1">
              <span className="text-sm sm:text-base font-medium text-gray-800">Vote</span>
              <div className="scale-[2.0] sm:scale-[2.5]">
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
            <div className="absolute inset-0 bg-gray-200 rounded-r flex flex-col items-center justify-center gap-1">
              <span className="text-sm sm:text-base font-medium text-gray-800">Vote</span>
              <div className="scale-[2.0] sm:scale-[2.5]">
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
                  <h3 className="font-semibold text-contest-text text-xs sm:text-sm truncate">{name}</h3>
                  <div className="text-xs text-contest-blue truncate">
                    {country} · {city}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {age} y.o · {weight} kg · {height} cm
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <div className="text-lg sm:text-xl font-bold text-contest-text mb-1 flex items-center justify-end gap-1">
                    {rating.toFixed(1)}
                    {isVoted && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <span className="text-xs text-muted-foreground/70 ml-1 cursor-pointer hover:text-muted-foreground">
                            ({userRating.toFixed(0)})
                          </span>
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
                  {isWinner && prize && (
                    <div className="text-contest-blue font-bold text-xs">
                      {prize}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "transition-colors text-xs h-6 px-2",
                    isLiked 
                      ? "text-contest-blue hover:text-contest-blue/80" 
                      : "text-muted-foreground hover:text-gray-600 hover:bg-gray-100"
                  )}
                  onClick={handleLike}
                >
                  <Heart 
                    className={cn(
                      "w-3 h-3 mr-1 transition-colors",
                      isLiked && "fill-contest-blue"
                    )} 
                  />
                  {likesCount}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-gray-600 hover:bg-gray-100 text-xs h-6 px-2">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {commentsCount}
                </Button>
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
      />
    </>
  );
}