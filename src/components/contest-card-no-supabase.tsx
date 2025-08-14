import { useState, useCallback } from "react";
import { Heart, MessageCircle, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { PhotoModal } from "@/components/photo-modal";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

import contestant1Face from "@/assets/contestant-1-face.jpg";
import contestant1Full from "@/assets/contestant-1-full.jpg";
import contestant2Face from "@/assets/contestant-2-face.jpg";
import contestant2Full from "@/assets/contestant-2-full.jpg";
import contestant3Face from "@/assets/contestant-3-face.jpg";
import contestant3Full from "@/assets/contestant-3-full.jpg";

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
  isVoted = false,
  isWinner = false,
  prize,
  viewMode = 'compact',
  onRate,
  profileId,
}: ContestantCardProps) {
  const { toast } = useToast();
  
  // Static state without Supabase
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 50) + 10);
  const [userRating, setUserRating] = useState(0);
  const [hasVoted, setHasVoted] = useState(isVoted);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const handleLike = useCallback(() => {
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
    
    toast({
      title: newIsLiked ? "Лайк добавлен" : "Лайк убран",
      description: `Вы ${newIsLiked ? 'поставили лайк' : 'убрали лайк'} ${name}`,
    });
  }, [isLiked, name, toast]);

  const handleRate = useCallback((newRating: number) => {
    setUserRating(newRating);
    setHasVoted(true);
    onRate?.(newRating);
    
    toast({
      title: "Оценка сохранена",
      description: `Вы поставили ${newRating} звезд${newRating === 1 ? 'у' : newRating < 5 ? 'ы' : ''}!`,
    });
  }, [onRate, toast]);

  if (viewMode === 'compact') {
    return (
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className="aspect-[3/4] relative cursor-pointer" onClick={() => setIsPhotoModalOpen(true)}>
          <img
            src={faceImage}
            alt={`${name} - участница конкурса`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Rank badge */}
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            #{rank}
          </div>

          {/* Winner badge */}
          {isWinner && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded font-bold">
              🏆 WINNER
            </div>
          )}
        </div>

        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm truncate">{name}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {rating.toFixed(1)}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-2">
            {city}, {country}
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1 text-xs transition-colors",
                isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
              )}
            >
              <Heart className={cn("w-3 h-3", isLiked && "fill-current")} />
              {likesCount}
            </button>

            <StarRating
              rating={userRating}
              onRate={handleRate}
              readonly={hasVoted}
            />
          </div>

          {prize && (
            <div className="mt-2 text-center">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {prize}
              </span>
            </div>
          )}
        </div>

        <PhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          photos={[faceImage, fullBodyImage, ...additionalPhotos]}
          currentIndex={0}
          contestantName={name}
        />
      </Card>
    );
  }

  // Full view mode
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <div className="space-y-2">
          <div className="aspect-[3/4] relative cursor-pointer" onClick={() => setIsPhotoModalOpen(true)}>
            <img
              src={faceImage}
              alt={`${name} - портрет`}
              className="absolute inset-0 w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <img
              src={fullBodyImage}
              alt={`${name} - в полный рост`}
              className="aspect-[3/4] object-cover rounded cursor-pointer"
              onClick={() => setIsPhotoModalOpen(true)}
              loading="lazy"
            />
            {additionalPhotos[0] && (
              <img
                src={additionalPhotos[0]}
                alt={`${name} - дополнительное фото`}
                className="aspect-[3/4] object-cover rounded cursor-pointer"
                onClick={() => setIsPhotoModalOpen(true)}
                loading="lazy"
              />
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold">#{rank}</span>
                <h2 className="text-xl font-bold">{name}</h2>
                {isWinner && <span className="text-lg">🏆</span>}
              </div>
              <p className="text-muted-foreground">{city}, {country}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span>{age} лет</span>
                <span>{height} см</span>
                <span>{weight} кг</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{rating.toFixed(1)}</span>
              </div>
              <StarRating
                rating={userRating}
                onRate={handleRate}
                readonly={hasVoted}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                isLiked 
                  ? "bg-red-50 text-red-600 hover:bg-red-100" 
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
              {likesCount}
            </button>

            {profileId && (
              <Link to={`/profile/${profileId}`}>
                <Button variant="outline" size="sm">
                  Профиль
                </Button>
              </Link>
            )}
          </div>

          {prize && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-green-700 font-semibold">{prize}</div>
            </div>
          )}
        </div>
      </div>

      <PhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        photos={[faceImage, fullBodyImage, ...additionalPhotos]}
        currentIndex={0}
        contestantName={name}
      />
    </Card>
  );
}