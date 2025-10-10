import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

interface StatusHistoryEntry {
  status: string;
  changed_at: string;
  changed_by?: string;
  changed_by_email?: string;
  week_interval?: string;
  change_reason?: string;
}

interface ParticipantStatusHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantName: string;
  statusHistory?: any;
}

export const ParticipantStatusHistoryModal: React.FC<ParticipantStatusHistoryModalProps> = ({
  isOpen,
  onClose,
  participantName,
  statusHistory,
}) => {
  const [enrichedEntries, setEnrichedEntries] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const parseStatusHistory = (history: any): StatusHistoryEntry[] => {
    if (!history) return [];
    
    if (typeof history === 'string') {
      try {
        history = JSON.parse(history);
      } catch {
        return [];
      }
    }
    
    if (typeof history === 'object' && !Array.isArray(history)) {
      return Object.entries(history)
        .filter(([status, data]: [string, any]) => data !== null && data !== undefined)
        .map(([status, data]: [string, any]) => ({
          status,
          changed_at: data.changed_at || data.timestamp || new Date().toISOString(),
          changed_by: data.changed_by,
          changed_by_email: data.changed_by_email,
          week_interval: data.week_interval || '',
          change_reason: data.change_reason || data.reason
        }));
    }
    
    if (Array.isArray(history)) {
      return history;
    }
    
    return [];
  };

  // Load admin emails for entries that don't have them
  useEffect(() => {
    const loadAdminEmails = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      const entries = parseStatusHistory(statusHistory);
      
      // Find entries that need email lookup
      const entriesNeedingEmail = entries.filter(e => e.changed_by && !e.changed_by_email);
      const userIds = [...new Set(entriesNeedingEmail.map(e => e.changed_by))];
      
      if (userIds.length > 0) {
        try {
          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', userIds);
          
          if (!error && profiles) {
            const emailMap = new Map(profiles.map(p => [p.id, p.display_name]));
            
            const enriched = entries.map(entry => ({
              ...entry,
              changed_by_email: entry.changed_by_email || emailMap.get(entry.changed_by || '') || 'System'
            }));
            
            setEnrichedEntries(enriched);
          } else {
            setEnrichedEntries(entries);
          }
        } catch (error) {
          console.error('Error loading admin emails:', error);
          setEnrichedEntries(entries);
        }
      } else {
        setEnrichedEntries(entries);
      }
      
      setLoading(false);
    };
    
    loadAdminEmails();
  }, [isOpen, statusHistory]);

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('ru-RU', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'this week':
        return 'default';
      case 'next week':
      case 'next week on site':
      case 'pre next week':
        return 'secondary';
      case 'past':
        return 'outline';
      case 'pending':
      case 'approved':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getChangedByDisplay = (entry: StatusHistoryEntry) => {
    if (entry.changed_by_email) {
      return entry.changed_by_email;
    }
    
    if (entry.change_reason) {
      // If there's a change_reason, it might indicate an automatic change
      if (entry.change_reason.includes('function') || entry.change_reason.includes('automatic')) {
        return `Автоматически (${entry.change_reason})`;
      }
      return entry.change_reason;
    }
    
    if (entry.changed_by) {
      return `User ID: ${entry.changed_by.substring(0, 8)}...`;
    }
    
    return 'Unknown';
  };

  const sortedEntries = enrichedEntries.sort((a, b) => 
    new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>История статусов - {participantName}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            История статусов отсутствует
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Статус</TableHead>
                <TableHead>Интервал</TableHead>
                <TableHead>Дата изменения</TableHead>
                <TableHead>Изменил</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(entry.status)}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{entry.week_interval || '—'}</TableCell>
                  <TableCell>{formatDateTime(entry.changed_at)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {getChangedByDisplay(entry)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
