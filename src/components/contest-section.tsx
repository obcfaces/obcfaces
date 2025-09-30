import { useState, useEffect } from "react";
import { ContestantCard } from "@/components/contest-card";
import { supabase } from "@/integrations/supabase/client";

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
  filters?: React.ReactNode; // Add filters prop
  weekOffset?: number; // Add weekOffset prop
}

// Helper function to get week range dates (Monday-Sunday) - правильные для 2025
const getWeekRange = (weeksOffset: number = 0) => {
  // Правильные интервалы для 2025 года
  switch (weeksOffset) {
    case 0:
      return "29 Sep - 05 Oct 2025";
    case -1:
      return "22 Sep - 28 Sep 2025";
    case -2:
      return "15 Sep - 21 Sep 2025";
    case -3:
      return "08 Sep - 14 Sep 2025";
    case -4:
      return "01 Sep - 07 Sep 2025";
    case 1:
      return "06 Oct - 12 Oct 2025";
    case 2:
      return "13 Oct - 19 Oct 2025";
    default:
      return "29 Sep - 05 Oct 2025";
  }
};

export function ContestSection({ title, subtitle, description, isActive, showWinner, centerSubtitle, titleSuffix, noWrapTitle, viewMode: controlledViewMode, filters, weekOffset = 0 }: ContestSectionProps) {
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

  // Check admin status
  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  // Load admin participants for THIS WEEK section
  const loadAdminParticipants = async () => {
    try {
      console.log('Loading admin participants with query...');
      
      // Get only participants with admin_status = 'this week'
      const { data: participants, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('admin_status', 'this week')
        .eq('is_active', true)
        .limit(10);

      if (error) {
        console.error('Error loading admin participants:', error);
        return [];
      }

      console.log('Raw participants data:', participants?.length, participants);

      if (!participants || participants.length === 0) {
        return [];
      }

      // Get user IDs and fetch their profiles separately
      const userIds = participants.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        return [];
      }

      console.log('Profiles data:', profiles?.length, profiles);

      // Combine participants with their profiles
      const combined = participants.map(participant => {
        const profile = profiles?.find(p => p.id === participant.user_id);
        return {
          ...participant,
          profiles: profile
        };
      });

      console.log('Combined participants data:', combined?.length, combined);
      return combined || [];
    } catch (error) {
      console.error('Error loading admin participants:', error);
      return [];
    }
  };

  // Load admin participants for 1 WEEK AGO section (participants with admin_status = 'past' and specific week interval)
  const loadPastWeekAdminParticipants = async () => {
    try {
      console.log('Loading past week admin participants...');
      
      // Get participants with admin_status = 'past' and week interval '29/09-05/10/25'
      const { data: participants, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('admin_status', 'past')
        .eq('is_active', true)
        .like('week_interval', '%29/09-05/10/25%')
        .limit(10);

      if (error) {
        console.error('Error loading past week admin participants:', error);
        return [];
      }

      console.log('Raw past week participants data:', participants?.length, participants);

      if (!participants || participants.length === 0) {
        return [];
      }

      // Get user IDs and fetch their profiles separately
      const userIds = participants.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading profiles for past week:', profilesError);
        return [];
      }

      console.log('Past week profiles data:', profiles?.length, profiles);

      // Combine participants with their profiles
      const combined = participants.map(participant => {
        const profile = profiles?.find(p => p.id === participant.user_id);
        return {
          ...participant,
          profiles: profile
        };
      });

      console.log('Combined past week participants data:', combined?.length, combined);
      return combined || [];
    } catch (error) {
      console.error('Error loading past week admin participants:', error);
      return [];
    }
  };

  // Load admin participants for 2 WEEKS AGO section (participants with admin_status = 'past' and specific week interval)
  const loadTwoWeeksAgoAdminParticipants = async () => {
    try {
      console.log('Loading 2 weeks ago admin participants...');
      
      // Get participants with admin_status = 'past' and week interval '22/09-28/09/25'
      const { data: participants, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('admin_status', 'past')
        .eq('is_active', true)
        .like('week_interval', '%22/09-28/09/25%')
        .limit(10);

      if (error) {
        console.error('Error loading 2 weeks ago admin participants:', error);
        return [];
      }

      console.log('Raw 2 weeks ago participants data:', participants?.length, participants);

      if (!participants || participants.length === 0) {
        return [];
      }

      // Get user IDs and fetch their profiles separately
      const userIds = participants.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading profiles for 2 weeks ago:', profilesError);
        return [];
      }

      console.log('2 weeks ago profiles data:', profiles?.length, profiles);

      // Combine participants with their profiles
      const combined = participants.map(participant => {
        const profile = profiles?.find(p => p.id === participant.user_id);
        return {
          ...participant,
          profiles: profile
        };
      });

      console.log('Combined 2 weeks ago participants data:', combined?.length, combined);
      return combined || [];
    } catch (error) {
      console.error('Error loading 2 weeks ago admin participants:', error);
      return [];
    }
  };

  // Load admin participants for 3 WEEKS AGO section (participants with admin_status = 'past' and specific week interval)
  const loadThreeWeeksAgoAdminParticipants = async () => {
    try {
      console.log('Loading 3 weeks ago admin participants...');
      
      // Get participants with admin_status = 'past' and week interval '15/09-21/09/25'
      const { data: participants, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('admin_status', 'past')
        .eq('is_active', true)
        .like('week_interval', '%15/09-21/09/25%')
        .limit(10);

      if (error) {
        console.error('Error loading 3 weeks ago admin participants:', error);
        return [];
      }

      console.log('Raw 3 weeks ago participants data:', participants?.length, participants);

      if (!participants || participants.length === 0) {
        return [];
      }

      // Get user IDs and fetch their profiles separately
      const userIds = participants.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading profiles for 3 weeks ago:', profilesError);
        return [];
      }

      console.log('3 weeks ago profiles data:', profiles?.length, profiles);

      // Combine participants with their profiles
      const combined = participants.map(participant => {
        const profile = profiles?.find(p => p.id === participant.user_id);
        return {
          ...participant,
          profiles: profile
        };
      });

      console.log('Combined 3 weeks ago participants data:', combined?.length, combined);
      return combined || [];
    } catch (error) {
      console.error('Error loading 3 weeks ago admin participants:', error);
      return [];
    }
  };

  // Get user session once for the entire section and listen for changes
  useEffect(() => {
    console.log('ContestSection useEffect triggered for:', title);
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      console.log('ContestSection: Current user:', currentUser?.id);
      setUser(currentUser);
      
      // Check admin status and load admin participants if user is admin
      if (currentUser) {
        console.log('Checking admin status for user:', currentUser.id);
        const adminStatus = await checkAdminStatus(currentUser.id);
        console.log('Admin status result:', adminStatus);
        setIsAdmin(adminStatus);
        
        if (adminStatus) {
          if (title === "THIS WEEK") {
            console.log('Loading admin participants for THIS WEEK section');
            const adminData = await loadAdminParticipants();
            console.log('Loaded admin participants:', adminData.length);
            setAdminParticipants(adminData);
          } else if (title === "1 WEEK AGO") {
            console.log('Loading past week admin participants for 1 WEEK AGO section');
            const pastWeekData = await loadPastWeekAdminParticipants();
            console.log('Loaded past week participants:', pastWeekData.length);
            setAdminParticipants(pastWeekData);
          } else if (title === "2 WEEKS AGO") {
            console.log('Loading 2 weeks ago admin participants for 2 WEEKS AGO section');
            const twoWeeksAgoData = await loadTwoWeeksAgoAdminParticipants();
            console.log('Loaded 2 weeks ago participants:', twoWeeksAgoData.length);
            setAdminParticipants(twoWeeksAgoData);
          } else if (title === "3 WEEKS AGO") {
            console.log('Loading 3 weeks ago admin participants for 3 WEEKS AGO section');
            const threeWeeksAgoData = await loadThreeWeeksAgoAdminParticipants();
            console.log('Loaded 3 weeks ago participants:', threeWeeksAgoData.length);
            setAdminParticipants(threeWeeksAgoData);
          }
        }
      }
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
  }, [title]);


  // Load participants based on title
  useEffect(() => {
    console.log('ContestSection loadParticipants useEffect triggered for:', title);
    const loadParticipants = async () => {
      console.log('Starting loadParticipants for:', title);
      setIsLoading(true);
      
      // For THIS WEEK section, admin participants are already loaded in the first useEffect
      // Just load contestants based on existing data
      const contestantsData = await getContestantsSync([]);
      setContestants(contestantsData || []);
      setIsLoading(false);
    };

    loadParticipants();

    // Set up real-time subscription for contest participant updates
    if (["THIS WEEK", "NEXT WEEK", "1 WEEK AGO", "2 WEEKS AGO", "3 WEEKS AGO"].includes(title)) {
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
   }, [title, user, isAdmin, adminParticipants.length]);

  const handleRate = async (contestantId: number, rating: number) => {
    setVotes(prev => ({ ...prev, [contestantId]: rating }));
    // Let real-time subscription handle the refresh automatically
  };

  // Define contestants based on week type (synchronous version)
  const getContestantsSync = async (participantsData: any[] = realContestants) => {
    // Use the actual participants data passed to the function
    const actualParticipants = participantsData.length > 0 ? participantsData : realContestants;
    
    console.log(`getContestantsSync called for ${title}:`, { 
      participantsDataLength: participantsData.length, 
      realContestantsLength: realContestants.length,
      actualParticipantsLength: actualParticipants.length,
      isAdmin,
      adminParticipantsLength: adminParticipants.length,
      participantsData: participantsData.slice(0, 2) // Log first 2 for debugging
    });

    // For "THIS WEEK" section, show only admin participants if user is admin
    if (title === "THIS WEEK") {
      console.log('Processing THIS WEEK section');
      
      // If user is admin and has admin participants, show only those
      if (isAdmin && adminParticipants.length > 0) {
        console.log('Admin with admin participants:', adminParticipants.length);
        
        // Sort by average_rating (highest first), then by total_votes
        const sortedParticipants = [...adminParticipants].sort((a, b) => {
          const ratingA = Number(a.average_rating) || 0;
          const ratingB = Number(b.average_rating) || 0;
          if (ratingB !== ratingA) return ratingB - ratingA;
          
          const votesA = Number(a.total_votes) || 0;
          const votesB = Number(b.total_votes) || 0;
          return votesB - votesA;
        });
        
        const adminCards = sortedParticipants.map((participant, index) => ({
          rank: index + 1,
          name: `${participant.profiles?.first_name || ''} ${participant.profiles?.last_name || ''}`.trim(),
          profileId: participant.id,
          country: participant.profiles?.country || 'Unknown',
          city: participant.profiles?.city || 'Unknown',
          age: participant.profiles?.age || 0,
          weight: participant.profiles?.weight_kg || 0,
          height: participant.profiles?.height_cm || 0,
          rating: participant.average_rating || 0,
          averageRating: participant.average_rating || 0,
          totalVotes: participant.total_votes || 0,
          faceImage: participant.profiles?.photo_1_url || testContestantFace,
          fullBodyImage: participant.profiles?.photo_2_url || testContestantFull,
          additionalPhotos: [],
          isVoted: false,
          isWinner: false,
          prize: undefined,
          isRealContestant: true,
          isAdminCard: true // Special flag for admin cards
        }));
        
        console.log('Returning admin cards:', adminCards.length);
        return adminCards;
      } 
      
      // If there are real contestants, process them
      if (actualParticipants && actualParticipants.length > 0) {
        console.log(`Using real contestants for ${title}:`, actualParticipants.length);
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
              profileId: contestant.participant_id, // Use participant_id for rating queries
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

    // For "1 WEEK AGO" section, show admin participants with "past" status for specific week interval
    if (title === "1 WEEK AGO") {
      console.log('Processing 1 WEEK AGO section');
      
      // If user is admin and has admin participants, show only those
      if (isAdmin && adminParticipants.length > 0) {
        console.log('Admin with past week participants:', adminParticipants.length);
        
        // Sort by average_rating (highest first), then by total_votes
        const sortedParticipants = [...adminParticipants].sort((a, b) => {
          const ratingA = Number(a.average_rating) || 0;
          const ratingB = Number(b.average_rating) || 0;
          if (ratingB !== ratingA) return ratingB - ratingA;
          
          const votesA = Number(a.total_votes) || 0;
          const votesB = Number(b.total_votes) || 0;
          return votesB - votesA;
        });
        
        const pastWeekCards = sortedParticipants.map((participant, index) => ({
          rank: index + 1,
          name: `${participant.profiles?.first_name || ''} ${participant.profiles?.last_name || ''}`.trim(),
          profileId: participant.id,
          country: participant.profiles?.country || 'Unknown',
          city: participant.profiles?.city || 'Unknown',
          age: participant.profiles?.age || 0,
          weight: participant.profiles?.weight_kg || 0,
          height: participant.profiles?.height_cm || 0,
          rating: participant.average_rating || 0,
          averageRating: participant.average_rating || 0,
          totalVotes: participant.total_votes || 0,
          faceImage: participant.profiles?.photo_1_url || testContestantFace,
          fullBodyImage: participant.profiles?.photo_2_url || testContestantFull,
          additionalPhotos: [],
          isVoted: true, // Past week participants are considered as voted
          isWinner: showWinner && index === 0, // First participant is winner if showWinner is true
          prize: showWinner && index === 0 ? "+ 5000 PHP" : undefined,
          isRealContestant: true,
          isAdminCard: true // Special flag for admin cards
        }));
        
        console.log('Returning past week cards:', pastWeekCards.length);
        return pastWeekCards;
      } else {
        // No participants to show for non-admin users
        console.log('No participants found for 1 WEEK AGO (non-admin)');
        return [];
      }
    }

    // For "2 WEEKS AGO" section, show admin participants with "past" status for specific week interval
    if (title === "2 WEEKS AGO") {
      console.log('Processing 2 WEEKS AGO section');
      
      // If user is admin and has admin participants, show only those
      if (isAdmin && adminParticipants.length > 0) {
        console.log('Admin with 2 weeks ago participants:', adminParticipants.length);
        
        // Sort by average_rating (highest first), then by total_votes
        const sortedParticipants = [...adminParticipants].sort((a, b) => {
          const ratingA = Number(a.average_rating) || 0;
          const ratingB = Number(b.average_rating) || 0;
          if (ratingB !== ratingA) return ratingB - ratingA;
          
          const votesA = Number(a.total_votes) || 0;
          const votesB = Number(b.total_votes) || 0;
          return votesB - votesA;
        });
        
        const twoWeeksAgoCards = sortedParticipants.map((participant, index) => ({
          rank: index + 1,
          name: `${participant.profiles?.first_name || ''} ${participant.profiles?.last_name || ''}`.trim(),
          profileId: participant.id,
          country: participant.profiles?.country || 'Unknown',
          city: participant.profiles?.city || 'Unknown',
          age: participant.profiles?.age || 0,
          weight: participant.profiles?.weight_kg || 0,
          height: participant.profiles?.height_cm || 0,
          rating: participant.average_rating || 0,
          averageRating: participant.average_rating || 0,
          totalVotes: participant.total_votes || 0,
          faceImage: participant.profiles?.photo_1_url || testContestantFace,
          fullBodyImage: participant.profiles?.photo_2_url || testContestantFull,
          additionalPhotos: [],
          isVoted: true, // 2 weeks ago participants are considered as voted
          isWinner: showWinner && participant.final_rank === 1, // Show winner based on final_rank
          prize: showWinner && participant.final_rank === 1 ? "+ 5000 PHP" : undefined,
          isRealContestant: true,
          isAdminCard: true // Special flag for admin cards
        }));
        
        console.log('Returning 2 weeks ago cards:', twoWeeksAgoCards.length);
        return twoWeeksAgoCards;
      } else {
        // No participants to show for non-admin users
        console.log('No participants found for 2 WEEKS AGO (non-admin)');
        return [];
      }
    }

    // For "3 WEEKS AGO" section, show admin participants with "past" status for specific week interval
    if (title === "3 WEEKS AGO") {
      console.log('Processing 3 WEEKS AGO section');
      
      // If user is admin and has admin participants, show only those
      if (isAdmin && adminParticipants.length > 0) {
        console.log('Admin with 3 weeks ago participants:', adminParticipants.length);
        
        // Sort by average_rating (highest first), then by total_votes
        const sortedParticipants = [...adminParticipants].sort((a, b) => {
          const ratingA = Number(a.average_rating) || 0;
          const ratingB = Number(b.average_rating) || 0;
          if (ratingB !== ratingA) return ratingB - ratingA;
          
          const votesA = Number(a.total_votes) || 0;
          const votesB = Number(b.total_votes) || 0;
          return votesB - votesA;
        });
        
        const threeWeeksAgoCards = sortedParticipants.map((participant, index) => ({
          rank: index + 1,
          name: `${participant.profiles?.first_name || ''} ${participant.profiles?.last_name || ''}`.trim(),
          profileId: participant.id,
          country: participant.profiles?.country || 'Unknown',
          city: participant.profiles?.city || 'Unknown',
          age: participant.profiles?.age || 0,
          weight: participant.profiles?.weight_kg || 0,
          height: participant.profiles?.height_cm || 0,
          rating: participant.average_rating || 0,
          averageRating: participant.average_rating || 0,
          totalVotes: participant.total_votes || 0,
          faceImage: participant.profiles?.photo_1_url || testContestantFace,
          fullBodyImage: participant.profiles?.photo_2_url || testContestantFull,
          additionalPhotos: [],
          isVoted: true, // 3 weeks ago participants are considered as voted
          isWinner: showWinner && participant.final_rank === 1, // Show winner based on final_rank
          prize: showWinner && participant.final_rank === 1 ? "+ 5000 PHP" : undefined,
          isRealContestant: true,
          isAdminCard: true // Special flag for admin cards
        }));
        
        console.log('Returning 3 weeks ago cards:', threeWeeksAgoCards.length);
        return threeWeeksAgoCards;
      } else {
        // No participants to show for non-admin users
        console.log('No participants found for 3 WEEKS AGO (non-admin)');
        return [];
      }
    }
    
    // Use real contestants from weekly contests if available for other weeks and NEXT WEEK
    if (["NEXT WEEK", "1 WEEK AGO", "2 WEEKS AGO", "3 WEEKS AGO"].includes(title) && actualParticipants.length > 0) {
      console.log(`Using real contestants for ${title}:`, actualParticipants.length);
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
            profileId: contestant.participant_id, // Use participant_id for rating queries
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
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className={`inline-flex flex-col w-fit ${centerSubtitle ? "items-center" : "items-center"}`}>
              <h2 className={`text-3xl font-bold ${title === "THIS WEEK" ? "text-green-800 dark:text-green-200" : "text-contest-text"} ${noWrapTitle ? "whitespace-nowrap" : ""}`}>{title}</h2>
              <p className={`text-sm ${title === "THIS WEEK" ? "text-green-600 dark:text-green-400" : "text-muted-foreground/70"} italic -mt-1`}>{subtitle}</p>
            </div>
            {titleSuffix && (
              <span className="text-2xl font-normal text-muted-foreground">{titleSuffix}</span>
            )}
            {isActive && description && (
              <span className={`text-base font-normal ${title === "THIS WEEK" ? "text-green-700 dark:text-green-300" : "text-contest-text"} leading-tight`}>
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
