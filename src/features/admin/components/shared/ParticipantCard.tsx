import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Heart, Star, Trophy, MoreVertical, History, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ParticipantCardProps {
  participant: any;
  appData: any;
  firstName: string;
  lastName: string;
  photo1: string;
  photo2: string;
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onEdit: (participant: any) => void;
  onStatusChange: (participant: any, status: string) => void;
  onViewVoters?: (data: { id: string; name: string }) => void;
  onStatusHistory?: (id: string, name: string, history: any) => void;
  onDelete?: (participant: any) => void;
  onRestore?: (participant: any) => void;
  showStats?: boolean;
  showHistory?: boolean;
  showDeleteMenu?: boolean;
  submittedDate?: Date | null;
  isWinner?: boolean;
}

export function ParticipantCard({
  participant,
  appData,
  firstName,
  lastName,
  photo1,
  photo2,
  onViewPhotos,
  onEdit,
  onStatusChange,
  onViewVoters,
  onStatusHistory,
  onDelete,
  onRestore,
  showStats = false,
  showHistory = false,
  showDeleteMenu = false,
  submittedDate = null,
  isWinner = false,
}: ParticipantCardProps) {
  const participantName = `${firstName} ${lastName}`;
  const age = new Date().getFullYear() - (appData.birth_year || new Date().getFullYear() - 25);

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case 'pre next week':
        return 'bg-purple-100 dark:bg-purple-900';
      case 'next week':
        return 'bg-[hsl(var(--status-next-week))]';
      case 'this week':
        return 'bg-[hsl(var(--status-this-week))]';
      case 'past':
        return 'bg-[hsl(var(--status-past))]';
      default:
        return '';
    }
  };

  return (
    <Card className={`overflow-hidden relative h-[149px] ${isWinner ? 'border-yellow-500' : ''} ${participant.admin_status === 'rejected' ? 'bg-red-50 border-red-200' : ''} ${participant.deleted_at ? 'opacity-60' : ''}`}>
      <CardContent className="p-0">
        {/* Date/Time badge */}
        {submittedDate && (
          <Badge 
            variant="outline" 
            className="absolute top-0 left-0 z-20 text-xs rounded-none rounded-br-md font-normal bg-muted/90 border-border"
          >
            {submittedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}{' '}
            {submittedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </Badge>
        )}

        {/* Three dots menu */}
        {showDeleteMenu && (
          <div className="absolute top-0 right-0 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-none rounded-bl-md hover:bg-background/90 bg-background/80">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[9999]">
                {onStatusHistory && (
                  <DropdownMenuItem onClick={() => onStatusHistory(participant.id, participantName, participant.status_history)}>
                    <History className="h-3.5 w-3.5 mr-2" />
                    History
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => participant.deleted_at ? onRestore?.(participant) : onDelete?.(participant)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  {participant.deleted_at ? 'Restore' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Edit button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(participant)}
          className="absolute bottom-0 left-0 z-20 p-1 m-0 rounded-none rounded-tr-md border-0 border-t border-r bg-background/90 hover:bg-background"
          title="Edit Application"
        >
          <Edit className="w-4 h-4" />
        </Button>

        {/* Desktop layout */}
        <div className="hidden md:flex">
          {/* Photos */}
          <div className="flex gap-px w-[25ch] flex-shrink-0">
            {photo1 && (
              <div className="w-1/2">
                <img 
                  src={photo1} 
                  alt="Portrait" 
                  className="w-full h-[149px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, participantName)}
                />
              </div>
            )}
            {photo2 && (
              <div className="w-1/2 relative">
                <img 
                  src={photo2} 
                  alt="Full length" 
                  className="w-full h-[149px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 1, participantName)}
                />
                <div className="absolute top-2 right-2">
                  <Avatar className="h-6 w-6 flex-shrink-0 border-2 border-white shadow-sm">
                    <AvatarImage src={photo1 || ''} />
                    <AvatarFallback className="text-xs">{firstName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </div>
                {isWinner && (
                  <div className="absolute top-2 left-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="w-[50ch] flex-shrink-0 flex-1 min-w-0 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold whitespace-nowrap">
                {age} {firstName} {lastName}
              </span>
            </div>

            <div className="text-xs text-muted-foreground mb-1">
              {appData.city} {appData.state} {appData.country}
            </div>

            {showStats && (
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-semibold">
                    {Number(participant.average_rating || 0).toFixed(1)}
                  </span>
                </div>
                <div 
                  className="flex items-center gap-1 cursor-pointer" 
                  onClick={() => onViewVoters?.({ id: participant.id, name: participantName })}
                >
                  <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
                  <span className="text-xs font-semibold">
                    {participant.total_votes || 0}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <Select 
                value={participant.admin_status || 'pending'} 
                onValueChange={(value) => onStatusChange(participant, value)}
              >
                <SelectTrigger className={`w-24 h-7 text-xs ${getStatusBackgroundColor(participant.admin_status || 'pending')}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999] bg-popover border shadow-lg">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pre next week">Pre Next Week</SelectItem>
                  <SelectItem value="this week">This Week</SelectItem>
                  <SelectItem value="next week">Next Week</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden flex flex-col h-full">
          <div className="flex-1 p-3 flex gap-3">
            <div className="flex flex-col gap-1 w-20 flex-shrink-0">
              {photo1 && (
                <img 
                  src={photo1} 
                  alt="Portrait" 
                  className="w-full h-16 object-cover rounded cursor-pointer"
                  onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, participantName)}
                />
              )}
              {photo2 && (
                <img 
                  src={photo2} 
                  alt="Full length" 
                  className="w-full h-16 object-cover rounded cursor-pointer"
                  onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 1, participantName)}
                />
              )}
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-sm truncate mb-1">
                  {firstName} {lastName}
                  {isWinner && <Trophy className="inline h-4 w-4 text-yellow-500 ml-1" />}
                </h3>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>{appData.city || 'Unknown'}, {appData.country || 'Unknown'}</div>
                  {showStats && (
                    <div className="flex items-center gap-2">
                      <span>⭐ {Number(participant.average_rating || 0).toFixed(1)}</span>
                      <span>❤️ {participant.total_votes || 0}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <Select 
                  value={participant.admin_status || 'pending'} 
                  onValueChange={(value) => onStatusChange(participant, value)}
                >
                  <SelectTrigger className={`w-24 h-7 text-xs ${getStatusBackgroundColor(participant.admin_status || 'pending')}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] bg-popover border shadow-lg">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="pre next week">Pre Next Week</SelectItem>
                    <SelectItem value="this week">This Week</SelectItem>
                    <SelectItem value="next week">Next Week</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
