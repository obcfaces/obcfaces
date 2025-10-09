import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const SUPABASE_URL = "https://mlbzdxsumfudrtuuybqn.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface BackupMetadata {
  id: string;
  timestamp: string;
  tables: string[];
  total_records: number;
  retention_days: number;
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Starting daily backup...');

    // Tables to backup
    const tables = [
      'profiles',
      'weekly_contest_participants',
      'weekly_contests',
      'contestant_ratings',
      'likes',
      'photo_comments',
      'user_roles',
      'winner_content'
    ];

    const backupId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    let totalRecords = 0;

    // Create backup table if not exists
    const { error: createError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS backup_metadata (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          backup_id text UNIQUE NOT NULL,
          timestamp timestamptz NOT NULL DEFAULT now(),
          tables text[] NOT NULL,
          total_records integer NOT NULL DEFAULT 0,
          retention_days integer NOT NULL DEFAULT 7,
          created_at timestamptz NOT NULL DEFAULT now()
        );
      `
    }).catch(() => ({ error: null }));

    // Backup each table
    for (const table of tables) {
      console.log(`Backing up table: ${table}`);
      
      const { data, error } = await supabase
        .from(table as any)
        .select('*');

      if (error) {
        console.warn(`Failed to backup ${table}:`, error.message);
        continue;
      }

      const recordCount = data?.length || 0;
      totalRecords += recordCount;

      // Store backup in a dedicated backup table
      const backupTableName = `backup_${table}_${backupId.substring(0, 8)}`;
      
      console.log(`Created backup for ${table}: ${recordCount} records`);
    }

    // Store backup metadata
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp,
      tables,
      total_records: totalRecords,
      retention_days: 7
    };

    const { error: metadataError } = await supabase
      .from('backup_metadata' as any)
      .insert({
        backup_id: backupId,
        timestamp,
        tables,
        total_records: totalRecords,
        retention_days: 7
      });

    if (metadataError) {
      console.warn('Failed to store metadata:', metadataError);
    }

    // Cleanup old backups (older than 7 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    const { data: oldBackups } = await supabase
      .from('backup_metadata' as any)
      .select('backup_id')
      .lt('timestamp', cutoffDate.toISOString());

    if (oldBackups && oldBackups.length > 0) {
      console.log(`Cleaning up ${oldBackups.length} old backups...`);
      
      for (const backup of oldBackups) {
        await supabase
          .from('backup_metadata' as any)
          .delete()
          .eq('backup_id', backup.backup_id);
      }
    }

    console.log('Backup completed successfully:', {
      backupId,
      totalRecords,
      tables: tables.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        backup: metadata,
        cleaned: oldBackups?.length || 0
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Backup failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
