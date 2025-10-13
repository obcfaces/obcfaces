import React, { useState, useEffect } from 'react';
import { WeeklyContestParticipant } from '@/types/admin';
import { UnifiedParticipantTab } from './UnifiedParticipantTab';
import { RatingsModal } from '../modals/RatingsModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminWeeklyTabProps {
  participants: WeeklyContestParticipant[];
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onEdit: (participant: WeeklyContestParticipant) => void;
  onStatusChange: (participant: WeeklyContestParticipant, newStatus: string) => Promise<void>;
  onViewVoters?: (participant: { id: string; name: string }) => void;
  onViewStatusHistory?: (participantId: string, participantName: string, statusHistory: any) => void;
  profiles?: any[];
  loading?: boolean;
  dailyStats?: Array<{
    day_name: string;
    day_date?: string;
    vote_count?: number;
    like_count?: number;
  }>;
}

export function AdminWeeklyTab(props: AdminWeeklyTabProps) {
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
        {...props}
        tabType="this"
        onViewVoters={handleViewVoters}
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
