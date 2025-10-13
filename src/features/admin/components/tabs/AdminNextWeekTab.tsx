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
          vote_type,
          candidate_name
        `)
        .eq('candidate_name', participantName)
        .eq('vote_type', type);

      if (error) throw error;

      // Затем получаем данные профилей отдельным запросом
      const userIds = (data || []).map(vote => vote.user_id);
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(
          (profilesData || []).map(p => [p.id, p])
        );

        const formattedVoters = (data || []).map((vote: any) => {
          const profile = profilesMap.get(vote.user_id);
          return {
            user_id: vote.user_id,
            display_name: profile?.display_name || 'Unknown User',
            avatar_url: profile?.avatar_url,
            voted_at: vote.created_at,
          };
        });

        setVoters(formattedVoters);
      } else {
        setVoters([]);
      }
    } catch (error) {
      console.error('Error loading voters:', error);
      toast.error('Failed to load voters');
      setVoters([]);
    } finally {
      setLoadingVoters(false);
    }
  };

  // Функция для получения статистики лайков/дизлайков
  const getParticipantVotes = async (participantName: string) => {
    try {
      const { data, error } = await supabase
        .from('next_week_votes')
        .select('vote_type, vote_count')
        .eq('candidate_name', participantName);

      if (error) throw error;

      const likes = (data || [])
        .filter(v => v.vote_type === 'like')
        .reduce((sum, v) => sum + (v.vote_count || 1), 0);
      
      const dislikes = (data || [])
        .filter(v => v.vote_type === 'dislike')
        .reduce((sum, v) => sum + (v.vote_count || 1), 0);

      return { likes, dislikes };
    } catch (error) {
      console.error('Error loading vote stats:', error);
      return { likes: 0, dislikes: 0 };
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
        getParticipantVotes={getParticipantVotes}
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
