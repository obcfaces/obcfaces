import React, { useState, useMemo, useEffect } from 'react';
import { WeeklyContestParticipant, WeekFilter } from '@/types/admin';
import { UnifiedParticipantTab } from './UnifiedParticipantTab';
import { RatingsModal } from '../modals/RatingsModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminPastWeekTabProps {
  participants: WeeklyContestParticipant[];
  weekFilters: WeekFilter[];
  selectedWeekFilter: string;
  onWeekFilterChange: (value: string) => void;
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onEdit?: (participant: WeeklyContestParticipant) => void;
  onStatusChange?: (participant: WeeklyContestParticipant, newStatus: string) => Promise<any>;
  onViewVoters?: (participant: { id: string; name: string }) => void;
  onViewStatusHistory?: (participantId: string, participantName: string, statusHistory: any) => void;
  onOpenWinnerModal?: (participantId: string, userId: string, name: string) => void;
  profiles?: any[];
  itemsPerPage?: number;
  getDynamicPastWeekFilters?: any[];
  getAvailableWeekIntervals?: () => { value: string; label: string; }[];
  showAllCards?: boolean;
  setShowAllCards?: (value: boolean) => void;
  pastStatusFilter?: string;
  setPastStatusFilter?: (value: string) => void;
  pastWeekIntervalFilter?: string;
  setPastWeekIntervalFilter?: (value: string) => void;
  loading?: boolean;
}

export function AdminPastWeekTab({
  participants,
  pastWeekIntervalFilter = 'all',
  setPastWeekIntervalFilter = () => {},
  onViewPhotos,
  onStatusChange,
  onViewStatusHistory,
  loading = false,
  ...rest
}: AdminPastWeekTabProps) {
  const [ratingsModalState, setRatingsModalState] = useState<{
    isOpen: boolean;
    participantId: string;
    participantName: string;
  }>({
    isOpen: false,
    participantId: '',
    participantName: '',
  });
  
  const [ratings, setRatings] = useState<Array<{
    user_id: string;
    display_name: string;
    avatar_url?: string;
    rating: number;
    voted_at: string;
  }>>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  // Fixed list of week intervals
  const FIXED_WEEK_INTERVALS = [
    '06/10-12/10/25',
    '29/09-05/10/25',
    '22/09-28/09/25',
    '15/09-21/09/25',
    '08/09-14/09/25',
  ];

  // Get available week intervals from participants
  const availableIntervals = useMemo(() => {
    return FIXED_WEEK_INTERVALS.map(interval => ({
      value: interval,
      label: interval,
      count: participants.filter(p => p.admin_status === 'past' && p.week_interval === interval).length
    }));
  }, [participants, FIXED_WEEK_INTERVALS]);

  const handleViewVoters = (participant: { id: string; name: string }) => {
    setRatingsModalState({
      isOpen: true,
      participantId: participant.id,
      participantName: participant.name,
    });
  };

  // Load ratings when modal opens
  useEffect(() => {
    if (ratingsModalState.isOpen && ratingsModalState.participantId) {
      loadRatings(ratingsModalState.participantId);
    }
  }, [ratingsModalState.isOpen, ratingsModalState.participantId]);

  const loadRatings = async (participantId: string) => {
    setLoadingRatings(true);
    try {
      // Get all ratings for this participant
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('contestant_ratings')
        .select('user_id, rating, created_at')
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;

      if (!ratingsData || ratingsData.length === 0) {
        setRatings([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(ratingsData.map(r => r.user_id))];

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, p])
      );

      const formattedRatings = ratingsData.map((rating: any) => {
        const profile = profilesMap.get(rating.user_id);
        return {
          user_id: rating.user_id,
          display_name: profile?.display_name || 'Unknown User',
          avatar_url: profile?.avatar_url,
          rating: rating.rating,
          voted_at: rating.created_at,
        };
      });

      setRatings(formattedRatings);
    } catch (error) {
      console.error('Error loading ratings:', error);
      toast.error('Failed to load ratings');
      setRatings([]);
    } finally {
      setLoadingRatings(false);
    }
  };

  return (
    <>
      <UnifiedParticipantTab
        participants={participants}
        tabType="past"
        onViewPhotos={onViewPhotos}
        onStatusChange={onStatusChange!}
        onViewVoters={handleViewVoters}
        loading={loading}
        weekIntervalFilter={pastWeekIntervalFilter}
        setWeekIntervalFilter={setPastWeekIntervalFilter}
        availableIntervals={availableIntervals}
      />
      
      <RatingsModal
        isOpen={ratingsModalState.isOpen}
        onClose={() => {
          setRatingsModalState(prev => ({ ...prev, isOpen: false }));
          setRatings([]);
        }}
        participantName={ratingsModalState.participantName}
        ratings={loadingRatings ? [] : ratings}
      />
    </>
  );
}
