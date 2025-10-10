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
        .filter(([status, data]: [string, any]) => {
          // Filter out metadata fields that aren't status entries
          if (status === 'changed_at' || status === 'changed_by' || status === 'change_reason') return false;
          // Only keep entries that have objects with changed_at
          return data !== null && data !== undefined && typeof data === 'object' && data.changed_at;
        })
        .map(([status, data]: [string, any]) => ({
          status,
          changed_at: data.changed_at || data.timestamp || new Date().toISOString(),
          changed_by: data.changed_by || data.changed_via,
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
      const day = date.getDate();
      const month = date.toLocaleString('en', { month: 'short' }).toLowerCase();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${hours}:${minutes}`;
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
      // Show first 4 characters of email
      return entry.changed_by_email.substring(0, 4);
    }
    
    // Check if this was a user edit (when user re-submits after rejection)
    if (entry.change_reason && entry.change_reason.includes('User edited')) {
      return 'user';
    }
    
    if (entry.change_reason) {
      // If there's a change_reason, it might indicate an automatic change
      if (entry.change_reason.includes('function') || entry.change_reason.includes('automatic')) {
        return 'Syst';
      }
    }
    
    if (entry.changed_by) {
      return entry.changed_by.substring(0, 4);
    }
    
    return 'Syst';
  };

  const sortedEntries = enrichedEntries.sort((a, b) => 
    new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-2 md:p-6">
        <DialogHeader className="pb-1 md:pb-4">
          <DialogTitle className="text-xs md:text-lg">Status History - {participantName}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-4 md:py-8 text-muted-foreground text-xs md:text-sm">
            Loading...
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="text-center py-4 md:py-8 text-muted-foreground text-xs md:text-sm">
            No status history available
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 md:mx-0">
            <table className="w-full border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-1 md:p-3 font-semibold">Status</th>
                  <th className="text-left py-2 px-1 md:p-3 font-semibold">Interval</th>
                  <th className="text-left py-2 px-1 md:p-3 font-semibold">Changed</th>
                  <th className="text-left py-2 px-1 md:p-3 font-semibold">By</th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((entry, index) => (
                  <tr 
                    key={index}
                    className="border-b last:border-b-0 hover:bg-muted/50"
                  >
                    <td className="py-2 px-1 md:p-3">
                      <Badge 
                        variant={getStatusBadgeVariant(entry.status)}
                        className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5"
                      >
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-1 md:p-3 text-[10px] md:text-xs text-muted-foreground">
                      {entry.week_interval || '—'}
                    </td>
                    <td className="py-2 px-1 md:p-3 text-[10px] md:text-xs whitespace-nowrap">
                      {formatDateTime(entry.changed_at)}
                    </td>
                    <td className="py-2 px-1 md:p-3 text-[10px] md:text-xs text-muted-foreground">
                      {getChangedByDisplay(entry)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
