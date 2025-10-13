import React, { useState } from 'react';
import { WeeklyContestParticipant } from '@/types/admin';
import { UnifiedParticipantTab } from './UnifiedParticipantTab';
import { RatingsModal } from '../modals/RatingsModal';

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
    participantName: string;
  }>({
    isOpen: false,
    participantName: '',
  });

  const handleViewVoters = (participant: { id: string; name: string }) => {
    setRatingsModalState({
      isOpen: true,
      participantName: participant.name,
    });
  };

  // Mock ratings data - replace with real data from database
  const mockRatings = [
    {
      user_id: '1',
      display_name: 'User 1',
      avatar_url: '',
      rating: 5,
      voted_at: new Date().toISOString(),
    },
  ];

  return (
    <>
      <UnifiedParticipantTab
        {...props}
        tabType="this"
        onViewVoters={handleViewVoters}
      />
      
      <RatingsModal
        isOpen={ratingsModalState.isOpen}
        onClose={() => setRatingsModalState(prev => ({ ...prev, isOpen: false }))}
        participantName={ratingsModalState.participantName}
        ratings={mockRatings}
      />
    </>
  );
}
