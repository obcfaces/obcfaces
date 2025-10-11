import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { VirtualizedList } from '@/components/performance/VirtualizedList';

interface Participant {
  id: string;
  user_id: string;
  admin_status: string;
  week_interval: string | null;
  created_at: string;
  deleted_at: string | null;
  is_active: boolean;
  application_data: any;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'this week':
      return 'default';
    case 'next week':
    case 'next week on site':
      return 'secondary';
    case 'pre next week':
      return 'outline';
    case 'past':
      return 'destructive';
    case 'pending':
      return 'outline';
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const AllParticipantsTable = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      // Add pagination limit for better performance
      const { data, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000); // Limit to 1000 most recent

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Все участницы ({participants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[600px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>Город/Страна</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Интервал недели</TableHead>
                <TableHead>Активна</TableHead>
                <TableHead>Удалена</TableHead>
                <TableHead>Дата создания</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          <VirtualizedList
            items={participants}
            itemHeight={53}
            containerHeight={550}
            renderItem={(participant) => {
              const firstName = participant.application_data?.first_name || '';
              const lastName = participant.application_data?.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim() || 'Без имени';
              const city = participant.application_data?.city || '';
              const country = participant.application_data?.country || '';
              const location = [city, country].filter(Boolean).join(', ') || 'Не указано';

              return (
                <div className="flex items-center border-b border-border px-4 py-2">
                  <div className="flex-1 font-medium">{fullName}</div>
                  <div className="flex-1">{location}</div>
                  <div className="flex-1">
                    <Badge variant={getStatusBadgeVariant(participant.admin_status)}>
                      {participant.admin_status}
                    </Badge>
                  </div>
                  <div className="flex-1">{participant.week_interval || '-'}</div>
                  <div className="flex-1">
                    <Badge variant={participant.is_active ? 'default' : 'outline'}>
                      {participant.is_active ? 'Да' : 'Нет'}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    {participant.deleted_at ? (
                      <Badge variant="destructive">Да</Badge>
                    ) : (
                      <Badge variant="outline">Нет</Badge>
                    )}
                  </div>
                  <div className="flex-1">
                    {new Date(participant.created_at).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              );
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
