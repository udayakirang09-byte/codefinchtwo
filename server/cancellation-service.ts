/**
 * Comprehensive Cancellation & Refund/Payout Service
 * 
 * Implements the 9 scenarios with final refund/payout logic:
 * 1. Class Held Normally - Teacher payout 85%, Platform fee 15%
 * 2. Teacher Cancelled (Before Start) - Full refund (100%) to student; no platform fee
 * 3. Student Cancelled (Before Start) - Refund 90% to student; Platform retains 10%
 * 4. AI: Teacher Late Join (>10 min) - Teacher payout 85%, Platform fee 15%; flag "Late Join" for analytics
 * 5. AI: Teacher Overall No-Show (≥15 min Not Connected) - Refund 85% to student; Platform fee 15% retained
 * 6. AI: Low Presence (Teacher Inactive >30%) - Teacher payout 85%, Platform fee 15%
 * 7. AI: Connectivity Issues (Platform-side) - Refund 100% to student; No platform fee retained
 * 8. Short Session (<50%) - Refund 85% to student; Platform fee 15% retained
 * 9. Admin Manual Cancellation - Full refund (100%) to student; no platform fee retained
 */

import { db } from "./db";
import { bookings, paymentTransactions } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { IStorage } from "./storage";

export interface CancellationResult {
  success: boolean;
  bookingId: string;
  cancellationType: string;
  refundAmount?: number;
  refundStatus: string;
  teacherPayoutAmount?: number;
  platformFeeAmount?: number;
  teacherPayoutStatus?: string;
  message: string;
  dashboardHighlight?: {
    teacher: string;
    student: string;
  };
}

export class CancellationService {
  constructor(private storage: IStorage) {}

