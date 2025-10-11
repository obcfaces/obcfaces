import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Database, Loader2, CheckCircle, X, MoreVertical, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { backupManager } from '@/utils/backup';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BackupMetadata {
  id: string;
  timestamp: number;
  tables: string[];
  totalRecords: number;
  size: number;
  checksum: string;
}

export const BackupTrigger = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [restoreBackupId, setRestoreBackupId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const backupList = await backupManager.listBackups();
      setBackups(backupList);
    } catch (error) {
      console.error('Failed to load backups:', error);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const createBackup = async () => {
    setIsCreating(true);
    try {
      const metadata = await backupManager.createBackup({
        tables: [
          'profiles',
          'weekly_contest_participants',
          'weekly_contests',
          'contestant_ratings',
          'likes',
          'photo_comments',
          'user_roles',
          'winner_content',
          'messages',
          'conversations',
          'conversation_participants'
        ],
        batchSize: 1000,
        retentionDays: 30
      });

      const timestamp = new Date().toLocaleString('en-US');
      const displayName = backupName.trim() || `Backup ${timestamp}`;
      setLastBackup(displayName);
      setBackupName('');
      setShowNameInput(false);
      
      toast.success('Backup created successfully', {
        description: `${displayName} (ID: ${metadata.id})`
      });
      
      await loadBackups();
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error('Backup creation failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreBackupId) return;
    
    setIsRestoring(true);
    try {
      await backupManager.restoreBackup(restoreBackupId);
      toast.success('Backup restored successfully');
      setRestoreBackupId(null);
    } catch (error) {
      console.error('Restore failed:', error);
      toast.error('Backup restoration failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const formatBackupDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Backups</h4>
              <Button 
                onClick={() => setShowNameInput(!showNameInput)}
                size="sm"
                variant="ghost"
              >
                <Database className="h-3 w-3 mr-1" />
                New
              </Button>
            </div>

            {showNameInput && (
              <div className="flex gap-2">
                <Input
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  placeholder="Backup name (optional)"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createBackup();
                    if (e.key === 'Escape') {
                      setShowNameInput(false);
                      setBackupName('');
                    }
                  }}
                />
                <Button 
                  onClick={createBackup}
                  disabled={isCreating}
                  size="sm"
                >
                  {isCreating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'Create'
                  )}
                </Button>
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isLoadingBackups ? (
                <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
              ) : backups.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No backups available</p>
              ) : (
                backups.map((backup) => (
                  <div 
                    key={backup.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent text-sm"
                  >
                    <div className="flex-1">
                      <p className="text-xs font-medium">
                        {formatBackupDate(backup.timestamp)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {backup.totalRecords} records
                      </p>
                    </div>
                    <Button
                      onClick={() => setRestoreBackupId(backup.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={!!restoreBackupId} onOpenChange={(open) => !open && setRestoreBackupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the selected backup. This action cannot be undone. Make sure you have a recent backup before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                'Restore'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
