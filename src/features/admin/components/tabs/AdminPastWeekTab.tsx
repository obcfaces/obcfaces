import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit, Heart, Star, Info, Copy, Video } from 'lucide-react';
import { WeeklyContestParticipant, WeekFilter } from '@/types/admin';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LoadingSpinner } from '../LoadingSpinner';

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
  weekFilters,
  selectedWeekFilter,
  onWeekFilterChange,
  onViewPhotos,
  onEdit,
  onStatusChange,
  onViewVoters,
  onViewStatusHistory,
  onOpenWinnerModal,
  profiles = [],
  itemsPerPage = 20,
  getDynamicPastWeekFilters = [],
  getAvailableWeekIntervals = () => [],
  showAllCards = false,
  setShowAllCards = () => {},
  pastStatusFilter = 'all',
  setPastStatusFilter = () => {},
  pastWeekIntervalFilter = 'all',
  setPastWeekIntervalFilter = () => {},
  loading = false,
}: AdminPastWeekTabProps) {
  if (loading) {
    return <LoadingSpinner message="Loading past weeks..." />;
  }

  const [expandedDesktopItems, setExpandedDesktopItems] = useState<Set<string>>(new Set());
  const [pendingPastChanges, setPendingPastChanges] = useState<Record<string, { admin_status?: string; week_interval?: string }>>({});
  const [updatingStatuses, setUpdatingStatuses] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case 'pre next week':
        return 'bg-purple-100 dark:bg-purple-900';
      case 'next week':
        return 'bg-[hsl(var(--status-next-week))]';
      case 'next week on site':
        return 'bg-[hsl(var(--status-next-week-on-site))]';
      case 'this week':
        return 'bg-[hsl(var(--status-this-week))]';
      case 'past':
        return 'bg-[hsl(var(--status-past))]';
      default:
        return '';
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const pastParticipants = participants.filter(p => p.admin_status === 'past');
    const totalVotes = pastParticipants.reduce((sum, p) => sum + (p.total_votes || 0), 0);
    const totalLikes = pastParticipants.reduce((sum, p) => {
      const statusHistory = p.status_history || {};
      let likeCount = 0;
      Object.values(statusHistory).forEach((entry: any) => {
        if (entry?.like_count) likeCount += entry.like_count;
      });
      return sum + likeCount;
    }, 0);
    return { totalVotes, totalLikes };
  }, [participants]);

  // Filter participants
  const filteredParticipants = useMemo(() => {
    console.log('🔍 AdminPastWeekTab - Filtering participants');
    console.log('📊 Total participants:', participants.length);
    console.log('🎯 pastWeekIntervalFilter:', pastWeekIntervalFilter);
    
    // Start with only 'past' status participants
    let filtered = participants.filter(p => p.admin_status === 'past');
    console.log('📋 Past status participants:', filtered.length);

    // Apply week interval filter
    if (pastWeekIntervalFilter !== 'all') {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(p => {
        const matches = p.week_interval === pastWeekIntervalFilter;
        if (matches) {
          const appData = p.application_data || {};
          console.log(`✓ Matched: ${appData.first_name} ${appData.last_name}, interval: ${p.week_interval}`);
        }
        return matches;
      });
      console.log(`🔽 After interval filter: ${filtered.length} (was ${beforeFilter})`);
    }

    // Sort by rating
    return filtered.sort((a, b) => {
      const ratingA = Number(a.average_rating) || 0;
      const ratingB = Number(b.average_rating) || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      const votesA = Number(a.total_votes) || 0;
      const votesB = Number(b.total_votes) || 0;
      return votesB - votesA;
    });
  }, [participants, pastWeekIntervalFilter]);

  // Show all filtered participants (no pagination)
  const paginatedParticipants = filteredParticipants;

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    return getDynamicPastWeekFilters.map((filter: any) => {
      if (filter.id === 'all') {
        const count = participants.filter(p => p.admin_status === 'past').length;
        return { ...filter, count };
      }
      const count = participants.filter(p => 
        p.admin_status === 'past' && p.week_interval === filter.weekInterval
      ).length;
      return { ...filter, count };
    });
  }, [participants, getDynamicPastWeekFilters]);

  const handleSaveChanges = async (participant: WeeklyContestParticipant) => {
    if (!onStatusChange) return;
    
    setUpdatingStatuses(prev => new Set(prev).add(participant.id));
    try {
      const changes = pendingPastChanges[participant.id];
      if (changes) {
        // Create updated participant object with both status and week_interval if changed
        const updatedParticipant = {
          ...participant,
          ...(changes.admin_status && { admin_status: changes.admin_status }),
          ...(changes.week_interval && { week_interval: changes.week_interval })
        };
        
        // Call onStatusChange with the new status (keeping the signature)
        await onStatusChange(updatedParticipant, changes.admin_status || participant.admin_status);
      }
      // Clear pending changes
      setPendingPastChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[participant.id];
        return newChanges;
      });
    } finally {
      setUpdatingStatuses(prev => {
        const newSet = new Set(prev);
        newSet.delete(participant.id);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="mb-4 p-3 bg-muted rounded-lg">
        <div className="text-sm text-muted-foreground">
          <div className="md:hidden text-base font-bold mb-2">
            votes: {stats.totalVotes} / likes: {stats.totalLikes}
          </div>
          <div className="hidden md:block text-xs">
            votes: {stats.totalVotes}, likes: {stats.totalLikes}
          </div>
        </div>
      </div>

      {/* Week Interval Filter Buttons - Specific 4 weeks from database */}
      <div className="mt-4">
        <div className="flex gap-2 flex-wrap">
          {/* Specific 4 week intervals in order */}
          {[
            { value: '06/10-12/10/25', label: '06/10-12/10/25' },
            { value: '29/09-05/10/25', label: '29/09-05/10/25' },
            { value: '22/09-28/09/25', label: '22/09-28/09/25' },
            { value: '15/09-21/09/25', label: '15/09-21/09/25' }
          ].map((interval) => {
            const participantsInWeek = participants.filter(p => 
              p.admin_status === 'past' && p.week_interval === interval.value
            );
            const count = participantsInWeek.length;
            
            return (
              <Button
                key={interval.value}
                variant={pastWeekIntervalFilter === interval.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPastWeekIntervalFilter(interval.value)}
                className="gap-2"
              >
                {interval.label}
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {count}
                </Badge>
              </Button>
            );
          })}
          <Button
            variant={pastWeekIntervalFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPastWeekIntervalFilter('all')}
            className="gap-2"
          >
            All
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              {participants.filter(p => p.admin_status === 'past').length}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Participants List */}
      {filteredParticipants.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg">Нет участников для выбранного периода</p>
        </div>
      ) : (
        paginatedParticipants.map((participant) => {
          const participantProfile = profiles.find(p => p.id === participant.user_id);
          const appData = participant.application_data || {};
          const participantName = `${appData.first_name} ${appData.last_name}`;
          const isWinner = participant.final_rank === 1;

          const firstName = appData.first_name || appData.firstName || '';
          const lastName = appData.last_name || appData.lastName || '';
          const photo1 = appData.photo_1_url || appData.photo1_url || appData.photo1Url || appData.photoUrl1 || '';
          const photo2 = appData.photo_2_url || appData.photo2_url || appData.photo2Url || appData.photoUrl2 || '';

          return (
            <Card key={participant.id} className="overflow-hidden relative mx-0 rounded-lg h-[149px]">
              <CardContent className="p-0">
                {/* Date/Time badge - left top corner */}
                {participant.created_at && (
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

                {/* Edit button in bottom left corner */}
                {onEdit && (
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
                
                {/* Desktop/Tablet layout - same style as new applications */}
                <div className="hidden md:flex h-[149px]">
                  {/* Photos section - Fixed width */}
                  <div className="flex gap-px w-[200px] flex-shrink-0 h-[149px]">
                    {photo1 && (
                      <div className="w-[100px] h-[149px] flex-shrink-0 relative overflow-hidden">
                        <img 
                          src={photo1} 
                          alt="Portrait" 
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, participantName)}
                        />
                      </div>
                    )}
                    {photo2 && (
                      <div className="w-[100px] h-[149px] flex-shrink-0 relative overflow-hidden">
                        <img 
                          src={photo2} 
                          alt="Full length" 
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 1, participantName)}
                        />
                      </div>
                    )}
                    {!photo2 && (
                      <div className="w-[100px] h-[149px] flex-shrink-0 bg-muted flex items-center justify-center border border-border overflow-hidden">
                        <div className="text-center text-muted-foreground">
                          <p className="text-xs font-medium">No Photo 2</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info section - same as new applications */}
                  <div className="flex-1 p-2 flex flex-col justify-between overflow-hidden">
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <Avatar className="h-5 w-5 flex-shrink-0">
                          <AvatarImage src={photo1 || ''} />
                          <AvatarFallback className="text-[10px]">
                            {firstName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold flex items-center gap-1">
                          {isWinner && <span className="text-yellow-500">🏆</span>}
                          {participant.final_rank > 1 && <span className="text-slate-500">🥈</span>}
                          {firstName} {lastName} {appData.birth_year ? new Date().getFullYear() - parseInt(appData.birth_year) : ''}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mb-1">
                        <span>{appData.city}, {appData.country}</span>
                      </div>

                      {/* Rating and Votes */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-[10px] font-semibold">
                            {Number(participant.average_rating || 0).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
                          <span className="text-[10px] font-semibold">
                            {participant.total_votes || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status and Week Interval Dropdowns */}
                    <div className="flex gap-1">
                      <div className="flex-1">
                        <Select
                          value={pendingPastChanges[participant.id]?.admin_status || participant.admin_status}
                          onValueChange={(value) => {
                            setPendingPastChanges(prev => ({
                              ...prev,
                              [participant.id]: { 
                                ...prev[participant.id],
                                admin_status: value as any
                              }
                            }));
                          }}
                        >
                          <SelectTrigger className={`w-full h-6 text-[10px] ${getStatusBackgroundColor(pendingPastChanges[participant.id]?.admin_status || participant.admin_status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="pre next week">Pre Next Week</SelectItem>
                            <SelectItem value="next week">Next Week</SelectItem>
                            <SelectItem value="next week on site">Next Week On Site</SelectItem>
                            <SelectItem value="this week">This Week</SelectItem>
                            <SelectItem value="past">Past</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1">
                        <Select
                          value={pendingPastChanges[participant.id]?.week_interval || participant.week_interval || ''}
                          onValueChange={(value) => {
                            setPendingPastChanges(prev => ({
                              ...prev,
                              [participant.id]: { 
                                ...prev[participant.id],
                                week_interval: value
                              }
                            }));
                          }}
                        >
                          <SelectTrigger className="w-full h-6 text-[10px]">
                            <SelectValue placeholder="Week" />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            {getAvailableWeekIntervals().map((interval) => (
                              <SelectItem key={interval.value} value={interval.value}>
                                {interval.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {pendingPastChanges[participant.id] && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSaveChanges(participant)}
                          disabled={updatingStatuses.has(participant.id)}
                          className="h-6 text-[10px] px-2"
                        >
                          {updatingStatuses.has(participant.id) ? '...' : 'Save'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile layout - same as desktop but compact */}
                <div className="md:hidden flex h-full">
                  <div className="flex flex-col w-full">
                    {/* Top Row: Avatar and Name */}
                    <div className="flex items-center p-2">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url || participantProfile?.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {appData.first_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm font-semibold">
                        {isWinner && <span className="text-yellow-500">🏆</span>}
                        {participant.final_rank > 1 && <span className="text-slate-500">🥈</span>}
                        {appData.first_name} {appData.last_name}
                      </div>
                    </div>

                    {/* Middle Row: Photos */}
                    <div className="flex overflow-x-auto p-1">
                      {(participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url) && (
                        <img
                          src={participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url}
                          alt="Portrait"
                          className="w-24 h-24 object-contain mr-1 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => onViewPhotos([
                            participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url,
                            participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url
                          ].filter(Boolean), 0, participantName)}
                        />
                      )}
                      {(participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url) && (
                        <img
                          src={participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url}
                          alt="Full length"
                          className="w-24 h-24 object-cover mr-1 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => onViewPhotos([
                            participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url,
                            participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url
                          ].filter(Boolean), 1, participantName)}
                        />
                      )}
                    </div>

                    {/* Bottom Row: Status and Actions */}
                    <div className="p-2 space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {appData.city}, {appData.state}, {appData.country}
                      </div>

                      {/* Status selector */}
                      <div>
                        <div className="font-semibold mb-1 text-xs">Status:</div>
                        <Select
                          value={pendingPastChanges[participant.id]?.admin_status ?? participant.admin_status ?? 'past'}
                          onValueChange={(newStatus) => {
                            setPendingPastChanges(prev => ({
                              ...prev,
                              [participant.id]: {
                                ...prev[participant.id],
                                admin_status: newStatus
                              }
                            }));
                          }}
                        >
                          <SelectTrigger className={`w-full h-6 text-xs ${getStatusBackgroundColor(pendingPastChanges[participant.id]?.admin_status ?? participant.admin_status ?? 'past')}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[9999] bg-popover border shadow-lg">
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="pre next week">Pre Next Week</SelectItem>
                            <SelectItem value="this week">This Week</SelectItem>
                            <SelectItem value="next week">Next Week</SelectItem>
                            <SelectItem value="next week on site">Next Week On Site</SelectItem>
                            <SelectItem value="past">Past</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Week interval selector */}
                      <div>
                        <div className="font-semibold mb-1 text-xs">Week Interval:</div>
                        <Select
                          value={pendingPastChanges[participant.id]?.week_interval ?? participant.week_interval ?? ''}
                          onValueChange={(newInterval) => {
                            setPendingPastChanges(prev => ({
                              ...prev,
                              [participant.id]: {
                                ...prev[participant.id],
                                week_interval: newInterval
                              }
                            }));
                          }}
                        >
                          <SelectTrigger className="w-full h-6 text-xs">
                            <SelectValue placeholder="Select week" />
                          </SelectTrigger>
                          <SelectContent className="z-[9999] bg-popover border shadow-lg">
                            {getAvailableWeekIntervals().map((interval) => (
                              <SelectItem key={interval.value} value={interval.value}>
                                {interval.label}
                              </SelectItem>
                            ))}</SelectContent>
                        </Select>
                      </div>

                      {/* Save button */}
                      <Button
                        size="sm"
                        className="w-full h-7 text-xs"
                        disabled={!pendingPastChanges[participant.id] || updatingStatuses.has(participant.id)}
                        onClick={() => handleSaveChanges(participant)}
                      >
                        {updatingStatuses.has(participant.id) ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
