import React, { useState, useEffect } from 'react';
import { WeeklyContestParticipant } from '@/types/admin';
import { UnifiedParticipantTab } from './UnifiedParticipantTab';
import { NextWeekVotesModal } from '../modals/NextWeekVotesModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminNextWeekTabProps {
  participants: WeeklyContestParticipant[];
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onViewVoters: (participantName: string) => void;
  onStatusChange: (participant: WeeklyContestParticipant, newStatus: string) => Promise<void>;
  onEdit: (participant: any) => void;
  loading?: boolean;
}

export function AdminNextWeekTab(props: AdminNextWeekTabProps) {
  const [votesModalState, setVotesModalState] = useState<{
    isOpen: boolean;
    participantName: string;
    voteType: 'like' | 'dislike';
  }>({
    isOpen: false,
    participantName: '',
    voteType: 'like',
  });
  
  const [voters, setVoters] = useState<Array<{
    user_id: string;
    display_name: string;
    avatar_url?: string;
    voted_at: string;
  }>>([]);
  const [loadingVoters, setLoadingVoters] = useState(false);

  const handleViewLikeDislike = async (participantName: string, type: 'like' | 'dislike') => {
    setVotesModalState({
      isOpen: true,
      participantName,
      voteType: type,
    });
    
    // Load voters from database
    setLoadingVoters(true);
    try {
      const { data, error } = await supabase
        .from('next_week_votes')
        .select(`
          user_id,
          created_at,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('candidate_name', participantName)
        .eq('vote_type', type);

      if (error) throw error;

      const formattedVoters = (data || []).map((vote: any) => ({
        user_id: vote.user_id,
        display_name: vote.profiles?.display_name || 'Unknown User',
        avatar_url: vote.profiles?.avatar_url,
        voted_at: vote.created_at,
      }));

      setVoters(formattedVoters);
    } catch (error) {
      console.error('Error loading voters:', error);
      toast.error('Failed to load voters');
      setVoters([]);
    } finally {
      setLoadingVoters(false);
    }
  };

  return (
    <>
      <UnifiedParticipantTab
        participants={props.participants}
        tabType="next"
        onViewPhotos={props.onViewPhotos}
        onStatusChange={props.onStatusChange}
        onEdit={props.onEdit}
        onViewLikeDislike={handleViewLikeDislike}
        loading={props.loading}
      />
      
      <NextWeekVotesModal
        isOpen={votesModalState.isOpen}
        onClose={() => {
          setVotesModalState(prev => ({ ...prev, isOpen: false }));
          setVoters([]);
        }}
        participantName={votesModalState.participantName}
        voteType={votesModalState.voteType}
        voters={loadingVoters ? [] : voters}
      />
    </>
  );
}
