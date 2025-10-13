import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface RatingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantName: string;
  ratings: Array<{
    user_id: string;
    display_name: string;
    avatar_url?: string;
    rating: number;
    voted_at: string;
  }>;
}

export function RatingsModal({
  isOpen,
  onClose,
  participantName,
  ratings,
}: RatingsModalProps) {
  const averageRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : '0.0';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Ratings for {participantName}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Average: {averageRating} ({ratings.length} votes)
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] pr-4">
          {ratings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No ratings yet
            </div>
          ) : (
            <div className="space-y-2">
              {ratings.map((rating) => (
                <div
                  key={rating.user_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={rating.avatar_url} />
                    <AvatarFallback>
                      {rating.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {rating.display_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(rating.voted_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Badge className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {rating.rating}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
