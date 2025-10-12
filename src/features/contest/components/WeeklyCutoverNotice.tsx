import { useEffect, useState } from 'react';
import { Clock, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface WeeklyCutoverNoticeProps {
  variant?: 'default' | 'compact';
}

export function WeeklyCutoverNotice({ variant = 'default' }: WeeklyCutoverNoticeProps) {
  const [timeUntilCutover, setTimeUntilCutover] = useState<string>('');
  const [localCutoverTime, setLocalCutoverTime] = useState<string>('');

  useEffect(() => {
    const calculateCutover = () => {
      const now = new Date();
      
      // Get next Monday 00:00 UTC
      const nextMonday = new Date(now);
      nextMonday.setUTCDate(now.getUTCDate() + ((1 + 7 - now.getUTCDay()) % 7 || 7));
      nextMonday.setUTCHours(0, 0, 0, 0);
      
      // Calculate time until cutover
      const diff = nextMonday.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setTimeUntilCutover(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeUntilCutover(`${hours}h ${minutes}m`);
      } else {
        setTimeUntilCutover(`${minutes}m`);
      }
      
      // Format local cutover time
      const localTime = nextMonday.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
      setLocalCutoverTime(localTime);
    };

    calculateCutover();
    const interval = setInterval(calculateCutover, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (variant === 'compact') {
    if (!timeUntilCutover) {
      return (
        <div className="flex items-center justify-center gap-2 text-sm">
          <span>⏰ Weekly contest ends in:</span>
          <Skeleton className="h-5 w-32" />
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-foreground/80">
        <span>⏰ Weekly contest ends in:</span>
        <span className="font-medium text-foreground">{timeUntilCutover} (UTC)</span>
      </div>
    );
  }

  if (!timeUntilCutover) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Weekly Contest Cutover</AlertTitle>
        <AlertDescription className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-4 w-64" />
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Weekly Contest Cutover</AlertTitle>
      <AlertDescription className="space-y-1">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Next transition: <span className="font-medium">{timeUntilCutover}</span></span>
        </div>
        <p className="text-xs text-muted-foreground">
          Every Monday 00:00 UTC ({localCutoverTime})
        </p>
      </AlertDescription>
    </Alert>
  );
}