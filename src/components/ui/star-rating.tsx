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

  const handleClick = (star: number) => {
    if (!readonly && onRate) {
      onRate(star);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {[1, 2, 3].map((star) => (
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
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-transparent text-white stroke-2"
                  : star <= hoveredRating
                    ? "fill-star-active text-star-active"
                    : "fill-star-inactive text-star-inactive"
              )}
            />
          </button>
        ))}
      </div>
      
      {!hideText && (
        <div className="text-sm text-muted-foreground">
          <span className="text-contest-blue font-medium">Vote</span>
        </div>
      )}
    </div>
  );
}