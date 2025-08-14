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
    1: 4.8, 2: 4.5, 3: 4.2, 4: 3.9, 5: 3.5, 6: 3.1, 7: 3.7, 8: 3.4, 9: 3.2, 10: 3.0
  });

  const [votes, setVotes] = useState<Record<number, number>>({});

  const handleRate = (contestantId: number, rating: number) => {
    setVotes(prev => ({ ...prev, [contestantId]: rating }));
  };

  const contestants = [
    {
      rank: 1,
      name: "Maria Santos",
      profileId: "1b5c2751-a820-4767-87e6-d06080219942",
      country: "Philippines", 
      city: "Cebu",
      age: 23,
      weight: 52,
      height: 168,
      rating: ratings[1],
      faceImage: contestant1Face,
      fullBodyImage: contestant1Full,
      additionalPhotos: [contestant2Face, contestant3Face],
      isVoted: showWinner ? true : !!votes[1],
      isWinner: showWinner,
      prize: showWinner ? "+ 5000 PhP" : undefined
    },
    {
      rank: 2,
      name: "Anna Cruz",
      country: "Philippines",
      city: "Manila",
      age: 24,
      weight: 55,
      height: 165,
      rating: ratings[2],
      faceImage: contestant2Face,
      fullBodyImage: contestant2Full,
      additionalPhotos: [contestant1Face],
      isVoted: showWinner ? true : !!votes[2]
    },
    {
      rank: 3,
      name: "Sofia Reyes",
      country: "Philippines",
      city: "Davao", 
      age: 22,
      weight: 51,
      height: 170,
      rating: ratings[3],
      faceImage: contestant3Face,
      fullBodyImage: contestant3Full,
      additionalPhotos: [contestant1Face, contestant2Face, contestant1Full],
      isVoted: showWinner ? true : !!votes[3]
    },
    {
      rank: 4,
      name: "Isabella Garcia",
      country: "Philippines",
      city: "Quezon City",
      age: 25,
      weight: 53,
      height: 167,
      rating: ratings[4],
      faceImage: contestant1Face,
      fullBodyImage: contestant1Full,
      isVoted: showWinner ? true : !!votes[4]
    },
    {
      rank: 5,
      name: "Camila Torres",
      country: "Philippines",
      city: "Makati",
      age: 21,
      weight: 49,
      height: 163,
      rating: ratings[5],
      faceImage: contestant2Face,
      fullBodyImage: contestant2Full,
      additionalPhotos: [contestant3Face, contestant3Full],
      isVoted: showWinner ? true : !!votes[5]
    },
    {
      rank: 6,
      name: "Valentina Lopez",
      country: "Philippines",
      city: "Pasig",
      age: 26,
      weight: 56,
      height: 172,
      rating: ratings[6],
      faceImage: contestant3Face,
      fullBodyImage: contestant3Full,
      isVoted: showWinner ? true : !!votes[6]
    },
    {
      rank: 7,
      name: "Emma Rodriguez",
      country: "Philippines",
      city: "Taguig",
      age: 23,
      weight: 52,
      height: 166,
      rating: ratings[7] || 3.7,
      faceImage: contestant1Face,
      fullBodyImage: contestant1Full,
      additionalPhotos: [contestant2Face],
      isVoted: showWinner ? true : !!votes[7]
    },
    {
      rank: 8,
      name: "Mia Hernandez",
      country: "Philippines",
      city: "Antipolo",
      age: 24,
      weight: 54,
      height: 169,
      rating: ratings[8] || 3.4,
      faceImage: contestant2Face,
      fullBodyImage: contestant2Full,
      additionalPhotos: [contestant3Face],
      isVoted: showWinner ? true : !!votes[8]
    },
    {
      rank: 9,
      name: "Gabriela Martinez",
      country: "Philippines",
      city: "Zamboanga",
      age: 22,
      weight: 50,
      height: 164,
      rating: ratings[9] || 3.2,
      faceImage: contestant3Face,
      fullBodyImage: contestant3Full,
      additionalPhotos: [contestant1Face, contestant2Face],
      isVoted: showWinner ? true : !!votes[9]
    },
    {
      rank: 10,
      name: "Lucia Gonzalez",
      country: "Philippines",
      city: "Cagayan de Oro",
      age: 25,
      weight: 57,
      height: 171,
      rating: ratings[10] || 3.0,
      faceImage: contestant1Face,
      fullBodyImage: contestant1Full,
      additionalPhotos: [contestant3Face],
      isVoted: showWinner ? true : !!votes[10]
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
        ? "grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-1 sm:gap-3"
        : "grid grid-cols-1 lg:grid-cols-2 gap-6"
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

    </section>
  );
}