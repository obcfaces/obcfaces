import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Heart, Star, Trophy, Info, Copy } from 'lucide-react';
import { WeeklyContestParticipant, WeekFilter } from '@/types/admin';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminPastWeekTabProps {
  participants: WeeklyContestParticipant[];
  weekFilters: WeekFilter[];
  selectedWeekFilter: string;
  onWeekFilterChange: (value: string) => void;
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onEdit?: (participant: WeeklyContestParticipant) => void;
  onStatusChange?: (participant: WeeklyContestParticipant, newStatus: string) => Promise<void>;
  onViewVoters?: (participant: { id: string; name: string }) => void;
  onViewStatusHistory?: (participantId: string, participantName: string, statusHistory: any) => void;
  profiles?: any[];
}

export function AdminPastWeekTab({
  participants,
  weekFilters,
  selectedWeekFilter,
  onWeekFilterChange,
  onViewPhotos,
  onEdit,
  onStatusChange,
  onViewVoters,
  onViewStatusHistory,
  profiles = [],
}: AdminPastWeekTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');

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

  // Filter participants
  const filteredParticipants = participants.filter(participant => {
    const appData = participant.application_data || {};
    const firstName = appData.first_name || '';
    const lastName = appData.last_name || '';
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const country = appData.country || '';
    const gender = appData.gender || '';

    const matchesSearch = searchQuery === '' || fullName.includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountry === 'all' || country === selectedCountry;
    const matchesGender = selectedGender === 'all' || gender === selectedGender;

    return matchesSearch && matchesCountry && matchesGender;
  });

  // Get unique countries
  const countries = Array.from(new Set(
    participants
      .map(p => p.application_data?.country)
      .filter(Boolean)
  )).sort();

  // Statistics
  const totalParticipants = filteredParticipants.length;
  const winners = filteredParticipants.filter(p => p.final_rank === 1);
  const avgRating = filteredParticipants.length > 0
    ? (filteredParticipants.reduce((sum, p) => sum + (Number(p.average_rating) || 0), 0) / filteredParticipants.length).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="mb-4 p-3 bg-muted rounded-lg">
        <div className="text-sm text-muted-foreground">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-semibold">Total:</span> {totalParticipants}
            </div>
            <div>
              <span className="font-semibold">Winners:</span> {winners.length}
            </div>
            <div>
              <span className="font-semibold">Avg Rating:</span> {avgRating}
            </div>
            <div>
              <span className="font-semibold">Selected Week:</span> {weekFilters.find(f => f.id === selectedWeekFilter)?.label || 'All'}
            </div>
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="rounded-md border mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Votes</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No participants found
                </TableCell>
              </TableRow>
            ) : (
              filteredParticipants.map((participant, index) => {
                const appData = participant.application_data || {};
                const firstName = appData.first_name || '';
                const lastName = appData.last_name || '';
                const participantName = `${firstName} ${lastName}`;
                const isWinner = participant.final_rank === 1;

                return (
                  <TableRow key={participant.id} className={isWinner ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={appData.photo_1_url || appData.photo1_url} />
                          <AvatarFallback>{firstName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{participantName}</div>
                          {isWinner && <Trophy className="h-4 w-4 text-yellow-500 inline ml-1" />}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {appData.city}, {appData.country}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span>{Number(participant.average_rating || 0).toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex items-center gap-1 cursor-pointer hover:underline"
                        onClick={() => onViewVoters?.({ id: participant.id, name: participantName })}
                      >
                        <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
                        <span>{participant.total_votes || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {participant.final_rank ? (
                        <Badge variant={participant.final_rank === 1 ? 'default' : 'secondary'}>
                          #{participant.final_rank}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {onStatusChange ? (
                        <Select
                          value={participant.admin_status || 'past'}
                          onValueChange={async (value) => {
                            await onStatusChange(participant, value);
                          }}
                        >
                          <SelectTrigger className={`w-24 h-7 text-xs ${getStatusBackgroundColor(participant.admin_status || 'past')}`}>
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
                      ) : (
                        <Badge className={getStatusBackgroundColor(participant.admin_status || 'past')}>
                          {participant.admin_status || 'past'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(participant)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {onViewStatusHistory && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onViewStatusHistory(participant.id, participantName, participant.status_history)}
                            className="h-8 w-8 p-0"
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={selectedWeekFilter} onValueChange={onWeekFilterChange}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select week" />
          </SelectTrigger>
          <SelectContent>
            {weekFilters.map((filter) => (
              <SelectItem key={filter.id} value={filter.id}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedGender} onValueChange={setSelectedGender}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="All Genders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Card View */}

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
                    {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
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
                    {participant.final_rank && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold">
                          Rank: {participant.final_rank}
                        </span>
                      </div>
                    )}
                  </div>

                  {onStatusChange && (
                    <div className="flex items-center gap-2 mt-2">
                      <Select 
                        value={participant.admin_status || 'past'} 
                        onValueChange={async (value) => {
                          await onStatusChange(participant, value);
                        }}
                      >
                        <SelectTrigger className={`w-24 h-7 text-xs ${getStatusBackgroundColor(participant.admin_status || 'past')}`}>
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
                  )}
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
                          {participant.final_rank && <span>🏆 {participant.final_rank}</span>}
                        </div>
                      </div>
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
          No participants for selected week
        </div>
      )}
    </div>
  );
}
