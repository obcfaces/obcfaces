import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, ThumbsUp, ThumbsDown, MoreVertical, History } from 'lucide-react';
import { WeeklyContestParticipant } from '@/types/admin';
import { LoadingSpinner } from '../LoadingSpinner';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { useApplicationHistory } from '@/hooks/useApplicationHistory';
import { ParticipantStatusHistoryModal } from '../ParticipantStatusHistoryModal';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminNextWeekTabProps {
  participants: WeeklyContestParticipant[];
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onViewVoters: (participantName: string) => void;
  onStatusChange: (participant: WeeklyContestParticipant, newStatus: string) => Promise<void>;
  onEdit: (participant: any) => void;
  loading?: boolean;
}

export function AdminNextWeekTab({
  participants,
  onViewPhotos,
  onViewVoters,
  onStatusChange,
  onEdit,
  loading = false,
}: AdminNextWeekTabProps) {
  const { selectedCountry } = useAdminCountry();
  const [filterType, setFilterType] = useState<'all' | 'like' | 'dislike'>('all');
  const [filterDay, setFilterDay] = useState<string | null>(null);
  const [votesStats, setVotesStats] = useState<Record<string, { like_count: number; dislike_count: number }>>({});
  const [allVotesData, setAllVotesData] = useState<any[]>([]);

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const country = p.application_data?.country || p.profiles?.country;
      return country === selectedCountry;
    });
  }, [participants, selectedCountry]);

  useEffect(() => {
    const fetchVotesStats = async () => {
      const { data, error } = await supabase
        .from('next_week_votes')
        .select('*');

      if (error || !data) return;

      setAllVotesData(data);

      const stats: Record<string, { like_count: number; dislike_count: number }> = {};
      
      // Count each vote record as 1 vote (each record represents one user's vote)
      data.forEach(vote => {
        if (!stats[vote.candidate_name]) {
          stats[vote.candidate_name] = { like_count: 0, dislike_count: 0 };
        }
        if (vote.vote_type === 'like') {
          stats[vote.candidate_name].like_count += 1;
        } else if (vote.vote_type === 'dislike') {
          stats[vote.candidate_name].dislike_count += 1;
        }
      });

      setVotesStats(stats);
    };

    fetchVotesStats();
  }, []);

  // Calculate weekly statistics by day
  const weeklyStats = useMemo(() => {
    const stats = {
      like: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
      dislike: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
    };

    const nowUtc = new Date();
    const currentDayOfWeek = nowUtc.getUTCDay();
    const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const weekStartUtc = new Date(Date.UTC(
      nowUtc.getUTCFullYear(),
      nowUtc.getUTCMonth(),
      nowUtc.getUTCDate() - daysFromMonday,
      0, 0, 0, 0
    ));
    
    const weekEndUtc = new Date(weekStartUtc);
    weekEndUtc.setUTCDate(weekStartUtc.getUTCDate() + 6);
    weekEndUtc.setUTCHours(23, 59, 59, 999);

    allVotesData.forEach(vote => {
      const createdAtUtc = new Date(vote.created_at);
      
      if (createdAtUtc < weekStartUtc || createdAtUtc > weekEndUtc) {
        return;
      }

      const dayOfWeek = createdAtUtc.getUTCDay();
      const dayMap: { [key: number]: keyof typeof stats.like } = {
        1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 0: 'sun'
      };
      const day = dayMap[dayOfWeek];

      // Count each vote as 1 (each record is one user's vote)
      if (vote.vote_type === 'like') {
        stats.like[day] += 1;
      } else if (vote.vote_type === 'dislike') {
        stats.dislike[day] += 1;
      }
    });

    return stats;
  }, [allVotesData]);

  // Get current week dates for table headers
  const weekDates = useMemo(() => {
    const nowUtc = new Date();
    const currentDayOfWeek = nowUtc.getUTCDay();
    const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const monday = new Date(Date.UTC(
      nowUtc.getUTCFullYear(),
      nowUtc.getUTCMonth(),
      nowUtc.getUTCDate() - daysFromMonday
    ));

    const dates: Record<string, string> = {};
    (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).forEach((day, index) => {
      const date = new Date(monday);
      date.setUTCDate(monday.getUTCDate() + index);
      dates[day] = `${date.getUTCDate()}/${date.getUTCMonth() + 1}`;
    });

    return dates;
  }, []);

  const totalStats = useMemo(() => {
    const total = { like: 0, dislike: 0 };
    Object.values(votesStats).forEach(stat => {
      total.like += stat.like_count;
      total.dislike += stat.dislike_count;
    });
    return total;
  }, [votesStats]);

  const displayParticipants = useMemo(() => {
    let result = filteredParticipants;

    // Filter by vote type
    if (filterType !== 'all') {
      result = result.filter(p => {
        const name = `${p.application_data?.first_name || ''} ${p.application_data?.last_name || ''}`.trim();
        const stats = votesStats[name];
        if (!stats) return false;
        
        if (filterType === 'like') return stats.like_count > 0;
        if (filterType === 'dislike') return stats.dislike_count > 0;
        return false;
      });
    }

    // Filter by day
    if (filterDay && filterType !== 'all') {
      result = result.filter(p => {
        const name = `${p.application_data?.first_name || ''} ${p.application_data?.last_name || ''}`.trim();
        
        const nowUtc = new Date();
        const currentDayOfWeek = nowUtc.getUTCDay();
        const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
        const weekStartUtc = new Date(Date.UTC(
          nowUtc.getUTCFullYear(),
          nowUtc.getUTCMonth(),
          nowUtc.getUTCDate() - daysFromMonday,
          0, 0, 0, 0
        ));

        const hasVoteOnDay = allVotesData.some(vote => {
          if (vote.candidate_name !== name) return false;
          if (vote.vote_type !== filterType) return false;

          const createdAtUtc = new Date(vote.created_at);
          const dayOfWeek = createdAtUtc.getUTCDay();
          const dayMap: { [key: number]: string } = {
            1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 0: 'sun'
          };
          const voteDay = dayMap[dayOfWeek];

          return voteDay === filterDay;
        });

        return hasVoteOnDay;
      });
    }

    return result;
  }, [filteredParticipants, filterType, filterDay, votesStats, allVotesData]);

  const handleCellClick = (day: string, type: 'like' | 'dislike') => {
    if (filterDay === day && filterType === type) {
      setFilterDay(null);
      setFilterType('all');
    } else {
      setFilterDay(day);
      setFilterType(type);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading next week participants..." />;
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

  return (
    <div className="space-y-4">
      {/* Votes Statistics Table */}
      <div className="mb-6 p-2 md:p-4 bg-muted rounded-lg">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-1 py-2 md:p-2 font-medium text-[10px] md:text-xs">Type</th>
                {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map((dayName, idx) => (
                  <th key={dayName} className="text-center px-0.5 py-2 md:p-2 font-medium text-[10px] md:text-xs">
                    <div className="leading-tight">{dayName}</div>
                    <div className="text-[8px] md:text-[10px] text-muted-foreground font-normal">
                      {weekDates[(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const)[idx]]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="text-left px-1 py-2 md:p-2 text-green-600 dark:text-green-500 text-[10px] md:text-xs">Like</td>
                {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map(day => {
                  const count = weeklyStats.like[day];
                  const isActive = filterDay === day && filterType === 'like';
                  return (
                    <td 
                      key={day}
                      className={`text-center px-0.5 py-2 md:p-2 text-green-600 dark:text-green-500 cursor-pointer hover:bg-accent/50 ${isActive ? 'bg-accent font-bold' : ''} text-sm md:text-base font-semibold`}
                      onClick={() => handleCellClick(day, 'like')}
                    >
                      {count}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b border-border/50">
                <td className="text-left px-1 py-2 md:p-2 text-red-500 text-[10px] md:text-xs">Dislike</td>
                {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map(day => {
                  const count = weeklyStats.dislike[day];
                  const isActive = filterDay === day && filterType === 'dislike';
                  return (
                    <td 
                      key={day}
                      className={`text-center px-0.5 py-2 md:p-2 text-red-500 cursor-pointer hover:bg-accent/50 ${isActive ? 'bg-accent font-bold' : ''} text-sm md:text-base font-semibold`}
                      onClick={() => handleCellClick(day, 'dislike')}
                    >
                      {count}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="text-2xl font-bold">
        Next Week ({displayParticipants.length})
        {(filterType !== 'all' || filterDay) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setFilterType('all');
              setFilterDay(null);
            }}
            className="ml-2"
          >
            Clear filter
          </Button>
        )}
      </h2>

      {displayParticipants.map((participant) => (
        <ParticipantCardWithHistory 
          key={participant.id}
          participant={participant}
          onViewPhotos={onViewPhotos}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onViewVoters={onViewVoters}
          getStatusBackgroundColor={getStatusBackgroundColor}
          votesStats={votesStats}
        />
      ))}

      {displayParticipants.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {filterType === 'all' ? 'No participants for next week' : `No participants with ${filterType}s`}
        </div>
      )}
    </div>
  );
}

// Separate component with history hook
const ParticipantCardWithHistory = ({
  participant,
  onViewPhotos,
  onStatusChange,
  onEdit,
  onViewVoters,
  getStatusBackgroundColor,
  votesStats,
}: any) => {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [showStatusHistoryModal, setShowStatusHistoryModal] = useState(false);
  const [showVotersModal, setShowVotersModal] = useState(false);
  const [votersType, setVotersType] = useState<'like' | 'dislike'>('like');
  const [voters, setVoters] = useState<any[]>([]);
  const { history } = useApplicationHistory(participant.id);
  
  const historyCount = history.length;
  const appData = participant.application_data || {};
  const firstName = appData.first_name || '';
  const lastName = appData.last_name || '';
  const photo1 = appData.photo_1_url || appData.photo1_url || '';
  const photo2 = appData.photo_2_url || appData.photo2_url || '';
  const participantName = `${firstName} ${lastName}`;
  const submittedDate = participant.created_at ? new Date(participant.created_at) : null;

  const stats = votesStats[participantName] || { like_count: 0, dislike_count: 0 };

  const handleShowVoters = async (type: 'like' | 'dislike') => {
    setVotersType(type);
    
    // Get votes first
    const { data: votesData, error: votesError } = await supabase
      .from('next_week_votes')
      .select('user_id, vote_type, created_at')
      .eq('candidate_name', participantName)
      .eq('vote_type', type);

    if (votesError) {
      console.error('Error fetching voters:', votesError);
      return;
    }

    if (!votesData || votesData.length === 0) {
      setVoters([]);
      setShowVotersModal(true);
      return;
    }

    // Get user profiles separately
    const userIds = votesData.map(v => v.user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, first_name, last_name, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setVoters(votesData.map(v => ({ ...v, profiles: null })));
    } else {
      // Merge votes with profiles
      const votersWithProfiles = votesData.map(vote => ({
        ...vote,
        profiles: profilesData?.find(p => p.id === vote.user_id) || null
      }));
      setVoters(votersWithProfiles);
    }

    setShowVotersModal(true);
  };

  return (
    <>
      <Card className="overflow-hidden relative rounded-none md:rounded-lg h-[149px]">
        <CardContent className="p-0">
          {/* Date/Time badge - left top corner - SMALLER */}
          {submittedDate && (
            <Badge 
              variant="outline" 
              className="absolute top-0 left-0 z-20 text-[10px] rounded-none rounded-br-md font-normal bg-muted/90 border-border px-1.5 py-0 h-5"
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

          {/* History badge - same style as edit button */}
          {historyCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="absolute bottom-0 left-6 z-20 p-0.5 m-0 rounded-none rounded-tr-md border-0 border-t border-r bg-background/90 hover:bg-background w-5 h-5 flex items-center justify-center"
              title={`${historyCount} version${historyCount > 1 ? 's' : ''}`}
            >
              <span className="text-[10px] font-bold">{historyCount}</span>
            </Button>
          )}

          {/* Three dots menu - top right corner */}
          <div className="absolute top-0 right-0 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 rounded-none rounded-bl-md hover:bg-background/90 bg-background/80"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[9999]">
                <DropdownMenuItem onClick={() => setShowStatusHistoryModal(true)}>
                  <History className="h-3.5 w-3.5 mr-2" />
                  History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Edit button in bottom left corner - SMALLER */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(participant)}
            className="absolute bottom-0 left-0 z-20 p-0.5 m-0 rounded-none rounded-tr-md border-0 border-t border-r bg-background/90 hover:bg-background w-5 h-5"
            title="Edit Application"
          >
            <Edit className="w-3 h-3" />
          </Button>

          {/* Desktop layout */}
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
                  {['this week', 'next week', 'next week on site'].includes(participant.admin_status || '') && (
                    <Badge variant="outline" className="absolute bottom-1 left-1 text-[10px] px-1 py-0 h-4 bg-green-500/90 text-white border-green-600 shadow-sm">
                      on site
                    </Badge>
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
                  <span className="text-xs font-semibold">
                    {appData.birth_year ? `${new Date().getFullYear() - parseInt(appData.birth_year)}, ` : ''}{firstName} {lastName}
                  </span>
                </div>
                
                <div className="text-xs text-muted-foreground mb-1">
                  {appData.city}, {appData.country}
                </div>

                {/* Like/Dislike Display */}
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                    onClick={() => handleShowVoters('like')}
                  >
                    <ThumbsUp className="h-3 w-3 text-green-600 fill-green-600" />
                    <span className="text-xs font-semibold text-green-600">
                      {stats.like_count}
                    </span>
                  </div>
                  <div 
                    className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                    onClick={() => handleShowVoters('dislike')}
                  >
                    <ThumbsDown className="h-3 w-3 text-red-500 fill-red-500" />
                    <span className="text-xs font-semibold text-red-500">
                      {stats.dislike_count}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Select 
                    value={participant.admin_status || 'next week'} 
                    onValueChange={async (value) => {
                      await onStatusChange(participant, value);
                    }}
                  >
                    <SelectTrigger className={`w-[110px] h-6 text-xs ${getStatusBackgroundColor(participant.admin_status || 'next week')}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-popover border shadow-lg">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="pre next week">Pre Next Week</SelectItem>
                      <SelectItem value="next week on site">Next Week on Site</SelectItem>
                      <SelectItem value="next week">Next Week</SelectItem>
                      <SelectItem value="this week">This Week</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="md:hidden flex h-[149px]">
            {/* Photos section - Fixed width */}
            <div className="flex gap-px w-[200px] flex-shrink-0 h-[149px]">
              {photo1 && (
                <div className="w-[100px] h-[149px] flex-shrink-0">
                  <img 
                    src={photo1} 
                    alt="Portrait" 
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, participantName)}
                  />
                </div>
              )}
              {photo2 && (
                <div className="w-[100px] h-[149px] flex-shrink-0">
                  <img 
                    src={photo2} 
                    alt="Full length" 
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 1, participantName)}
                  />
                </div>
              )}
            </div>

            {/* Info section */}
            <div className="flex-1 p-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs font-semibold">
                    {appData.birth_year ? `${new Date().getFullYear() - parseInt(appData.birth_year)}, ` : ''}{firstName} {lastName}
                  </span>
                </div>
                
                <div className="text-xs text-muted-foreground mb-1">
                  {appData.city}, {appData.country}
                </div>

                <div className="flex items-center gap-3 mb-1">
                  <span 
                    className="text-[10px] cursor-pointer hover:opacity-80 text-green-600 font-semibold"
                    onClick={() => handleShowVoters('like')}
                  >
                    👍 {stats.like_count}
                  </span>
                  <span 
                    className="text-[10px] cursor-pointer hover:opacity-80 text-red-500 font-semibold"
                    onClick={() => handleShowVoters('dislike')}
                  >
                    👎 {stats.dislike_count}
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-1">
                  <Select 
                    value={participant.admin_status || 'next week'}
                    onValueChange={async (value) => {
                      await onStatusChange(participant, value);
                    }}
                  >
                    <SelectTrigger className={`w-[100px] text-[10px] h-5 ${getStatusBackgroundColor(participant.admin_status || 'next week')}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-popover border shadow-lg">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="pre next week">Pre Next Week</SelectItem>
                      <SelectItem value="next week on site">Next Week on Site</SelectItem>
                      <SelectItem value="next week">Next Week</SelectItem>
                      <SelectItem value="this week">This Week</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status History Modal */}
      {showStatusHistoryModal && (
        <ParticipantStatusHistoryModal
          participantId={participant.id}
          participantName={participantName}
          statusHistory={participant.status_history}
          isOpen={showStatusHistoryModal}
          onClose={() => setShowStatusHistoryModal(false)}
        />
      )}

      {/* Voters Modal */}
      <Dialog open={showVotersModal} onOpenChange={setShowVotersModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {votersType === 'like' ? (
                <>
                  <ThumbsUp className="h-5 w-5 text-green-600 fill-green-600" />
                  <span>Likes ({stats.like_count})</span>
                </>
              ) : (
                <>
                  <ThumbsDown className="h-5 w-5 text-red-500 fill-red-500" />
                  <span>Dislikes ({stats.dislike_count})</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {voters.map((voter) => {
                const profile = voter.profiles as any;
                return (
                  <div key={voter.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>
                        {(profile?.display_name || profile?.first_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {profile?.display_name || `${profile?.first_name} ${profile?.last_name}` || 'Unknown User'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(voter.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {voters.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No {votersType}s yet
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
