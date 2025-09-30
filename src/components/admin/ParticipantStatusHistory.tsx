import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface StatusHistoryEntry {
  status: string;
  changed_at: string;
  contest_title?: string;
  week_start_date?: string;
  week_end_date?: string;
  week_interval?: string;
}

interface ParticipantStatusHistoryProps {
  statusHistory?: any;
  isExpanded?: boolean;
  onToggle?: () => void;
  compact?: boolean;
}

export const ParticipantStatusHistory: React.FC<ParticipantStatusHistoryProps> = ({
  statusHistory,
  isExpanded = false,
  onToggle,
  compact = false
}) => {
  // Parse status history if it exists
  const parseStatusHistory = (history: any): StatusHistoryEntry[] => {
    if (!history) return [];
    
    // If it's a string, try to parse it as JSON
    if (typeof history === 'string') {
      try {
        history = JSON.parse(history);
      } catch {
        return [];
      }
    }
    
    // If it's an object, convert to array
    if (typeof history === 'object' && !Array.isArray(history)) {
      return Object.entries(history)
        .filter(([status, data]: [string, any]) => data !== null && data !== undefined) // Фильтруем null значения
        .map(([status, data]: [string, any]) => ({
          status,
          changed_at: data.changed_at || data.timestamp || new Date().toISOString(),
          contest_title: data.contest_title,
          week_start_date: data.week_start_date,
          week_end_date: data.week_end_date,
          week_interval: data.week_interval
        }));
    }
    
    // If it's already an array, return as is
    if (Array.isArray(history)) {
      return history;
    }
    
    return [];
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit',
        year: '2-digit'
      }).replace(/\./g, '/');
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.toLocaleDateString('ru-RU', { month: 'short' });
      const time = date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return `${day} ${month}. ${time}`;
    } catch {
      return dateStr;
    }
  };

  const formatWeekInterval = (entry: StatusHistoryEntry) => {
    // Try different sources for week interval
    if (entry.week_interval) {
      return entry.week_interval;
    }
    
    if (entry.week_start_date && entry.week_end_date) {
      const startDate = new Date(entry.week_start_date);
      const endDate = new Date(entry.week_end_date);
      const startFormatted = startDate.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      const endFormatted = endDate.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit',
        year: '2-digit'
      }).replace(/\//g, '/');
      return `${startFormatted}-${endFormatted}`;
    }
    
    // Extract from contest_title if available
    if (entry.contest_title) {
      const match = entry.contest_title.match(/(\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{4})/);
      if (match) {
        return match[1].replace(/\./g, '/');
      }
    }
    
    return '';
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
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const entries = parseStatusHistory(statusHistory);
  
  if (entries.length === 0) {
    return null;
  }

  // Sort entries by date (newest first)
  const sortedEntries = entries.sort((a, b) => 
    new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  if (compact) {
    // Compact view - show only current status
    const currentEntry = sortedEntries[0];
    if (!currentEntry) return null;
    
    return (
      <div className="text-xs">
        <Badge variant={getStatusBadgeVariant(currentEntry.status)} className="text-xs">
          {currentEntry.status}
        </Badge>
        {formatWeekInterval(currentEntry) && (
          <span className="ml-1 text-muted-foreground">
            {formatWeekInterval(currentEntry)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="text-xs">
      <div className="mb-1 text-muted-foreground">
        History ({entries.length}):
      </div>
      <div className="flex flex-wrap gap-1">
        {sortedEntries.map((entry, index) => {
          const weekInterval = formatWeekInterval(entry);
          const isHighlighted = entry.status === 'past' && weekInterval === '22/09-28/09/25';
          
          return (
            <div 
              key={index} 
              className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs ${
                isHighlighted 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-muted/30 border-muted'
              }`}
            >
              <Badge 
                variant={getStatusBadgeVariant(entry.status)} 
                className="text-xs"
              >
                {entry.status}
              </Badge>
              {weekInterval && (
                <span className="text-muted-foreground">
                  {weekInterval}
                </span>
              )}
              <span className="text-muted-foreground">
                ({formatDateTime(entry.changed_at)})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};