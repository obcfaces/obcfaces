import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { backupManager } from '@/utils/backup';

export const BackupTrigger = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

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

      setLastBackup(new Date().toLocaleString('ru-RU'));
      toast.success('Бэкап успешно создан', {
        description: `ID: ${backupId}`
      });
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error('Ошибка создания бэкапа', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex-1">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" />
          Создание бэкапа
        </h3>
        {lastBackup && (
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Последний бэкап: {lastBackup}
          </p>
        )}
      </div>
      <Button 
        onClick={createBackup}
        disabled={isCreating}
        size="lg"
      >
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Создание...
          </>
        ) : (
          <>
            <Database className="mr-2 h-4 w-4" />
            Создать бэкап
          </>
        )}
      </Button>
    </div>
  );
};
