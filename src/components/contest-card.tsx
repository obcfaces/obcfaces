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
  image: string;
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
  image,
  isVoted,
  isWinner,
  prize,
  onRate
}: ContestantCardProps) {
  return (
    <Card className="p-4 bg-card border-contest-border relative">
      {isWinner && (
        <div className="absolute -top-2 -right-2 bg-contest-blue text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          🏆 WINNER
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-2xl font-bold text-contest-text w-8">
          {rank}.
        </div>
        
        <div className="flex-shrink-0">
          <img 
            src={image} 
            alt={name}
            className="w-20 h-20 rounded-lg object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-contest-text">{name}</h3>
              <div className="text-sm text-contest-blue">
                {country} · {city}
              </div>
              <div className="text-sm text-muted-foreground">
                {age} y.o · {weight} kg · {height} cm
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
          
          <div className="flex items-center gap-4 mt-3">
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
      </div>
    </Card>
  );
}