import { useState, useEffect } from "react";
import { ContestantCard } from "@/components/contest-card";
import { supabase } from "@/integrations/supabase/client";

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
  filters?: React.ReactNode; // Add filters prop
}

// Helper function to get week range dates (Monday-Sunday)
const getWeekRange = (weeksOffset: number = 0) => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Get Monday of current week
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + (weeksOffset * 7));
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const formatDate = (date: Date, includeYear: boolean = false) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return includeYear ? `${day} ${month} ${year}` : `${day} ${month}`;
  };
  
  const mondayFormatted = formatDate(monday);
  const sundayFormatted = formatDate(sunday, true);
  
  // If same month, show "1-7 September 2025", otherwise "31 August - 6 September 2025"
  if (monday.getMonth() === sunday.getMonth()) {
    return `${monday.getDate()}-${sunday.getDate()} ${sunday.toLocaleDateString('en-US', { month: 'long' })} ${sunday.getFullYear()}`;
  } else {
    return `${mondayFormatted} - ${sundayFormatted}`;
  }
};

export function ContestSection({ title, subtitle, description, isActive, showWinner, centerSubtitle, titleSuffix, noWrapTitle, viewMode: controlledViewMode, filters }: ContestSectionProps) {
  const [localViewMode] = useState<'compact' | 'full'>('compact');
  const viewMode = controlledViewMode ?? localViewMode;
  const [ratings, setRatings] = useState<Record<number, number>>({
    1: 4.8, 2: 4.5, 3: 4.2, 4: 3.9, 5: 3.5, 6: 3.1, 7: 3.7, 8: 3.4, 9: 3.2, 10: 3.0
  });

  const [votes, setVotes] = useState<Record<number, number>>({});
  const [realContestants, setRealContestants] = useState<any[]>([]);

  const loadContestParticipants = async (weekOffset: number = 0) => {
    try {
      const { data, error } = await supabase
        .rpc('get_weekly_contest_participants', { weeks_offset: weekOffset });

      console.log('Weekly contest participants data:', data);
      console.log('Weekly contest participants error:', error);

      if (data && !error) {
        return data;
      } else {
        console.warn('No weekly contest participants loaded:', error);
        return [];
      }
    } catch (err) {
      console.error('Error loading weekly contest participants:', err);
      return [];
    }
  };

  // Load participants based on title
  useEffect(() => {
    const loadParticipants = async () => {
      let weekOffset = 0;
      if (title === "THIS WEEK") weekOffset = 0;
      else if (title === "1 WEEK AGO") weekOffset = -1;
      else if (title === "2 WEEKS AGO") weekOffset = -2;
      else if (title === "3 WEEKS AGO") weekOffset = -3;
      
      if (["THIS WEEK", "1 WEEK AGO", "2 WEEKS AGO", "3 WEEKS AGO"].includes(title)) {
        const participants = await loadContestParticipants(weekOffset);
        setRealContestants(participants);
      }
    };

    loadParticipants();
  }, [title]);

  const handleRate = (contestantId: number, rating: number) => {
    setVotes(prev => ({ ...prev, [contestantId]: rating }));
  };

  // Определяем участников в зависимости от типа недели
  const getContestants = () => {
    // Use real contestants from weekly contests if available
    if (["THIS WEEK", "1 WEEK AGO", "2 WEEKS AGO", "3 WEEKS AGO"].includes(title) && realContestants.length > 0) {
      return realContestants.map((contestant, index) => {
        // Validate contestant data structure
        if (!contestant || typeof contestant !== 'object') {
          console.warn('Invalid contestant data:', contestant);
          return null;
        }
        
        // For real contestants, try to get user's rating from localStorage
        const currentUserId = localStorage.getItem('currentUserId');
        let userRating = 0;
        if (currentUserId && contestant.first_name && contestant.last_name) {
          const savedRating = localStorage.getItem(`rating-${contestant.first_name} ${contestant.last_name}-${currentUserId}`);
          userRating = savedRating ? parseFloat(savedRating) : 0;
        }
        
        // Use final_rank from database if available, otherwise use index + 1
        const rank = contestant.final_rank || (index + 1);
        
        return {
          rank,
          name: `${contestant.first_name || 'Unknown'} ${contestant.last_name || ''}`.trim(),
          profileId: contestant.user_id,
          country: contestant.country || 'Unknown',
          city: contestant.city || 'Unknown',
          age: contestant.age || 0,
          weight: contestant.weight_kg || 0,
          height: contestant.height_cm || 0,
          rating: userRating > 0 ? userRating : ratings[rank] || 4.0,
          faceImage: contestant.photo1_url || contestant1Face,
          fullBodyImage: contestant.photo2_url || contestant1Full,
          additionalPhotos: [],
          isVoted: showWinner ? true : !!votes[rank] || userRating > 0,
          isWinner: showWinner && rank === 1,
          prize: showWinner && rank === 1 ? "+ 5000 PHP" : undefined,
          isRealContestant: true // Mark as real contestant to disable fake likes/comments
        };
      }).filter(Boolean).sort((a, b) => a.rank - b.rank); // Sort by rank
    }
    
    // Fallback contestants for testing or when no real data
    if (title === "THIS WEEK") {
      return [
        {
          rank: 1,
          name: "Анна Петрова",
          profileId: "11111111-1111-1111-1111-111111111111",
          country: "Россия", 
          city: "Москва",
          age: 25,
          weight: 55.5,
          height: 165,
          rating: ratings[1],
          faceImage: contestant1Face,
          fullBodyImage: contestant1Full,
          additionalPhotos: [contestant2Face, contestant3Face],
          isVoted: showWinner ? true : !!votes[1],
          isWinner: showWinner,
          prize: showWinner ? "+ 5000 руб" : undefined
        },
        {
          rank: 2,
          name: "Елена Козлова",
          profileId: "33333333-3333-3333-3333-333333333333",
          country: "Россия",
          city: "Екатеринбург",
          age: 28,
          weight: 60,
          height: 170,
          rating: ratings[2],
          faceImage: contestant2Face,
          fullBodyImage: contestant2Full,
          additionalPhotos: [contestant1Face],
          isVoted: showWinner ? true : !!votes[2]
        },
        {
          rank: 3,
          name: "Ольга Волкова",
          profileId: "55555555-5555-5555-5555-555555555555",
          country: "Россия",
          city: "Казань", 
          age: 31,
          weight: 58,
          height: 162,
          rating: ratings[3],
          faceImage: contestant3Face,
          fullBodyImage: contestant3Full,
          additionalPhotos: [contestant1Face, contestant2Face, contestant1Full],
          isVoted: showWinner ? true : !!votes[3]
        }
      ];
    } else if (title === "1 WEEK AGO") {
      // Прошлая неделя - 2 финалистки
      return [
        {
          rank: 1,
          name: "Михаил Иванов",
          profileId: "22222222-2222-2222-2222-222222222222",
          country: "Россия",
          city: "Санкт-Петербург",
          age: 32,
          weight: 75,
          height: 180,
          rating: ratings[1],
          faceImage: contestant1Face,
          fullBodyImage: contestant1Full,
          additionalPhotos: [contestant2Face],
          isVoted: showWinner ? true : !!votes[1],
          isWinner: showWinner,
          prize: showWinner ? "+ 3000 руб" : undefined
        },
        {
          rank: 2,
          name: "Дмитрий Смирнов",
          profileId: "44444444-4444-4444-4444-444444444444",
          country: "Россия",
          city: "Новосибирск",
          age: 29,
          weight: 70.5,
          height: 178,
          rating: ratings[2],
          faceImage: contestant2Face,
          fullBodyImage: contestant2Full,
          additionalPhotos: [contestant3Face],
          isVoted: showWinner ? true : !!votes[2]
        }
      ];
    } else {
      // Остальные недели - оригинальные участники
      return [
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
    }
  };

  const contestants = getContestants();

  return (
    <section className="max-w-6xl mx-auto py-8 mb-2 bg-background rounded-lg shadow-lg shadow-foreground/15">
      <div className="mb-8 px-6">
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

      {filters && isActive && (
        <div className="mb-6 px-6">
          {filters}
        </div>
      )}

      <div className="px-0 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-1 sm:gap-3 max-w-full overflow-hidden">
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