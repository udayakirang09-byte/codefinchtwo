import type { IStorage } from './storage';
import * as azureStorage from './azureStorage';

export class RecordingScheduler {
  private storage: IStorage;
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  start(intervalMs: number = 60000) {
    console.log('🎬 Recording merge scheduler started (checking every 60 seconds)');
    
    this.intervalId = setInterval(async () => {
      if (this.isProcessing) {
        return;
      }

      this.isProcessing = true;
      try {
        await this.processPendingMerges();
      } catch (error) {
        console.error('❌ Recording scheduler error:', error);
      } finally {
        this.isProcessing = false;
      }
    }, intervalMs);

    this.processPendingMerges().catch(console.error);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Recording merge scheduler stopped');
    }
  }

  private async processPendingMerges() {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

    const pendingBookings = await this.storage.getBookingsForMerge(twentyMinutesAgo);

    if (pendingBookings.length === 0) {
      return;
    }

    console.log(`📹 Found ${pendingBookings.length} bookings ready for merge`);

    for (const booking of pendingBookings) {
      try {
        await this.mergeBookingRecording(booking);
      } catch (error) {
        console.error(`❌ Failed to merge booking ${booking.id}:`, error);
      }
    }
  }

  private async mergeBookingRecording(booking: any) {
    const startTime = Date.now();
    const { id: bookingId, studentId, mentorId, scheduledAt, sessionType } = booking;
    
    const parts = await this.storage.getRecordingPartsByBooking(bookingId);

    if (parts.length === 0) {
      console.log(`⚠️ No recording parts found for booking ${bookingId}`);
      return;
    }

    const existingMerge = await this.storage.getMergedRecordingByBooking(bookingId);
    if (existingMerge && existingMerge.status === 'completed') {
      const firstPartStatus = parts[0]?.status;
      if (firstPartStatus === 'merging') {
        console.log(`🔄 Merge exists for booking ${bookingId}, updating part statuses to 'merged'`);
        await this.storage.updateRecordingPartsMergeStatus(bookingId, 'merged');
      } else {
        console.log(`⏭️ Booking ${bookingId} already fully merged, skipping`);
      }
      return;
    }

    console.log(`🔗 Merging ${parts.length} parts for booking ${bookingId}`);

    await this.storage.updateRecordingPartsMergeStatus(bookingId, 'merging');

    let mergeResult;
    let blobCreated = false;
    let dbRecordCreated = false;
    
    try {
      const sortedParts = parts
        .sort((a, b) => a.partNumber - b.partNumber)
        .map(part => part.blobPath);

      mergeResult = await azureStorage.mergeRecordingParts({
        studentId,
        classId: bookingId,
        parts: sortedParts,
      });
      
      blobCreated = true;

      const totalSize = parts.reduce((sum, part) => sum + (part.fileSizeBytes || 0), 0);
      const totalDuration = parts.reduce((sum, part) => sum + (part.durationSeconds || 0), 0);

      // Get retention period from config
      const config = await this.storage.getAzureStorageConfig();
      const retentionMonths = config?.retentionMonths || 6; // Default to 6 months
      
      // Calculate expiration date (classDate + retention months)
      const classDate = new Date(scheduledAt);
      const expiresAt = new Date(classDate);
      expiresAt.setMonth(expiresAt.getMonth() + retentionMonths);

      // Feature Gap #2: Set isDemoRecording flag for demo sessions
      await this.storage.createMergedRecording({
        bookingId,
        studentId,
        mentorId,
        isDemoRecording: sessionType === 'demo', // Lock demo recordings until student completes ≥1 paid class
        blobPath: mergeResult.blobPath,
        blobUrl: mergeResult.url,
        fileSizeBytes: totalSize,
        durationSeconds: totalDuration,
        totalParts: parts.length,
        expiresAt,
        status: 'completed',
      });
      
      dbRecordCreated = true;

      await this.storage.updateRecordingPartsMergeStatus(bookingId, 'merged');

      const duration = Date.now() - startTime;
      console.log(`✅ Successfully merged recording for booking ${bookingId}: ${mergeResult.blobPath} (${duration}ms, ${parts.length} parts, ${totalSize} bytes)`);
    } catch (error) {
      console.error(`❌ Merge failed for booking ${bookingId}:`, error);
      
      if (blobCreated && !dbRecordCreated && mergeResult?.blobPath) {
        try {
          await azureStorage.azureStorage.deleteMergedRecording(studentId, bookingId);
          console.log(`🧹 Cleaned up orphan merged blob: ${mergeResult.blobPath}`);
        } catch (cleanupError) {
          console.error(`⚠️ Failed to cleanup orphan blob ${mergeResult.blobPath}:`, cleanupError);
        }
        
        await this.storage.updateRecordingPartsMergeStatus(bookingId, 'merge_failed');
      } else if (dbRecordCreated) {
        console.error(`⚠️ Merge succeeded but status update failed for booking ${bookingId} - parts will retry status update next cycle`);
      }
      
      throw error;
    }
  }
}
