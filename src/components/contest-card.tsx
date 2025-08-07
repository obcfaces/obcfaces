import { Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
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
  isVoted,
  isWinner,
  prize,
  onRate
}: ContestantCardProps) {
  return (
    <Card className="bg-card border-contest-border relative overflow-hidden flex h-44">
      {isWinner && (
        <div className="absolute top-2 right-2 bg-contest-blue text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 z-10">
          🏆 WINNER
        </div>
      )}
      
      {/* Two square photos side by side */}
      <div className="flex-shrink-0 flex">
        <img 
          src={faceImage} 
          alt={`${name} face`}
          className="w-20 h-20 object-cover border-r border-contest-border"
        />
        <img 
          src={fullBodyImage} 
          alt={`${name} full body`}
          className="w-20 h-20 object-cover"
        />
      </div>
      
      {/* Content area */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-contest-text">
              {rank}.
            </div>
            <div>
              <h3 className="font-semibold text-contest-text">{name}</h3>
              <div className="text-sm text-contest-blue">
                {country} · {city}
              </div>
              <div className="text-sm text-muted-foreground">
                {age} y.o · {weight} kg · {height} cm
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xl font-bold text-contest-text mb-1">
              {rating.toFixed(1)}
            </div>
            {isWinner && prize && (
              <div className="text-contest-blue font-bold text-sm">
                {prize}
              </div>
            )}
          </div>
        </div>
        
        <StarRating 
          rating={Math.round(rating)} 
          isVoted={isVoted}
          onRate={onRate}
        />
        
        <div className="flex items-center gap-4 mt-auto pt-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-contest-blue">
            <Heart className="w-4 h-4 mr-1" />
            Like
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-contest-blue">
            <MessageCircle className="w-4 h-4 mr-1" />
            no comment
          </Button>
        </div>
      </div>
    </Card>
  );
}