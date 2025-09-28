import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import { ContestantCard } from "@/components/contest-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import LoginModalContent from "@/components/login-modal-content";

import contestant1Face from "@/assets/contestant-1-face.jpg";
import contestant1Full from "@/assets/contestant-1-full.jpg";
import contestant2Face from "@/assets/contestant-2-face.jpg";
import contestant2Full from "@/assets/contestant-2-full.jpg";
import contestant3Face from "@/assets/contestant-3-face.jpg";
import contestant3Full from "@/assets/contestant-3-full.jpg";

const candidates: any[] = [
  {
    name: "Test Candidate 1",
    country: "Philippines", 
    city: "Manila",
    age: 22,
    weight: 51,
    height: 170,
    faceImage: contestant1Face,
    fullBodyImage: contestant1Full,
    additionalPhotos: []
  },
  {
    name: "Test Candidate 2", 
    country: "Philippines",
    city: "Cebu",
    age: 24,
    weight: 47,
    height: 155,
    faceImage: contestant2Face,
    fullBodyImage: contestant2Full,
    additionalPhotos: []
  },
  {
    name: "Test Candidate 3",
    country: "Philippines", 
    city: "Davao",
    age: 23,
    weight: 49,
    height: 162,
    faceImage: contestant3Face,
    fullBodyImage: contestant3Full,
    additionalPhotos: []
  }
];

interface NextWeekSectionProps {
  viewMode?: 'compact' | 'full';
}

// Helper function to get next week range dates (Monday-Sunday)
const getNextWeekRange = () => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Get Monday of current week
  
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + mondayOffset + 7); // Next week's Monday
  
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  
  const formatDate = (date: Date, includeYear: boolean = false) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return includeYear ? `${day} ${month} ${year}` : `${day} ${month}`;
  };
  
  const mondayFormatted = formatDate(nextMonday);
  const sundayFormatted = formatDate(nextSunday, true);
  
  // If same month, show "1-7 September 2025", otherwise "31 August - 6 September 2025"
  if (nextMonday.getMonth() === nextSunday.getMonth()) {
    return `${nextMonday.getDate()}-${nextSunday.getDate()} ${nextSunday.toLocaleDateString('en-US', { month: 'short' })} ${nextSunday.getFullYear()}`;
  } else {
    return `${mondayFormatted} - ${sundayFormatted}`;
  }
};

