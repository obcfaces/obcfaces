import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface NextWeekVotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantName: string;
  voteType: 'like' | 'dislike';
  voters: Array<{
    user_id: string;
    display_name: string;
    avatar_url?: string;
    voted_at: string;
  }>;
}

export function NextWeekVotesModal({
  isOpen,
  onClose,
  participantName,
  voteType,
  voters,
}: NextWeekVotesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {voteType === 'like' ? '👍 Likes' : '👎 Dislikes'} for {participantName}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] pr-4">
          {voters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No {voteType}s yet
            </div>
          ) : (
            <div className="space-y-2">
              {voters.map((voter) => (
                <div
                  key={voter.user_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={voter.avatar_url} />
                    <AvatarFallback>
                      {voter.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {voter.display_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(voter.voted_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Badge variant={voteType === 'like' ? 'default' : 'destructive'}>
                    {voteType}
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
