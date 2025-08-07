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
  description: string;
  isActive?: boolean;
  showWinner?: boolean;
}

export function ContestSection({ title, subtitle, description, isActive, showWinner }: ContestSectionProps) {
  const [ratings, setRatings] = useState<Record<number, number>>({
    1: 4.2,
    2: 4.2,
    3: 4.2,
    4: 4.2,
    5: 4.2,
    6: 4.2
  });

  const [votes, setVotes] = useState<Record<number, number>>({
    2: 3,
    4: 3,
    6: 3
  });

  const handleRate = (contestantId: number, rating: number) => {
    setVotes(prev => ({ ...prev, [contestantId]: rating }));
  };

  const contestants = [
    {
      rank: 1,
      name: "Name Chall",
      country: "Philippines",
      city: "Negros",
      age: 25,
      weight: 53,
      height: 182,
      rating: ratings[1],
      faceImage: contestant1Face,
      fullBodyImage: contestant1Full,
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
      fullBodyImage: contestant3Full
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
      fullBodyImage: contestant2Full
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
    <section className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-contest-text mb-2">
          {title}
        </h2>
        <p className="text-contest-blue font-medium mb-2">{subtitle}</p>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {contestants.map((contestant) => (
          <ContestantCard
            key={contestant.rank}
            {...contestant}
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