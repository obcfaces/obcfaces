import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Heart, Star, Trophy } from 'lucide-react';
import { WeeklyContestParticipant } from '@/types/admin';

interface AdminWeeklyTabProps {
  participants: WeeklyContestParticipant[];
  statusFilter: string;
  countryFilter: string;
  genderFilter: string;
  onStatusFilterChange: (value: string) => void;
  onCountryFilterChange: (value: string) => void;
  onGenderFilterChange: (value: string) => void;
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onEdit: (participant: WeeklyContestParticipant) => void;
  onStatusChange: (participant: WeeklyContestParticipant, newStatus: string) => Promise<void>;
  onViewVoters?: (participant: { id: string; name: string }) => void;
}

export function AdminWeeklyTab({
  participants,
  statusFilter,
  countryFilter,
  genderFilter,
  onStatusFilterChange,
  onCountryFilterChange,
  onGenderFilterChange,
  onViewPhotos,
  onEdit,
  onStatusChange,
  onViewVoters,
}: AdminWeeklyTabProps) {
  const uniqueCountries = Array.from(
    new Set(participants.map(p => p.application_data?.country).filter(Boolean))
  );

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

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">This Week</h2>

      <div className="flex gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="this week">This Week</SelectItem>
            <SelectItem value="next week">Next Week</SelectItem>
            <SelectItem value="next week on site">Next Week On Site</SelectItem>
            <SelectItem value="past">Past</SelectItem>
          </SelectContent>
        </Select>

        <Select value={countryFilter} onValueChange={onCountryFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {uniqueCountries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={genderFilter} onValueChange={onGenderFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="male">Male</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {participants.map((participant) => {
        const appData = participant.application_data || {};
        const firstName = appData.first_name || '';
        const lastName = appData.last_name || '';
        const photo1 = appData.photo_1_url || appData.photo1_url || '';
        const photo2 = appData.photo_2_url || appData.photo2_url || '';
        const participantName = `${firstName} ${lastName}`;
        const isWinner = participant.final_rank === 1;

        return (
          <Card key={participant.id} className={`overflow-hidden relative h-[149px] ${isWinner ? 'border-yellow-500' : ''}`}>
            <CardContent className="p-0">
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
                        <SelectItem value="next week on site">Next Week On Site</SelectItem>
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
                          <SelectItem value="next week on site">Next Week On Site</SelectItem>
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
          No participants found
        </div>
      )}
    </div>
  );
}
