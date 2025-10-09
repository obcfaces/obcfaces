import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeeklyContestParticipant, WeekFilter } from '@/types/admin';
import { Trophy } from 'lucide-react';

interface AdminPastWeekTabProps {
  participants: WeeklyContestParticipant[];
  weekFilters: WeekFilter[];
  selectedWeekFilter: string;
  onWeekFilterChange: (value: string) => void;
  onViewPhotos: (images: string[], index: number, name: string) => void;
}

export function AdminPastWeekTab({
  participants,
  weekFilters,
  selectedWeekFilter,
  onWeekFilterChange,
  onViewPhotos,
}: AdminPastWeekTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Past Weeks</h2>
        <Select value={selectedWeekFilter} onValueChange={onWeekFilterChange}>
          <SelectTrigger className="w-[200px]">
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {participants.map((participant) => {
          const data = participant.application_data || {};
          const firstName = data.first_name || '';
          const lastName = data.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();
          const isWinner = participant.final_rank === 1;

          return (
            <Card key={participant.id} className={isWinner ? 'border-yellow-500' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{fullName}</CardTitle>
                  {isWinner && <Trophy className="h-5 w-5 text-yellow-500" />}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {data.age} • {data.city}, {data.country}
                </p>
                <div className="space-y-1 mb-3 text-sm">
                  <p>Rank: {participant.final_rank || 'N/A'}</p>
                  <p>Rating: {participant.average_rating?.toFixed(1) || '0.0'}</p>
                  <p>Votes: {participant.total_votes || 0}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => onViewPhotos(
                    [data.photo_1_url, data.photo_2_url],
                    0,
                    fullName
                  )}
                >
                  View Photos
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {participants.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No participants for selected week
        </div>
      )}
    </div>
  );
}
