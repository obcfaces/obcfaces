import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Info } from 'lucide-react';
import { WeeklyContestParticipant } from '@/types/admin';
import { LoadingSpinner } from '../LoadingSpinner';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { formatDateInCountry } from '@/utils/weekIntervals';

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
          <Card key={participant.id} className="overflow-hidden relative h-[149px]">
            <CardContent className="p-0">
              {/* Edit button in bottom left corner */}
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
                {/* Photos section - 2 columns */}
                <div className="flex gap-px w-[25ch] flex-shrink-0">
                  {photo1 && (
                    <div className="w-1/2">
                      <img 
                        src={photo1} 
                        alt="Portrait" 
                        className="w-full h-[149px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, `${firstName} ${lastName}`)}
                      />
                    </div>
                  )}
                  {photo2 && (
                    <div className="w-1/2 relative">
                      <img 
                        src={photo2} 
                        alt="Full length" 
                        className="w-full h-[149px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 1, `${firstName} ${lastName}`)}
                      />
                      {/* User avatar positioned in top right corner */}
                      <div className="absolute top-2 right-2">
                        <Avatar className="h-6 w-6 flex-shrink-0 border-2 border-white shadow-sm">
                          <AvatarImage src={photo1 || ''} />
                          <AvatarFallback className="text-xs">
                            {firstName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main info section */}
                <div className="w-[50ch] flex-shrink-0 flex-1 min-w-0 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold whitespace-nowrap">
                      {new Date().getFullYear() - (appData.birth_year || new Date().getFullYear() - 25)} {firstName} {lastName}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground mb-1">
                    {appData.city} {appData.state} {appData.country}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Select 
                      value={participant.admin_status || 'pre next week'} 
                      onValueChange={async (value) => {
                        await onStatusChange(participant, value);
                      }}
                    >
                      <SelectTrigger className={`w-24 h-7 text-xs ${getStatusBackgroundColor(participant.admin_status || 'pre next week')}`}>
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
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        onStatusHistory(
                          participant.id,
                          `${firstName} ${lastName}`,
                          participant.status_history
                        );
                      }}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
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
                        onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, `${firstName} ${lastName}`)}
                      />
                    )}
                    {photo2 && (
                      <img 
                        src={photo2} 
                        alt="Full length" 
                        className="w-full h-16 object-cover rounded cursor-pointer"
                        onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 1, `${firstName} ${lastName}`)}
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-sm truncate mb-1">
                        {firstName} {lastName}
                      </h3>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>{appData.city || 'Unknown'}, {appData.country || 'Unknown'}</div>
                        <Badge variant="outline" className="text-xs px-1 py-0 mt-1">
                          Week: {participant.week_interval}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <Select 
                        value={participant.admin_status || 'pre next week'} 
                        onValueChange={async (value) => {
                          await onStatusChange(participant, value);
                        }}
                      >
                        <SelectTrigger className={`w-24 h-7 text-xs ${getStatusBackgroundColor(participant.admin_status || 'pre next week')}`}>
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

      {participants.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No participants in pre next week
        </div>
      )}
    </div>
  );
}