  /**
   * Scenario 1: Class Held Normally - Teacher payout 85%, Platform fee 15%
   */
  async markClassCompleted(bookingId: string): Promise<CancellationResult> {
    const booking = await this.storage.getBooking(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Get payment transaction to calculate payout
    const transaction = await this.getPaymentTransaction(bookingId);
    const totalAmount = transaction ? parseFloat(transaction.amount) : 0;
    
    // Calculate teacher payout (85%) and platform fee (15%)
    const teacherPayoutAmount = totalAmount * 0.85;
    const platformFeeAmount = totalAmount * 0.15;

    await db
      .update(bookings)
      .set({
        status: 'completed',
        refundStatus: 'not_applicable',
        teacherPayoutAmount: teacherPayoutAmount.toFixed(2),
        platformFeeAmount: platformFeeAmount.toFixed(2),
        teacherPayoutStatus: transaction ? 'pending' : 'not_applicable',
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId));

    console.log(`✅ Class completed - Teacher payout: ₹${teacherPayoutAmount.toFixed(2)} (85%), Platform fee: ₹${platformFeeAmount.toFixed(2)} (15%)`);

    return {
      success: true,
      bookingId,
      cancellationType: 'none',
      refundStatus: 'not_applicable',
      teacherPayoutAmount,
      platformFeeAmount,
      teacherPayoutStatus: transaction ? 'pending' : 'not_applicable',
      message: 'Class completed successfully - Teacher payout 85%, Platform fee 15%',
      dashboardHighlight: {
        teacher: 'Demo Completed Successfully',
        student: 'Demo Completed Successfully'
      }
    };
  }

  /**
   * Scenario 2: Teacher Cancelled (Before Start) - Full refund (100%) to student, no platform fee
   */
  async teacherCancelBeforeStart(
    bookingId: string,
    teacherId: string,
    reason?: string
  ): Promise<CancellationResult> {
    const booking = await this.storage.getBooking(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // CRITICAL: Verify ownership - prevent unauthorized cancellation
    if (booking.mentorId !== teacherId) {
      throw new Error("Unauthorized: You can only cancel your own classes");
    }

    const now = new Date();
    const scheduledTime = new Date(booking.scheduledAt);

    // Check if class hasn't started yet
    if (now >= scheduledTime) {
      throw new Error("Cannot cancel after class has started");
    }

    // Get payment transaction
    const transaction = await this.getPaymentTransaction(bookingId);
    const totalAmount = transaction ? parseFloat(transaction.amount) : 0;
    
    // Full refund (100%) to student, no platform fee
    const refundAmount = totalAmount;
    const platformFeeAmount = 0;
    const teacherPayoutAmount = 0;

    // Cancel booking
    await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledBy: 'teacher',
        cancellationType: 'teacher_cancelled',
        cancelledAt: now,
        cancelReason: reason || 'Teacher manually cancelled before start',
        refundStatus: transaction ? 'pending' : 'not_applicable',
        refundAmount: refundAmount > 0 ? refundAmount.toFixed(2) : null,
        teacherPayoutAmount: teacherPayoutAmount.toFixed(2),
        platformFeeAmount: platformFeeAmount.toFixed(2),
        teacherPayoutStatus: 'withheld',
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    // Schedule refund if payment exists
    if (transaction) {
      await this.scheduleRefund(transaction.id, refundAmount);
    }

    console.log(`✅ Teacher cancelled - Full refund: ₹${refundAmount.toFixed(2)} (100%), No platform fee`);

    return {
      success: true,
      bookingId,
      cancellationType: 'teacher_cancelled',
      refundAmount,
      refundStatus: transaction ? 'pending' : 'not_applicable',
      teacherPayoutAmount,
      platformFeeAmount,
      teacherPayoutStatus: 'withheld',
      message: 'Teacher cancelled class - full refund (100%) to student, no platform fee',
      dashboardHighlight: {
        teacher: 'You Cancelled This Demo Class',
        student: 'Class Cancelled by Teacher'
      }
    };
  }

  /**
   * Scenario 3: Student Cancelled (Before Start) - Refund 90% to student, Platform retains 10%
   */
  async studentCancelBeforeStart(
    bookingId: string,
    studentId: string,
    reason?: string
  ): Promise<CancellationResult> {
    const booking = await this.storage.getBooking(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // CRITICAL: Verify ownership - prevent unauthorized cancellation
    if (booking.studentId !== studentId) {
      throw new Error("Unauthorized: You can only cancel your own bookings");
    }

    const now = new Date();
    const scheduledTime = new Date(booking.scheduledAt);
    const sixHoursBeforeClass = new Date(scheduledTime.getTime() - 6 * 60 * 60 * 1000);

    // Check 6-hour restriction
    if (now >= sixHoursBeforeClass) {
      throw new Error("Cannot cancel within 6 hours of the scheduled class time");
    }

    // Get payment transaction
    const transaction = await this.getPaymentTransaction(bookingId);
    const totalAmount = transaction ? parseFloat(transaction.amount) : 0;
    
    // Refund 90% to student, Platform retains 10%
    const refundAmount = totalAmount * 0.90;
    const platformFeeAmount = totalAmount * 0.10;
    const teacherPayoutAmount = 0;

    // Cancel booking
    await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledBy: 'student',
        cancellationType: 'student_cancelled',
        cancelledAt: now,
        cancelReason: reason || 'Student manually cancelled before start',
        refundStatus: transaction ? 'pending' : 'not_applicable',
        refundAmount: refundAmount > 0 ? refundAmount.toFixed(2) : null,
        teacherPayoutAmount: teacherPayoutAmount.toFixed(2),
        platformFeeAmount: platformFeeAmount.toFixed(2),
        teacherPayoutStatus: 'withheld',
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    // Schedule refund if payment exists
    if (transaction) {
      await this.scheduleRefund(transaction.id, refundAmount);
    }

    console.log(`✅ Student cancelled - Refund: ₹${refundAmount.toFixed(2)} (90%), Platform fee: ₹${platformFeeAmount.toFixed(2)} (10%)`);

    return {
      success: true,
      bookingId,
      cancellationType: 'student_cancelled',
      refundAmount,
      refundStatus: transaction ? 'pending' : 'not_applicable',
      teacherPayoutAmount,
      platformFeeAmount,
      teacherPayoutStatus: 'withheld',
      message: 'Student cancelled class - refund 90% to student, platform retains 10%',
      dashboardHighlight: {
        teacher: 'Class Cancelled by Student',
        student: 'You Cancelled This Demo Class'
      }
    };
  }

  /**
   * Scenario 4: Teacher Late Join (>10 min) - Teacher payout 85%, Platform fee 15%, flag for analytics
   * AI/System Trigger: Joined > 10 min after start + 25% duration
   */
  async detectAndCancelLateJoin(bookingId: string): Promise<CancellationResult> {
    const booking = await this.storage.getBooking(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const now = new Date();
    const scheduledTime = new Date(booking.scheduledAt);
    const lateThreshold = new Date(scheduledTime.getTime() + 10 * 60 * 1000 + (booking.duration * 0.25 * 60 * 1000));

    // Check if teacher joined late
    const teacherJoinedAt = booking.teacherJoinedAt ? new Date(booking.teacherJoinedAt) : null;
    if (!teacherJoinedAt || teacherJoinedAt <= lateThreshold) {
      return {
        success: false,
        bookingId,
        cancellationType: 'none',
        refundStatus: 'not_applicable',
        message: 'Teacher joined on time'
      };
    }

    // Get payment transaction
    const transaction = await this.getPaymentTransaction(bookingId);
    const totalAmount = transaction ? parseFloat(transaction.amount) : 0;
    
    // Teacher still gets 85% payout, Platform gets 15% - flagged for analytics
    const teacherPayoutAmount = totalAmount * 0.85;
    const platformFeeAmount = totalAmount * 0.15;
    const refundAmount = 0;

    // Mark as completed (not cancelled) with late join flag for analytics
    await db
      .update(bookings)
      .set({
        status: 'completed',
        cancelledBy: 'system',
        cancellationType: 'late_join',
        lateJoinDetectedAt: now,
        cancelReason: `Teacher joined > 10 min late (flagged for analytics)`,
        refundStatus: 'not_applicable',
        refundAmount: null,
        teacherPayoutAmount: teacherPayoutAmount.toFixed(2),
        platformFeeAmount: platformFeeAmount.toFixed(2),
        teacherPayoutStatus: transaction ? 'pending' : 'not_applicable',
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    console.log(`⚠️ Late join detected - Teacher payout: ₹${teacherPayoutAmount.toFixed(2)} (85%), Platform fee: ₹${platformFeeAmount.toFixed(2)} (15%), Flagged for analytics`);

    return {
      success: true,
      bookingId,
      cancellationType: 'late_join',
      refundAmount,
      refundStatus: 'not_applicable',
      teacherPayoutAmount,
      platformFeeAmount,
      teacherPayoutStatus: transaction ? 'pending' : 'not_applicable',
      message: 'Teacher late join detected - Teacher payout 85%, Platform fee 15%, flagged for analytics',
      dashboardHighlight: {
        teacher: 'Late Join Detected (Analytics Flagged)',
        student: 'Class Completed (Teacher Joined Late)'
      }
    };
  }

  /**
   * Scenario 5: Teacher Overall No-Show (≥15 min Not Connected) - Refund 85% to student, Platform fee 15% retained
   * AI/System Trigger: Teacher offline/disconnected ≥ 15 min total
   */
  async detectAndCancelTeacherNoShow(
    bookingId: string,
    offlineDuration: number
  ): Promise<CancellationResult> {
    const booking = await this.storage.getBooking(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Check if offline duration exceeds 15 minutes
    if (offlineDuration < 15) {
      return {
        success: false,
        bookingId,
        cancellationType: 'none',
        refundStatus: 'not_applicable',
        message: 'Offline duration within acceptable range'
      };
    }

    const now = new Date();
    const transaction = await this.getPaymentTransaction(bookingId);
    const totalAmount = transaction ? parseFloat(transaction.amount) : 0;
    
    // Refund 85% to student, Platform retains 15%
    const refundAmount = totalAmount * 0.85;
    const platformFeeAmount = totalAmount * 0.15;
    const teacherPayoutAmount = 0;

    await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledBy: 'system',
        cancellationType: 'teacher_no_show',
        cancelledAt: now,
        cancelReason: `Teacher offline/disconnected ≥ 15 min (${offlineDuration} min total)`,
        refundStatus: transaction ? 'pending' : 'not_applicable',
        refundAmount: refundAmount > 0 ? refundAmount.toFixed(2) : null,
        teacherPayoutAmount: teacherPayoutAmount.toFixed(2),
        platformFeeAmount: platformFeeAmount.toFixed(2),
        teacherPayoutStatus: 'withheld',
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    if (transaction) {
      await this.scheduleRefund(transaction.id, refundAmount);
    }

    console.log(`✅ Teacher no-show - Refund: ₹${refundAmount.toFixed(2)} (85%), Platform fee: ₹${platformFeeAmount.toFixed(2)} (15%)`);

    return {
      success: true,
      bookingId,
      cancellationType: 'teacher_no_show',
      refundAmount,
      refundStatus: transaction ? 'pending' : 'not_applicable',
      teacherPayoutAmount,
      platformFeeAmount,
      teacherPayoutStatus: 'withheld',
      message: 'Teacher no-show detected - Refund 85% to student, Platform fee 15% retained',
      dashboardHighlight: {
        teacher: 'Teacher No-Show - Cancelled',
        student: 'Teacher No-Show - 85% Refund Processing'
      }
    };
  }

  /**
   * Scenario 6: Low Presence (Teacher Inactive >30%) - Teacher payout 85%, Platform fee 15%
   * AI/System Trigger: AI detects no cursor + inactive >30% duration
   */
  async detectAndCancelLowPresence(
    bookingId: string,
    inactivePercent: number
  ): Promise<CancellationResult> {
    const booking = await this.storage.getBooking(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Check if inactive percentage exceeds 30%
    if (inactivePercent < 30) {
      return {
        success: false,
        bookingId,
        cancellationType: 'none',
        refundStatus: 'not_applicable',
        message: 'Teacher presence within acceptable range'
      };
    }

    const now = new Date();
    const transaction = await this.getPaymentTransaction(bookingId);
    const totalAmount = transaction ? parseFloat(transaction.amount) : 0;
    
    // Teacher still gets 85% payout, Platform gets 15%
    const teacherPayoutAmount = totalAmount * 0.85;
    const platformFeeAmount = totalAmount * 0.15;
    const refundAmount = 0;

    await db
      .update(bookings)
      .set({
        status: 'completed',
        cancelledBy: 'system',
        cancellationType: 'low_presence',
        lowPresenceDetectedAt: now,
        teacherAbsentPercent: Math.round(inactivePercent),
        cancelReason: `Teacher inactive >30% (${inactivePercent}%) - flagged for analytics`,
        refundStatus: 'not_applicable',
        refundAmount: null,
        teacherPayoutAmount: teacherPayoutAmount.toFixed(2),
        platformFeeAmount: platformFeeAmount.toFixed(2),
        teacherPayoutStatus: transaction ? 'pending' : 'not_applicable',
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    console.log(`⚠️ Low presence - Teacher payout: ₹${teacherPayoutAmount.toFixed(2)} (85%), Platform fee: ₹${platformFeeAmount.toFixed(2)} (15%)`);

    return {
      success: true,
      bookingId,
      cancellationType: 'low_presence',
      refundAmount,
      refundStatus: 'not_applicable',
      teacherPayoutAmount,
      platformFeeAmount,
      teacherPayoutStatus: transaction ? 'pending' : 'not_applicable',
      message: 'Low teacher presence detected - Teacher payout 85%, Platform fee 15%',
      dashboardHighlight: {
        teacher: 'Low Presence Detected (Analytics Flagged)',
        student: 'Class Completed (Low Teacher Activity)'
      }
    };
  }

  /**
   * Scenario 7: Connectivity Issues (Platform-side) - Refund 100% to student, No platform fee retained
   * AI/System Trigger: AI detects platform-side connectivity issues (>25% connection loss)
   */
  async detectAndCancelConnectivityIssue(
    bookingId: string,
    connectionLossPercent: number
  ): Promise<CancellationResult> {
    const booking = await this.storage.getBooking(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Check if connection loss exceeds 25%
    if (connectionLossPercent < 25) {
      return {
        success: false,
        bookingId,
        cancellationType: 'none',
        refundStatus: 'not_applicable',
        message: 'Connection quality within acceptable range'
      };
    }

    const now = new Date();
    const transaction = await this.getPaymentTransaction(bookingId);
    const totalAmount = transaction ? parseFloat(transaction.amount) : 0;
    
    // Full refund (100%) to student, no platform fee
    const refundAmount = totalAmount;
    const platformFeeAmount = 0;
    const teacherPayoutAmount = 0;

    await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledBy: 'system',
        cancellationType: 'connectivity_issue',
        cancelledAt: now,
        connectivityIssueDetectedAt: now,
        cancelReason: `Platform-side network issue: ${connectionLossPercent}% connection loss`,
        refundStatus: transaction ? 'pending' : 'not_applicable',
        refundAmount: refundAmount > 0 ? refundAmount.toFixed(2) : null,
        teacherPayoutAmount: teacherPayoutAmount.toFixed(2),
        platformFeeAmount: platformFeeAmount.toFixed(2),
        teacherPayoutStatus: 'withheld',
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    if (transaction) {
      await this.scheduleRefund(transaction.id, refundAmount);
    }

    console.log(`✅ Connectivity issue - Full refund: ₹${refundAmount.toFixed(2)} (100%), No platform fee`);

    return {
      success: true,
      bookingId,
      cancellationType: 'connectivity_issue',
      refundAmount,
      refundStatus: transaction ? 'pending' : 'not_applicable',
      teacherPayoutAmount,
      platformFeeAmount,
      teacherPayoutStatus: 'withheld',
      message: 'Connectivity issue detected - Refund 100% to student, no platform fee',
      dashboardHighlight: {
        teacher: 'Platform Connectivity Issue - Full Refund',
        student: 'Platform Network Issue - Full Refund Processing'
      }
    };
  }

  /**
   * Scenario 8: Short Session (<50%) - Refund 85% to student, Platform fee 15% retained
   * AI/System Trigger: Both participants left < 50% of scheduled duration
   */
  async detectAndCancelShortSession(
    bookingId: string,
    actualDuration: number
  ): Promise<CancellationResult> {
    const booking = await this.storage.getBooking(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const minimumDuration = booking.duration * 0.5;

    // Check if actual duration is less than 50%
    if (actualDuration >= minimumDuration) {
      return {
        success: false,
        bookingId,
        cancellationType: 'none',
        refundStatus: 'not_applicable',
        message: 'Session duration acceptable'
      };
    }

    const now = new Date();
    const transaction = await this.getPaymentTransaction(bookingId);
    const totalAmount = transaction ? parseFloat(transaction.amount) : 0;
    
    // Refund 85% to student, Platform retains 15%
    const refundAmount = totalAmount * 0.85;
    const platformFeeAmount = totalAmount * 0.15;
    const teacherPayoutAmount = 0;

    await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledBy: 'system',
        cancellationType: 'short_session',
        cancelledAt: now,
        shortSessionDetectedAt: now,
        actualDuration,
        cancelReason: `Session ended early: ${actualDuration} min (< ${minimumDuration} min required)`,
        refundStatus: transaction ? 'pending' : 'not_applicable',
        refundAmount: refundAmount > 0 ? refundAmount.toFixed(2) : null,
        teacherPayoutAmount: teacherPayoutAmount.toFixed(2),
        platformFeeAmount: platformFeeAmount.toFixed(2),
        teacherPayoutStatus: 'withheld',
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    if (transaction) {
      await this.scheduleRefund(transaction.id, refundAmount);
    }

    console.log(`✅ Short session - Refund: ₹${refundAmount.toFixed(2)} (85%), Platform fee: ₹${platformFeeAmount.toFixed(2)} (15%)`);

    return {
      success: true,
      bookingId,
      cancellationType: 'short_session',
      refundAmount,
      refundStatus: transaction ? 'pending' : 'not_applicable',
      teacherPayoutAmount,
      platformFeeAmount,
      teacherPayoutStatus: 'withheld',
      message: 'Short session detected - Refund 85% to student, Platform fee 15% retained',
      dashboardHighlight: {
        teacher: 'Session Ended Early (<50%)',
        student: 'Session Ended Early - 85% Refund Processing'
      }
    };
  }

  /**
   * Scenario 9: Admin Manual Cancellation - Full refund (100%) to student, no platform fee retained
   * Trigger: Policy violation / duplicate / quality case
   */
  async adminManualCancellation(
    bookingId: string,
    adminId: string,
    reason: string
  ): Promise<CancellationResult> {
    const booking = await this.storage.getBooking(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const now = new Date();
    const transaction = await this.getPaymentTransaction(bookingId);
    const totalAmount = transaction ? parseFloat(transaction.amount) : 0;
    
    // Full refund (100%) to student, no platform fee
    const refundAmount = totalAmount;
    const platformFeeAmount = 0;
    const teacherPayoutAmount = 0;

    await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledBy: 'admin',
        cancellationType: 'admin_manual',
        cancelledAt: now,
        cancelReason: reason,
        refundStatus: transaction ? 'pending' : 'not_applicable',
        refundAmount: refundAmount > 0 ? refundAmount.toFixed(2) : null,
        teacherPayoutAmount: teacherPayoutAmount.toFixed(2),
        platformFeeAmount: platformFeeAmount.toFixed(2),
        teacherPayoutStatus: 'withheld',
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    if (transaction) {
      await this.scheduleRefund(transaction.id, refundAmount);
    }

    console.log(`✅ Admin cancelled - Full refund: ₹${refundAmount.toFixed(2)} (100%), No platform fee`);

    return {
      success: true,
      bookingId,
      cancellationType: 'admin_manual',
      refundAmount,
      refundStatus: transaction ? 'pending' : 'not_applicable',
      teacherPayoutAmount,
      platformFeeAmount,
      teacherPayoutStatus: 'withheld',
      message: 'Admin cancelled class - Full refund (100%) to student, no platform fee',
      dashboardHighlight: {
        teacher: 'Cancelled by Admin - Full Refund',
        student: 'Cancelled by Admin - Full Refund Processing'
      }
    };
  }

  /**
   * Helper: Get payment transaction for a booking
   */
  private async getPaymentTransaction(bookingId: string) {
    const [transaction] = await db
      .select()
      .from(paymentTransactions)
      .where(
        and(
          eq(paymentTransactions.bookingId, bookingId),
          eq(paymentTransactions.status, 'completed')
        )
      )
      .limit(1);

    return transaction;
  }

  /**
   * Helper: Schedule refund (72 hours from now)
   */
  private async scheduleRefund(transactionId: string, amount: number) {
    const scheduledRefundAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours from now

    await db
      .update(paymentTransactions)
      .set({
        status: 'cancelled',
        workflowStage: 'refund_to_student',
        scheduledRefundAt,
        updatedAt: new Date()
      })
      .where(eq(paymentTransactions.id, transactionId));

    console.log(`✅ Scheduled refund of ₹${amount} for transaction ${transactionId} (72 hours)`);
  }

  /**
   * Get dashboard highlight based on cancellation type
   */
  getDashboardHighlight(cancellationType: string, userRole: 'teacher' | 'student'): string {
    const highlights: Record<string, { teacher: string; student: string }> = {
      'none': { teacher: 'Demo Completed Successfully', student: 'Demo Completed Successfully' },
      'teacher_cancelled': { teacher: 'You Cancelled This Demo Class', student: 'Class Cancelled by Teacher' },
      'student_cancelled': { teacher: 'You Cancelled This Demo Class', student: 'Student Cancelled This Demo Class' },
      'late_join': { teacher: 'Teacher No-Show - Cancelled', student: 'Is Student Lost - Class Cancelled' },
      'teacher_no_show': { teacher: 'Teacher Overstay No Show - Duration Exceeded - Cancelled', student: 'Teacher Overstay No Show - Duration Exceeded - Cancelled' },
      'low_presence': { teacher: 'Is Student Lost - Class Cancelled', student: 'Refund Processing - Teacher Inactive' },
      'connectivity_issue': { teacher: 'Connectivity Issue Detected - Network Issue', student: 'Class Interrupted - Network Issue' },
      'short_session': { teacher: 'Session Ended Early (< 50 %)', student: 'Session Ended Early (< 50 %)' },
      'admin_manual': { teacher: 'Cancelled by Admin - Refund Processing', student: 'Cancelled by Admin - Refund Processing' }
    };

    return highlights[cancellationType]?.[userRole] || 'Class Cancelled';
  }
}
