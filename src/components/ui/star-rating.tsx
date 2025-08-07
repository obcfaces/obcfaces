import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  isVoted?: boolean;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  showText?: boolean;
}

export function StarRating({ rating, isVoted, onRate, readonly, showText = true }: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleClick = (star: number) => {
    if (!readonly && onRate) {
      onRate(star);
    }
  };

  return (
    <div className="flex items-center gap-2">
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
                star <= (hoveredRating || rating)
                  ? "fill-star-active text-star-active"
                  : "fill-star-inactive text-star-inactive"
              )}
            />
          </button>
        ))}
      </div>
      
      {showText && (
        <div className="text-sm text-muted-foreground">
          {isVoted ? (
            <span>Your vote is <span className="font-medium">{rating} stars</span> /// <button className="text-contest-blue hover:underline">edit</button></span>
          ) : (
            <span>Thanks!</span>
          )}
        </div>
      )}
    </div>
  );
}