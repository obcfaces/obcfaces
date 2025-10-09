import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WeeklyContestParticipant } from '@/types/admin';
import { Heart, Star } from 'lucide-react';

interface AdminNextWeekTabProps {
  participants: WeeklyContestParticipant[];
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onViewVoters: (participantName: string) => void;
  onStatusChange: (participant: WeeklyContestParticipant, newStatus: string) => void;
}

export function AdminNextWeekTab({
  participants,
  onViewPhotos,
  onViewVoters,
  onStatusChange,
}: AdminNextWeekTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Next Week</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {participants.map((participant) => {
          const data = participant.application_data || {};
          const firstName = data.first_name || '';
          const lastName = data.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();

          return (
            <Card key={participant.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{fullName}</CardTitle>
                  <Badge variant="secondary">{participant.admin_status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {data.age} • {data.city}, {data.country}
                </p>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span>Likes: 0</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>Votes: 0</span>
                  </div>
                </div>

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
                    onClick={() => onViewVoters(fullName)}
                  >
                    View Voters
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="w-full"
                    onClick={() => onStatusChange(participant, 'next week on site')}
                  >
                    Move to Next Week On Site
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {participants.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No participants for next week
        </div>
      )}
    </div>
  );
}
