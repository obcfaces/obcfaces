import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  submessage?: string;
}

export function LoadingSpinner({ 
  message = "Loading data...", 
  submessage = "Please wait" 
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg font-medium">{message}</p>
      {submessage && <p className="text-sm text-muted-foreground">{submessage}</p>}
    </div>
  );
}
