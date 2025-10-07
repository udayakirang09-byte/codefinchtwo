import { IStorage } from './storage.js';
import * as azureStorage from './azureStorage.js';

export class RetentionScheduler {
  private storage: IStorage;
  private interval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  public start(): void {
    console.log('🗑️ Recording retention scheduler started (checking every 24 hours)');
    
    // Run immediately on start
    this.checkAndDeleteExpiredRecordings().catch(err => {
      console.error('❌ Retention check failed on startup:', err);
    });
    
    // Then run every 24 hours
    this.interval = setInterval(() => {
      this.checkAndDeleteExpiredRecordings().catch(err => {
        console.error('❌ Retention check failed:', err);
      });
    }, this.CHECK_INTERVAL_MS);
  }

  public stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('🛑 Recording retention scheduler stopped');
    }
  }

  private async checkAndDeleteExpiredRecordings(): Promise<void> {
    const startTime = Date.now();
    console.log('🔍 Checking for expired recordings...');

    try {
      const expiredRecordings = await this.storage.getExpiredRecordings();
      
      if (expiredRecordings.length === 0) {
        console.log('✅ No expired recordings found');
        return;
      }

      console.log(`📋 Found ${expiredRecordings.length} expired recording(s) to delete`);

      for (const recording of expiredRecordings) {
        await this.deleteRecording(recording);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Retention check completed (${duration}ms, deleted ${expiredRecordings.length} recording(s))`);
    } catch (error) {
      console.error('❌ Retention check failed:', error);
      throw error;
    }
  }

  private async deleteRecording(recording: any): Promise<void> {
    const { id, bookingId, studentId, blobPath } = recording;
    
    console.log(`🗑️ Deleting expired recording: ${blobPath} (booking: ${bookingId})`);

    try {
      // Delete blob from Azure Storage first - if this fails, we throw and don't touch DB
      if (studentId && bookingId) {
        await azureStorage.azureStorage.deleteMergedRecording(studentId, bookingId);
        console.log(`  ✅ Deleted blob: ${blobPath}`);
      }

      // Only mark as deleted in DB if blob deletion succeeded
      await this.storage.deleteMergedRecording(id);
      await this.storage.deleteRecordingPartsByBooking(bookingId);
      
      console.log(`  ✅ Marked recording and parts as deleted in database`);
    } catch (error) {
      console.error(`  ❌ Failed to delete recording ${id}:`, error);
      // Error propagates - DB records remain 'active', so retention will retry next cycle
      throw error;
    }
  }
}
