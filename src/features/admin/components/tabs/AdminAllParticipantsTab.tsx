import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit, Heart, Star, Info, Copy, Video } from 'lucide-react';
import { WeeklyContestParticipant } from '@/types/admin';
import { LoadingSpinner } from '../LoadingSpinner';

interface AdminAllParticipantsTabProps {
  participants: WeeklyContestParticipant[];
  profiles?: any[];
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onEdit?: (participant: WeeklyContestParticipant) => void;
  onStatusChange?: (participant: WeeklyContestParticipant, newStatus: string) => Promise<any>;
  onViewVoters?: (participant: { id: string; name: string }) => void;
  onViewStatusHistory?: (participantId: string, participantName: string, statusHistory: any) => void;
  onOpenWinnerModal?: (participantId: string, userId: string, name: string) => void;
  getAvailableWeekIntervals?: () => { value: string; label: string; }[];
  loading?: boolean;
}

export function AdminAllParticipantsTab({
  participants,
  profiles = [],
  onViewPhotos,
  onEdit,
  onStatusChange,
  onViewVoters,
  onViewStatusHistory,
  onOpenWinnerModal,
  getAvailableWeekIntervals = () => [],
  loading = false,
}: AdminAllParticipantsTabProps) {
  if (loading) {
    return <LoadingSpinner message="Loading all participants..." />;
  }

  const [statusFilter, setStatusFilter] = useState('all');
  const [weekIntervalFilter, setWeekIntervalFilter] = useState('all');
  const [expandedDesktopItems, setExpandedDesktopItems] = useState<Set<string>>(new Set());
  const [pendingChanges, setPendingChanges] = useState<Record<string, { admin_status?: string; week_interval?: string }>>({});
  const [updatingStatuses, setUpdatingStatuses] = useState<Set<string>>(new Set());

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

  // Filter participants
  const filteredParticipants = useMemo(() => {
    let filtered = participants;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.admin_status === statusFilter);
    }

    // Apply week interval filter
    if (weekIntervalFilter !== 'all') {
      filtered = filtered.filter(p => p.week_interval === weekIntervalFilter);
    }

    // Sort by rating and votes
    return filtered.sort((a, b) => {
      const ratingA = Number(a.average_rating) || 0;
      const ratingB = Number(b.average_rating) || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      const votesA = Number(a.total_votes) || 0;
      const votesB = Number(b.total_votes) || 0;
      return votesB - votesA;
    });
  }, [participants, statusFilter, weekIntervalFilter]);

  const handleSaveChanges = async (participant: WeeklyContestParticipant) => {
    if (!onStatusChange) return;
    
    setUpdatingStatuses(prev => new Set(prev).add(participant.id));
    try {
      const changes = pendingChanges[participant.id];
      if (changes) {
        const updatedParticipant = {
          ...participant,
          ...(changes.admin_status && { admin_status: changes.admin_status }),
          ...(changes.week_interval && { week_interval: changes.week_interval })
        };
        
        await onStatusChange(updatedParticipant, changes.admin_status || participant.admin_status);
      }
      // Clear pending changes
      setPendingChanges(prev => {
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
      <h2 className="text-2xl font-bold">All Participants ({participants.length})</h2>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-sm font-medium mb-2 block">Status Filter:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="z-[9999] bg-popover border shadow-lg">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="pre next week">Pre Next Week</SelectItem>
              <SelectItem value="next week">Next Week</SelectItem>
              <SelectItem value="this week">This Week</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label className="text-sm font-medium mb-2 block">Week Interval Filter:</Label>
          <Select value={weekIntervalFilter} onValueChange={setWeekIntervalFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select week interval" />
            </SelectTrigger>
            <SelectContent className="z-[9999] bg-popover border shadow-lg">
              <SelectItem value="all">All Intervals</SelectItem>
              {getAvailableWeekIntervals().map((interval) => (
                <SelectItem key={interval.value} value={interval.value}>
                  {interval.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Participants List */}
      {filteredParticipants.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg">No participants found</p>
        </div>
      ) : (
        filteredParticipants.map((participant) => {
          const participantProfile = profiles.find(p => p.id === participant.user_id);
          const appData = participant.application_data || {};
          const participantName = `${appData.first_name} ${appData.last_name}`;
          const isWinner = participant.final_rank === 1;

          return (
            <Card key={participant.id} className="overflow-hidden relative mx-0 rounded-lg h-[149px]">
              <CardContent className="p-0">
                {/* Edit button */}
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

                {/* Desktop layout */}
                <div className="hidden md:flex md:overflow-visible">
                  {/* Column 1: Photos (25ch) */}
                  <div className="w-[25ch] flex-shrink-0 p-0">
                    <div className="flex gap-px">
                      {(participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url) && (
                        <div className="w-full">
                          <img
                            src={participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url}
                            alt="Portrait"
                            className="w-full h-36 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => onViewPhotos([
                              participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url,
                              participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url
                            ].filter(Boolean), 0, participantName)}
                          />
                        </div>
                      )}
                      {(participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url) && (
                        <div className="w-full">
                          <img 
                            src={participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url} 
                            alt="Full length"
                            className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => onViewPhotos([
                              participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url,
                              participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url
                            ].filter(Boolean), 1, participantName)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Information (25ch) */}
                  <div className="w-[25ch] flex-shrink-0 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarImage src={participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url || participantProfile?.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {appData.first_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold whitespace-nowrap flex items-center gap-1">
                        {isWinner && <span className="text-yellow-500">🏆</span>}
                        {participant.final_rank > 1 && <span className="text-slate-500">🥈</span>}
                        {appData.first_name} {appData.last_name} {appData.birth_year ? new Date().getFullYear() - parseInt(appData.birth_year) : ''}
                      </span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-2">
                      {appData.city}, {appData.state}, {appData.country}
                    </div>

                    {/* Expandable details toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-xs mb-2"
                      onClick={() => {
                        const newExpanded = new Set(expandedDesktopItems);
                        if (expandedDesktopItems.has(participant.id)) {
                          newExpanded.delete(participant.id);
                        } else {
                          newExpanded.add(participant.id);
                        }
                        setExpandedDesktopItems(newExpanded);
                      }}
                    >
                      {expandedDesktopItems.has(participant.id) ? '▼' : '▶'} Details
                    </Button>

                    {/* Expanded details */}
                    {expandedDesktopItems.has(participant.id) && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Height: {appData.height_cm || 'N/A'} cm</p>
                        <p>Weight: {appData.weight_kg || 'N/A'} kg</p>
                        <p>Marital: {appData.marital_status || 'N/A'}</p>
                        <p>Children: {appData.has_children ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                  </div>

                  {/* Column 3: Rating & Contact (25ch) */}
                  <div className="w-[25ch] flex-shrink-0 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold">
                          {Number(participant.average_rating || 0).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => onViewVoters?.({ id: participant.id, name: participantName })}>
                        <Heart className="h-4 w-4 fill-red-400 text-red-400" />
                        <span className="text-sm">
                          {participant.total_votes || 0}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="flex items-center gap-1">
                        Email: {appData.email || 'Not provided'}
                        {appData.email && (
                          <Copy
                            className="h-3 w-3 cursor-pointer hover:text-foreground"
                            onClick={() => navigator.clipboard.writeText(appData.email)}
                          />
                        )}
                      </p>
                      <p className="flex items-center gap-1">
                        Phone: {appData.phone_number || 'Not provided'}
                        {appData.phone_number && (
                          <Copy
                            className="h-3 w-3 cursor-pointer hover:text-foreground"
                            onClick={() => navigator.clipboard.writeText(appData.phone_number)}
                          />
                        )}
                      </p>
                      <p className="flex items-center gap-1">
                        FB: {appData.facebook_url ? (
                          <a href={appData.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            Link
                          </a>
                        ) : 'Not provided'}
                      </p>
                    </div>

                    {/* Winner video button */}
                    {isWinner && onOpenWinnerModal && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8 w-8 p-0"
                        onClick={() => onOpenWinnerModal(participant.id, participant.user_id, participantName)}
                        title="Управление видео и контентом победительницы"
                      >
                        <Video className="h-8 w-8 text-yellow-600" />
                      </Button>
                    )}
                  </div>

                  {/* Column 4: Status and actions (20ch) */}
                  <div className="w-[20ch] flex-shrink-0 p-4 flex flex-col justify-between">
                    <div className="text-xs text-muted-foreground mb-2 space-y-2">
                      {/* Status selector */}
                      <div>
                        <div className="font-semibold mb-1">Status:</div>
                        <Select 
                          value={pendingChanges[participant.id]?.admin_status ?? participant.admin_status ?? 'past'}
                          onValueChange={(newStatus) => {
                            setPendingChanges(prev => ({
                              ...prev,
                              [participant.id]: {
                                ...prev[participant.id],
                                admin_status: newStatus
                              }
                            }));
                          }}
                        >
                          <SelectTrigger className={`w-full h-6 text-xs ${getStatusBackgroundColor(pendingChanges[participant.id]?.admin_status ?? participant.admin_status ?? 'past')}`}>
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
                      
                      {/* Week interval selector */}
                      <div>
                        <div className="font-semibold mb-1">Week Interval:</div>
                        <Select 
                          value={pendingChanges[participant.id]?.week_interval ?? participant.week_interval ?? ''}
                          onValueChange={(newInterval) => {
                            setPendingChanges(prev => ({
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
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Save button */}
                      <Button
                        size="sm"
                        className="w-full h-7 text-xs"
                        disabled={!pendingChanges[participant.id] || updatingStatuses.has(participant.id)}
                        onClick={() => handleSaveChanges(participant)}
                      >
                        {updatingStatuses.has(participant.id) ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Mobile layout */}
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
                          value={pendingChanges[participant.id]?.admin_status ?? participant.admin_status ?? 'past'}
                          onValueChange={(newStatus) => {
                            setPendingChanges(prev => ({
                              ...prev,
                              [participant.id]: {
                                ...prev[participant.id],
                                admin_status: newStatus
                              }
                            }));
                          }}
                        >
                          <SelectTrigger className={`w-full h-6 text-xs ${getStatusBackgroundColor(pendingChanges[participant.id]?.admin_status ?? participant.admin_status ?? 'past')}`}>
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

                      {/* Week interval selector */}
                      <div>
                        <div className="font-semibold mb-1 text-xs">Week Interval:</div>
                        <Select
                          value={pendingChanges[participant.id]?.week_interval ?? participant.week_interval ?? ''}
                          onValueChange={(newInterval) => {
                            setPendingChanges(prev => ({
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
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Save button */}
                      <Button
                        size="sm"
                        className="w-full h-7 text-xs"
                        disabled={!pendingChanges[participant.id] || updatingStatuses.has(participant.id)}
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
