import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
}: AdminWeeklyTabProps) {
  const uniqueCountries = Array.from(
    new Set(participants.map(p => p.application_data?.country).filter(Boolean))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Weekly Participants</h2>
      </div>

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {participants.map((participant) => {
          const data = participant.application_data || {};
          const firstName = data.first_name || '';
          const lastName = data.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();

          return (
            <Card key={participant.id}>
              <CardHeader>
                <CardTitle>{fullName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {data.age} • {data.city}, {data.country}
                </p>
                <div className="space-y-2">
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => onEdit(participant)}
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {participants.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No participants found
        </div>
      )}
    </div>
  );
}
