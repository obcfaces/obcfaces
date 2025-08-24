import { useState, useEffect } from "react";
import { ContestantCard } from "@/components/contest-card";
import { supabase } from "@/integrations/supabase/client";

import contestant1Face from "@/assets/contestant-1-face.jpg";
import contestant1Full from "@/assets/contestant-1-full.jpg";
import contestant2Face from "@/assets/contestant-2-face.jpg";
import contestant2Full from "@/assets/contestant-2-full.jpg";
import contestant3Face from "@/assets/contestant-3-face.jpg";
import contestant3Full from "@/assets/contestant-3-full.jpg";
import testContestantFace from "@/assets/test-contestant-face.jpg";
import testContestantFull from "@/assets/test-contestant-full.jpg";

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
  const [contestants, setContestants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadContestParticipants = async (weekOffset: number = 0) => {
    try {
      // Use the secure public function that doesn't expose sensitive data
      const { data, error } = await supabase
        .rpc('get_weekly_contest_participants_public', { weeks_offset: weekOffset });

      console.log(`Loading participants for week offset ${weekOffset}:`, data);
      console.log('Weekly contest participants error:', error);

      if (error) {
        console.error('Database error loading participants:', error);
        return [];
      }

      if (data && Array.isArray(data)) {
        console.log(`Found ${data.length} real participants for week offset ${weekOffset}`);
        return data;
      } else {
        console.warn('No weekly contest participants found for week offset:', weekOffset);
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
      setIsLoading(true);
      let weekOffset = 0;
      if (title === "THIS WEEK") weekOffset = 0;
      else if (title === "1 WEEK AGO") weekOffset = -1;
      else if (title === "2 WEEKS AGO") weekOffset = -2;
      else if (title === "3 WEEKS AGO") weekOffset = -3;
      
      if (["THIS WEEK", "1 WEEK AGO", "2 WEEKS AGO", "3 WEEKS AGO"].includes(title)) {
        const participants = await loadContestParticipants(weekOffset);
        setRealContestants(participants);
        
        // Load contestants immediately after getting real data
        const contestantsData = await getContestantsSync(participants);
        setContestants(contestantsData || []);
      } else {
        // For other weeks, load fallback data immediately
        const contestantsData = await getContestantsSync([]);
        setContestants(contestantsData || []);
      }
      setIsLoading(false);
    };

    loadParticipants();

    // Set up real-time subscription for contest participant updates
    if (["THIS WEEK", "1 WEEK AGO", "2 WEEKS AGO", "3 WEEKS AGO"].includes(title)) {
      const channel = supabase
        .channel('contest_participant_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'weekly_contest_participants'
          },
          (payload) => {
            console.log('Weekly contest participants changed:', payload);
            loadParticipants();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'contest_applications'
          },
          (payload) => {
            console.log('Contest applications changed:', payload);
            loadParticipants();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [title]);

  const handleRate = async (contestantId: number, rating: number) => {
    setVotes(prev => ({ ...prev, [contestantId]: rating }));
    
    // Refresh contestants data after rating to show updated average
    setTimeout(async () => {
      const updatedContestants = await getContestantsSync();
      setContestants(updatedContestants || []);
    }, 1000);
  };

  // Define contestants based on week type (synchronous version)
  const getContestantsSync = async (participantsData: any[] = realContestants) => {
    // Use the actual participants data passed to the function
    const actualParticipants = participantsData.length > 0 ? participantsData : realContestants;
    
    console.log(`getContestantsSync called for ${title}:`, { 
      participantsDataLength: participantsData.length, 
      realContestantsLength: realContestants.length,
      actualParticipantsLength: actualParticipants.length,
      participantsData: participantsData.slice(0, 2) // Log first 2 for debugging
    });
    
    // Use real contestants from weekly contests if available
    if (["THIS WEEK", "1 WEEK AGO", "2 WEEKS AGO", "3 WEEKS AGO"].includes(title) && actualParticipants.length > 0) {
      console.log(`Using real contestants for ${title}:`, actualParticipants.length);
      const contestantsWithRatings = await Promise.all(
        actualParticipants.map(async (contestant) => {
          // Validate contestant data structure
          if (!contestant || typeof contestant !== 'object') {
            console.warn('Invalid contestant data:', contestant);
            return null;
          }
          
          // Get average rating from database
          const { data: avgRating } = await supabase.rpc('get_contestant_average_rating', {
            contestant_name_param: `${contestant.first_name || ''} ${contestant.last_name || ''}`.trim(),
            contestant_user_id_param: contestant.user_id
          });
          
          const averageRating = avgRating || 0;
          
          const contestantData = {
            rank: contestant.final_rank || 0,
            name: `${contestant.first_name || 'Unknown'} ${contestant.last_name || ''}`.trim(),
            profileId: contestant.user_id,
            country: contestant.country || 'Unknown',
            city: contestant.city || 'Unknown',
            age: contestant.age || 0,
            weight: contestant.weight_kg || 0,
            height: contestant.height_cm || 0,
            rating: averageRating,
            averageRating: contestant.average_rating || 0, // Add average rating from DB
            totalVotes: contestant.total_votes || 0, // Add total votes from DB
            faceImage: contestant.photo_1_url || contestant1Face,
            fullBodyImage: contestant.photo_2_url || contestant1Full,
            additionalPhotos: [],
            isVoted: showWinner ? true : averageRating > 0,
            isWinner: false, // Will be set after sorting
            prize: undefined, // Will be set after sorting
            isRealContestant: true // Mark as real contestant to disable fake likes/comments
          };
          
          console.log(`Real contestant data for ${contestantData.name}:`, {
            profileId: contestantData.profileId,
            user_id: contestant.user_id,
            hasProfileId: !!contestantData.profileId
          });
          
          return contestantData;
        })
      );
      
      // Sort by average rating (highest first) and assign ranks based on rating
      const sortedContestants = contestantsWithRatings.filter(Boolean).sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        // If ratings are equal, sort by total votes (higher votes first)
        return (b.totalVotes || 0) - (a.totalVotes || 0);
      });

      // For "THIS WEEK" section, always add test card at the beginning
      if (title === "THIS WEEK") {
        const testCard = {
          rank: 0, // Use 0 to distinguish from real ranks
          name: "Example Card", 
          profileId: "example-id",
          country: "Philippines",
          city: "Manila",
          age: 25,
          weight: 55,
          height: 165,
          rating: 4.8,
          averageRating: 4.8,
          totalVotes: 124,
          faceImage: testContestantFace,
          fullBodyImage: testContestantFull,
          additionalPhotos: [],
          isVoted: false,
          isWinner: false,
          prize: undefined,
          isRealContestant: false,
          isExample: true // Special flag for example card
        };
        
        // Add test card at the beginning, then real contestants
        const realContestantsWithRanks = sortedContestants.map((contestant, index) => {
          const newRank = contestant.rating > 0 ? index + 1 : 0;
          return {
            ...contestant,
            rank: newRank,
            isWinner: showWinner && newRank === 1,
            prize: showWinner && newRank === 1 ? "+ 5000 PHP" : undefined
          };
        });
        
        return [testCard, ...realContestantsWithRanks];
      }

      // Assign ranks based on rating order (1 for highest rating) for other weeks
      return sortedContestants.map((contestant, index) => {
        const newRank = contestant.rating > 0 ? index + 1 : 0;
        return {
          ...contestant,
          rank: newRank,
          isWinner: showWinner && newRank === 1,
          prize: showWinner && newRank === 1 ? "+ 5000 PHP" : undefined
        };
      });
    }
    
    // Return empty array if no real contestants found
    console.log(`No real contestants found for ${title}, returning empty array`);
    return [];
  };

  // Keep this for backward compatibility but it's now mainly unused
  const getContestants = () => getContestantsSync();

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

      {isLoading ? (
        <div className="px-0 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-1 sm:gap-3 max-w-full overflow-hidden">
          {/* Loading skeleton */}
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border-contest-border relative overflow-hidden flex h-36 sm:h-40 md:h-44 animate-pulse">
              <div className="w-32 sm:w-36 md:w-40 bg-gray-300"></div>
              <div className="flex-1 p-3 sm:p-4 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
      )}

    </section>
  );
}
