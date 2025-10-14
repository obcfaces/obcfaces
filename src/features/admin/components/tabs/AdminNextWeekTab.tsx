import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [votesData, setVotesData] = useState<Record<string, { likes: number; dislikes: number }>>({});

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const country = p.application_data?.country || p.profiles?.country;
      return country === selectedCountry;
    });
  }, [participants, selectedCountry]);

  // Load votes data - aggregated directly from database
  useEffect(() => {
    const loadVotes = async () => {
      // Get all votes
      const { data: allVotes, error } = await supabase
        .from('next_week_votes')
        .select('candidate_name, vote_type');

      if (error) {
        console.error('❌ Error loading votes:', error);
        return;
      }

      if (!allVotes) {
        console.log('⚠️ No votes data');
        return;
      }

      console.log('📊 RAW VOTES DATA:', allVotes.length, 'records');

      // Calculate stats by counting each record
      const stats: Record<string, { likes: number; dislikes: number }> = {};
      
      allVotes.forEach(vote => {
        // Normalize name
        const name = vote.candidate_name.trim().replace(/\s+/g, ' ');
        
        if (!stats[name]) {
          stats[name] = { likes: 0, dislikes: 0 };
        }
        
        if (vote.vote_type === 'like') {
          stats[name].likes++;
        } else if (vote.vote_type === 'dislike') {
          stats[name].dislikes++;
        }
      });

      console.log('📊 CALCULATED VOTE STATS:', stats);
      setVotesData(stats);
    };

    loadVotes();
  }, []);

  const [weeklyVotes, setWeeklyVotes] = useState<any[]>([]);

  // Load votes with dates for weekly stats
  useEffect(() => {
    const loadWeeklyVotes = async () => {
      const { data, error } = await supabase
        .from('next_week_votes')
        .select('vote_type, created_at');

      if (error || !data) {
        console.error('Error loading weekly votes:', error);
        return;
      }

      setWeeklyVotes(data);
    };

    loadWeeklyVotes();
  }, []);

  // Calculate weekly statistics
  const weeklyStats = useMemo(() => {
    const stats = {
      like: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
      dislike: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
    };

    // Get current week boundaries
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysFromMonday,
      0, 0, 0, 0
    ));
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    // Count votes per day
    weeklyVotes.forEach(vote => {
      const voteDate = new Date(vote.created_at);
      
      // Check if vote is in current week
      if (voteDate >= monday && voteDate <= sunday) {
        const dayIndex = voteDate.getUTCDay();
        const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dayIndex];
        
        if (vote.vote_type === 'like') {
          stats.like[dayKey as keyof typeof stats.like]++;
        } else if (vote.vote_type === 'dislike') {
          stats.dislike[dayKey as keyof typeof stats.dislike]++;
        }
      }
    });

    return stats;
  }, [weeklyVotes]);

  // Week dates for table headers
  const weekDates = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysFromMonday
    ));

    const dates: Record<string, string> = {};
    ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach((day, index) => {
      const date = new Date(monday);
      date.setUTCDate(monday.getUTCDate() + index);
      dates[day] = `${date.getUTCDate()}/${date.getUTCMonth() + 1}`;
    });

    return dates;
  }, []);

  const totalStats = useMemo(() => {
    const total = { like: 0, dislike: 0 };
    Object.values(votesData).forEach(stat => {
      total.like += stat.likes;
      total.dislike += stat.dislikes;
    });
    return total;
  }, [votesData]);

  const displayParticipants = useMemo(() => {
    let result = filteredParticipants;

    if (filterType !== 'all') {
      result = result.filter(p => {
        const name = `${p.application_data?.first_name || ''} ${p.application_data?.last_name || ''}`.trim();
        const stats = votesData[name];
        if (!stats) return false;
        
        if (filterType === 'like') return stats.likes > 0;
        if (filterType === 'dislike') return stats.dislikes > 0;
        return false;
      });
    }

    return result;
  }, [filteredParticipants, filterType, votesData]);

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
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => (
                  <th key={dayName} className="text-center px-0.5 py-2 md:p-2 font-medium text-[10px] md:text-xs">
                    <div className="leading-tight">{dayName}</div>
                    <div className="text-[8px] md:text-[10px] text-muted-foreground font-normal">
                      {weekDates[['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][idx]]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="text-left px-1 py-2 md:p-2 text-green-600 dark:text-green-500 text-[10px] md:text-xs">Like</td>
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => {
                  const count = weeklyStats.like[day as keyof typeof weeklyStats.like];
                  return (
                    <td 
                      key={day}
                      className="text-center px-0.5 py-2 md:p-2 text-green-600 dark:text-green-500 text-sm md:text-base font-semibold"
                    >
                      {count}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b border-border/50">
                <td className="text-left px-1 py-2 md:p-2 text-red-500 text-[10px] md:text-xs">Dislike</td>
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => {
                  const count = weeklyStats.dislike[day as keyof typeof weeklyStats.dislike];
                  return (
                    <td 
                      key={day}
                      className="text-center px-0.5 py-2 md:p-2 text-red-500 text-sm md:text-base font-semibold"
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
        {filterType !== 'all' && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilterType('all')}
            className="ml-2"
          >
            Clear filter
          </Button>
        )}
      </h2>

      {displayParticipants.map((participant) => (
        <ParticipantCard 
          key={participant.id}
          participant={participant}
          onViewPhotos={onViewPhotos}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          getStatusBackgroundColor={getStatusBackgroundColor}
          votesData={votesData}
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

// Separate component for each participant card
const ParticipantCard = ({
  participant,
  onViewPhotos,
  onStatusChange,
  onEdit,
  getStatusBackgroundColor,
  votesData,
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
  // Normalize name: trim and replace multiple spaces with single space
  const participantName = `${firstName} ${lastName}`.trim().replace(/\s+/g, ' ');
  const submittedDate = participant.created_at ? new Date(participant.created_at) : null;

  // Get vote stats for this participant
  const stats = votesData[participantName] || { likes: 0, dislikes: 0 };
  
  console.log(`🔍 Card for "${participantName}": likes=${stats.likes}, dislikes=${stats.dislikes}`);

  const handleShowVoters = async (type: 'like' | 'dislike') => {
    setVotersType(type);
    
    const { data: votesData, error } = await supabase
      .from('next_week_votes')
      .select('user_id, vote_type, created_at')
      .eq('candidate_name', participantName)
      .eq('vote_type', type);

    if (error || !votesData) {
      console.error('Error fetching voters:', error);
      setVoters([]);
      setShowVotersModal(true);
      return;
    }

    // Get profiles
    const userIds = votesData.map(v => v.user_id);
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, last_name, avatar_url')
        .in('id', userIds);

      const votersWithProfiles = votesData.map(vote => ({
        ...vote,
        profiles: profilesData?.find(p => p.id === vote.user_id) || null
      }));
      setVoters(votersWithProfiles);
    } else {
      setVoters([]);
    }

    setShowVotersModal(true);
  };

  return (
    <>
      <Card className="overflow-hidden relative rounded-none md:rounded-lg h-[149px]">
        <CardContent className="p-0">
          {/* Date badge */}
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

          {/* History badge */}
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

          {/* Menu */}
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

          {/* Edit button */}
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
            {/* Photos */}
            <div className="flex gap-px w-[200px] flex-shrink-0 h-[149px]">
              {photo1 && (
                <div className="w-[100px] h-[149px] flex-shrink-0 relative overflow-hidden">
                  <img 
                    src={photo1} 
                    alt="Portrait" 
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                    onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, participantName)}
                  />
                </div>
              )}
              {photo2 && (
                <div className="w-[100px] h-[149px] flex-shrink-0 relative overflow-hidden">
                  <img 
                    src={photo2} 
                    alt="Full body" 
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                    onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 1, participantName)}
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-between px-4">
              <div>
                <h3 className="text-lg font-semibold">{participantName}</h3>
                <p className="text-sm text-muted-foreground">
                  {appData.city && appData.country && `${appData.city}, ${appData.country}`}
                </p>
                
                {/* Vote counts */}
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => handleShowVoters('like')}
                    className="flex items-center gap-1 text-green-600 dark:text-green-500 hover:opacity-80"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="font-semibold">{stats.likes}</span>
                  </button>
                  <button
                    onClick={() => handleShowVoters('dislike')}
                    className="flex items-center gap-1 text-red-500 hover:opacity-80"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span className="font-semibold">{stats.dislikes}</span>
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col items-end gap-2">
                <Select
                  value={participant.admin_status}
                  onValueChange={(value) => onStatusChange(participant, value)}
                >
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="pre next week">Pre Next Week</SelectItem>
                    <SelectItem value="next week">Next Week</SelectItem>
                    <SelectItem value="next week on site">Next Week On Site</SelectItem>
                    <SelectItem value="this week">This Week</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="flex md:hidden h-[149px]">
            {/* Photos */}
            <div className="flex gap-px w-[149px] flex-shrink-0">
              {photo1 && (
                <div className="w-[74px] h-[149px] relative overflow-hidden">
                  <img 
                    src={photo1} 
                    alt="Portrait" 
                    className="w-full h-full object-cover"
                    onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, participantName)}
                  />
                </div>
              )}
              {photo2 && (
                <div className="w-[74px] h-[149px] relative overflow-hidden">
                  <img 
                    src={photo2} 
                    alt="Full body" 
                    className="w-full h-full object-cover"
                    onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 1, participantName)}
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between p-2">
              <div>
                <h3 className="text-sm font-semibold line-clamp-1">
                  {appData.age && `${appData.age}, `}{participantName}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {appData.city}, {appData.country}
                </p>
                
                {/* Vote counts */}
                <div className="flex gap-3 mt-1">
                  <button
                    onClick={() => handleShowVoters('like')}
                    className="flex items-center gap-1 text-green-600 dark:text-green-500"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="text-sm font-semibold">{stats.likes}</span>
                  </button>
                  <button
                    onClick={() => handleShowVoters('dislike')}
                    className="flex items-center gap-1 text-red-500"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span className="text-sm font-semibold">{stats.dislikes}</span>
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="flex justify-end">
                <Select
                  value={participant.admin_status}
                  onValueChange={(value) => onStatusChange(participant, value)}
                >
                  <SelectTrigger className="w-[130px] h-7 text-xs bg-yellow-100 dark:bg-yellow-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="pre next week">Pre Next Week</SelectItem>
                    <SelectItem value="next week">Next Week</SelectItem>
                    <SelectItem value="next week on site">Next Week On Site</SelectItem>
                    <SelectItem value="this week">This Week</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ParticipantStatusHistoryModal
        isOpen={showStatusHistoryModal}
        onClose={() => setShowStatusHistoryModal(false)}
        participantId={participant.id}
        participantName={participantName}
      />

      {/* Voters Modal */}
      <Dialog open={showVotersModal} onOpenChange={setShowVotersModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {votersType === 'like' ? (
                <>
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                  <span>Likes ({voters.length})</span>
                </>
              ) : (
                <>
                  <ThumbsDown className="w-5 h-5 text-red-500" />
                  <span>Dislikes ({voters.length})</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {voters.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No {votersType}s yet
              </p>
            ) : (
              <div className="space-y-2 pr-4">
                {voters.map((voter, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {voter.profiles?.display_name || 
                         `${voter.profiles?.first_name || ''} ${voter.profiles?.last_name || ''}`.trim() ||
                         'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(voter.created_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
