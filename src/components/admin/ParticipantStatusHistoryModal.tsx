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
  participantId?: string;
  statusHistory?: any;
}

export const ParticipantStatusHistoryModal: React.FC<ParticipantStatusHistoryModalProps> = ({
  isOpen,
  onClose,
  participantName,
  participantId,
  statusHistory,
}) => {
  const [enrichedEntries, setEnrichedEntries] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [participantData, setParticipantData] = useState<any>(null);

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
      const entries: StatusHistoryEntry[] = [];
      
      Object.entries(history).forEach(([key, data]: [string, any]) => {
        // Skip metadata fields
        if (key === 'changed_at' || key === 'changed_by' || key === 'change_reason') return;
        
        if (data === null || data === undefined || typeof data !== 'object') return;
        
        // Handle datetime keys (like "2025-10-10 07:54:00")
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(key)) {
          // This is a status change event with datetime as key
          const status = data.new_status || data.old_status || 'unknown';
          entries.push({
            status: status,
            changed_at: key,
            changed_by: data.changed_by,
            changed_by_email: data.changed_by_email,
            week_interval: data.week_interval || '',
            change_reason: `Changed from ${data.old_status || '?'} to ${data.new_status || '?'}`
          });
        }
        // Handle pending resubmissions (keys like "pending_resubmit_2025-10-11_12:30:45")
        else if (key.startsWith('pending_resubmit_')) {
          entries.push({
            status: 'pending (re-submitted)',
            changed_at: data.changed_at || data.timestamp || new Date().toISOString(),
            changed_by: data.changed_by || data.changed_via,
            changed_by_email: data.changed_by_email || 'user',
            week_interval: data.week_interval || '',
            change_reason: data.change_reason || data.reason || 'User re-submitted after rejection'
          });
        }
        // Handle normal status entries
        else if (data.changed_at || data.timestamp) {
          entries.push({
            status: key,
            changed_at: data.changed_at || data.timestamp || new Date().toISOString(),
            changed_by: data.changed_by || data.changed_via,
            changed_by_email: data.changed_by_email,
            week_interval: data.week_interval || '',
            change_reason: data.change_reason || data.reason
          });
        }
      });
      
      return entries;
    }
    
    if (Array.isArray(history)) {
      return history;
    }
    
    return [];
  };

  // Load participant data and admin emails
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      
      // Parse status history from prop
      let entries = parseStatusHistory(statusHistory);
      
      // Get participant data to add initial created status
      try {
        let participant = null;
        
        // If we have participantId, use it directly (faster and more reliable)
        if (participantId) {
          const { data } = await supabase
            .from('weekly_contest_participants')
            .select('id, created_at, submitted_at, admin_status')
            .eq('id', participantId)
            .single();
          participant = data;
        } else {
          // Fallback to name search
          const [firstName, ...lastNameParts] = participantName.split(' ');
          const lastName = lastNameParts.join(' ');
          
          const { data } = await supabase
            .from('weekly_contest_participants')
            .select('id, created_at, submitted_at, admin_status')
            .ilike('application_data->>first_name', firstName)
            .ilike('application_data->>last_name', lastName)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          participant = data;
        }
        
        if (participant) {
          setParticipantData(participant);
          
          // Convert created_at from UTC to Manila timezone
          const createdDate = new Date(participant.created_at);
          const manilaCreatedDate = new Date(createdDate.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
          const manilaCreatedStr = manilaCreatedDate.toISOString().slice(0, 19).replace('T', ' ');
          
          console.log('✅ Participant data:', participant);
          console.log('✅ created_at UTC:', participant.created_at);
          console.log('✅ created_at Manila:', manilaCreatedStr);
          
          // Add initial pending status with Manila time
          entries.push({
            status: 'created_at',
            changed_at: manilaCreatedStr,
            changed_by_email: 'user',
            change_reason: 'Application created',
            week_interval: ''
          });
          console.log('✅ Entries after adding initial:', entries);
        } else {
          console.log('❌ No participant found!');
        }
      } catch (error) {
        console.error('❌ Error loading participant data:', error);
      }
      
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
    
    loadData();
  }, [isOpen, statusHistory, participantName]);

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      // If time looks like it's already in Manila timezone (from status_history), don't convert
      // Otherwise convert from UTC to Manila
      const isAlreadyManila = dateStr.includes(' ') && !dateStr.includes('T') && !dateStr.includes('Z');
      
      const displayDate = isAlreadyManila 
        ? date 
        : new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
      
      const day = displayDate.getDate();
      const month = displayDate.toLocaleString('en', { month: 'short', timeZone: 'Asia/Manila' }).toLowerCase();
      const hours = String(displayDate.getHours()).padStart(2, '0');
      const minutes = String(displayDate.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'created_at':
        return 'outline';
      case 'this week':
        return 'default';
      case 'next week':
      case 'next week on site':
      case 'pre next week':
        return 'secondary';
      case 'past':
        return 'outline';
      case 'pending':
      case 'pending (re-submitted)':
        return 'secondary';
      case 'approved':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getChangedByDisplay = (entry: StatusHistoryEntry) => {
    // Check if this was user action (user edited/resubmitted)
    if (entry.changed_by_email === 'user' || 
        entry.change_reason?.toLowerCase().includes('user') || 
        entry.change_reason?.toLowerCase().includes('submitted') ||
        entry.change_reason?.toLowerCase().includes('created') ||
        entry.change_reason?.toLowerCase().includes('resubmitted')) {
      return 'user';
    }
    
    if (entry.changed_by_email) {
      // Show first 4 characters of email
      return entry.changed_by_email.substring(0, 4);
    }
    
    // If we have changed_by UUID, it's admin - show first 4 chars of UUID
    if (entry.changed_by) {
      return entry.changed_by.substring(0, 4);
    }
    
    // If there's a change_reason mentioning function/automatic, show System
    if (entry.change_reason) {
      if (entry.change_reason.includes('function') || entry.change_reason.includes('automatic')) {
        return 'Syst';
      }
    }
    
    return 'Syst';
  };

  // Sort from NEWEST to OLDEST (descending) - latest events on top
  const sortedEntries = enrichedEntries.sort((a, b) => 
    new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-2 md:p-6">
        <DialogHeader className="pb-1 md:pb-4">
          <DialogTitle className="text-xs md:text-lg">
            Status History - {participantName}
            {participantId && (
              <span className="text-xs text-muted-foreground ml-2">
                (ID: {participantId.substring(0, 8)}...)
              </span>
            )}
          </DialogTitle>
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
            <table className="w-full border-collapse text-sm md:text-base">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-1 md:p-3 font-semibold whitespace-nowrap">Status</th>
                  <th className="text-left py-2 px-1 md:p-3 font-semibold whitespace-nowrap">Interval</th>
                  <th className="text-left py-2 px-1 md:p-3 font-semibold whitespace-nowrap">Changed</th>
                  <th className="text-left py-2 px-1 md:p-3 font-semibold whitespace-nowrap">By</th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((entry, index) => (
                  <tr 
                    key={index}
                    className="border-b last:border-b-0 hover:bg-muted/50"
                  >
                    <td className="py-2 px-1 md:p-3 whitespace-nowrap">
                      <Badge 
                        variant={getStatusBadgeVariant(entry.status)}
                        className="text-xs md:text-sm px-2 md:px-2.5 py-0.5"
                      >
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-1 md:p-3 text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                      {entry.week_interval || '—'}
                    </td>
                    <td className="py-2 px-1 md:p-3 text-xs md:text-sm whitespace-nowrap">
                      {formatDateTime(entry.changed_at)}
                    </td>
                    <td className="py-2 px-1 md:p-3 text-xs md:text-sm text-muted-foreground whitespace-nowrap">
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
