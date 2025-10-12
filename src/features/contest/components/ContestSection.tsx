import { useState, useEffect } from "react";
import { ContestantCard } from "./ContestCard";
import { supabase } from "@/integrations/supabase/client";
import { useContestParticipants } from "../hooks/useContestParticipants";
import { useLanguage } from "@/contexts/LanguageContext";
import { getWeekRange } from "@/utils/dateFormatting";

import contestant1Face from "@/assets/contestant-1-face.jpg";
import contestant1Full from "@/assets/contestant-1-full.jpg";
import contestant2Face from "@/assets/contestant-2-face.jpg";
import contestant2Full from "@/assets/contestant-2-full.jpg";
import contestant3Face from "@/assets/contestant-3-face.jpg";
import contestant3Full from "@/assets/contestant-3-full.jpg";
import testContestantFace from "/lovable-uploads/0db6ac53-7148-4ae3-9622-f3af6675c364.png";
import testContestantFull from "/lovable-uploads/eecb29a9-eb9b-47c0-acad-9666f450ccc7.png";

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
  filters?: React.ReactNode;
  weekOffset?: number;
  weekInterval?: string; // Add weekInterval prop for dynamic past weeks
  countryCode?: string; // Add countryCode to filter participants by country
}

export function ContestSection({ title, subtitle, description, isActive, showWinner, centerSubtitle, titleSuffix, noWrapTitle, viewMode: controlledViewMode, filters, weekOffset = 0, weekInterval, countryCode = "PH" }: ContestSectionProps) {
  const [localViewMode] = useState<'compact' | 'full'>('compact');
  const viewMode = controlledViewMode ?? localViewMode;
  const [ratings, setRatings] = useState<Record<number, number>>({
    1: 4.8, 2: 4.5, 3: 4.2, 4: 3.9, 5: 3.5, 6: 3.1, 7: 3.7, 8: 3.4, 9: 3.2, 10: 3.0
  });

  const [votes, setVotes] = useState<Record<number, number>>({});
  const [realContestants, setRealContestants] = useState<any[]>([]);
  const [contestants, setContestants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminParticipants, setAdminParticipants] = useState<any[]>([]);
  
  // Use optimized hook for participant loading
  const { 
    fetchParticipantsByStatus, 
    loadUserRatingsForParticipants: loadUserRatings 
  } = useContestParticipants();

  // Check admin status
  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  // Load participants for NEXT WEEK section - FOR ALL USERS
  const loadNextWeekParticipants = async () => {
    console.log('Loading NEXT WEEK participants for all users...');
    return await fetchParticipantsByStatus(['next week', 'next week on site'], undefined, countryCode);
  };
  
  // Generic function to load past week participants by week_interval
  const loadPastWeekParticipantsByInterval = async (interval: string) => {
    console.log(`🔄 Loading participants for interval: ${interval}`);
    return await fetchParticipantsByStatus('past', interval, countryCode);
  };

  // Load participants for THIS WEEK section - FOR ALL USERS
  const loadThisWeekParticipants = async () => {
    console.log('🔄 Loading THIS WEEK participants for all users...');
    return await fetchParticipantsByStatus('this week', undefined, countryCode);
  };


  // Get user session once for the entire section and listen for changes
  useEffect(() => {
    console.log(`🚀 ContestSection useEffect triggered for: ${title}, weekInterval: ${weekInterval || 'none'}`);
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      console.log('ContestSection: Current user:', currentUser?.id);
      setUser(currentUser);
      
      // Check admin status if user is logged in
      if (currentUser) {
        console.log('Checking admin status for user:', currentUser.id);
        const adminStatus = await checkAdminStatus(currentUser.id);
        console.log('Admin status result:', adminStatus);
        setIsAdmin(adminStatus);
      }
      
      // Load participants for all users (authenticated and unauthenticated)
      let participantsData: any[] = [];
      
      if (title.includes("THIS WEEK") || weekOffset === 0) {
        console.log('Loading THIS WEEK participants');
        participantsData = await loadThisWeekParticipants();
        console.log('Loaded THIS WEEK participants:', participantsData.length);
      } else if (title.includes("NEXT WEEK")) {
        console.log('Loading NEXT WEEK participants');
        participantsData = await loadNextWeekParticipants();
        console.log('Loaded NEXT WEEK participants:', participantsData.length);
      } else if (weekInterval) {
        // For all past weeks, use the weekInterval prop
        console.log(`🔍 [${title}] Loading participants with weekInterval: "${weekInterval}"`);
        participantsData = await loadPastWeekParticipantsByInterval(weekInterval);
        console.log(`✅ [${title}] Loaded ${participantsData.length} participants for interval ${weekInterval}`);
        console.log(`📋 [${title}] Participants data:`, participantsData);
      } else {
        console.warn(`⚠️ No loading logic matched for section: ${title}, weekInterval: ${weekInterval}`);
      }
      
      // Load user ratings BEFORE setting participants
      let userRatingsMap: Record<string, number> = {};
      if (currentUser?.id && participantsData.length > 0) {
        console.log('Loading user ratings for authenticated user:', currentUser.id);
        userRatingsMap = await loadUserRatings(participantsData, currentUser.id);
      }
      
      // Store participants data with ratings info
      setRealContestants(participantsData);
      setAdminParticipants(participantsData);
    };
    
    getCurrentUser();
    
    // Listen for auth state changes (login/logout) but avoid setting same user object
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      setUser(prevUser => {
        // Only update if user actually changed to prevent unnecessary re-renders
        if (prevUser?.id !== newUser?.id) {
          return newUser;
        }
        return prevUser;
      });
    });
    
    return () => subscription.unsubscribe();
  }, [weekOffset, weekInterval, countryCode]); // Use weekOffset instead of title to avoid re-renders on language change


  // Load participants based on weekOffset and weekInterval
  useEffect(() => {
    console.log('ContestSection loadParticipants useEffect triggered for weekOffset:', weekOffset, 'weekInterval:', weekInterval);
    const loadParticipants = async () => {
      console.log('Starting loadParticipants for weekOffset:', weekOffset, 'with weekInterval:', weekInterval);
      setIsLoading(true);
      
      // Reload participants data when weekInterval changes
      let participantsData: any[] = realContestants;
      
      console.log(`📊 Checking condition for weekOffset ${weekOffset}:`, {
        hasWeekInterval: !!weekInterval,
        weekInterval,
        isPastWeek: weekOffset < 0
      });
      
      if (weekOffset < 0 && weekInterval) {
        console.log(`✅ Reloading participants for past week (offset ${weekOffset}) with interval ${weekInterval}`);
        participantsData = await loadPastWeekParticipantsByInterval(weekInterval);
        console.log(`✅ Reloaded past week participants:`, participantsData.length);
        setRealContestants(participantsData);
        setAdminParticipants(participantsData);
      } else {
        console.log(`⚠️ Condition NOT met for weekOffset ${weekOffset} - using existing realContestants`);
      }
      
      // Load user ratings if user is authenticated
      let userRatingsMap: Record<string, number> = {};
      if (user?.id && participantsData.length > 0) {
        console.log('Loading user ratings for authenticated user:', user.id);
        userRatingsMap = await loadUserRatings(participantsData, user.id);
      }
      
      // Use the newly loaded participants data
      const contestantsData = await getContestantsSync(participantsData, userRatingsMap);
      setContestants(contestantsData || []);
      setIsLoading(false);
    };

    loadParticipants();

    // Set up real-time subscription for all contest sections
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
   }, [weekOffset, weekInterval, user, isAdmin, adminParticipants.length, realContestants.length]);

  const handleRate = async (contestantId: number, rating: number) => {
    setVotes(prev => ({ ...prev, [contestantId]: rating }));
    // Let real-time subscription handle the refresh automatically
  };

  // Define contestants based on week type (synchronous version)
  const getContestantsSync = async (participantsData: any[] = realContestants, providedUserRatingsMap: Record<string, number> = {}) => {
    // Use the actual participants data passed to the function
    const actualParticipants = participantsData.length > 0 ? participantsData : realContestants;
    const userRatingsMap = providedUserRatingsMap; // Use provided ratings map
    
    console.log(`getContestantsSync called for ${title}:`, { 
      participantsDataLength: participantsData.length, 
      realContestantsLength: realContestants.length,
      actualParticipantsLength: actualParticipants.length,
      isAdmin,
      adminParticipantsLength: adminParticipants.length,
      participantsData: participantsData.slice(0, 2), // Log first 2 for debugging
      userRatingsMapSize: Object.keys(userRatingsMap).length
    });

    // For "THIS WEEK" section (weekOffset === 0), show participants for all users
    if (weekOffset === 0) {
      console.log('Processing THIS WEEK section (weekOffset === 0)');
      
      // Process participants for all users (admin and non-admin)
      if (actualParticipants && actualParticipants.length > 0) {
        console.log('Processing THIS WEEK participants for all users:', actualParticipants.length);
        const contestantsWithRatings = await Promise.all(
          actualParticipants.map(async (contestant) => {
            // Validate contestant data structure
            if (!contestant || typeof contestant !== 'object') {
              console.warn('Invalid contestant data:', contestant);
              return null;
            }
            
            // Extract data from application_data
            const appData = contestant.application_data || {};
            const profileData = contestant.profiles || {};
            
            // Get rating stats using secure function
            const { data: ratingStats } = await supabase
              .rpc('get_public_participant_rating_stats', { target_participant_id: contestant.id });
            
            let averageRating = 0;
            let totalVotes = 0;
            
            if (ratingStats && ratingStats.length > 0) {
              averageRating = ratingStats[0].average_rating;
              totalVotes = ratingStats[0].total_votes;
            }
            
            // Log data for debugging
            console.log('Contestant data for THIS WEEK:', {
              name: `${appData.first_name || 'Unknown'} ${appData.last_name || ''}`.trim(),
              photo1_url: appData.photo1_url,
              photo2_url: appData.photo2_url,
              profile_photo_1_url: profileData.photo_1_url,
              profile_photo_2_url: profileData.photo_2_url,
              appData: appData,
              profileData: profileData
            });
            
            const contestantData = {
              rank: contestant.final_rank || 0,
              name: `${appData.first_name || 'Unknown'} ${appData.last_name || ''}`.trim(),
              profileId: contestant.id,
              country: profileData.country || (appData.country === 'PH' ? 'Philippines' : (appData.country || 'Unknown')),
              city: profileData.city || appData.city || 'Unknown',
              age: profileData.age || (appData.birth_year ? new Date().getFullYear() - parseInt(appData.birth_year) : 0),
              weight: profileData.weight_kg || appData.weight_kg || 0,
              height: profileData.height_cm || appData.height_cm || 0,
              rating: averageRating,
              averageRating: averageRating,
              totalVotes: totalVotes,
              faceImage: profileData.photo_1_url || appData.photo1_url || testContestantFace,
              fullBodyImage: profileData.photo_2_url || appData.photo2_url || testContestantFull,
              additionalPhotos: [],
              // Check if user has voted using pre-loaded ratings map
              isVoted: contestant.id && userRatingsMap[contestant.id] ? true : false,
              isWinner: false, // Will be set after sorting
              prize: undefined, // Will be set after sorting
              isRealContestant: true
            };
            
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

        // Assign ranks based on rating order
        const realContestantsWithRanks = sortedContestants.map((contestant, index) => {
          const newRank = contestant.rating > 0 ? index + 1 : 0;
          return {
            ...contestant,
            rank: newRank,
            isWinner: showWinner && newRank === 1,
            prize: showWinner && newRank === 1 ? "+ 5000 PHP" : undefined
          };
        });
        
        return realContestantsWithRanks;
      } else {
        // No participants to show
        console.log('No participants found for THIS WEEK');
        return [];
      }
    }

    // For past week sections (weekOffset < 0), show participants for all users
    if (weekOffset === -1) {
      console.log('Processing 1 WEEK AGO section (weekOffset === -1) for all users');
      
      // If there are participants, process them
      if (actualParticipants && actualParticipants.length > 0) {
        console.log('Processing 1 WEEK AGO participants:', actualParticipants.length);
        
        const contestantsWithRatings = await Promise.all(
          actualParticipants.map(async (contestant) => {
            if (!contestant || typeof contestant !== 'object') {
              console.warn('Invalid contestant data:', contestant);
              return null;
            }
            
            const appData = contestant.application_data || {};
            const profileData = contestant.profiles || {};
            
            const { data: ratingStats } = await supabase
              .rpc('get_public_participant_rating_stats', { target_participant_id: contestant.id });
            
            let averageRating = 0;
            let totalVotes = 0;
            
            if (ratingStats && ratingStats.length > 0) {
              averageRating = ratingStats[0].average_rating;
              totalVotes = ratingStats[0].total_votes;
            }
            
            return {
              rank: contestant.final_rank || 0,
              name: `${appData.first_name || 'Unknown'} ${appData.last_name || ''}`.trim(),
              profileId: contestant.id,
              country: profileData.country || (appData.country === 'PH' ? 'Philippines' : (appData.country || 'Unknown')),
              city: profileData.city || appData.city || 'Unknown',
              age: profileData.age || (appData.birth_year ? new Date().getFullYear() - parseInt(appData.birth_year) : 0),
              weight: profileData.weight_kg || appData.weight_kg || 0,
              height: profileData.height_cm || appData.height_cm || 0,
              rating: averageRating,
              averageRating: averageRating,
              totalVotes: totalVotes,
              faceImage: profileData.photo_1_url || appData.photo1_url || contestant1Face,
              fullBodyImage: profileData.photo_2_url || appData.photo2_url || contestant1Full,
              additionalPhotos: [],
              isVoted: true, // Past week participants are considered as voted
              isWinner: showWinner && contestant.final_rank === 1,
              prize: showWinner && contestant.final_rank === 1 ? "+ 5000 PHP" : undefined,
              isRealContestant: true
            };
          })
        );
        
        const sortedContestants = contestantsWithRatings.filter(Boolean).sort((a, b) => {
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          return (b.totalVotes || 0) - (a.totalVotes || 0);
        });
        
        console.log('Returning 1 WEEK AGO cards:', sortedContestants.length);
        return sortedContestants;
      } else {
        console.log('No participants found for 1 WEEK AGO');
        return [];
      }
    }

    // For any past week sections (weekOffset < 0), show participants for all users
    if (weekOffset < 0 && weekOffset !== -1) {
      console.log(`Processing past week section (weekOffset ${weekOffset}) for all users`);
      
      // If there are participants, process them
      if (actualParticipants && actualParticipants.length > 0) {
        console.log(`Processing ${title} participants:`, actualParticipants.length);
        
        const contestantsWithRatings = await Promise.all(
          actualParticipants.map(async (contestant) => {
            if (!contestant || typeof contestant !== 'object') {
              console.warn('Invalid contestant data:', contestant);
              return null;
            }
            
            const appData = contestant.application_data || {};
            const profileData = contestant.profiles || {};
            
            const { data: ratingStats } = await supabase
              .rpc('get_public_participant_rating_stats', { target_participant_id: contestant.id });
            
            let averageRating = 0;
            let totalVotes = 0;
            
            if (ratingStats && ratingStats.length > 0) {
              averageRating = ratingStats[0].average_rating;
              totalVotes = ratingStats[0].total_votes;
            }
            
            return {
              rank: contestant.final_rank || 0,
              name: `${appData.first_name || 'Unknown'} ${appData.last_name || ''}`.trim(),
              profileId: contestant.id,
              country: profileData.country || (appData.country === 'PH' ? 'Philippines' : (appData.country || 'Unknown')),
              city: profileData.city || appData.city || 'Unknown',
              age: profileData.age || (appData.birth_year ? new Date().getFullYear() - parseInt(appData.birth_year) : 0),
              weight: profileData.weight_kg || appData.weight_kg || 0,
              height: profileData.height_cm || appData.height_cm || 0,
              rating: averageRating,
              averageRating: averageRating,
              totalVotes: totalVotes,
              faceImage: profileData.photo_1_url || appData.photo1_url || contestant1Face,
              fullBodyImage: profileData.photo_2_url || appData.photo2_url || contestant1Full,
              additionalPhotos: [],
              isVoted: true,
              isWinner: showWinner && contestant.final_rank === 1,
              prize: showWinner && contestant.final_rank === 1 ? "+ 5000 PHP" : undefined,
              isRealContestant: true
            };
          })
        );
        
        const sortedContestants = contestantsWithRatings.filter(Boolean).sort((a, b) => {
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          return (b.totalVotes || 0) - (a.totalVotes || 0);
        });
        
        console.log(`Returning ${title} cards:`, sortedContestants.length);
        return sortedContestants;
      } else {
        console.log(`No participants found for ${title}`);
        return [];
      }
    }
    
    // Use real contestants from weekly contests if available for NEXT WEEK and any past weeks
    if ((title.includes("NEXT WEEK") || weekOffset < 0) && actualParticipants.length > 0) {
      console.log(`Using real contestants for weekOffset ${weekOffset}:`, actualParticipants.length);
      const contestantsWithRatings = await Promise.all(
        actualParticipants.map(async (contestant) => {
          // Validate contestant data structure
          if (!contestant || typeof contestant !== 'object') {
            console.warn('Invalid contestant data:', contestant);
            return null;
          }
          
          // Get rating stats using secure function
          const { data: ratingStats } = await supabase
            .rpc('get_public_participant_rating_stats', { target_participant_id: contestant.participant_id });
          
          let averageRating = 0;
          let totalVotes = 0;
          
          if (ratingStats && ratingStats.length > 0) {
            averageRating = ratingStats[0].average_rating;
            totalVotes = ratingStats[0].total_votes;
          }
          
          const contestantData = {
            rank: contestant.final_rank || 0,
            name: `${contestant.first_name || 'Unknown'} ${contestant.last_name || ''}`.trim(),
            profileId: contestant.participant_id,
            country: contestant.country || 'Unknown',
            city: contestant.city || 'Unknown',
            age: contestant.age || 0,
            weight: contestant.weight_kg || 0,
            height: contestant.height_cm || 0,
            rating: averageRating,
            averageRating: averageRating, // Use secure rating from function
            totalVotes: totalVotes, // Use secure vote count from function
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
    
    // Return empty array if no real contestants found for other weeks
    console.log(`No real contestants found for ${title}, returning empty array`);
    return [];
  };

  // Keep this for backward compatibility but it's now mainly unused
  const getContestants = () => getContestantsSync();

  return (
    <section className={`max-w-6xl mx-auto mb-2 rounded-lg shadow-lg shadow-foreground/15 ${title === "THIS WEEK" ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-background"} pt-6 pb-0`}>
      <div className="mb-6 px-6">
        <div className="mb-4 text-center">
          <p className={`text-xs sm:text-sm ${title?.includes("THIS WEEK") ? "text-green-600 dark:text-green-400" : "text-muted-foreground/70"} italic mb-1`}>
            {subtitle}
          </p>
          <h2 className={`text-2xl sm:text-3xl font-bold ${title?.includes("THIS WEEK") ? "text-green-800 dark:text-green-200" : "text-contest-text"} mb-1`}>
            {title}
          </h2>
          {description && (
            <p className={`text-sm sm:text-base font-normal ${title?.includes("THIS WEEK") ? "text-green-700 dark:text-green-300" : "text-muted-foreground"}`}>
              {description}
            </p>
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
        <div className="px-0 sm:px-6">
          {/* Regular contestants only */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 sm:gap-3 max-w-full overflow-hidden">
            {contestants.map((contestant, index) => (
              <ContestantCard
                key={`${contestant.profileId || contestant.name}-${index}`}
                {...contestant}
                viewMode={viewMode}
                onRate={(rating) => handleRate(contestant.rank, rating)}
                isThisWeek={title === "THIS WEEK"}
                user={user}
                weekOffset={weekOffset}
              />
             ))}
           </div>
           
           {/* Add spacing after cards for THIS WEEK section */}
           {title === "THIS WEEK" && (
             <div className="mt-1 sm:mt-3"></div>
           )}
        </div>
      )}

    </section>
  );
}
