import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Heart, Star, ThumbsUp, ThumbsDown, Trophy, MoreVertical, History, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { WeeklyContestParticipant, ContestApplication } from '@/types/admin';
import { LoadingSpinner } from '../LoadingSpinner';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { useApplicationHistory } from '@/hooks/useApplicationHistory';
import { Country } from 'country-state-city';
import { ParticipantStatusHistoryModal } from '../ParticipantStatusHistoryModal';
import { REJECTION_REASONS } from '../RejectReasonModal';

interface UnifiedParticipantTabProps {
  participants: WeeklyContestParticipant[] | ContestApplication[];
  tabType: 'pre-next' | 'next' | 'this' | 'past' | 'new';
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onStatusChange?: (participant: WeeklyContestParticipant | ContestApplication, newStatus: string) => Promise<void>;
  onEdit?: (participant: any) => void;
  onViewVoters?: (participant: { id: string; name: string }) => void;
  onViewLikeDislike?: (participantName: string, type: 'like' | 'dislike') => void;
  onDelete?: (participant: WeeklyContestParticipant | ContestApplication) => void;
  onRestore?: (participant: WeeklyContestParticipant | ContestApplication) => void;
  onApprove?: (participant: ContestApplication) => void;
  onReject?: (participant: ContestApplication) => void;
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
  onDelete,
  onRestore,
  onApprove,
  onReject,
  loading = false,
  weekIntervalFilter = 'all',
  setWeekIntervalFilter,
  availableIntervals = [],
}: UnifiedParticipantTabProps) {
  const { selectedCountry } = useAdminCountry();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showStatusHistoryModal, setShowStatusHistoryModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);

  const filteredParticipants = useMemo(() => {
    let filtered = participants.filter(p => {
      const country = p.application_data?.country || ('profiles' in p ? p.profiles?.country : undefined);
      return country === selectedCountry;
    });

    // Filter by status for THIS tab - only "this week"
    if (tabType === 'this') {
      filtered = filtered.filter(p => p.admin_status === 'this week');
    }

    // Apply week interval filter for past tab
    if (tabType === 'past' && weekIntervalFilter !== 'all') {
      filtered = filtered.filter(p => 'week_interval' in p && p.week_interval === weekIntervalFilter);
    }

    // Sort by rating for this and past tabs (only for WeeklyContestParticipant)
    if (tabType === 'this' || tabType === 'past') {
      filtered.sort((a, b) => {
        const aRank = 'final_rank' in a ? a.final_rank : undefined;
        const bRank = 'final_rank' in b ? b.final_rank : undefined;
        
        if (aRank && !bRank) return -1;
        if (!aRank && bRank) return 1;
        if (aRank && bRank) return aRank - bRank;
        
        const ratingA = 'average_rating' in a ? Number(a.average_rating) || 0 : 0;
        const ratingB = 'average_rating' in b ? Number(b.average_rating) || 0 : 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        
        const votesA = 'total_votes' in a ? Number(a.total_votes) || 0 : 0;
        const votesB = 'total_votes' in b ? Number(b.total_votes) || 0 : 0;
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
    <div className="space-y-4 md:space-y-4">
      <div className="flex items-center justify-between px-4 md:px-0">
        <h2 className="text-2xl font-bold">{getTitle()} ({filteredParticipants.length})</h2>
      </div>

      {/* Week Interval Filter for Past tab */}
      {tabType === 'past' && setWeekIntervalFilter && (
        <div className="flex gap-2 flex-wrap px-4 md:px-0">
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

      {/* Карточки - среднее между полным размером и -mx-4 */}
      {/* ТЕКУЩЕЕ: space-y-4 без отступов */}
      {/* ПРЕДЫДУЩЕЕ БЫЛО: -mx-4 md:mx-0 (растягивание на мобайл) */}
      {/* СРЕДНЕЕ РЕШЕНИЕ: -mx-2 md:mx-0 (небольшое растягивание) */}
      <div className="space-y-4 md:space-y-4 -mx-2 md:mx-0">
        {filteredParticipants.map((participant) => (
          <ParticipantCardWithHistory
            key={participant.id}
            participant={participant}
            tabType={tabType}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            onViewPhotos={onViewPhotos}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onRestore={onRestore}
            onViewStatusHistory={(id: string, name: string, statusHistory: any) => {
              setSelectedParticipant({ id, name, statusHistory });
              setShowStatusHistoryModal(true);
            }}
            onViewVoters={onViewVoters}
            onViewLikeDislike={onViewLikeDislike}
            onApprove={onApprove}
            onReject={onReject}
            getStatusBackgroundColor={getStatusBackgroundColor}
            getParticipantVotes={getParticipantVotes}
          />
        ))}
      </div>

      {filteredParticipants.length === 0 && (
        <div className="text-center py-12 text-muted-foreground px-4 md:px-0">
          No participants for {getTitle()}
        </div>
      )}

      {/* Status History Modal */}
      {showStatusHistoryModal && selectedParticipant && (
        <ParticipantStatusHistoryModal
          isOpen={showStatusHistoryModal}
          onClose={() => {
            setShowStatusHistoryModal(false);
            setSelectedParticipant(null);
          }}
          participantId={selectedParticipant.id}
          participantName={selectedParticipant.name}
          statusHistory={selectedParticipant.statusHistory}
        />
      )}
    </div>
  );
}

// Separate component with history hook - same layout as New Applications
const ParticipantCardWithHistory = ({
  participant,
  tabType,
  expandedId,
  setExpandedId,
  onViewPhotos,
  onEdit,
  onStatusChange,
  onDelete,
  onRestore,
  onViewStatusHistory,
  onViewVoters,
  onViewLikeDislike,
  onApprove,
  onReject,
  getStatusBackgroundColor,
  getParticipantVotes,
}: any) => {
  const { history, loading } = useApplicationHistory(participant.id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const historyCount = history.length;
  const appData = participant.application_data || {};
  const firstName = appData.first_name || appData.firstName || '';
  const lastName = appData.last_name || appData.lastName || '';
  const photo1 = appData.photo_1_url || appData.photo1_url || appData.photo1Url || appData.photoUrl1 || '';
  const photo2 = appData.photo_2_url || appData.photo2_url || appData.photo2Url || appData.photoUrl2 || '';
  const participantName = `${firstName} ${lastName}`;
  const isWinner = 'final_rank' in participant && participant.final_rank === 1;
  const votes = getParticipantVotes(participantName);

  // Get rejection reasons if rejected
  const rejectionReasons = participant.admin_status === 'rejected' && appData.rejection_reason_types
    ? appData.rejection_reason_types
    : [];

  // Get the latest status change date
  const getLatestStatusChangeDate = () => {
    const statusHistory = participant.status_history;
    if (!statusHistory || typeof statusHistory !== 'object') {
      return participant.submitted_at ? new Date(participant.submitted_at) : participant.created_at ? new Date(participant.created_at) : null;
    }
    
    const dates: Date[] = [];
    Object.entries(statusHistory).forEach(([key, data]: [string, any]) => {
      if (key === 'changed_at' || key === 'changed_by' || key === 'change_reason') return;
      if (!data || typeof data !== 'object') return;
      const dateStr = data.changed_at || data.timestamp;
      if (dateStr) dates.push(new Date(dateStr));
    });
    
    if (dates.length > 0) {
      return new Date(Math.max(...dates.map(d => d.getTime())));
    }
    return participant.submitted_at ? new Date(participant.submitted_at) : participant.created_at ? new Date(participant.created_at) : null;
  };
  
  const submittedDate = getLatestStatusChangeDate();

  return (
    <>
      <Card className={`overflow-hidden relative rounded-lg md:rounded-lg h-[149px] ${participant.admin_status === 'rejected' ? 'bg-red-50 border-red-200' : ''} ${participant.deleted_at ? 'opacity-60' : ''} ${isWinner ? 'border-yellow-500' : ''}`}>
        <CardContent className="p-0">
          {/* Date/Time badge - left top corner */}
          {submittedDate && (
            <Badge 
              variant="outline" 
              className="absolute top-0 left-0 z-20 text-xs rounded-none rounded-br-md font-normal bg-muted/90 border-border"
            >
              {submittedDate.toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short' 
              })} {submittedDate.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </Badge>
          )}

          {/* History badge - right of edit button */}
          {historyCount > 0 && (
            <div
              className="absolute bottom-0 left-8 z-20 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-primary/90 shadow-lg transition-all border-2 border-background"
              onClick={() => onViewStatusHistory && onViewStatusHistory(participant.id, participantName, participant.status_history)}
              title={`${historyCount} version${historyCount > 1 ? 's' : ''} - click to view history`}
            >
              {historyCount}
            </div>
          )}

          {/* Three dots menu - top right corner */}
          <div className="absolute top-0 right-0 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-none rounded-bl-md hover:bg-background/90 bg-background/80"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[9999]">
                <DropdownMenuItem
                  onClick={() => onViewStatusHistory && onViewStatusHistory(participant.id, participantName, participant.status_history)}
                >
                  <History className="h-3.5 w-3.5 mr-2" />
                  History
                </DropdownMenuItem>
                {onDelete && onRestore && (
                  <DropdownMenuItem
                    onClick={() => {
                      if (participant.deleted_at) {
                        onRestore(participant);
                      } else {
                        onDelete(participant);
                      }
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    {participant.deleted_at ? 'Restore' : 'Delete'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        {/* Edit button in bottom left corner - not shown for past */}
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
        
        {/* Desktop/Tablet layout - same as New Applications */}
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
                {['this week', 'next week', 'pre next week'].includes(participant.admin_status || '') && (
                  <Badge variant="outline" className="absolute bottom-1 left-1 text-[10px] px-1 py-0 h-4 bg-green-500/90 text-white border-green-600 shadow-sm">
                    on site
                  </Badge>
                )}
                {isWinner && (
                  <div className="absolute top-1 left-1">
                    <Trophy className="h-5 w-5 text-yellow-500 drop-shadow-lg" />
                  </div>
                )}
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

          {/* Info section */}
          <div className="flex-1 p-2 flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <Avatar className="h-5 w-5 flex-shrink-0">
                  <AvatarImage src={photo1 || ''} />
                  <AvatarFallback className="text-[10px]">
                    {firstName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold">
                  {firstName} {lastName} {appData.birth_year ? new Date().getFullYear() - parseInt(appData.birth_year) : ''}
                </span>
              </div>
              <div 
                className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1 mb-1"
                onClick={() => setExpandedId(expandedId === participant.id ? null : participant.id)}
                title="Click to view full application data"
              >
                <span>{appData.city}, {appData.country}</span>
                {expandedId === participant.id ? (
                  <ChevronUp className="h-2.5 w-2.5" />
                ) : (
                  <ChevronDown className="h-2.5 w-2.5" />
                )}
              </div>
              
              {/* Expandable application data */}
              {expandedId === participant.id && (
                <div className="text-xs text-muted-foreground mt-1 max-h-32 md:max-h-40 overflow-y-auto overflow-x-hidden space-y-1 pr-1">
                  <div>
                    {Object.entries(appData).map(([key, value], index) => {
                      if (key.includes('url') || key.includes('photo') || key === 'phone' || !value) return null;
                      return (
                        <span key={key}>
                          {String(value)}
                          {index < Object.entries(appData).filter(([k, v]) => !k.includes('url') && !k.includes('photo') && k !== 'phone' && v).length - 1 ? ', ' : ''}
                        </span>
                      );
                    })}
                  </div>
                  
                  {/* Facebook Link */}
                  <div className="pt-1">
                    {appData.facebook_url ? (
                      <a 
                        href={appData.facebook_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all"
                      >
                        {appData.facebook_url}
                      </a>
                    ) : appData.cached_facebook_url ? (
                      <a 
                        href={appData.cached_facebook_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 underline break-all"
                      >
                        save {appData.cached_facebook_url}
                      </a>
                    ) : (
                      <span className="text-muted-foreground/60">no fb</span>
                    )}
                  </div>
                  
                  {/* Phone */}
                  <div>
                    {appData.phone?.number ? (
                      <span>
                        {appData.phone.country_code && `+${Country.getCountryByCode(appData.phone.country_code)?.phonecode || ''} `}
                        {appData.phone.number}
                      </span>
                    ) : appData.cached_phone?.number ? (
                      <span className="text-orange-600 dark:text-orange-400">
                        save {appData.cached_phone.country_code && `+${Country.getCountryByCode(appData.cached_phone.country_code)?.phonecode || ''} `}
                        {appData.cached_phone.number}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">no tel</span>
                    )}
                  </div>
                </div>
              )}

              {/* Stats based on tab type */}
              <div className="flex items-center gap-2 mt-1">
                {/* Next Week: Like/Dislike */}
                {tabType === 'next' && onViewLikeDislike && (
                  <>
                    <div 
                      className="flex items-center gap-0.5 cursor-pointer hover:opacity-80"
                      onClick={() => onViewLikeDislike(participantName, 'like')}
                    >
                      <ThumbsUp className="h-3 w-3 text-green-500 fill-green-500" />
                      <span className="text-[10px] font-semibold">{votes.likes}</span>
                    </div>
                    <div 
                      className="flex items-center gap-0.5 cursor-pointer hover:opacity-80"
                      onClick={() => onViewLikeDislike(participantName, 'dislike')}
                    >
                      <ThumbsDown className="h-3 w-3 text-red-500 fill-red-500" />
                      <span className="text-[10px] font-semibold">{votes.dislikes}</span>
                    </div>
                  </>
                )}

                {/* This Week & Past: Rating and Votes */}
                {(tabType === 'this' || tabType === 'past') && onViewVoters && (
                  <>
                    <div 
                      className="flex items-center gap-0.5 cursor-pointer hover:opacity-80"
                      onClick={() => onViewVoters({ id: participant.id, name: participantName })}
                    >
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-[10px] font-semibold">
                        {Number(participant.average_rating || 0).toFixed(1)}
                      </span>
                    </div>
                    <div 
                      className="flex items-center gap-0.5 cursor-pointer hover:opacity-80"
                      onClick={() => onViewVoters({ id: participant.id, name: participantName })}
                    >
                      <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
                      <span className="text-[10px] font-semibold">
                        {participant.total_votes || 0}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status dropdown */}
            <div className="flex items-center gap-1">
              <Select 
                value={participant.admin_status || tabType} 
                onValueChange={async (value) => {
                  await onStatusChange(participant, value);
                }}
              >
                <SelectTrigger className={`w-20 h-6 text-[10px] ${getStatusBackgroundColor(participant.admin_status || tabType)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
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

        {/* Mobile layout - same as New Applications */}
        <div className="md:hidden flex h-[149px]">
          {/* Photos section - Fixed width как в New */}
          <div className="flex gap-px w-[200px] flex-shrink-0 h-[149px]">
            {photo1 && (
              <div className="w-[100px] h-[149px] flex-shrink-0 overflow-hidden">
                <img 
                  src={photo1} 
                  alt="Portrait" 
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, participantName)}
                />
                {isWinner && (
                  <div className="absolute top-1 left-1">
                    <Trophy className="h-4 w-4 text-yellow-500 drop-shadow-lg" />
                  </div>
                )}
              </div>
            )}
            {photo2 && (
              <div className="w-[100px] h-[149px] flex-shrink-0 overflow-hidden">
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
          
          {/* Info section - same as New */}
          <div className="flex-1 p-2 flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <Avatar className="h-5 w-5 flex-shrink-0">
                  <AvatarImage src={photo1 || ''} />
                  <AvatarFallback className="text-[10px]">
                    {firstName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold">
                  {firstName} {lastName} {appData.birth_year ? new Date().getFullYear() - parseInt(appData.birth_year) : ''}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mb-1">
                {appData.city}, {appData.country}
              </div>
              
              {/* Stats for mobile */}
              <div className="flex items-center gap-2 text-[10px] mt-1">
                {tabType === 'next' && onViewLikeDislike && (
                  <>
                    <div 
                      className="flex items-center gap-0.5 cursor-pointer hover:opacity-80"
                      onClick={() => onViewLikeDislike(participantName, 'like')}
                    >
                      <ThumbsUp className="h-3 w-3 text-green-500 fill-green-500" />
                      <span className="font-semibold">{votes.likes}</span>
                    </div>
                    <div 
                      className="flex items-center gap-0.5 cursor-pointer hover:opacity-80"
                      onClick={() => onViewLikeDislike(participantName, 'dislike')}
                    >
                      <ThumbsDown className="h-3 w-3 text-red-500 fill-red-500" />
                      <span className="font-semibold">{votes.dislikes}</span>
                    </div>
                  </>
                )}
                {(tabType === 'this' || tabType === 'past') && onViewVoters && (
                  <>
                    <div 
                      className="flex items-center gap-0.5 cursor-pointer hover:opacity-80"
                      onClick={() => onViewVoters({ id: participant.id, name: participantName })}
                    >
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{Number(participant.average_rating || 0).toFixed(1)}</span>
                    </div>
                    <div 
                      className="flex items-center gap-0.5 cursor-pointer hover:opacity-80"
                      onClick={() => onViewVoters({ id: participant.id, name: participantName })}
                    >
                      <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
                      <span className="font-semibold">{participant.total_votes || 0}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Status dropdown */}
            <div className="flex items-center gap-1">
              <Select 
                value={participant.admin_status || tabType} 
                onValueChange={async (value) => {
                  await onStatusChange(participant, value);
                }}
              >
                <SelectTrigger className={`w-[100px] text-[10px] h-5 ${getStatusBackgroundColor(participant.admin_status || tabType)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
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
      </CardContent>
    </Card>

    {/* Rejection reasons - показываем под карточкой для NEW и REJECTED */}
    {tabType === 'new' && participant.admin_status === 'rejected' && rejectionReasons.length > 0 && (
      <div className="mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
        <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Rejection Reasons:</p>
        <div className="flex flex-wrap gap-1">
          {rejectionReasons.map((reasonType: string, index: number) => {
            const reasonText = typeof REJECTION_REASONS === 'object' && REJECTION_REASONS[reasonType];
            return (
              <Badge key={index} variant="destructive" className="text-xs">
                {reasonText || reasonType}
              </Badge>
            );
          })}
        </div>
      </div>
    )}
    </>
  );
};
