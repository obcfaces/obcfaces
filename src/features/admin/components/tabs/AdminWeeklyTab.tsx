import React, { useMemo, useState } from 'react';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Heart, Star, Trophy, Copy, Info, MoreVertical, History, ChevronDown, ChevronUp } from 'lucide-react';
import { WeeklyContestParticipant } from '@/types/admin';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '../LoadingSpinner';
import { useApplicationHistory } from '@/hooks/useApplicationHistory';
import { Country } from 'country-state-city';
import { ParticipantStatusHistoryModal } from '../ParticipantStatusHistoryModal';

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showStatusHistoryModal, setShowStatusHistoryModal] = useState(false);
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
                <DropdownMenuItem
                  onClick={() => setShowStatusHistoryModal(true)}
                >
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
                  {['this week', 'next week', 'pre next week'].includes(participant.admin_status || '') && (
                    <Badge variant="outline" className="absolute bottom-1 left-1 text-[10px] px-1 py-0 h-4 bg-green-500/90 text-white border-green-600 shadow-sm">
                      on site
                    </Badge>
                  )}
                  {isWinner && (
                    <div className="absolute top-1 left-1">
                      <Trophy className="h-5 w-5 text-yellow-500" />
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
                  <span className="text-xs font-semibold">
                    {appData.birth_year ? `${new Date().getFullYear() - parseInt(appData.birth_year)}, ` : ''}{firstName} {lastName}
                  </span>
                </div>
                
                <div className="text-xs text-muted-foreground mb-1">
                  {appData.city}, {appData.country}
                </div>

                {/* Rating and votes */}
                <div className="flex items-center gap-3 mb-1">
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
                
                {/* Expandable application data */}
                <div 
                  className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                  onClick={() => setExpandedId(expandedId === participant.id ? null : participant.id)}
                  title="Click to view full application data"
                >
                  <span>More info</span>
                  {expandedId === participant.id ? (
                    <ChevronUp className="h-2.5 w-2.5" />
                  ) : (
                    <ChevronDown className="h-2.5 w-2.5" />
                  )}
                </div>

                {expandedId === participant.id && (
                  <div className="text-xs text-muted-foreground mt-1 max-h-32 md:max-h-40 overflow-y-auto overflow-x-hidden space-y-1 pr-1">
                    <div>
                      {Object.entries(appData).map(([key, value], index) => {
                        if (key.includes('url') || key.includes('photo') || key === 'phone' || key === 'email' || !value) return null;
                        return (
                          <span key={key}>
                            {String(value)}
                            {index < Object.entries(appData).filter(([k, v]) => !k.includes('url') && !k.includes('photo') && k !== 'phone' && k !== 'email' && v).length - 1 ? ', ' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Select 
                  value={participant.admin_status || 'this week'}
                  onValueChange={async (value) => {
                    await onStatusChange(participant, value);
                  }}
                >
                  <SelectTrigger className={`w-[110px] h-6 text-xs ${getStatusBackgroundColor(participant.admin_status || 'this week')}`}>
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
          <div className="md:hidden">
            <div className="flex w-full">
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
                    {isWinner && <Trophy className="h-3 w-3 text-yellow-500 ml-1" />}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {appData.city}, {appData.country}
                  </div>

                  {/* Rating and votes */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-[10px] font-semibold">
                        {Number(participant.average_rating || 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 cursor-pointer" onClick={() => onViewVoters?.({ id: participant.id, name: participantName })}>
                      <Heart className="h-2.5 w-2.5 text-pink-500 fill-pink-500" />
                      <span className="text-[10px] font-semibold">
                        {participant.total_votes || 0}
                      </span>
                    </div>
                  </div>
                  
                  {expandedId === participant.id && (
                    <div className="text-xs text-muted-foreground mt-1 max-h-32 md:max-h-40 overflow-y-auto overflow-x-hidden space-y-1 pr-1">
                      <div>
                        {Object.entries(appData).map(([key, value], index) => {
                          if (key.includes('url') || key.includes('photo') || key === 'phone' || key === 'email' || !value) return null;
                          return (
                            <span key={key}>
                              {String(value)}
                              {index < Object.entries(appData).filter(([k, v]) => !k.includes('url') && !k.includes('photo') && k !== 'phone' && k !== 'email' && v).length - 1 ? ', ' : ''}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-1">
                  <Select 
                    value={participant.admin_status || 'this week'}
                    onValueChange={async (value) => {
                      await onStatusChange(participant, value);
                    }}
                  >
                    <SelectTrigger className={`w-[100px] text-[10px] h-5 ${getStatusBackgroundColor(participant.admin_status || 'this week')}`}>
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
          </div>
            </CardContent>
          </Card>

      {/* Status History Modal */}
      {showStatusHistoryModal && (
        <ParticipantStatusHistoryModal
          isOpen={showStatusHistoryModal}
          participantId={participant.id}
          participantName={participantName}
          statusHistory={participant.status_history}
          onClose={() => setShowStatusHistoryModal(false)}
        />
      )}
    </div>
  );
};
