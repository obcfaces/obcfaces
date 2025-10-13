import React from 'react';
import { WeeklyContestParticipant } from '@/types/admin';
import { UnifiedParticipantTab } from './UnifiedParticipantTab';

interface AdminPreNextWeekTabProps {
  participants: WeeklyContestParticipant[];
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onStatusChange: (participant: WeeklyContestParticipant, newStatus: string) => Promise<void>;
  onEdit: (participant: any) => void;
  onStatusHistory: (participantId: string, participantName: string, statusHistory: any) => void;
  loading?: boolean;
}

export function AdminPreNextWeekTab(props: AdminPreNextWeekTabProps) {
  return (
    <UnifiedParticipantTab
      participants={props.participants}
      tabType="pre-next"
      onViewPhotos={props.onViewPhotos}
      onStatusChange={props.onStatusChange}
      onEdit={props.onEdit}
      loading={props.loading}
    />
  );
}
