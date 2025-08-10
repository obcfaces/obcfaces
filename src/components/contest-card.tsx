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
          
          {/* Header with name and location */}
          <div className="p-4 border-b border-contest-border">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-contest-text">{name}</h3>
                <p className="text-contest-blue">{country} · {city}</p>
                <p className="text-muted-foreground text-sm">{age} y.o · {weight} kg · {height} cm</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Rank</div>
                <div className="text-2xl font-bold text-contest-blue">#{rank}</div>
                {isWinner && prize && (
                  <div className="text-contest-blue font-bold text-sm mt-1">
                    {prize}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Photos section */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-px mb-4">
              <div className="relative">
                <img 
                  src={faceImage} 
                  alt={`${name} face`}
                  className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openModal(0)}
                />
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                  Face
                </div>
              </div>
              <div className="relative">
                <img 
                  src={fullBodyImage} 
                  alt={`${name} full body`}
                  className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openModal(1)}
                />
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                  Body
                </div>
                {additionalPhotos.length > 0 && (
                  <div 
                    className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded cursor-pointer hover:bg-black/85 transition-colors"
                    onClick={() => openModal(2)}
                  >
                    +{additionalPhotos.length} more
                  </div>
                )}
              </div>
            </div>
            
            {/* Rating and actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {!isVoted && !isEditing && !showThanks ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Rate:</span>
                    <StarRating 
                      rating={0} 
                      isVoted={false}
                      variant="default"
                      onRate={(rating) => {
                        setUserRating(rating);
                        setShowThanks(true);
                        setTimeout(() => {
                          setShowThanks(false);
                          onRate?.(rating);
                        }, 1000);
                      }}
                    />
                    <span className="text-sm text-muted-foreground ml-2">
                      Average: {rating.toFixed(1)}
                    </span>
                  </div>
                ) : showThanks ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-medium">Thank you! Rated {userRating.toFixed(0)}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      Average: {rating.toFixed(1)}
                    </span>
                  </div>
                ) : isEditing ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">New rating:</span>
                    <StarRating 
                      rating={0} 
                      isVoted={false}
                      variant="default"
                      onRate={(rating) => {
                        setUserRating(rating);
                        setIsEditing(false);
                        onRate?.(rating);
                      }}
                    />
                    <span className="text-sm text-muted-foreground ml-2">
                      Average: {rating.toFixed(1)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Your rating: {userRating.toFixed(0)}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Change
                    </Button>
                    <span className="text-sm text-muted-foreground ml-2">
                      Average: {rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "transition-colors",
                    isLiked 
                      ? "text-contest-blue hover:text-contest-blue/80" 
                      : "text-muted-foreground hover:text-gray-600"
                  )}
                  onClick={handleLike}
                >
                  <Heart 
                    className={cn(
                      "w-4 h-4 mr-1 transition-colors",
                      isLiked && "fill-contest-blue"
                    )} 
                  />
                  {likesCount} Like{likesCount !== 1 ? 's' : ''}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-gray-600 transition-colors"
                  onClick={() => openModal(0)}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {commentsCount} Comment{commentsCount !== 1 ? 's' : ''}
                </Button>
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
            <div className="absolute inset-0 bg-white rounded-r flex flex-col justify-between p-2 sm:p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1 mr-2">
                  <h3 className="font-semibold text-contest-text text-sm sm:text-base truncate">{name}</h3>
                  <div className="text-xs sm:text-sm text-contest-blue truncate">
                    {country} · {city}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {age} y.o · {weight} kg · {height} cm
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
              
              <div className="flex items-center gap-2 sm:gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "transition-colors text-xs h-6 px-2 hover:bg-gray-100",
                    isLiked 
                      ? "text-contest-blue hover:text-contest-blue/80" 
                      : "text-muted-foreground hover:text-gray-600"
                  )}
                  onClick={handleLike}
                >
                  <Heart 
                    className={cn(
                      "w-3 h-3 mr-1 transition-colors",
                      isLiked && "fill-contest-blue"
                    )} 
                  />
                  <span className="hidden sm:inline">{likesCount} Like{likesCount !== 1 ? 's' : ''}</span>
                  <span className="sm:hidden">{likesCount}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-gray-600 hover:bg-gray-100 text-xs h-6 px-2 transition-colors"
                  onClick={() => openModal(0)}
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">{commentsCount} Comment{commentsCount !== 1 ? 's' : ''}</span>
                  <span className="sm:hidden">{commentsCount}</span>
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