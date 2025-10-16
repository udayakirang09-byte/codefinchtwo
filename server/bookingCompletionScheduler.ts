import type { IStorage } from './storage';

export class BookingCompletionScheduler {
  private storage: IStorage;
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  start(intervalMs: number = 60000) { // Check every 1 minute
    console.log('✅ Booking completion scheduler started (checking every 60 seconds)');
    
    this.intervalId = setInterval(async () => {
      if (this.isProcessing) {
        return;
      }

      this.isProcessing = true;
      try {
        await this.completeFinishedBookings();
      } catch (error) {
        console.error('❌ Booking completion scheduler error:', error);
      } finally {
        this.isProcessing = false;
      }
    }, intervalMs);

    // Run initial check
    this.completeFinishedBookings().catch(console.error);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Booking completion scheduler stopped');
    }
  }

  private async completeFinishedBookings() {
    try {
      // Get all scheduled bookings that have ended
      const endedBookings = await this.storage.getEndedScheduledBookings();
      
      if (endedBookings.length === 0) {
        return;
      }

      console.log(`📋 Found ${endedBookings.length} bookings to mark as completed`);

      for (const booking of endedBookings) {
        try {
          await this.storage.updateBookingStatus(booking.id, 'completed');
          console.log(`✅ Marked booking ${booking.id} as completed`);
        } catch (error) {
          console.error(`❌ Failed to complete booking ${booking.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error in completeFinishedBookings:', error);
      throw error;
    }
  }
}
