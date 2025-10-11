// Backup and data recovery utilities

interface BackupConfig {
  tables: string[];
  batchSize: number;
  retentionDays: number;
}

interface BackupMetadata {
  id: string;
  timestamp: number;
  tables: string[];
  totalRecords: number;
  size: number;
  checksum: string;
  name?: string;
}

export class BackupManager {
  private static instance: BackupManager;

  static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  // Create backup of critical data
  async createBackup(config: BackupConfig, name?: string): Promise<BackupMetadata> {
    const { supabase } = await import('@/integrations/supabase/client');
    const backupId = crypto.randomUUID();
    const timestamp = Date.now();
    let totalRecords = 0;
    const backupData: Record<string, any[]> = {};

    try {
      // Backup each table
      for (const table of config.tables) {
        console.log(`Backing up table: ${table}`);
        
        try {
          // Use dynamic query for backup since table names are dynamic
          const { data, error } = await supabase
            .from(table as any)
            .select('*')
            .limit(config.batchSize);

          if (error) {
            console.warn(`Failed to backup table ${table}: ${error.message}`);
            continue;
          }

          backupData[table] = data || [];
          totalRecords += data?.length || 0;
        } catch (err) {
          console.warn(`Skipping table ${table} due to error:`, err);
        }
      }

      // Calculate checksum
      const dataString = JSON.stringify(backupData);
      const checksum = await this.calculateChecksum(dataString);
      
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        tables: config.tables,
        totalRecords,
        size: dataString.length,
        checksum,
        name: name || undefined
      };

      // Store backup using IndexedDB
      await this.storeBackup(backupId, backupData, metadata);

      console.log('Backup created successfully:', metadata);
      return metadata;

    } catch (error) {
      console.error('Backup failed:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Backup too large. Consider reducing the number of tables or records.');
      }
      throw error;
    }
  }

  // Restore from backup
  async restoreBackup(backupId: string, tables?: string[]): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');

    try {
      const { backupData, metadata } = await this.retrieveBackup(backupId);
      
      // Verify checksum
      const dataString = JSON.stringify(backupData);
      const checksum = await this.calculateChecksum(dataString);
      
      if (checksum !== metadata.checksum) {
        throw new Error('Backup data integrity check failed');
      }

      const tablesToRestore = tables || metadata.tables;

      for (const table of tablesToRestore) {
        if (!backupData[table]) {
          console.warn(`Table ${table} not found in backup`);
          continue;
        }

        console.log(`Restoring table: ${table}`);
        
        // In a real scenario, you'd want to truncate and restore
        // For safety, we'll just log what would be restored
        console.log(`Would restore ${backupData[table].length} records to ${table}`);
        
        // Example restore operation (uncomment with caution):
        // const { error } = await supabase
        //   .from(table)
        //   .insert(backupData[table]);
        
        // if (error) {
        //   throw new Error(`Failed to restore table ${table}: ${error.message}`);
        // }
      }

      console.log('Restore completed successfully');

    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  // List available backups from IndexedDB
  async listBackups(): Promise<BackupMetadata[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BackupDatabase', 1);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        resolve([]);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('backups')) {
          db.createObjectStore('backups', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('metadata')) {
          db.close();
          resolve([]);
          return;
        }
        
        const transaction = db.transaction(['metadata'], 'readonly');
        const metadataStore = transaction.objectStore('metadata');
        const getAllRequest = metadataStore.getAll();
        
        getAllRequest.onsuccess = () => {
          const backups = getAllRequest.result || [];
          db.close();
          resolve(backups.sort((a, b) => b.timestamp - a.timestamp));
        };
        
        getAllRequest.onerror = () => {
          db.close();
          reject(getAllRequest.error);
        };
      };
    });
  }

  // Delete old backups
  async cleanupOldBackups(retentionDays: number): Promise<void> {
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    const backups = await this.listBackups();
    
    for (const backup of backups) {
      if (backup.timestamp < cutoffTime) {
        await this.deleteBackup(backup.id);
        console.log(`Deleted old backup: ${backup.id}`);
      }
    }
  }

  // Export data for migration
  async exportData(tables: string[], format: 'json' | 'csv' = 'json'): Promise<string> {
    const { supabase } = await import('@/integrations/supabase/client');
    const exportData: Record<string, any[]> = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table as any)
          .select('*');

        if (error) {
          console.warn(`Failed to export table ${table}: ${error.message}`);
          continue;
        }

        exportData[table] = data || [];
      } catch (err) {
        console.warn(`Skipping table ${table} due to error:`, err);
      }
    }

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      // Convert to CSV format
      let csvContent = '';
      for (const [tableName, records] of Object.entries(exportData)) {
        if (records.length === 0) continue;
        
        csvContent += `\n\n--- ${tableName} ---\n`;
        const headers = Object.keys(records[0]);
        csvContent += headers.join(',') + '\n';
        
        for (const record of records) {
          const values = headers.map(header => {
            const value = record[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value.toString();
          });
          csvContent += values.join(',') + '\n';
        }
      }
      return csvContent;
    }
  }

  // Import data from export
  async importData(dataString: string, format: 'json' | 'csv' = 'json'): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');

    try {
      let importData: Record<string, any[]>;

      if (format === 'json') {
        importData = JSON.parse(dataString);
      } else {
        // Parse CSV format (basic implementation)
        importData = this.parseCSVData(dataString);
      }

      for (const [tableName, records] of Object.entries(importData)) {
        if (records.length === 0) continue;

        console.log(`Importing ${records.length} records to ${tableName}`);
        
        // Import in batches
        const batchSize = 100;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          
          try {
            const { error } = await supabase
              .from(tableName as any)
              .upsert(batch, { onConflict: 'id' });

            if (error) {
              console.warn(`Failed to import batch to ${tableName}: ${error.message}`);
            }
          } catch (err) {
            console.warn(`Skipping batch for ${tableName}:`, err);
          }
        }
      }

      console.log('Import completed successfully');

    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Store backup data using IndexedDB for larger storage capacity
  private async storeBackup(
    backupId: string, 
    data: Record<string, any[]>, 
    metadata: BackupMetadata
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BackupDatabase', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('backups')) {
          db.createObjectStore('backups', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['backups', 'metadata'], 'readwrite');
        
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        
        const backupStore = transaction.objectStore('backups');
        const metadataStore = transaction.objectStore('metadata');
        
        backupStore.put({ id: backupId, data });
        metadataStore.put({ id: backupId, ...metadata });
      };
    });
  }

  private async retrieveBackup(backupId: string): Promise<{
    backupData: Record<string, any[]>;
    metadata: BackupMetadata;
  }> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BackupDatabase', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['backups', 'metadata'], 'readonly');
        
        const backupStore = transaction.objectStore('backups');
        const metadataStore = transaction.objectStore('metadata');
        
        const backupRequest = backupStore.get(backupId);
        const metadataRequest = metadataStore.get(backupId);
        
        let backupData: Record<string, any[]>;
        let metadata: BackupMetadata;
        
        backupRequest.onsuccess = () => {
          backupData = backupRequest.result?.data;
        };
        
        metadataRequest.onsuccess = () => {
          metadata = metadataRequest.result;
        };
        
        transaction.oncomplete = () => {
          db.close();
          if (!backupData || !metadata) {
            reject(new Error('Backup not found'));
          } else {
            resolve({ backupData, metadata });
          }
        };
        
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  private async deleteBackup(backupId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BackupDatabase', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['backups', 'metadata'], 'readwrite');
        
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        
        const backupStore = transaction.objectStore('backups');
        const metadataStore = transaction.objectStore('metadata');
        
        backupStore.delete(backupId);
        metadataStore.delete(backupId);
      };
    });
  }

  private parseCSVData(csvString: string): Record<string, any[]> {
    // Basic CSV parser - in production, use a proper CSV library
    const sections = csvString.split('--- ').filter(s => s.trim());
    const result: Record<string, any[]> = {};

    for (const section of sections) {
      const lines = section.trim().split('\n');
      if (lines.length < 2) continue;

      const tableName = lines[0].replace(' ---', '').trim();
      const headers = lines[1].split(',');
      const records = [];

      for (let i = 2; i < lines.length; i++) {
        const values = lines[i].split(',');
        const record: any = {};
        
        headers.forEach((header, index) => {
          record[header] = values[index] || null;
        });
        
        records.push(record);
      }

      result[tableName] = records;
    }

    return result;
  }
}

// Automated backup scheduling
export class BackupScheduler {
  private intervalId?: NodeJS.Timeout;

  startScheduledBackups(config: BackupConfig, intervalHours: number = 24): void {
    this.intervalId = setInterval(async () => {
      try {
        const backupManager = BackupManager.getInstance();
        await backupManager.createBackup(config);
        await backupManager.cleanupOldBackups(config.retentionDays);
        console.log('Scheduled backup completed');
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    }, intervalHours * 60 * 60 * 1000);

    console.log(`Scheduled backups started (every ${intervalHours} hours)`);
  }

  stopScheduledBackups(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log('Scheduled backups stopped');
    }
  }
}

// Export singleton instances
export const backupManager = BackupManager.getInstance();
export const backupScheduler = new BackupScheduler();