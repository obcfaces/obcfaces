import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, Check, X, Trash2 } from 'lucide-react';
import { useParticipantsQuery, useUpdateParticipantStatus } from '@/hooks/useParticipantsQuery';
import { useToast } from '@/hooks/use-toast';

interface AdminApplicationsTabProps {
  userId: string;
}

export const AdminApplicationsTab: React.FC<AdminApplicationsTabProps> = ({ userId }) => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('pending');
  
  const { data: participants, isLoading } = useParticipantsQuery({ 
    status: statusFilter !== 'all' ? statusFilter : undefined 
  });
  
  const updateStatus = useUpdateParticipantStatus();

  const handleStatusChange = async (participantId: string, newStatus: string, name: string) => {
    try {
      await updateStatus.mutateAsync({ participantId, newStatus, userId });
      toast({
        title: 'Success',
        description: `${name} status updated to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Applications</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="pre next week">Pre Next Week</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {participants?.map((participant: any) => (
          <Card key={participant.participant_id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>
                  {participant.first_name} {participant.last_name}
                </span>
                <Badge variant={
                  participant.admin_status === 'pending' ? 'secondary' :
                  participant.admin_status === 'rejected' ? 'destructive' :
                  'default'
                }>
                  {participant.admin_status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => handleStatusChange(participant.participant_id, 'pre next week', `${participant.first_name} ${participant.last_name}`)}
                  disabled={updateStatus.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleStatusChange(participant.participant_id, 'rejected', `${participant.first_name} ${participant.last_name}`)}
                  disabled={updateStatus.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {participants?.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              No applications found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
