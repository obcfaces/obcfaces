import { useState, useEffect } from "react";
import { ContestantCard } from "@/components/contest-card";
import { supabase } from "@/integrations/supabase/client";

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
}

export function ContestSection({ 
  title, 
  subtitle, 
  description, 
  isActive, 
  showWinner, 
  centerSubtitle, 
  titleSuffix, 
  noWrapTitle, 
  viewMode: controlledViewMode, 
  filters, 
  weekOffset = 0 
}: ContestSectionProps) {
  const [localViewMode] = useState<'compact' | 'full'>('compact');
  const viewMode = controlledViewMode ?? localViewMode;
  const [contestants, setContestants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Get user session once for the entire section and listen for changes
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    
    getCurrentUser();
    
    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      setUser(prevUser => {
        if (prevUser?.id !== newUser?.id) {
          return newUser;
        }
        return prevUser;
      });
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const loadContestParticipants = async (sectionTitle: string) => {
    try {
      console.log(`Loading participants for ${sectionTitle}`);
      
      // Determine status filter based on section title
      let statusFilter = '';
      
      if (sectionTitle === "NEXT WEEK") {
        statusFilter = 'next';
      } else if (sectionTitle === "THIS WEEK") {
        statusFilter = 'this';
      } else if (sectionTitle.includes("AGO")) {
        statusFilter = 'past';
      }

      // Get participants with their photos from profiles and contest_applications tables
      let query = supabase
        .from('weekly_contest_participants')
        .select(`
          id,
          user_id,
          admin_status,
          application_data,
          average_rating,
          total_votes,
          final_rank,
          is_active,
          profiles!inner(photo_1_url, photo_2_url)
        `)
        .eq('is_active', true);
      
      // Filter by admin_status based on section
      if (statusFilter === 'next') {
        query = query.in('admin_status', ['next week', 'next week on site']);
      } else if (statusFilter === 'this') {
        query = query.eq('admin_status', 'this week');
      } else if (statusFilter === 'past') {
        query = query.or('admin_status.eq.past,admin_status.like.*past week*');
      }

      const { data: participants, error } = await query;

      if (error) {
        console.error('Error loading weekly contest participants:', error);
        return [];
      }

      // Transform the data to match expected format
      const filteredParticipants = (participants || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        first_name: p.application_data?.first_name || '',
        last_name: p.application_data?.last_name || '',
        age: p.application_data?.birth_year ? 
          new Date().getFullYear() - parseInt(p.application_data.birth_year) : null,
        city: p.application_data?.city || '',
        country: p.application_data?.country === 'PH' ? 'Philippines' : p.application_data?.country || '',
        photo1_url: p.profiles?.photo_1_url || p.application_data?.photo1_url || '',
        photo2_url: p.profiles?.photo_2_url || p.application_data?.photo2_url || '',
        height_cm: p.application_data?.height_cm || null,
        weight_kg: p.application_data?.weight_kg || null,
        final_rank: p.final_rank,
        average_rating: p.average_rating || 0,
        total_votes: p.total_votes || 0,
        contest_status: 'active',
        week_start_date: '2025-09-29',
        week_end_date: '2025-10-05'
      }));

      console.log(`Loaded ${filteredParticipants?.length || 0} participants for ${sectionTitle} with status ${statusFilter}`);
      return filteredParticipants || [];
    } catch (err) {
      console.error('Error loading weekly contest participants:', err);
      return [];
    }
  };

  // Load participants based on title
  useEffect(() => {
    const loadParticipants = async () => {
      setIsLoading(true);
      
      if (["THIS WEEK", "NEXT WEEK", "1 WEEK AGO", "2 WEEKS AGO", "3 WEEKS AGO"].includes(title)) {
        const participants = await loadContestParticipants(title);
        
        // Transform participants to contestant format
        const transformedContestants = participants.map((participant: any, index: number) => ({
          rank: index + 1,
          name: `${participant.first_name || ''} ${participant.last_name || ''}`.trim(),
          profileId: participant.user_id || participant.id,
          country: participant.country || 'Philippines',
          city: participant.city || '',
          age: participant.age || 25,
          weight: participant.weight_kg || 55,
          height: participant.height_cm || 160,
          faceImage: participant.photo1_url || testContestantFace,
          fullBodyImage: participant.photo2_url || testContestantFull,
          additionalPhotos: [],
          isVoted: false,
          rating: 0,
          isThisWeek: title === "THIS WEEK",
          isNextWeek: title === "NEXT WEEK",
          isPastWeek: title.includes("AGO"),
          isWinner: participant.final_rank === 1,
          averageRating: participant.average_rating || 0,
          totalVotes: participant.total_votes || 0,
          isExample: false,
          prize: participant.final_rank === 1 && showWinner ? "+ 5000 PHP" : undefined,
          isRealContestant: true
        }));

        setContestants(transformedContestants);
      }
      
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
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [title, showWinner]);

  const handleRate = async (contestantId: number, rating: number) => {
    // Handle rating logic here if needed
    console.log(`Rating contestant ${contestantId} with ${rating} stars`);
  };

  return (
    <section className="max-w-6xl mx-auto pt-2 mb-1 sm:mb-3 mt-2 bg-background rounded-lg shadow-sm shadow-foreground/10">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <div className={`flex items-center gap-3 mb-2 ${noWrapTitle ? '' : 'flex-wrap'}`}>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {title}
              </h2>
              {titleSuffix && (
                <span className="text-lg md:text-xl font-medium text-muted-foreground">
                  {titleSuffix}
                </span>
              )}
            </div>
            <p className={`text-sm md:text-base text-muted-foreground mb-1 ${centerSubtitle ? 'text-center' : ''}`}>
              {subtitle}
            </p>
            {description && (
              <p className="text-xs md:text-sm text-muted-foreground/80">
                {description}
              </p>
            )}
          </div>
        </div>

        {filters && (
          <div className="mb-6">
            {filters}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-lg text-muted-foreground">Loading contestants...</div>
          </div>
        ) : contestants.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-lg text-muted-foreground">No contestants found for this period</div>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'compact' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {contestants.map((contestant) => (
              <ContestantCard
                key={`${contestant.profileId}-${contestant.rank}`}
                rank={contestant.rank}
                name={contestant.name}
                profileId={contestant.profileId}
                country={contestant.country}
                city={contestant.city}
                age={contestant.age}
                weight={contestant.weight}
                height={contestant.height}
                faceImage={contestant.faceImage}
                fullBodyImage={contestant.fullBodyImage}
                additionalPhotos={contestant.additionalPhotos}
                isVoted={contestant.isVoted}
                rating={contestant.rating}
                isWinner={contestant.isWinner}
                isExample={contestant.isExample}
                prize={contestant.prize}
                hideCardActions={!isActive}
                viewMode={viewMode}
                isThisWeek={contestant.isThisWeek}
                averageRating={contestant.averageRating}
                totalVotes={contestant.totalVotes}
                onRate={(rating) => handleRate(contestant.rank, rating)}
                user={user}
                isRealContestant={contestant.isRealContestant}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}