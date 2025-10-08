import type { IStorage } from './storage';
import { db } from './db';
import { adminConfig, users, paymentMethods } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

export class NoShowScheduler {
  private storage: IStorage;
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  start(intervalMs: number = 120000) { // Check every 2 minutes
    console.log('🔍 Teacher no-show detection started (checking every 2 minutes)');
    
    this.intervalId = setInterval(async () => {
      if (this.isProcessing) {
        return;
      }

      this.isProcessing = true;
      try {
        await this.detectNoShows();
      } catch (error) {
        console.error('❌ No-show detection error:', error);
      } finally {
        this.isProcessing = false;
      }
    }, intervalMs);

    // Run initial check
    this.detectNoShows().catch(console.error);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Teacher no-show detection stopped');
    }
  }

  private async detectNoShows() {
    const now = new Date();
    const fortyMinutesAgo = new Date(now.getTime() - 40 * 60 * 1000);

    // Get all bookings
    const allBookings = await this.storage.getBookings();

    // Filter for scheduled bookings that are 40+ minutes past their scheduled time (teacher didn't join)
    const noShowBookings = allBookings.filter(
      booking => booking.status === 'scheduled' && new Date(booking.scheduledAt) <= fortyMinutesAgo
    );

    if (noShowBookings.length === 0) {
      return;
    }

    console.log(`⚠️ Found ${noShowBookings.length} teacher no-show bookings`);

    for (const booking of noShowBookings) {
      try {
        await this.processNoShowRefund(booking);
      } catch (error) {
        console.error(`❌ Failed to process no-show for booking ${booking.id}:`, error);
      }
    }
  }

  private async processNoShowRefund(booking: any) {
    console.log(`🚨 Processing teacher no-show for booking ${booking.id}`);

    // Get the payment transaction for this booking FIRST
    const transactions = await this.storage.getTransactionsByUser(booking.studentId);
    const transaction = transactions.find(
      t => t.bookingId === booking.id && (t.status === 'completed' || t.status === 'processing')
    );

    if (!transaction) {
      console.log(`⚠️ No payment transaction found for booking ${booking.id} - skipping refund`);
      return;
    }

    // Get admin's preferred payment method (where refund comes from)
    const adminPreferredMethodConfig = await db.select().from(adminConfig)
      .where(eq(adminConfig.configKey, 'admin_preferred_payment_method'))
      .limit(1);
    
    const adminPreferredMethodType = adminPreferredMethodConfig[0]?.configValue || 'upi';
    
    // Get admin user
    const adminUsers = await db.select().from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);
    
    let adminPaymentMethodId = null;
    if (adminUsers.length > 0) {
      const adminPaymentMethods = await db.select().from(paymentMethods)
        .where(
          and(
            eq(paymentMethods.userId, adminUsers[0].id),
            eq(paymentMethods.type, adminPreferredMethodType),
            eq(paymentMethods.isActive, true)
          )
        )
        .limit(1);
      
      if (adminPaymentMethods.length > 0) {
        adminPaymentMethodId = adminPaymentMethods[0].id;
      }
    }

    // Validate admin payment method exists before proceeding
    if (!adminPaymentMethodId) {
      console.error(`❌ CRITICAL: Admin preferred payment method (${adminPreferredMethodType}) not found or inactive! Cannot process refund for booking ${booking.id}. Manual intervention required.`);
      // Keep booking as scheduled for manual processing
      return;
    }

    // Create refund transaction (teacher no-show)
    try {
      const refundData = {
        bookingId: booking.id,
        transactionType: "refund",
        amount: transaction.amount,
        transactionFee: "0.00",
        netAmount: transaction.amount,
        currency: "INR",
        fromUserId: transaction.toUserId,  // Admin (where refund comes from)
        toUserId: transaction.fromUserId,   // Student (where refund goes to)
        fromPaymentMethod: adminPaymentMethodId,  // Admin's preferred payment method
        toPaymentMethod: transaction.fromPaymentMethod,  // Student's original payment method
        status: "completed",
        workflowStage: "refund_to_student",
        completedAt: new Date()
      };

      const refundTransaction = await this.storage.createPaymentTransaction(refundData);
      
      // Only update booking and transaction status AFTER refund is successfully created
      await this.storage.updateBookingStatus(booking.id, 'cancelled');
      
      await this.storage.updatePaymentTransactionStatus(
        transaction.id, 
        'refunded', 
        'teacher_no_show_refund'
      );
      
      console.log(`✅ Teacher no-show refund completed: ${refundTransaction.id} for ₹${transaction.amount} (admin ${adminPreferredMethodType} → student), booking cancelled`);
    } catch (error) {
      console.error(`❌ Failed to create refund for booking ${booking.id}:`, error);
      // Booking remains scheduled for manual intervention
      throw error;
    }
  }
}
