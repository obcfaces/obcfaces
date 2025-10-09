import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WeeklyContestParticipant } from '@/types/admin';

interface AdminPreNextWeekTabProps {
  participants: WeeklyContestParticipant[];
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onStatusChange: (participant: WeeklyContestParticipant, newStatus: string) => void;
}

export function AdminPreNextWeekTab({
  participants,
  onViewPhotos,
  onStatusChange,
}: AdminPreNextWeekTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Pre Next Week</h2>

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
                <Badge>{participant.admin_status}</Badge>
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
                    variant="default"
                    className="w-full"
                    onClick={() => onStatusChange(participant, 'next week')}
                  >
                    Move to Next Week
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {participants.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No participants in pre next week
        </div>
      )}
    </div>
  );
}
