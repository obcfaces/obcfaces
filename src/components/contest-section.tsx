import { useState } from "react";
import { ContestantCard } from "@/components/contest-card";


import contestant1Face from "@/assets/contestant-1-face.jpg";
import contestant1Full from "@/assets/contestant-1-full.jpg";
import contestant2Face from "@/assets/contestant-2-face.jpg";
import contestant2Full from "@/assets/contestant-2-full.jpg";
import contestant3Face from "@/assets/contestant-3-face.jpg";
import contestant3Full from "@/assets/contestant-3-full.jpg";
import listIcon from "@/assets/icons/sdisplay-list.png";
import listActiveIcon from "@/assets/icons/sdisplay-list-active.png";
import tableIcon from "@/assets/icons/sdisplay-table.png";
import tableActiveIcon from "@/assets/icons/sdisplay-table-active.png";

interface ContestSectionProps {
  title: string;
  subtitle: string;
  description: string;
  isActive?: boolean;
  showWinner?: boolean;
}

export function ContestSection({ title, subtitle, description, isActive, showWinner }: ContestSectionProps) {
  const [viewMode, setViewMode] = useState<'compact' | 'full'>('compact');
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
      isVoted: !!votes[1],
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
      isVoted: !!votes[2]
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
      isVoted: !!votes[3]
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
      isVoted: !!votes[4]
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
      isVoted: !!votes[5]
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
      isVoted: !!votes[6]
    }
  ];

  return (
    <section className="max-w-6xl mx-auto px-0 sm:px-6 py-8">
      <div className="mb-8 px-6 sm:px-0">
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-contest-text mb-2">{title}</h2>
          <p className="text-contest-blue font-medium mb-2">{subtitle}</p>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mb-4 px-6 sm:px-0">
        <div className="relative">
          <div aria-hidden className="absolute inset-x-0 bottom-0 border-b border-border" />
          <div className="flex items-end justify-evenly pb-0" role="tablist" aria-label="View mode">
            <button
              type="button"
              onClick={() => setViewMode('full')}
              aria-pressed={viewMode === 'full'}
              aria-label="List view"
              className="p-1 rounded-md hover:bg-accent transition-colors"
            >
              <img
                src={viewMode === 'full' ? listActiveIcon : listIcon}
                alt="List view icon"
                width={28}
                height={28}
                loading="lazy"
                className="block"
              />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              aria-pressed={viewMode === 'compact'}
              aria-label="Grid view"
              className="p-1 rounded-md hover:bg-accent transition-colors"
            >
              <img
                src={viewMode === 'compact' ? tableActiveIcon : tableIcon}
                alt="Grid view icon"
                width={28}
                height={28}
                loading="lazy"
                className="block"
              />
            </button>
          </div>
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