export function NextWeekSection({ viewMode = 'full' }: NextWeekSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [remainingCandidates, setRemainingCandidates] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVotesLoaded, setIsVotesLoaded] = useState(false);
  const [userInitialized, setUserInitialized] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      setUserInitialized(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setUserInitialized(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Filter candidates based on user's previous votes and next week participants
  useEffect(() => {
    const filterCandidates = async () => {
      // Don't start until user state is determined
      if (!userInitialized) return;
      
      setIsLoading(true);
      setIsVotesLoaded(false);
      
      try {
        // Get participants with "next week" or "next week on site" admin_status
        const { data: nextWeekParticipants, error } = await supabase
          .rpc('get_next_week_participants_public');

        if (error) {
          console.error('Error fetching next week participants:', error);
          setFilteredCandidates([]);
          setRemainingCandidates(0);
          setCurrentIndex(0);
          setIsVotesLoaded(true);
          setIsLoading(false);
          return;
        }

        console.log('Next week participants fetched:', nextWeekParticipants);

        // All returned participants have next week status already
        const actualNextWeekCandidates = nextWeekParticipants || [];

        // Convert database participants to candidate format
        const candidatesFromDB = actualNextWeekCandidates.map(participant => ({
          id: participant.participant_id,
          name: `${participant.first_name} ${participant.last_name}`,
          age: participant.age,
          country: participant.country,
          city: participant.city,
          location: `${participant.city}, ${participant.country}`,
          facePhoto: participant.photo_1_url,
          fullPhoto: participant.photo_2_url,
          faceImage: participant.photo_1_url,
          fullBodyImage: participant.photo_2_url,
          height: participant.height_cm,
          weight: participant.weight_kg
        }));

        console.log('Candidates from DB:', candidatesFromDB);

        if (!user) {
          // Show only first candidate for non-authenticated users
          const firstCandidate = candidatesFromDB.length > 0 ? [candidatesFromDB[0]] : [];
          console.log('Showing first candidate for non-auth user:', firstCandidate);
          setFilteredCandidates(firstCandidate);
          setRemainingCandidates(firstCandidate.length);
          setCurrentIndex(0);
          setIsVotesLoaded(true);
        } else {
          // Get user's votes first, then filter candidates
          const { data: votes } = await supabase
            .from('next_week_votes')
            .select('candidate_name')
            .eq('user_id', user.id);

          const votedNames = votes?.map(vote => vote.candidate_name) || [];
          console.log('User voted names:', votedNames);

          // Filter out voted candidates
          const unvotedCandidatesFromDB = candidatesFromDB.filter(candidate => 
            !votedNames.includes(candidate.name)
          );
          
          // Show only real candidates, no fallback to test candidates
          const finalCandidates = unvotedCandidatesFromDB;
          
          console.log('Final candidates for auth user:', finalCandidates);
          setFilteredCandidates(finalCandidates);
          setRemainingCandidates(finalCandidates.length);
          setCurrentIndex(0);
          setHistory([]);
          setIsVotesLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching participants and votes:', error);
        // Show empty list instead of fallback to test candidates
        setFilteredCandidates([]);
        setRemainingCandidates(0);
        setCurrentIndex(0);
        setIsVotesLoaded(true);
      }
      
      setIsLoading(false);
    };

    filterCandidates();
  }, [user, userInitialized]);

  const handleLike = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (currentIndex < filteredCandidates.length) {
      const currentCandidate = filteredCandidates[currentIndex];
      
      // Save vote to database
      try {
        await supabase
          .from('next_week_votes')
          .insert({
            user_id: user.id,
            candidate_name: currentCandidate.name,
            vote_type: 'like'
          });

        // Save like to likes table
        await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            content_type: 'next_week_candidate',
            content_id: JSON.stringify({
              name: currentCandidate.name,
              country: currentCandidate.country,
              city: currentCandidate.city,
              age: currentCandidate.age,
              weight: currentCandidate.weight,
              height: currentCandidate.height,
              faceImage: currentCandidate.faceImage,
              fullBodyImage: currentCandidate.fullBodyImage,
              additionalPhotos: currentCandidate.additionalPhotos
            })
          });
      } catch (error) {
        console.error('Error saving vote:', error);
      }
      
      setHistory(prev => [...prev, currentIndex]);
      setCurrentIndex(prev => prev + 1);
      setRemainingCandidates(prev => prev - 1);
    }
  };

  const handleDislike = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (currentIndex < filteredCandidates.length) {
      const currentCandidate = filteredCandidates[currentIndex];
      
      // Save vote to database
      try {
        await supabase
          .from('next_week_votes')
          .insert({
            user_id: user.id,
            candidate_name: currentCandidate.name,
            vote_type: 'dislike'
          });
      } catch (error) {
        console.error('Error saving vote:', error);
      }
      
      setHistory(prev => [...prev, currentIndex]);
      setCurrentIndex(prev => prev + 1);
      setRemainingCandidates(prev => prev - 1);
    }
  };

  const handleUndo = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (history.length > 0) {
      const previousIndex = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setCurrentIndex(previousIndex);
      setRemainingCandidates(prev => prev + 1);
    }
  };

  const currentCandidate = filteredCandidates[currentIndex];

  return (
    <section className="max-w-6xl mx-auto pt-6 pb-0 mb-2 mt-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-lg shadow-foreground/15 border border-blue-200 dark:border-blue-800">
      <div className="mb-6 px-6">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="inline-flex flex-col w-fit items-center">
              <h2 className="text-3xl font-bold text-blue-800 dark:text-blue-200 whitespace-nowrap">NEXT WEEK</h2>
              <p className="text-sm text-blue-600 dark:text-blue-400 italic -mt-1">{getNextWeekRange()}</p>
            </div>
            <span className="text-base font-normal text-blue-700 dark:text-blue-300 leading-tight">
              Choose next week's finalists
            </span>
          </div>
        </div>
      </div>

      {!userInitialized || isLoading || !isVotesLoaded ? (
        <div className="text-center py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mx-auto mb-2"></div>
            <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
          </div>
        </div>
      ) : filteredCandidates.length > 0 && currentIndex < filteredCandidates.length ? (
        <div className="flex flex-col items-center">
          <div className="w-full px-0 sm:px-6 max-w-full overflow-hidden">
            <ContestantCard
              {...currentCandidate}
              rank={0}
              viewMode={viewMode}
              showDislike={true}
              hideCardActions={true}
            />
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-6 pb-6">
            <div className="flex items-center gap-4">
              <span className="text-lg text-blue-800 dark:text-blue-200 font-medium">
                {remainingCandidates} left
              </span>
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
            </div>
            
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
              <ThumbsUp className="w-8 h-8 text-green-500" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-base text-blue-700 dark:text-blue-300">You've rated all cards in this block. New ones auto-update.</p>
        </div>
      )}

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-lg">
          <LoginModalContent onClose={() => setShowLoginModal(false)} />
        </DialogContent>
      </Dialog>
    </section>
  );
}