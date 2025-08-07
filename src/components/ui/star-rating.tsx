import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  isVoted?: boolean;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  variant?: "default" | "white";
  hideText?: boolean;
}

export function StarRating({ rating, isVoted, onRate, readonly, variant = "default", hideText = false }: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showThanks, setShowThanks] = useState(false);
  const [userVote, setUserVote] = useState<number | null>(isVoted ? rating : null);

  const handleClick = (star: number) => {
    if (!readonly && onRate) {
      setUserVote(star);
      setShowThanks(true);
      onRate(star);
      
      // Show thanks for 1 second
      setTimeout(() => {
        setShowThanks(false);
      }, 1000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!userVote && (
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={readonly}
              onClick={() => handleClick(star)}
              onMouseEnter={() => !readonly && setHoveredRating(star)}
              onMouseLeave={() => !readonly && setHoveredRating(0)}
              className={cn(
                "p-0.5 transition-colors",
                !readonly && "hover:scale-110 cursor-pointer"
              )}
            >
              <Star
                className={cn(
                  "w-4 h-4 transition-colors",
                  variant === "white"
                    ? star <= hoveredRating
                      ? "fill-white text-white"
                      : "fill-white/30 text-white/30"
                    : star <= hoveredRating
                      ? "fill-star-active text-star-active"
                      : "fill-star-inactive text-star-inactive"
                )}
              />
            </button>
          ))}
        </div>
      )}
      
      {!hideText && (
        <div className="text-sm text-muted-foreground">
          {showThanks ? (
            <span className="text-green-600 font-medium">Thanks!</span>
          ) : userVote ? (
            <span>Your vote is <span className="font-medium">{userVote} stars</span> /// <button className="text-contest-blue hover:underline">edit</button></span>
          ) : (
            <span className="text-contest-blue font-medium">Vote</span>
          )}
        </div>
      )}
    </div>
  );
}