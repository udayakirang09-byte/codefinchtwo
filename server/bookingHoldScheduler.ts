import type { IStorage } from './storage';

export class BookingHoldScheduler {
  private storage: IStorage;
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  start(intervalMs: number = 60000) { // Check every 1 minute
    console.log('🔒 Booking hold cleanup scheduler started (checking every 60 seconds)');
    
    this.intervalId = setInterval(async () => {
      if (this.isProcessing) {
        return;
      }

      this.isProcessing = true;
      try {
        await this.cleanupExpiredHolds();
      } catch (error) {
        console.error('❌ Booking hold cleanup scheduler error:', error);
      } finally {
        this.isProcessing = false;
      }
    }, intervalMs);

    // Run initial check
    this.cleanupExpiredHolds().catch(console.error);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Booking hold cleanup scheduler stopped');
    }
  }

  private async cleanupExpiredHolds() {
    try {
      const cleaned = await this.storage.cleanupExpiredHolds();
      
      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} expired booking holds`);
      }
    } catch (error) {
      console.error('❌ Error in cleanupExpiredHolds:', error);
      throw error;
    }
  }
}
