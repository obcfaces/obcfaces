import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import { ContestantCard } from "./ContestCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import LoginModalContent from "@/components/login-modal-content";
import { useTranslation } from "@/hooks/useTranslation";

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

// Helper function to get next week range dates (Monday-Sunday) - правильные для 2025
const getNextWeekRange = () => {
  return "06 Oct - 12 Oct 2025"; // Следующая неделя после текущей (29/09-05/10/25)
};

export function NextWeekSection({ viewMode = 'full' }: NextWeekSectionProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [remainingCandidates, setRemainingCandidates] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVotesLoaded, setIsVotesLoaded] = useState(false);
  const [userInitialized, setUserInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [preloadedIndexes, setPreloadedIndexes] = useState<Set<number>>(new Set());

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

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const hasAdminRole = userRoles?.some(role => role.role === 'admin');
        setIsAdmin(hasAdminRole || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Filter candidates based on user's previous votes and next week participants
  useEffect(() => {
    const filterCandidates = async () => {
      // Don't start until user state is determined
      if (!userInitialized) return;
      
      setIsLoading(true);
      setIsVotesLoaded(false);
      
      try {
        let nextWeekParticipants: any[] = [];
        let error = null;

        console.log('Loading next week participants...');
        console.log('User ID:', user?.id);

        // Загружаем участников со статусом next week и next week on site
        const { data: participants, error: fetchError } = await supabase
          .from('weekly_contest_participants')
          .select('*')
          .in('admin_status', ['next week', 'next week on site'])
          .eq('is_active', true)
          .is('deleted_at', null);

        let data = participants;

        // Fetch profiles separately to ensure we get the data
        if (participants && participants.length > 0) {
          const userIds = participants.map(p => p.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, photo_1_url, photo_2_url')
            .in('id', userIds);

          // Attach profiles to participants
          data = participants.map(participant => ({
            ...participant,
            profiles: profiles?.find(p => p.id === participant.user_id) || null
          }));
        }

        console.log('Query result:', { data, fetchError });
        nextWeekParticipants = data || [];
        error = fetchError;

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

        // Convert database participants to candidate format using application_data
        const candidatesFromDB = actualNextWeekCandidates.map(participant => {
          const appData = participant.application_data || {};
          const profileData = participant.profiles || {};
          
          // Use photos from application_data, fallback to profile photos, then test images (same as THIS WEEK)
          const photo1 = appData.photo1_url || profileData.photo_1_url || contestant1Face;
          const photo2 = appData.photo2_url || profileData.photo_2_url || contestant1Full;
          
          console.log('Next week participant FULL DATA:', {
            id: participant.id,
            name: `${appData.first_name} ${appData.last_name}`,
            full_appData: appData,
            full_profileData: profileData,
            photo1_from_app: appData.photo1_url,
            photo2_from_app: appData.photo2_url,
            photo1_from_profile: profileData?.photo_1_url,
            photo2_from_profile: profileData?.photo_2_url,
            photo1_final: photo1,
            photo2_final: photo2
          });
          
          return {
            id: participant.id,
            participant_id: participant.id,
            profileId: participant.id,
            name: `${appData.first_name || ''} ${appData.last_name || ''}`.trim(),
            age: appData.birth_year ? new Date().getFullYear() - parseInt(appData.birth_year) : null,
            country: appData.country === 'PH' ? 'Philippines' : appData.country,
            city: appData.city,
            location: `${appData.city || ''}, ${appData.country === 'PH' ? 'Philippines' : appData.country || ''}`,
            faceImage: photo1,
            fullBodyImage: photo2,
            height: appData.height_cm,
            weight: appData.weight_kg,
            status: participant.admin_status,
            isRealContestant: true
          };
        });

        console.log('Candidates from DB:', candidatesFromDB);

        if (!user) {
          // Show all candidates for non-authenticated users
          console.log('Showing all candidates for non-auth user:', candidatesFromDB);
          setFilteredCandidates(candidatesFromDB);
          setRemainingCandidates(candidatesFromDB.length);
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
          
          // Show only real candidates
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

  // Preload first 3 cards images when candidates load
  useEffect(() => {
    if (filteredCandidates.length > 0 && !imagesLoaded) {
      const loadInitialCards = async () => {
        // Preload current + next 2 cards
        const promises = [];
        for (let i = 0; i < Math.min(3, filteredCandidates.length); i++) {
          promises.push(preloadCard(i));
        }
        await Promise.all(promises);
        setImagesLoaded(true);
      };
      
      const timeout = setTimeout(() => {
        console.log('⚠️ Image preload timeout, showing card anyway');
        setImagesLoaded(true);
      }, 5000);
      
      loadInitialCards().finally(() => clearTimeout(timeout));
      
      return () => clearTimeout(timeout);
    }
  }, [filteredCandidates]);

  // Preload next cards in background whenever currentIndex changes
  useEffect(() => {
    if (filteredCandidates.length > 0 && imagesLoaded) {
      const preloadNextCards = async () => {
        // Preload next 3 cards
        for (let i = 1; i <= 3; i++) {
          const nextIdx = currentIndex + i;
          if (nextIdx < filteredCandidates.length && !preloadedIndexes.has(nextIdx)) {
            preloadCard(nextIdx);
          }
        }
      };
      preloadNextCards();
    }
  }, [currentIndex, filteredCandidates, imagesLoaded]);

  // Improved preload function with tracking
  const preloadCard = async (index: number) => {
    if (index >= filteredCandidates.length || preloadedIndexes.has(index)) return true;
    
    const candidate = filteredCandidates[index];
    if (!candidate) return true;

    const images = [candidate.faceImage, candidate.fullBodyImage].filter(Boolean);
    
    try {
      const imagePromises = images.map(src => {
        return Promise.race([
          new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = src;
          }),
          new Promise(resolve => setTimeout(resolve, 3000))
        ]);
      });

      await Promise.all(imagePromises);
      setPreloadedIndexes(prev => new Set(prev).add(index));
    } catch (error) {
      console.error('Error preloading images:', error);
    }
    
    return true;
  };

  const handleLike = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (currentIndex < filteredCandidates.length && !isTransitioning) {
      const currentCandidate = filteredCandidates[currentIndex];
      const nextIndex = currentIndex + 1;
      
      setIsTransitioning(true);
      
      try {
        // Save vote to database
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
      
      // Instant transition since images are preloaded
      setHistory(prev => [...prev, currentIndex]);
      setCurrentIndex(nextIndex);
      setRemainingCandidates(prev => prev - 1);
      
      // Quick transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleDislike = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (currentIndex < filteredCandidates.length && !isTransitioning) {
      const currentCandidate = filteredCandidates[currentIndex];
      const nextIndex = currentIndex + 1;
      
      setIsTransitioning(true);
      
      try {
        // Save vote to database
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
      
      // Instant transition since images are preloaded
      setHistory(prev => [...prev, currentIndex]);
      setCurrentIndex(nextIndex);
      setRemainingCandidates(prev => prev - 1);
      
      // Quick transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleUndo = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (history.length > 0 && !isTransitioning) {
      const previousIndex = history[history.length - 1];
      setIsTransitioning(true);
      
      setHistory(prev => prev.slice(0, -1));
      setCurrentIndex(previousIndex);
      setRemainingCandidates(prev => prev + 1);
      
      // Quick transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }
  };

  const currentCandidate = filteredCandidates[currentIndex];

  return (
    <section className="max-w-6xl mx-auto pt-6 pb-0 mb-2 mt-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-lg shadow-foreground/15 border border-blue-200 dark:border-blue-800">
      <div className="mb-6 px-6">
        <div className="mb-4 text-center">
          <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 italic mb-1">
            {getNextWeekRange()}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-800 dark:text-blue-200 mb-1">
            {t("NEXT WEEK")}
          </h2>
          <p className="text-sm sm:text-base font-normal text-blue-700 dark:text-blue-300">
            {t("Choose next week's finalists")}
          </p>
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
          <div className={`w-full px-0 sm:px-6 max-w-full overflow-hidden transition-opacity duration-200 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}>
            <ContestantCard
              {...currentCandidate}
              rank={0}
              viewMode={viewMode}
              showDislike={true}
              hideCardActions={true}
            />
          </div>
          
          {isTransitioning && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="animate-pulse text-muted-foreground text-sm">{t("Loading...")}</div>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-6 mt-6 pb-6">
            <div className="flex items-center gap-4">
              <span className="text-lg text-blue-800 dark:text-blue-200 font-medium">
                {remainingCandidates} {t("left")}
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
              disabled={isTransitioning}
              variant="outline"
              size="lg"
              className="rounded-full w-16 h-16 p-0 border-2 border-red-300 hover:border-red-500 hover:bg-red-50 disabled:opacity-50"
            >
              <ThumbsDown className="w-8 h-8 text-red-500" />
            </Button>
            
            <Button
              onClick={handleLike}
              disabled={isTransitioning}
              variant="outline"
              size="lg"
              className="rounded-full w-16 h-16 p-0 border-2 border-green-300 hover:border-green-500 hover:bg-green-50 disabled:opacity-50"
            >
              <ThumbsUp className="w-8 h-8 text-green-500" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-base text-blue-700 dark:text-blue-300">{t("You've rated all cards in this block. New ones will appear next week.")}</p>
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