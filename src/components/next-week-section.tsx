import { useState } from "react";
import { Heart, ThumbsDown, RotateCcw } from "lucide-react";
import { ContestantCard } from "@/components/contest-card";
import { Button } from "@/components/ui/button";

import contestant1Face from "@/assets/contestant-1-face.jpg";
import contestant1Full from "@/assets/contestant-1-full.jpg";
import contestant2Face from "@/assets/contestant-2-face.jpg";
import contestant2Full from "@/assets/contestant-2-full.jpg";
import contestant3Face from "@/assets/contestant-3-face.jpg";
import contestant3Full from "@/assets/contestant-3-full.jpg";

const candidates = [
  {
    rank: 0, // Специальное значение для скрытия места и плашки
    name: "Name Chall",
    country: "Philippines",
    city: "Negros",
    age: 25,
    weight: 53,
    height: 182,
    rating: 0,
    faceImage: contestant1Face,
    fullBodyImage: contestant1Full,
    additionalPhotos: [contestant2Face, contestant3Face],
    isVoted: true
  },
  {
    rank: 0,
    name: "Name Chall",
    country: "Philippines", 
    city: "Negros",
    age: 25,
    weight: 53,
    height: 182,
    rating: 0,
    faceImage: contestant2Face,
    fullBodyImage: contestant2Full,
    additionalPhotos: [contestant1Face],
    isVoted: true
  },
  {
    rank: 0,
    name: "Name Chall",
    country: "Philippines",
    city: "Negros",
    age: 25,
    weight: 53,
    height: 182,
    rating: 0,
    faceImage: contestant3Face,
    fullBodyImage: contestant3Full,
    additionalPhotos: [contestant1Face, contestant2Face, contestant1Full],
    isVoted: true
  },
  {
    rank: 0,
    name: "Name Chall",
    country: "Philippines",
    city: "Negros",
    age: 25,
    weight: 53,
    height: 182,
    rating: 0,
    faceImage: contestant1Face,
    fullBodyImage: contestant1Full,
    isVoted: true
  },
  {
    rank: 0,
    name: "Name Chall",
    country: "Philippines",
    city: "Negros",
    age: 25,
    weight: 53,
    height: 182,
    rating: 0,
    faceImage: contestant2Face,
    fullBodyImage: contestant2Full,
    additionalPhotos: [contestant3Face, contestant3Full],
    isVoted: true
  }
];

interface NextWeekSectionProps {
  viewMode?: 'compact' | 'full';
}

export function NextWeekSection({ viewMode = 'full' }: NextWeekSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [remainingCandidates, setRemainingCandidates] = useState(candidates.length);

  const handleLike = () => {
    if (currentIndex < candidates.length - 1) {
      setHistory(prev => [...prev, currentIndex]);
      setCurrentIndex(prev => prev + 1);
      setRemainingCandidates(prev => prev - 1);
    }
  };

  const handleDislike = () => {
    if (currentIndex < candidates.length - 1) {
      setHistory(prev => [...prev, currentIndex]);
      setCurrentIndex(prev => prev + 1);
      setRemainingCandidates(prev => prev - 1);
    }
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previousIndex = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setCurrentIndex(previousIndex);
      setRemainingCandidates(prev => prev + 1);
    }
  };

  const currentCandidate = candidates[currentIndex];

  return (
    <section className="max-w-6xl mx-auto px-0 sm:px-6 py-8">
      <div className="mb-8 px-6 sm:px-0">
        <div className="mb-4">
          <div className="flex items-baseline gap-3 mb-1">
            <div className="inline-flex flex-col w-fit items-start">
              <h2 className="text-3xl font-bold text-contest-text">NEXT WEEK</h2>
              <p className="text-muted-foreground italic -mt-1">1-8 September 2025</p>
            </div>
            <span className="text-lg font-normal text-contest-text">
              Choose next week's finalists
            </span>
          </div>
        </div>
      </div>

      {currentIndex < candidates.length ? (
        <div className="flex flex-col items-center">
          <div className="w-full">
            <ContestantCard
              {...currentCandidate}
              viewMode={viewMode}
              showDislike={true}
            />
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-6">
            {history.length > 0 && (
              <Button
                onClick={handleUndo}
                variant="outline"
                size="lg"
                className="rounded-full w-14 h-14 p-0 border-2 border-muted hover:border-blue-400 hover:bg-blue-50"
              >
                <RotateCcw className="w-6 h-6 text-blue-500" />
              </Button>
            )}
            
            <Button
              onClick={handleDislike}
              variant="outline"
              size="lg"
              className="rounded-full w-16 h-16 p-0 border-2 border-red-300 hover:border-red-500 hover:bg-red-50"
            >
              <ThumbsDown className="w-8 h-8 text-red-500" />
            </Button>
            
            <Button
              onClick={handleLike}
              variant="outline"
              size="lg"
              className="rounded-full w-16 h-16 p-0 border-2 border-green-300 hover:border-green-500 hover:bg-green-50"
            >
              <Heart className="w-8 h-8 text-green-500" />
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <span className="text-lg text-contest-text">
              {remainingCandidates} remaining
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-2xl font-bold text-contest-text mb-2">All candidates reviewed!</h3>
          <p className="text-muted-foreground">You've made your choices for next week's finalists.</p>
        </div>
      )}
    </section>
  );
}