import { useState } from "react";
import { ContestantCard } from "@/components/contest-card";

import contestant1Face from "@/assets/contestant-1-face.jpg";
import contestant1Full from "@/assets/contestant-1-full.jpg";
import contestant2Face from "@/assets/contestant-2-face.jpg";
import contestant2Full from "@/assets/contestant-2-full.jpg";
import contestant3Face from "@/assets/contestant-3-face.jpg";
import contestant3Full from "@/assets/contestant-3-full.jpg";

interface ContestSectionProps {
  title: string;
  subtitle: string;
  description?: string;
  isActive?: boolean;
  showWinner?: boolean;
  centerSubtitle?: boolean;
  titleSuffix?: string;
  noWrapTitle?: boolean;
  viewMode?: 'compact' | 'full';
}

export function ContestSection({ title, subtitle, description, isActive, showWinner, centerSubtitle, titleSuffix, noWrapTitle, viewMode: controlledViewMode }: ContestSectionProps) {
  const [localViewMode] = useState<'compact' | 'full'>('compact');
  const viewMode = controlledViewMode ?? localViewMode;
  const [ratings, setRatings] = useState<Record<number, number>>({
    1: 4.8,
    2: 4.5,
    3: 4.2,
    4: 3.9,
    5: 3.5,
    6: 3.1
  });

  const [votes, setVotes] = useState<Record<number, number>>({});

  const handleRate = (contestantId: number, rating: number) => {
    setVotes(prev => ({ ...prev, [contestantId]: rating }));
  };

  const contestants = [
    {
      rank: 1,
      name: "Name Chall",
      profileId: "11111111-1111-1111-1111-111111111111",
      country: "Philippines",
      city: "Negros",
      age: 25,
      weight: 53,
      height: 182,
      rating: ratings[1],
      faceImage: contestant1Face,
      fullBodyImage: contestant1Full,
      additionalPhotos: [contestant2Face, contestant3Face],
      isVoted: showWinner ? true : !!votes[1], // Для завершенных конкурсов голосование уже прошло
      isWinner: showWinner,
      prize: showWinner ? "+ 5000 PhP" : undefined
    },
    {
      rank: 2,
      name: "Name Chall",
      country: "Philippines",
      city: "Negros",
      age: 25,
      weight: 53,
      height: 182,
      rating: ratings[2],
      faceImage: contestant2Face,
      fullBodyImage: contestant2Full,
      additionalPhotos: [contestant1Face],
      isVoted: showWinner ? true : !!votes[2] // Для завершенных конкурсов голосование уже прошло
    },
    {
      rank: 3,
      name: "Name Chall",
      country: "Philippines",
      city: "Negros", 
      age: 25,
      weight: 53,
      height: 182,
      rating: ratings[3],
      faceImage: contestant3Face,
      fullBodyImage: contestant3Full,
      additionalPhotos: [contestant1Face, contestant2Face, contestant1Full],
      isVoted: showWinner ? true : !!votes[3] // Для завершенных конкурсов голосование уже прошло
    },
    {
      rank: 4,
      name: "Name Chall",
      country: "Philippines",
      city: "Negros",
      age: 25,
      weight: 53,
      height: 182,
      rating: ratings[4],
      faceImage: contestant1Face,
      fullBodyImage: contestant1Full,
      isVoted: showWinner ? true : !!votes[4] // Для завершенных конкурсов голосование уже прошло
    },
    {
      rank: 5,
      name: "Name Chall",
      country: "Philippines",
      city: "Negros",
      age: 25,
      weight: 53,
      height: 182,
      rating: ratings[5],
      faceImage: contestant2Face,
      fullBodyImage: contestant2Full,
      additionalPhotos: [contestant3Face, contestant3Full],
      isVoted: showWinner ? true : !!votes[5] // Для завершенных конкурсов голосование уже прошло
    },
    {
      rank: 6,
      name: "Name Chall",
      country: "Philippines",
      city: "Negros",
      age: 25,
      weight: 53,
      height: 182,
      rating: ratings[6],
      faceImage: contestant3Face,
      fullBodyImage: contestant3Full,
      isVoted: showWinner ? true : !!votes[6] // Для завершенных конкурсов голосование уже прошло
    }
  ];

  return (
    <section className="max-w-6xl mx-auto px-0 sm:px-6 py-8">
      <div className="mb-8 px-6 sm:px-0">
        <div className="mb-4">
          <div className="flex items-baseline gap-3 mb-1">
            <div className={`inline-flex flex-col w-fit ${centerSubtitle ? "items-center" : "items-start"}`}>
              <h2 className={`text-3xl font-bold text-contest-text ${noWrapTitle ? "whitespace-nowrap" : ""}`}>{title}</h2>
              <p className="text-muted-foreground italic -mt-1">{subtitle}</p>
            </div>
            {titleSuffix && (
              <span className="text-2xl font-normal text-muted-foreground">{titleSuffix}</span>
            )}
            {isActive && description && (
              <span className="text-lg font-normal text-contest-text">
                {description}
              </span>
            )}
          </div>
          {!isActive && description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      <div className={viewMode === 'compact'
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-3"
        : "space-y-6"
      }>
        {contestants.map((contestant) => (
          <ContestantCard
            key={contestant.rank}
            {...contestant}
            viewMode={viewMode}
            onRate={(rating) => handleRate(contestant.rank, rating)}
          />
        ))}
      </div>

      {!showWinner && (
        <div className="mt-8 text-center">
          <button className="text-contest-blue hover:underline">
            Other 6 challengers ↓
          </button>
        </div>
      )}
    </section>
  );
}