import React, { memo } from 'react';
import { ContestantCard } from "../ContestCard";

interface MemoizedContestantCardProps {
  rank: number;
  name: string;
  country: string;
  city: string;
  age: number;
  weight: number;
  height: number;
  rating: number;
  faceImage: string;
  fullBodyImage: string;
  additionalPhotos?: string[];
  isVoted?: boolean;
  isWinner?: boolean;
  prize?: string;
  viewMode?: 'compact' | 'full';
  onRate?: (rating: number) => void;
  profileId?: string;
  userId?: string;
  showDislike?: boolean;
  participantId?: string;
  userHasRated?: boolean;
  weekInterval?: string;
  winnerContent?: any;
}

const MemoizedContestantCardComponent: React.FC<MemoizedContestantCardProps> = (props) => {
  return <ContestantCard {...props} />;
};

// Deep memoization with all critical props
export const MemoizedContestantCard = memo(
  MemoizedContestantCardComponent,
  (prevProps, nextProps) => {
    // Compare all props that affect rendering
    return (
      prevProps.profileId === nextProps.profileId &&
      prevProps.participantId === nextProps.participantId &&
      prevProps.viewMode === nextProps.viewMode &&
      prevProps.rating === nextProps.rating &&
      prevProps.isVoted === nextProps.isVoted &&
      prevProps.rank === nextProps.rank &&
      prevProps.name === nextProps.name &&
      prevProps.userHasRated === nextProps.userHasRated &&
      prevProps.isWinner === nextProps.isWinner &&
      prevProps.weekInterval === nextProps.weekInterval
    );
  }
);
