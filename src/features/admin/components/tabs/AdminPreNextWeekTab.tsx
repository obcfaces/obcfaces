import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Info, MoreVertical, History, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { WeeklyContestParticipant } from '@/types/admin';
import { LoadingSpinner } from '../LoadingSpinner';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { formatDateInCountry } from '@/utils/weekIntervals';
import { useApplicationHistory } from '@/hooks/useApplicationHistory';
import { Country } from 'country-state-city';
import { ParticipantStatusHistoryModal } from '../ParticipantStatusHistoryModal';

interface AdminPreNextWeekTabProps {
  participants: WeeklyContestParticipant[];
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onStatusChange: (participant: WeeklyContestParticipant, newStatus: string) => Promise<void>;
  onEdit: (participant: any) => void;
  onStatusHistory: (participantId: string, participantName: string, statusHistory: any) => void;
  loading?: boolean;
}

export function AdminPreNextWeekTab({
  participants,
  onViewPhotos,
  onStatusChange,
  onEdit,
  onStatusHistory,
  loading = false,
}: AdminPreNextWeekTabProps) {
  const { selectedCountry } = useAdminCountry();

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const country = p.application_data?.country || p.profiles?.country;
      return country === selectedCountry;
    });
  }, [participants, selectedCountry]);

  if (loading) {
    return <LoadingSpinner message="Loading pre next week list..." />;
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
      <h2 className="text-2xl font-bold">Pre Next Week ({filteredParticipants.length})</h2>

      {filteredParticipants.map((participant) => {
        const appData = participant.application_data || {};
        const firstName = appData.first_name || '';
        const lastName = appData.last_name || '';
        const photo1 = appData.photo_1_url || appData.photo1_url || '';
        const photo2 = appData.photo_2_url || appData.photo2_url || '';

        return (
          <ParticipantCardWithHistory
            key={participant.id}
            participant={participant}
            appData={appData}
            firstName={firstName}
            lastName={lastName}
            photo1={photo1}
            photo2={photo2}
            onViewPhotos={onViewPhotos}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
            onStatusHistory={onStatusHistory}
            getStatusBackgroundColor={getStatusBackgroundColor}
          />
        );
      })}

      {participants.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No participants in pre next week
        </div>
      )}
    </div>
  );
}

// Separate component with history
const ParticipantCardWithHistory = ({
  participant,
  appData,
  firstName,
  lastName,
  photo1,
  photo2,
  onViewPhotos,
  onEdit,
  onStatusChange,
  onStatusHistory,
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
      <Card className={`overflow-hidden relative rounded-none md:rounded-lg h-[149px]`}>
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

          {/* Desktop/Tablet layout */}
          <div className="hidden md:flex h-[149px]">
            {/* Photos section - Fixed width */}
            <div className="flex gap-px w-[200px] flex-shrink-0 h-[149px]">
              {photo1 && (
                <div className="w-[100px] h-[149px] flex-shrink-0 relative overflow-hidden">
                  <img 
                    src={photo1} 
                    alt="Portrait" 
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, `${firstName} ${lastName}`)}
                  />
                  {['this week', 'next week', 'pre next week'].includes(participant.admin_status || '') && (
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
                    onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 1, `${firstName} ${lastName}`)}
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

                {/* Week interval */}
                {participant.week_interval && (
                  <Badge variant="outline" className="text-xs px-1 py-0 mb-1">
                    Week: {participant.week_interval}
                  </Badge>
                )}
                
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
                  value={participant.admin_status || 'pre next week'}
                  onValueChange={async (value) => {
                    await onStatusChange(participant, value);
                  }}
                >
                  <SelectTrigger className={`w-[110px] h-6 text-xs ${getStatusBackgroundColor(participant.admin_status || 'pre next week')}`}>
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
                      onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, `${firstName} ${lastName}`)}
                    />
                  </div>
                )}
                {photo2 && (
                  <div className="w-[100px] h-[149px] flex-shrink-0">
                    <img 
                      src={photo2} 
                      alt="Full length" 
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 1, `${firstName} ${lastName}`)}
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
                  
                  <div className="text-xs text-muted-foreground">
                    {appData.city}, {appData.country}
                  </div>

                  {/* Week interval */}
                  {participant.week_interval && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 mt-0.5">
                      Week: {participant.week_interval}
                    </Badge>
                  )}
                  
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
                    value={participant.admin_status || 'pre next week'}
                    onValueChange={async (value) => {
                      await onStatusChange(participant, value);
                    }}
                  >
                    <SelectTrigger className={`w-[100px] text-[10px] h-5 ${getStatusBackgroundColor(participant.admin_status || 'pre next week')}`}>
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
          participantName={`${firstName} ${lastName}`}
          statusHistory={participant.status_history}
          onClose={() => setShowStatusHistoryModal(false)}
        />
      )}
    </div>
  );
};
