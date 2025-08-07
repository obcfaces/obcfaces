import { useState } from "react";
import { Heart, MessageCircle, Star, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { PhotoModal } from "@/components/photo-modal";
import { MiniStars } from "@/components/mini-stars";
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

  const allPhotos = [faceImage, fullBodyImage, ...additionalPhotos];

  const openModal = (photoIndex: number) => {
    setModalStartIndex(photoIndex);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className="bg-card border-contest-border relative overflow-hidden flex h-36 sm:h-40 md:h-44">
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
              className="w-28 sm:w-32 md:w-36 h-full object-cover border-r border-contest-border cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => openModal(0)}
            />
            <div className="absolute top-0 left-0 bg-black/70 text-white text-xs sm:text-sm font-bold px-1 py-0.5 rounded-br">
              {rank}
            </div>
          </div>
          <div className="relative">
            <img 
              src={fullBodyImage} 
              alt={`${name} full body`}
              className="w-28 sm:w-32 md:w-36 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
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
        <div className="flex-1 p-2 sm:p-3 md:p-4 flex flex-col relative">
          {/* Voting overlay - shown by default when not voted and not editing */}
          {!isVoted && !isEditing && !showThanks && (
            <div className="absolute inset-0 bg-gray-300 rounded-r flex items-center px-4">
              <span className="text-base font-medium text-gray-800 mr-6">Vote</span>
              <div className="scale-150">
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
            <div className="absolute inset-0 bg-gray-300 rounded-r flex items-center justify-center px-4">
              <div className="text-center">
                <div className="text-base font-medium text-gray-800 mb-1">Thank you. Rated</div>
                <div className="text-xl font-bold text-gray-800">{userRating.toFixed(1)}</div>
              </div>
            </div>
          )}
          
          {/* Re-voting overlay - shown when editing existing vote */}
          {isVoted && isEditing && !showThanks && (
            <div className="absolute inset-0 bg-gray-300 rounded-r flex items-center px-4">
              <span className="text-base font-medium text-gray-800 mr-6">Vote</span>
              <div className="scale-150">
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
            <div className="absolute inset-0 bg-white rounded-r flex flex-col justify-between p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-contest-text text-sm sm:text-base">{name}</h3>
                  <div className="text-xs sm:text-sm text-contest-blue">
                    {country} · {city}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {age} y.o · {weight} kg · {height} cm
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg sm:text-xl font-bold text-contest-text mb-1 flex items-center justify-end gap-1">
                    {rating.toFixed(1)}
                    <MiniStars rating={rating} />
                  </div>
                  <div className="flex items-center justify-end gap-2 -mt-1 pr-1">
                    <span className="text-xs text-muted-foreground/70">{userRating.toFixed(1)}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-1 h-auto text-muted-foreground hover:text-gray-600"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                  {isWinner && prize && (
                    <div className="text-contest-blue font-bold text-sm">
                      {prize}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-gray-600 hover:bg-gray-100">
                  <Heart className="w-4 h-4 mr-1" />
                  Like
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-gray-600 hover:bg-gray-100">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  no comment
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