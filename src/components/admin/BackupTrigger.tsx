import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Database, Loader2, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { backupManager } from '@/utils/backup';

export const BackupTrigger = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [backupName, setBackupName] = useState('');

  const createBackup = async () => {
    setIsCreating(true);
    try {
      const backupId = await backupManager.createBackup({
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
        description: `${displayName} (ID: ${backupId})`
      });
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error('Backup creation failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {showNameInput ? (
        <>
          <Input
            value={backupName}
            onChange={(e) => setBackupName(e.target.value)}
            placeholder="Backup name (optional)"
            className="w-64"
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
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Database className="mr-1 h-3 w-3" />
                Create
              </>
            )}
          </Button>
          <Button
            onClick={() => {
              setShowNameInput(false);
              setBackupName('');
            }}
            variant="ghost"
            size="sm"
          >
            <X className="h-3 w-3" />
          </Button>
        </>
      ) : (
        <Button 
          onClick={() => setShowNameInput(true)}
          size="sm"
          variant="outline"
        >
          <Database className="mr-1 h-3 w-3" />
          Backup
        </Button>
      )}
      
      {lastBackup && !showNameInput && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-500" />
          {lastBackup}
        </p>
      )}
    </div>
  );
};
