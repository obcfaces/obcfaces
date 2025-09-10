import { Star } from "lucide-react";

interface MiniStarsProps {
  rating: number;
}

export function MiniStars({ rating }: MiniStarsProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex">
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="w-1.5 h-1.5 fill-star-active text-star-active" />
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <div className="relative">
          <Star className="w-1.5 h-1.5 fill-star-inactive text-star-inactive" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <Star className="w-1.5 h-1.5 fill-star-active text-star-active" />
          </div>
        </div>
      )}
      
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="w-1.5 h-1.5 fill-star-inactive text-star-inactive" />
      ))}
    </div>
  );
}