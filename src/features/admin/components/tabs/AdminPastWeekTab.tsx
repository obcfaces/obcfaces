import React, { useState, useMemo } from 'react';
import { WeeklyContestParticipant, WeekFilter } from '@/types/admin';
import { UnifiedParticipantTab } from './UnifiedParticipantTab';
import { RatingsModal } from '../modals/RatingsModal';

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
    participantName: string;
  }>({
    isOpen: false,
    participantName: '',
  });

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
        participants={participants}
        tabType="past"
        onViewPhotos={onViewPhotos}
        onStatusChange={onStatusChange!}
        onViewStatusHistory={onViewStatusHistory}
        onViewVoters={handleViewVoters}
        loading={loading}
        weekIntervalFilter={pastWeekIntervalFilter}
        setWeekIntervalFilter={setPastWeekIntervalFilter}
        availableIntervals={availableIntervals}
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
