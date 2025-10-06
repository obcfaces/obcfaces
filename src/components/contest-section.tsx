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
  filters?: React.ReactNode;
  weekOffset?: number;
  weekInterval?: string; // Add weekInterval prop for dynamic past weeks
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

export function ContestSection({ title, subtitle, description, isActive, showWinner, centerSubtitle, titleSuffix, noWrapTitle, viewMode: controlledViewMode, filters, weekOffset = 0, weekInterval }: ContestSectionProps) {
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

  // Load participants for NEXT WEEK section - FOR ALL USERS
  const loadNextWeekParticipants = async () => {
    try {
      console.log('Loading NEXT WEEK participants for all users...');
      
      // Get participants with admin_status = 'next week' or 'next week on site' for current week
      const { data: participants, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .in('admin_status', ['next week', 'next week on site'])
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading NEXT WEEK participants:', error);
        return [];
      }

      console.log('Raw NEXT WEEK participants data:', participants?.length);

      if (!participants || participants.length === 0) {
        return [];
      }

      // Fetch profiles using secure RPC function (works for ALL users - authenticated and unauthenticated)
      const userIds = participants.map(p => p.user_id);
      const { data: profilesData } = await (supabase.rpc as any)('get_public_contest_participant_photos', { participant_user_ids: userIds });
      
      const profiles = (profilesData || []) as Array<{ 
        id: string; 
        photo_1_url: string | null; 
        photo_2_url: string | null; 
        avatar_url: string | null;
        age: number | null;
        city: string | null;
        country: string | null;
        height_cm: number | null;
        weight_kg: number | null;
      }>;

      // Attach profiles to participants
      const participantsWithProfiles = participants.map(participant => ({
        ...participant,
        profiles: profiles?.find(p => p.id === participant.user_id) || null
      }));

      return participantsWithProfiles || [];
    } catch (error) {
      console.error('Error loading NEXT WEEK participants:', error);
      return [];
    }
  };
  
  // Generic function to load past week participants by week_interval
  const loadPastWeekParticipantsByInterval = async (interval: string) => {
    try {
      console.log(`🔄 Loading participants for interval: ${interval}`);
      
      const { data: participants, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('admin_status', 'past')
        .eq('is_active', true)
        .is('deleted_at', null)
        .eq('week_interval', interval);

      if (error) {
        console.error(`❌ Error loading participants for ${interval}:`, error);
        return [];
      }

      console.log(`✅ Found ${participants?.length} participants for ${interval}`);

      if (!participants || participants.length === 0) {
        return [];
      }

      const userIds = participants.map(p => p.user_id);
      const { data: profilesData } = await (supabase.rpc as any)('get_public_contest_participant_photos', { participant_user_ids: userIds });
      
      const profiles = (profilesData || []) as Array<{ 
        id: string; 
        photo_1_url: string | null; 
        photo_2_url: string | null; 
        avatar_url: string | null;
        age: number | null;
        city: string | null;
        country: string | null;
        height_cm: number | null;
        weight_kg: number | null;
      }>;

      const participantsWithProfiles = participants.map(participant => ({
        ...participant,
        profiles: profiles?.find(p => p.id === participant.user_id) || null
      }));

      return participantsWithProfiles || [];
    } catch (error) {
      console.error(`Error loading participants for ${interval}:`, error);
      return [];
    }
  };

  // Load participants for THIS WEEK section - FOR ALL USERS
  const loadThisWeekParticipants = async () => {
    try {
      console.log('🔄 Loading THIS WEEK participants for all users...');
      
      // Get participants with admin_status = 'this week' for current week - NO LIMIT!
      const { data: participants, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('admin_status', 'this week')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading THIS WEEK participants:', error);
        return [];
      }

      console.log(`✅ Raw THIS WEEK participants data: ${participants?.length} participants loaded`);
      console.log('📋 Participants list:', participants?.map(p => {
        const appData = (p.application_data as any) || {};
        return {
          name: `${appData.first_name || ''} ${appData.last_name || ''}`.trim(),
          id: p.id
        };
      }));

      if (!participants || participants.length === 0) {
        console.warn('⚠️ No THIS WEEK participants found');
        return [];
      }

      // Fetch profiles using secure RPC function (works for ALL users - authenticated and unauthenticated)
      const userIds = participants.map(p => p.user_id);
      const { data: profilesData } = await (supabase.rpc as any)('get_public_contest_participant_photos', { participant_user_ids: userIds });
      
      const profiles = (profilesData || []) as Array<{ 
        id: string; 
        photo_1_url: string | null; 
        photo_2_url: string | null; 
        avatar_url: string | null;
        age: number | null;
        city: string | null;
        country: string | null;
        height_cm: number | null;
        weight_kg: number | null;
      }>;

      // Attach profiles to participants
      const participantsWithProfiles = participants.map(participant => ({
        ...participant,
        profiles: profiles?.find(p => p.id === participant.user_id) || null
      }));

      return participantsWithProfiles || [];
    } catch (error) {
      console.error('Error loading THIS WEEK participants:', error);
      return [];
    }
  };

  // Load participants for 1 WEEK AGO section - FOR ALL USERS
  const loadPastWeekParticipants = async () => {
    try {
      console.log('🔄 Loading 1 WEEK AGO participants for PUBLIC...');
      
      // Get participants with admin_status = 'past' and week interval matching 1 WEEK AGO (06/10-12/10/25)
      const { data: participants, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('admin_status', 'past')
        .eq('is_active', true)
        .is('deleted_at', null)
        .eq('week_interval', '06/10-12/10/25');

      if (error) {
        console.error('❌ Error loading 1 WEEK AGO participants:', error);
        return [];
      }

      console.log('✅ Raw 1 WEEK AGO participants found:', participants?.length);
      if (participants && participants.length > 0) {
        console.log('📋 1 WEEK AGO participants:', participants.map(p => {
          const appData = (p.application_data as any) || {};
          return {
            name: `${appData.first_name || ''} ${appData.last_name || ''}`.trim(),
            week_interval: p.week_interval
          };
        }));
      }

      if (!participants || participants.length === 0) {
        return [];
      }

      // Fetch profiles using secure RPC function (works for ALL users - authenticated and unauthenticated)
      const userIds = participants.map(p => p.user_id);
      const { data: profilesData } = await (supabase.rpc as any)('get_public_contest_participant_photos', { participant_user_ids: userIds });
      
      const profiles = (profilesData || []) as Array<{ 
        id: string; 
        photo_1_url: string | null; 
        photo_2_url: string | null; 
        avatar_url: string | null;
        age: number | null;
        city: string | null;
        country: string | null;
        height_cm: number | null;
        weight_kg: number | null;
      }>;

      // Attach profiles to participants
      const participantsWithProfiles = participants.map(participant => ({
        ...participant,
        profiles: profiles?.find(p => p.id === participant.user_id) || null
      }));

      return participantsWithProfiles || [];
    } catch (error) {
      console.error('Error loading 1 WEEK AGO participants:', error);
      return [];
    }
  };

  // Load admin participants for 2 WEEKS AGO section (participants with admin_status = 'past' and specific week interval)
  const loadTwoWeeksAgoAdminParticipants = async () => {
    try {
      console.log('🔄 Loading 2 WEEKS AGO participants for PUBLIC...');
      
      // Get participants with admin_status = 'past' and week interval '29/09-05/10/25'
      const { data: participants, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('admin_status', 'past')
        .eq('is_active', true)
        .is('deleted_at', null)
        .eq('week_interval', '29/09-05/10/25');

      if (error) {
        console.error('❌ Error loading 2 WEEKS AGO participants:', error);
        return [];
      }

      console.log('✅ Raw 2 WEEKS AGO participants found:', participants?.length);
      if (participants && participants.length > 0) {
        console.log('📋 2 WEEKS AGO participants:', participants.map(p => {
          const appData = (p.application_data as any) || {};
          return {
            name: `${appData.first_name || ''} ${appData.last_name || ''}`.trim(),
            week_interval: p.week_interval
          };
        }));
      }

      if (!participants || participants.length === 0) {
        return [];
      }

      // Get user IDs and fetch their profiles using secure RPC function
      const userIds = participants.map(p => p.user_id);
      const { data: profilesData, error: profilesError } = await (supabase.rpc as any)('get_public_contest_participant_photos', { participant_user_ids: userIds });
      
      const profiles = (profilesData || []) as Array<{ 
        id: string; 
        photo_1_url: string | null; 
        photo_2_url: string | null; 
        avatar_url: string | null;
        age: number | null;
        city: string | null;
        country: string | null;
        height_cm: number | null;
        weight_kg: number | null;
      }>;

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

  // Load user ratings for all participants BEFORE rendering
  const loadUserRatingsForParticipants = async (participants: any[], userId: string) => {
    if (!userId || !participants || participants.length === 0) {
      return {};
    }
    
    console.log('Loading user ratings for', participants.length, 'participants');
    
    const participantIds = participants
      .map(p => p.id)
      .filter(id => id && id !== '00000000-0000-0000-0000-000000000000');
    
    if (participantIds.length === 0) {
      return {};
    }
    
    try {
      // Load all ratings for this user in one query
      const { data: ratings, error } = await supabase
        .from('contestant_ratings')
        .select('participant_id, rating')
        .eq('user_id', userId)
        .in('participant_id', participantIds);
      
      if (error) {
        console.error('Error loading user ratings:', error);
        return {};
      }
      
      // Convert to map for quick lookup
      const ratingsMap: Record<string, number> = {};
      ratings?.forEach(r => {
        if (r.participant_id) {
          ratingsMap[r.participant_id] = r.rating;
        }
      });
      
      console.log('Loaded user ratings map:', ratingsMap);
      return ratingsMap;
    } catch (error) {
      console.error('Error loading user ratings:', error);
      return {};
    }
  };

  // Load admin participants for 3 WEEKS AGO section (participants with admin_status = 'past' and specific week interval)
  const loadThreeWeeksAgoAdminParticipants = async () => {
    try {
      console.log('🔄 Loading 3 WEEKS AGO participants for PUBLIC...');
      
      // Get participants with admin_status = 'past' and week interval '22/09-28/09/25'
      const { data: participants, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('admin_status', 'past')
        .eq('is_active', true)
        .is('deleted_at', null)
        .eq('week_interval', '22/09-28/09/25');

      if (error) {
        console.error('❌ Error loading 3 WEEKS AGO participants:', error);
        return [];
      }

      console.log('✅ Raw 3 WEEKS AGO participants found:', participants?.length);
      if (participants && participants.length > 0) {
        console.log('📋 3 WEEKS AGO participants:', participants.map(p => {
          const appData = (p.application_data as any) || {};
          return {
            name: `${appData.first_name || ''} ${appData.last_name || ''}`.trim(),
            week_interval: p.week_interval
          };
        }));
      }

      if (!participants || participants.length === 0) {
        return [];
      }

      // Get user IDs and fetch their profiles using secure RPC function
      const userIds = participants.map(p => p.user_id);
      const { data: profilesData, error: profilesError } = await (supabase.rpc as any)('get_public_contest_participant_photos', { participant_user_ids: userIds });
      
      const profiles = (profilesData || []) as Array<{ 
        id: string; 
        photo_1_url: string | null; 
        photo_2_url: string | null; 
        avatar_url: string | null;
        age: number | null;
        city: string | null;
        country: string | null;
        height_cm: number | null;
        weight_kg: number | null;
      }>;

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

  // Load admin participants for 4 WEEKS AGO section (participants with admin_status = 'past' and specific week interval)
  const loadFourWeeksAgoAdminParticipants = async () => {
    try {
      console.log('🔄 Loading 4 WEEKS AGO participants for PUBLIC...');
      
      // Get participants with admin_status = 'past' and week interval '15/09-21/09/25'
      const { data: participants, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('admin_status', 'past')
        .eq('is_active', true)
        .is('deleted_at', null)
        .eq('week_interval', '15/09-21/09/25');

      if (error) {
        console.error('❌ Error loading 4 WEEKS AGO participants:', error);
        return [];
      }

      console.log('✅ Raw 4 WEEKS AGO participants found:', participants?.length);
      if (participants && participants.length > 0) {
        console.log('📋 4 WEEKS AGO participants:', participants.map(p => {
          const appData = (p.application_data as any) || {};
          return {
            name: `${appData.first_name || ''} ${appData.last_name || ''}`.trim(),
            week_interval: p.week_interval
          };
        }));
      }

      if (!participants || participants.length === 0) {
        return [];
      }

      // Get user IDs and fetch their profiles using secure RPC function
      const userIds = participants.map(p => p.user_id);
      const { data: profilesData, error: profilesError } = await (supabase.rpc as any)('get_public_contest_participant_photos', { participant_user_ids: userIds });
      
      const profiles = (profilesData || []) as Array<{ 
        id: string; 
        photo_1_url: string | null; 
        photo_2_url: string | null; 
        avatar_url: string | null;
        age: number | null;
        city: string | null;
        country: string | null;
        height_cm: number | null;
        weight_kg: number | null;
      }>;

      if (profilesError) {
        console.error('Error loading profiles for 4 weeks ago:', profilesError);
        return [];
      }

      console.log('4 weeks ago profiles data:', profiles?.length, profiles);

      // Combine participants with their profiles
      const combined = participants.map(participant => {
        const profile = profiles?.find(p => p.id === participant.user_id);
        return {
          ...participant,
          profiles: profile
        };
      });

      console.log('Combined 4 weeks ago participants data:', combined?.length, combined);
      return combined || [];
    } catch (error) {
      console.error('Error loading 4 weeks ago admin participants:', error);
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
      
      // Check admin status if user is logged in
      if (currentUser) {
        console.log('Checking admin status for user:', currentUser.id);
        const adminStatus = await checkAdminStatus(currentUser.id);
        console.log('Admin status result:', adminStatus);
        setIsAdmin(adminStatus);
      }
      
      // Load participants for all users (authenticated and unauthenticated)
      let participantsData: any[] = [];
      
      if (title === "THIS WEEK") {
        console.log('Loading THIS WEEK participants');
        participantsData = await loadThisWeekParticipants();
        console.log('Loaded THIS WEEK participants:', participantsData.length);
      } else if (title === "NEXT WEEK") {
        console.log('Loading NEXT WEEK participants');
        participantsData = await loadNextWeekParticipants();
        console.log('Loaded NEXT WEEK participants:', participantsData.length);
      } else if (title.includes("WEEK") && title.includes("AGO") && weekInterval) {
        // For all past weeks, use the weekInterval prop
        console.log(`Loading participants for ${title} with interval ${weekInterval}`);
        participantsData = await loadPastWeekParticipantsByInterval(weekInterval);
        console.log(`Loaded ${title} participants:`, participantsData.length);
      }
      
      // Load user ratings BEFORE setting participants
      let userRatingsMap: Record<string, number> = {};
      if (currentUser?.id && participantsData.length > 0) {
        console.log('Loading user ratings for authenticated user:', currentUser.id);
        userRatingsMap = await loadUserRatingsForParticipants(participantsData, currentUser.id);
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
  }, [title]);


  // Load participants based on title
  useEffect(() => {
    console.log('ContestSection loadParticipants useEffect triggered for:', title);
    const loadParticipants = async () => {
      console.log('Starting loadParticipants for:', title);
      setIsLoading(true);
      
      // Load user ratings if user is authenticated
      let userRatingsMap: Record<string, number> = {};
      if (user?.id && realContestants.length > 0) {
        console.log('Loading user ratings for authenticated user:', user.id);
        userRatingsMap = await loadUserRatingsForParticipants(realContestants, user.id);
      }
      
      // For THIS WEEK section, admin participants are already loaded in the first useEffect
      // Use realContestants data instead of empty array
      const contestantsData = await getContestantsSync(realContestants, userRatingsMap);
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
   }, [title, user, isAdmin, adminParticipants.length, realContestants.length]);

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

    // For "THIS WEEK" section, show only admin participants if user is admin
    if (title === "THIS WEEK") {
      console.log('Processing THIS WEEK section');
      
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

    // For "1 WEEK AGO" section, show participants for all users
    if (title === "1 WEEK AGO") {
      console.log('Processing 1 WEEK AGO section for all users');
      
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

    // For "2 WEEKS AGO" and "3 WEEKS AGO" sections, show participants for all users
    if (["2 WEEKS AGO", "3 WEEKS AGO"].includes(title)) {
      console.log(`Processing ${title} section for all users`);
      
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
