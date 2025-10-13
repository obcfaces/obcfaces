import React, { useState } from 'react';
import { WeeklyContestParticipant } from '@/types/admin';
import { UnifiedParticipantTab } from './UnifiedParticipantTab';
import { NextWeekVotesModal } from '../modals/NextWeekVotesModal';

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

  const handleViewLikeDislike = (participantName: string, type: 'like' | 'dislike') => {
    setVotesModalState({
      isOpen: true,
      participantName,
      voteType: type,
    });
  };

  // Mock voters data - replace with real data from database
  const mockVoters = [
    {
      user_id: '1',
      display_name: 'User 1',
      avatar_url: '',
      voted_at: new Date().toISOString(),
    },
  ];

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
        onClose={() => setVotesModalState(prev => ({ ...prev, isOpen: false }))}
        participantName={votesModalState.participantName}
        voteType={votesModalState.voteType}
        voters={mockVoters}
      />
    </>
  );
}
