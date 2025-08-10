import { useState } from "react";
import { Heart, MessageCircle, Star, Pencil, Send } from "lucide-react";
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
  const { toast } = useToast();

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
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
            <div className="absolute top-4 left-4 bg-contest-blue text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 z-10">
              🏆 WINNER
            </div>
          )}
          
          {/* Rank and Rating in top right corner - only after voting */}
          {((isVoted && !showThanks) || isEditing) && (
            <div className="absolute top-0 right-0 flex items-center gap-1 z-20">
              <div className="text-center">
                <div className="text-xl font-bold text-contest-blue">#{rank}</div>
              </div>
              <div 
                className="bg-contest-blue text-white px-2 py-1.5 rounded-bl-lg text-lg font-bold shadow-md cursor-pointer hover:bg-contest-blue/90 transition-colors"
                onClick={() => setIsEditing(true)}
              >
                {rating.toFixed(1)}
              </div>
            </div>
          )}
          
          
          {/* Header with voting overlay logic */}
          <div className="relative p-4 border-b border-contest-border h-[108px]">
            {/* Voting overlay - shown by default when not voted and not editing */}
            {!isVoted && !isEditing && !showThanks && (
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center gap-6 h-full">
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
            )}
            
            {/* Thank you message - shown for 1 second after voting */}
            {showThanks && (
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center gap-3 h-full">
                <span className="text-lg font-medium text-gray-800">Thank you! Rated {userRating.toFixed(0)}</span>
              </div>
            )}
            
            {/* Re-voting overlay - shown when editing existing vote */}
            {isVoted && isEditing && !showThanks && (
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center gap-6 h-full">
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
            )}
            
            {/* Contestant info - shown after voting */}
            {isVoted && !isEditing && !showThanks && (
              <div className="flex items-start justify-between h-full pl-4 pr-4 pt-2 pb-2">
                <div>
                  <h3 className="text-xl font-semibold text-contest-text">{name}, {age}</h3>
                  <p className="text-contest-blue">{country} · {city}</p>
                  <p className="text-muted-foreground text-sm">{weight} kg · {height} cm</p>
                </div>
                <div className="text-right flex items-start gap-2">
                  {isWinner && prize && (
                    <div className="text-contest-blue font-bold text-sm mt-1">
                      {prize}
                    </div>
                  )}
                </div>
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
                {/* Actions for face photo */}
                <div className="absolute bottom-1 left-1 flex items-center gap-0.5">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "transition-colors border-0 h-4 px-0.5 text-xs",
                      isLiked 
                        ? "bg-contest-blue text-white hover:bg-contest-blue/90" 
                        : "bg-transparent text-white hover:text-white/80 hover:bg-transparent"
                    )}
                    onClick={handleLike}
                  >
                    <Heart 
                      className="w-2.5 h-2.5 mr-0 transition-colors" 
                    />
                    {likesCount}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="transition-colors text-white hover:text-white/80 border-0 bg-transparent hover:bg-contest-blue/20 h-4 px-0.5 text-xs"
                    onClick={() => openModal(0)}
                  >
                    <MessageCircle className="w-2.5 h-2.5 mr-0" />
                    {commentsCount}
                  </Button>
                </div>
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
                {/* Actions for full body photo */}
                <div className="absolute bottom-1 left-1 flex items-center gap-0.5">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "transition-colors border-0 h-4 px-0.5 text-xs",
                      isLiked 
                        ? "bg-contest-blue text-white hover:bg-contest-blue/90" 
                        : "bg-transparent text-white hover:text-white/80 hover:bg-transparent"
                    )}
                    onClick={handleLike}
                  >
                    <Heart 
                      className="w-2.5 h-2.5 mr-0 transition-colors" 
                    />
                    {likesCount}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="transition-colors text-white hover:text-white/80 border-0 bg-transparent hover:bg-contest-blue/20 h-4 px-0.5 text-xs"
                    onClick={() => openModal(0)}
                  >
                    <MessageCircle className="w-2.5 h-2.5 mr-0" />
                    {commentsCount}
                  </Button>
                </div>
              </div>
            </div>
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

  return (
    <>
      <Card className="bg-card border-contest-border relative overflow-hidden flex h-32 sm:h-36 md:h-40">
        {isWinner && (
          <div className="absolute top-2 left-2 bg-contest-blue text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 z-10">
            🏆 WINNER
          </div>
        )}
        
        {/* Rating badge in top right corner */}
        {isVoted && !isEditing && !showThanks && (
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
            <div className="absolute top-0 left-0 bg-black/70 text-white text-xs font-bold px-1 py-0.5 rounded-br">
              {rank}
            </div>
            {/* Actions for face photo in compact mode - only show when voted */}
            {isVoted && !isEditing && !showThanks && (
              <div className="absolute bottom-0.5 left-0.5 flex items-center gap-0.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "transition-colors text-xs h-4 px-1 hover:bg-gray-100/20",
                    isLiked 
                      ? "text-contest-blue hover:text-contest-blue/80" 
                      : "text-white hover:text-white/80"
                  )}
                  onClick={handleLike}
                >
                  <Heart 
                    className={cn(
                      "w-2.5 h-2.5 transition-colors",
                      isLiked && "fill-contest-blue"
                    )} 
                  />
                </Button>
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
            <div className="absolute inset-0 bg-gray-200 rounded-r flex flex-col items-center justify-center gap-3">
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
            <div className="absolute inset-0 bg-gray-200 rounded-r flex flex-col items-center justify-center gap-3">
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
            <div className="absolute inset-0 bg-white rounded-r flex flex-col p-1 sm:p-2">
              {/* Top row with rank, name, age - all on same level as rating */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <div className="bg-black/70 text-white text-xs font-bold px-1 py-0.5 rounded">
                    #{rank}
                  </div>
                  <h3 className="font-semibold text-contest-text text-base sm:text-lg">{name}, {age}</h3>
                </div>
              </div>
              
              {/* Location and measurements below */}
              <div className="flex flex-col gap-1 mt-1">
                <div className="text-sm sm:text-base text-contest-blue truncate">
                  {country} · {city}
                </div>
                <div className="text-sm sm:text-base text-muted-foreground">
                  {weight} kg · {height} cm
                </div>
              </div>
                
              {isWinner && prize && (
                <div className="text-contest-blue font-bold text-xs mt-auto">
                  {prize}
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
      />
    </>
  );
}