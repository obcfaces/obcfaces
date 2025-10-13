import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Heart, Star, ThumbsUp, ThumbsDown, Trophy } from 'lucide-react';
import { WeeklyContestParticipant } from '@/types/admin';
import { LoadingSpinner } from '../LoadingSpinner';
import { useAdminCountry } from '@/contexts/AdminCountryContext';

interface UnifiedParticipantTabProps {
  participants: WeeklyContestParticipant[];
  tabType: 'pre-next' | 'next' | 'this' | 'past';
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onStatusChange: (participant: WeeklyContestParticipant, newStatus: string) => Promise<void>;
  onEdit?: (participant: any) => void;
  onViewVoters?: (participant: { id: string; name: string }) => void;
  onViewLikeDislike?: (participantName: string, type: 'like' | 'dislike') => void;
  loading?: boolean;
  
  // Past week specific props
  weekIntervalFilter?: string;
  setWeekIntervalFilter?: (value: string) => void;
  availableIntervals?: Array<{ value: string; label: string; count: number }>;
}

export function UnifiedParticipantTab({
  participants,
  tabType,
  onViewPhotos,
  onStatusChange,
  onEdit,
  onViewVoters,
  onViewLikeDislike,
  loading = false,
  weekIntervalFilter = 'all',
  setWeekIntervalFilter,
  availableIntervals = [],
}: UnifiedParticipantTabProps) {
  const { selectedCountry } = useAdminCountry();

  const filteredParticipants = useMemo(() => {
    let filtered = participants.filter(p => {
      const country = p.application_data?.country || p.profiles?.country;
      return country === selectedCountry;
    });

    // Apply week interval filter for past tab
    if (tabType === 'past' && weekIntervalFilter !== 'all') {
      filtered = filtered.filter(p => p.week_interval === weekIntervalFilter);
    }

    // Sort by rating for this and past tabs
    if (tabType === 'this' || tabType === 'past') {
      filtered.sort((a, b) => {
        if (a.final_rank && !b.final_rank) return -1;
        if (!a.final_rank && b.final_rank) return 1;
        if (a.final_rank && b.final_rank) return a.final_rank - b.final_rank;
        
        const ratingA = Number(a.average_rating) || 0;
        const ratingB = Number(b.average_rating) || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        
        const votesA = Number(a.total_votes) || 0;
        const votesB = Number(b.total_votes) || 0;
        return votesB - votesA;
      });
    }

    return filtered;
  }, [participants, selectedCountry, tabType, weekIntervalFilter]);

  if (loading) {
    return <LoadingSpinner message={`Loading ${tabType} week participants...`} />;
  }

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case 'pre next week':
        return 'bg-purple-100 dark:bg-purple-900';
      case 'next week':
        return 'bg-[hsl(var(--status-next-week))]';
      case 'this week':
        return 'bg-[hsl(var(--status-this-week))]';
      case 'past':
        return 'bg-[hsl(var(--status-past))]';
      default:
        return '';
    }
  };

  const getTitle = () => {
    switch (tabType) {
      case 'pre-next': return 'Pre Next Week';
      case 'next': return 'Next Week';
      case 'this': return 'This Week';
      case 'past': return 'Past Weeks';
      default: return '';
    }
  };

  // Mock data for next week votes (replace with real data)
  const getParticipantVotes = (participantName: string) => {
    return { likes: 0, dislikes: 0 };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{getTitle()} ({filteredParticipants.length})</h2>
      </div>

      {/* Week Interval Filter for Past tab */}
      {tabType === 'past' && setWeekIntervalFilter && (
        <div className="flex gap-2 flex-wrap">
          {availableIntervals.map((interval) => (
            <Button
              key={interval.value}
              variant={weekIntervalFilter === interval.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setWeekIntervalFilter(interval.value)}
              className="gap-2"
            >
              {interval.label}
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {interval.count}
              </Badge>
            </Button>
          ))}
          <Button
            variant={weekIntervalFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setWeekIntervalFilter('all')}
          >
            All
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              {participants.length}
            </Badge>
          </Button>
        </div>
      )}

      {filteredParticipants.map((participant) => {
        const appData = participant.application_data || {};
        const firstName = appData.first_name || '';
        const lastName = appData.last_name || '';
        const photo1 = appData.photo_1_url || appData.photo1_url || '';
        const photo2 = appData.photo_2_url || appData.photo2_url || '';
        const participantName = `${firstName} ${lastName}`;
        const isWinner = participant.final_rank === 1;
        const votes = getParticipantVotes(participantName);

        return (
          <Card key={participant.id} className={`overflow-hidden relative h-[149px] ${isWinner ? 'border-yellow-500' : ''}`}>
            <CardContent className="p-0">
              {/* Date/Time badge for past */}
              {tabType === 'past' && participant.created_at && (
                <Badge 
                  variant="outline" 
                  className="absolute top-0 left-0 z-20 text-xs rounded-none rounded-br-md font-normal bg-muted/90 border-border"
                >
                  {new Date(participant.created_at).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'short' 
                  })} {new Date(participant.created_at).toLocaleTimeString('en-GB', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })}
                </Badge>
              )}

              {/* Edit button (not shown for past) */}
              {tabType !== 'past' && onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(participant)}
                  className="absolute bottom-0 left-0 z-20 p-1 m-0 rounded-none rounded-tr-md border-0 border-t border-r bg-background/90 hover:bg-background"
                  title="Edit Application"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}

              {/* Desktop layout */}
              <div className="hidden md:flex">
                <div className="flex gap-px w-[25ch] flex-shrink-0">
                  {photo1 && (
                    <div className="w-1/2">
                      <img 
                        src={photo1} 
                        alt="Portrait" 
                        className="w-full h-[149px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, participantName)}
                      />
                    </div>
                  )}
                  {photo2 && (
                    <div className="w-1/2 relative">
                      <img 
                        src={photo2} 
                        alt="Full length" 
                        className="w-full h-[149px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 1, participantName)}
                      />
                      <div className="absolute top-2 right-2">
                        <Avatar className="h-6 w-6 flex-shrink-0 border-2 border-white shadow-sm">
                          <AvatarImage src={photo1 || ''} />
                          <AvatarFallback className="text-xs">
                            {firstName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {isWinner && (
                        <div className="absolute top-2 left-2">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-[50ch] flex-shrink-0 flex-1 min-w-0 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold whitespace-nowrap">
                      {new Date().getFullYear() - (appData.birth_year || new Date().getFullYear() - 25)} {firstName} {lastName}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground mb-1">
                    {appData.city} {appData.state} {appData.country}
                  </div>

                  {/* Stats based on tab type */}
                  <div className="flex items-center gap-3 mb-2">
                    {/* Next Week: Like/Dislike */}
                    {tabType === 'next' && (
                      <>
                        <div 
                          className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                          onClick={() => onViewLikeDislike?.(participantName, 'like')}
                        >
                          <ThumbsUp className="h-3 w-3 text-green-500 fill-green-500" />
                          <span className="text-xs font-semibold">{votes.likes}</span>
                        </div>
                        <div 
                          className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                          onClick={() => onViewLikeDislike?.(participantName, 'dislike')}
                        >
                          <ThumbsDown className="h-3 w-3 text-red-500 fill-red-500" />
                          <span className="text-xs font-semibold">{votes.dislikes}</span>
                        </div>
                      </>
                    )}

                    {/* This Week & Past: Rating and Votes */}
                    {(tabType === 'this' || tabType === 'past') && (
                      <>
                        <div 
                          className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                          onClick={() => onViewVoters?.({ id: participant.id, name: participantName })}
                        >
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-semibold">
                            {Number(participant.average_rating || 0).toFixed(1)}
                          </span>
                        </div>
                        <div 
                          className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                          onClick={() => onViewVoters?.({ id: participant.id, name: participantName })}
                        >
                          <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
                          <span className="text-xs font-semibold">
                            {participant.total_votes || 0}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Select 
                      value={participant.admin_status || tabType} 
                      onValueChange={async (value) => {
                        await onStatusChange(participant, value);
                      }}
                    >
                      <SelectTrigger className={`w-24 h-7 text-xs ${getStatusBackgroundColor(participant.admin_status || tabType)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] bg-popover border shadow-lg">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="pre next week">Pre Next Week</SelectItem>
                        <SelectItem value="this week">This Week</SelectItem>
                        <SelectItem value="next week">Next Week</SelectItem>
                        <SelectItem value="past">Past</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Mobile layout */}
              <div className="md:hidden flex flex-col h-full">
                <div className="flex-1 p-3 flex gap-3">
                  <div className="flex flex-col gap-1 w-20 flex-shrink-0">
                    {photo1 && (
                      <img 
                        src={photo1} 
                        alt="Portrait" 
                        className="w-full h-16 object-cover rounded cursor-pointer"
                        onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, participantName)}
                      />
                    )}
                    {photo2 && (
                      <img 
                        src={photo2} 
                        alt="Full length" 
                        className="w-full h-16 object-cover rounded cursor-pointer"
                        onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 1, participantName)}
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-sm truncate mb-1">
                        {firstName} {lastName}
                        {isWinner && <Trophy className="inline h-4 w-4 text-yellow-500 ml-1" />}
                      </h3>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>{appData.city || 'Unknown'}, {appData.country || 'Unknown'}</div>
                        <div className="flex items-center gap-2">
                          {tabType === 'next' && (
                            <>
                              <span>👍 {votes.likes}</span>
                              <span>👎 {votes.dislikes}</span>
                            </>
                          )}
                          {(tabType === 'this' || tabType === 'past') && (
                            <>
                              <span>⭐ {Number(participant.average_rating || 0).toFixed(1)}</span>
                              <span>❤️ {participant.total_votes || 0}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <Select 
                        value={participant.admin_status || tabType} 
                        onValueChange={async (value) => {
                          await onStatusChange(participant, value);
                        }}
                      >
                        <SelectTrigger className={`w-24 h-7 text-xs ${getStatusBackgroundColor(participant.admin_status || tabType)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[9999] bg-popover border shadow-lg">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="pre next week">Pre Next Week</SelectItem>
                          <SelectItem value="this week">This Week</SelectItem>
                          <SelectItem value="next week">Next Week</SelectItem>
                          <SelectItem value="past">Past</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {filteredParticipants.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No participants for {getTitle()}
        </div>
      )}
    </div>
  );
}
