import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Heart, Star, MoreVertical, History } from 'lucide-react';
import { WeeklyContestParticipant } from '@/types/admin';
import { LoadingSpinner } from '../LoadingSpinner';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { useApplicationHistory } from '@/hooks/useApplicationHistory';
import { ParticipantStatusHistoryModal } from '../ParticipantStatusHistoryModal';

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

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const country = p.application_data?.country || p.profiles?.country;
      return country === selectedCountry;
    });
  }, [participants, selectedCountry]);

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
      <h2 className="text-2xl font-bold">Next Week ({filteredParticipants.length})</h2>

      {filteredParticipants.map((participant) => (
        <ParticipantCardWithHistory 
          key={participant.id}
          participant={participant}
          onViewPhotos={onViewPhotos}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onViewVoters={onViewVoters}
          getStatusBackgroundColor={getStatusBackgroundColor}
        />
      ))}

      {filteredParticipants.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No participants for next week
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
}: any) => {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [showStatusHistoryModal, setShowStatusHistoryModal] = useState(false);
  const { history } = useApplicationHistory(participant.id);
  
  const historyCount = history.length;
  const appData = participant.application_data || {};
  const firstName = appData.first_name || '';
  const lastName = appData.last_name || '';
  const photo1 = appData.photo_1_url || appData.photo1_url || '';
  const photo2 = appData.photo_2_url || appData.photo2_url || '';
  const participantName = `${firstName} ${lastName}`;
  const submittedDate = participant.created_at ? new Date(participant.created_at) : null;

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

                {/* Rating and Votes Display */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-semibold">
                      {Number(participant.average_rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 cursor-pointer" onClick={() => onViewVoters(participantName)}>
                    <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
                    <span className="text-xs font-semibold">
                      {participant.total_votes || 0}
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
                  <span className="text-[10px]">⭐ {Number(participant.average_rating || 0).toFixed(1)}</span>
                  <span className="text-[10px]">❤️ {participant.total_votes || 0}</span>
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
    </>
  );
};
