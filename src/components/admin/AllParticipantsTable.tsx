import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

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
      const { data, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .order('created_at', { ascending: false });

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
        <ScrollArea className="h-[600px]">
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
            <TableBody>
              {participants.map((participant) => {
                const firstName = participant.application_data?.first_name || '';
                const lastName = participant.application_data?.last_name || '';
                const fullName = `${firstName} ${lastName}`.trim() || 'Без имени';
                const city = participant.application_data?.city || '';
                const country = participant.application_data?.country || '';
                const location = [city, country].filter(Boolean).join(', ') || 'Не указано';

                return (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium">{fullName}</TableCell>
                    <TableCell>{location}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(participant.admin_status)}>
                        {participant.admin_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{participant.week_interval || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={participant.is_active ? 'default' : 'outline'}>
                        {participant.is_active ? 'Да' : 'Нет'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {participant.deleted_at ? (
                        <Badge variant="destructive">Да</Badge>
                      ) : (
                        <Badge variant="outline">Нет</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(participant.created_at).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
