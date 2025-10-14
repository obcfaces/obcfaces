import React, { useMemo, useState } from 'react';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Heart, Star, Trophy, Copy, Info } from 'lucide-react';
import { WeeklyContestParticipant } from '@/types/admin';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '../LoadingSpinner';
import { useApplicationHistory } from '@/hooks/useApplicationHistory';

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

export function AdminWeeklyTab({
  participants,
  statusFilter,
  onStatusFilterChange,
  onViewPhotos,
  onEdit,
  onStatusChange,
  onViewVoters,
  onViewStatusHistory,
  profiles = [],
  loading = false,
  dailyStats = [],
}: AdminWeeklyTabProps) {
  if (loading) {
    return <LoadingSpinner message="Loading this week participants..." />;
  }
  // Filter participants - show ONLY 'this week' status
  const filteredParticipants = useMemo(() => {
    // First filter: only 'this week' status
    const filteredByStatus = participants.filter(p => 
      p.admin_status === 'this week' && 
      (statusFilter === 'all' || p.admin_status === statusFilter)
    );

    // Remove duplicates based on user_id
    const uniqueParticipants = filteredByStatus.filter((participant, index, arr) => 
      arr.findIndex(p => p.user_id === participant.user_id) === index
    );
    
    // Sort participants by rating
    return uniqueParticipants.sort((a, b) => {
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
  }, [participants, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalVotes = filteredParticipants.reduce((sum, p) => sum + (p.total_votes || 0), 0);
    // Note: likes calculation would need dailyStats data from parent
    return { totalVotes };
  }, [filteredParticipants]);

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
      {/* Daily Statistics Table */}
      <div className="mb-4 p-3 bg-muted rounded-lg">
        <div className="text-sm text-muted-foreground space-y-2">
          <div className="text-xs">
            votes: {stats.totalVotes}, likes: {dailyStats.reduce((sum, stat) => sum + (stat.like_count || 0), 0)}
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs">
            {dailyStats.map((stat, index) => {
              // Format date as DD.MM
              const dateStr = stat.day_date ? 
                new Date(stat.day_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) 
                : '';
              
              return (
                <div key={index} className="text-center p-1 bg-background rounded">
                  <div className="font-medium text-xs">{stat.day_name}</div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">{dateStr}</div>
                  <div className="text-xs text-muted-foreground">
                    {stat.vote_count || 0}-{stat.like_count || 0}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Admin Status Filter */}
      <div className="mb-4">
        <Label className="text-sm font-medium mb-2 block">Admin Status Filter:</Label>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select admin status" />
          </SelectTrigger>
          <SelectContent className="z-[9999] bg-popover border shadow-lg">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="pre next week">Pre Next Week</SelectItem>
            <SelectItem value="next week">Next Week</SelectItem>
            <SelectItem value="this week">This Week</SelectItem>
            <SelectItem value="past">Past</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredParticipants.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg">
            {statusFilter === 'pending' 
              ? 'No pending applications found' 
              : statusFilter === 'rejected'
              ? 'No rejected applications found'
              : 'No weekly contest participants found'}
          </p>
        </div>
      ) : (
        filteredParticipants.map((participant) => {
          const participantProfile = profiles.find(p => p.id === participant.user_id);
          const appData = participant.application_data || {};
          const firstName = appData.first_name || '';
          const lastName = appData.last_name || '';
          const photo1 = appData.photo_1_url || appData.photo1_url || '';
          const photo2 = appData.photo_2_url || appData.photo2_url || '';
          const participantName = `${firstName} ${lastName}`;
          const isWinner = participant.final_rank === 1;

          return (
            <WeeklyParticipantCard
              key={participant.id}
              participant={participant}
              appData={appData}
              firstName={firstName}
              lastName={lastName}
              photo1={photo1}
              photo2={photo2}
              participantName={participantName}
              isWinner={isWinner}
              onViewPhotos={onViewPhotos}
              onEdit={onEdit}
              onStatusChange={onStatusChange}
              onViewVoters={onViewVoters}
              onViewStatusHistory={onViewStatusHistory}
              getStatusBackgroundColor={getStatusBackgroundColor}
            />
          );
        })
      )}
    </div>
  );
}

// Separate component with history
const WeeklyParticipantCard = ({
  participant,
  appData,
  firstName,
  lastName,
  photo1,
  photo2,
  participantName,
  isWinner,
  onViewPhotos,
  onEdit,
  onStatusChange,
  onViewVoters,
  onViewStatusHistory,
  getStatusBackgroundColor,
}: any) => {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const { history } = useApplicationHistory(participant.id);
  const historyCount = history.length;

  // Get submitted date
  const submittedDate = participant.created_at 
    ? new Date(participant.created_at) 
    : participant.submitted_at 
    ? new Date(participant.submitted_at) 
    : null;

  return (
    <div className="space-y-0">
      <Card className={`overflow-hidden relative rounded-none md:rounded-lg h-[149px] ${isWinner ? 'border-yellow-500' : ''}`}>
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
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              title={`${historyCount} version${historyCount > 1 ? 's' : ''} - click to expand versions`}
            >
              {historyCount}
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(participant)}
            className="absolute bottom-0 left-0 z-20 p-1 m-0 rounded-none rounded-tr-md border-0 border-t border-r bg-background/90 hover:bg-background"
            title="Edit Application"
          >
            <Edit className="w-4 h-4" />
          </Button>

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

                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-semibold">
                        {Number(participant.average_rating || 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => onViewVoters?.({ id: participant.id, name: participantName })}>
                      <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
                      <span className="text-xs font-semibold">
                        {participant.total_votes || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Select 
                      value={participant.admin_status || 'this week'} 
                      onValueChange={async (value) => {
                        await onStatusChange(participant, value);
                      }}
                    >
                      <SelectTrigger className={`w-24 h-7 text-xs ${getStatusBackgroundColor(participant.admin_status || 'this week')}`}>
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
                          <span>⭐ {Number(participant.average_rating || 0).toFixed(1)}</span>
                          <span>❤️ {participant.total_votes || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <Select 
                        value={participant.admin_status || 'this week'} 
                        onValueChange={async (value) => {
                          await onStatusChange(participant, value);
                        }}
                      >
                        <SelectTrigger className={`w-24 h-7 text-xs ${getStatusBackgroundColor(participant.admin_status || 'this week')}`}>
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
    </div>
  );
};
