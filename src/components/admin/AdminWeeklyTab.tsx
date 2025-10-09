import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Star } from 'lucide-react';
import { useParticipantsQuery } from '@/hooks/useParticipantsQuery';

export const AdminWeeklyTab: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('this week');
  
  const { data: participants, isLoading } = useParticipantsQuery({ 
    status: statusFilter !== 'all' ? statusFilter : undefined 
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const sortedParticipants = [...(participants || [])].sort((a: any, b: any) => {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">This Week's Contest</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="this week">This Week</SelectItem>
            <SelectItem value="next week">Next Week</SelectItem>
            <SelectItem value="past">Past</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {sortedParticipants?.map((participant: any, index: number) => (
          <Card key={participant.participant_id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {participant.final_rank && (
                    <Badge variant="default">#{participant.final_rank}</Badge>
                  )}
                  <span>
                    {participant.first_name} {participant.last_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                    {Number(participant.average_rating || 0).toFixed(1)}
                  </Badge>
                  <Badge variant="secondary">
                    {participant.total_votes || 0} votes
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Location:</span>{' '}
                  {participant.city}, {participant.country}
                </div>
                <div>
                  <span className="text-muted-foreground">Age:</span> {participant.age}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sortedParticipants?.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              No participants found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
