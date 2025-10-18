/**
 * Comprehensive Cancellation & Refund Service
 * 
 * Implements the 9 cancellation scenarios from the policy table:
 * 1. Class Held Normally - No refund
 * 2. Teacher Cancelled (Before Start) - Full refund
 * 3. Student Cancelled (Before Start) - Refund will be initiated
 * 4. Teacher Late Join (> 10 min) - Payment check, then refund
 * 5. Teacher Overstay No Show (> 15 min offline) - Payment check, then refund
 * 6. Low Presence (Teacher Inactive > 35%) - Payment check, then refund
 * 7. Connectivity Issues - AI verification, then full refund
 * 8. Short Session (< 50%) - Payment check, then refund
 * 9. Admin Manual Cancellation - Full refund
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
  message: string;
  dashboardHighlight?: {
    teacher: string;
    student: string;
  };
}

export class CancellationService {
  constructor(private storage: IStorage) {}

  /**
   * Scenario 1: Class Held Normally - No cancellation, mark as completed
   */
  async markClassCompleted(bookingId: string): Promise<CancellationResult> {
    const booking = await this.storage.getBooking(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    await db
      .update(bookings)
      .set({
        status: 'completed',
        refundStatus: 'not_applicable',
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId));

    return {
      success: true,
      bookingId,
      cancellationType: 'none',
      refundStatus: 'not_applicable',
      message: 'Class completed successfully',
      dashboardHighlight: {
        teacher: 'Demo Completed Successfully',
        student: 'Demo Completed Successfully'
      }
    };
  }

  /**
   * Scenario 2: Teacher Cancelled (Before Start) - Full refund
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

    const now = new Date();
    const scheduledTime = new Date(booking.scheduledAt);

    // Check if class hasn't started yet
    if (now >= scheduledTime) {
      throw new Error("Cannot cancel after class has started");
    }

    // Get payment transaction
    const transaction = await this.getPaymentTransaction(bookingId);
    const refundAmount = transaction ? parseFloat(transaction.amount) : 0;

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
        refundAmount: refundAmount > 0 ? refundAmount.toString() : null,
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    // Schedule refund if payment exists
    if (transaction) {
      await this.scheduleRefund(transaction.id, refundAmount);
    }

    return {
      success: true,
      bookingId,
      cancellationType: 'teacher_cancelled',
      refundAmount,
      refundStatus: transaction ? 'pending' : 'not_applicable',
      message: 'Teacher cancelled class - full refund will be initiated',
      dashboardHighlight: {
        teacher: 'You Cancelled This Demo Class',
        student: 'Class Cancelled by Teacher'
      }
    };
  }

  /**
   * Scenario 3: Student Cancelled (Before Start) - Refund will be initiated
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

    const now = new Date();
    const scheduledTime = new Date(booking.scheduledAt);
    const sixHoursBeforeClass = new Date(scheduledTime.getTime() - 6 * 60 * 60 * 1000);

    // Check 6-hour restriction
    if (now >= sixHoursBeforeClass) {
      throw new Error("Cannot cancel within 6 hours of the scheduled class time");
    }

    // Get payment transaction
    const transaction = await this.getPaymentTransaction(bookingId);
    const refundAmount = transaction ? parseFloat(transaction.amount) : 0;

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
        refundAmount: refundAmount > 0 ? refundAmount.toString() : null,
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    // Schedule refund if payment exists
    if (transaction) {
      await this.scheduleRefund(transaction.id, refundAmount);
    }

    return {
      success: true,
      bookingId,
      cancellationType: 'student_cancelled',
      refundAmount,
      refundStatus: transaction ? 'pending' : 'not_applicable',
      message: 'Student cancelled class - refund will be initiated',
      dashboardHighlight: {
        teacher: 'You Cancelled This Demo Class',
        student: 'Student Cancelled This Demo Class'
      }
    };
  }

  /**
   * Scenario 4: Teacher Late Join (> 10 min after start + 25% duration)
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
    const refundAmount = transaction ? parseFloat(transaction.amount) : 0;

    // Cancel booking with late join reason
    await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledBy: 'system',
        cancellationType: 'late_join',
        cancelledAt: now,
        lateJoinDetectedAt: now,
        cancelReason: `Teacher joined > 10 min after start + 25% duration`,
        refundStatus: transaction ? 'pending' : 'not_applicable',
        refundAmount: refundAmount > 0 ? refundAmount.toString() : null,
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    // Schedule refund after AI verification
    if (transaction) {
      await this.scheduleRefund(transaction.id, refundAmount);
    }

    return {
      success: true,
      bookingId,
      cancellationType: 'late_join',
      refundAmount,
      refundStatus: transaction ? 'pending' : 'not_applicable',
      message: 'Teacher late join detected - refund after AI verification',
      dashboardHighlight: {
        teacher: 'Teacher No-Show - Cancelled',
        student: 'Is Student Lost - Class Cancelled'
      }
    };
  }

  /**
   * Scenario 5: Teacher Overstay No Show (offline disconnect > 15 min)
   * AI/System Trigger: Teacher offline/disconnected > 15 min total
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
    const refundAmount = transaction ? parseFloat(transaction.amount) : 0;

    await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledBy: 'system',
        cancellationType: 'teacher_no_show',
        cancelledAt: now,
        cancelReason: `Teacher offline/disconnected > 15 min (${offlineDuration} min total)`,
        refundStatus: transaction ? 'pending' : 'not_applicable',
        refundAmount: refundAmount > 0 ? refundAmount.toString() : null,
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    if (transaction) {
      await this.scheduleRefund(transaction.id, refundAmount);
    }

    return {
      success: true,
      bookingId,
      cancellationType: 'teacher_no_show',
      refundAmount,
      refundStatus: transaction ? 'pending' : 'not_applicable',
      message: 'Teacher no-show detected - refund after payment check',
      dashboardHighlight: {
        teacher: 'Teacher Overstay No Show - Duration Exceeded - Cancelled',
        student: 'Teacher Overstay No Show - Duration Exceeded - Cancelled'
      }
    };
  }

  /**
   * Scenario 6: Low Presence (Teacher Inactive > 35% of time)
   * AI/System Trigger: AI detects no cursor + inactive > 35% duration
   */
  async detectAndCancelLowPresence(
    bookingId: string,
    inactivePercent: number
  ): Promise<CancellationResult> {
    const booking = await this.storage.getBooking(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Check if inactive percentage exceeds 35%
    if (inactivePercent < 35) {
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
    const refundAmount = transaction ? parseFloat(transaction.amount) : 0;

    await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledBy: 'system',
        cancellationType: 'low_presence',
        cancelledAt: now,
        lowPresenceDetectedAt: now,
        teacherAbsentPercent: Math.round(inactivePercent),
        cancelReason: `Teacher inactive > 35% (${inactivePercent}%)`,
        refundStatus: transaction ? 'pending' : 'not_applicable',
        refundAmount: refundAmount > 0 ? refundAmount.toString() : null,
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    if (transaction) {
      await this.scheduleRefund(transaction.id, refundAmount);
    }

    return {
      success: true,
      bookingId,
      cancellationType: 'low_presence',
      refundAmount,
      refundStatus: transaction ? 'pending' : 'not_applicable',
      message: 'Low teacher presence detected - refund after payment check',
      dashboardHighlight: {
        teacher: 'Is Student Lost - Class Cancelled',
        student: 'Refund Processing - Teacher Inactive'
      }
    };
  }

  /**
   * Scenario 7: Connectivity Issues
   * AI/System Trigger: AI detects < 25% connection loss / packet drops
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
    const refundAmount = transaction ? parseFloat(transaction.amount) : 0;

    await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledBy: 'system',
        cancellationType: 'connectivity_issue',
        cancelledAt: now,
        connectivityIssueDetectedAt: now,
        cancelReason: `Network issue detected: ${connectionLossPercent}% connection loss`,
        refundStatus: transaction ? 'pending' : 'not_applicable',
        refundAmount: refundAmount > 0 ? refundAmount.toString() : null,
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    if (transaction) {
      await this.scheduleRefund(transaction.id, refundAmount);
    }

    return {
      success: true,
      bookingId,
      cancellationType: 'connectivity_issue',
      refundAmount,
      refundStatus: transaction ? 'pending' : 'not_applicable',
      message: 'Connectivity issue detected - full refund after AI verification',
      dashboardHighlight: {
        teacher: 'Connectivity Issue Detected - Network Issue',
        student: 'Class Interrupted - Network Issue'
      }
    };
  }

  /**
   * Scenario 8: Short Session (< 50% of scheduled duration)
   * AI/System Trigger: Both participants left < 50 min (for 80 min class)
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
    const refundAmount = transaction ? parseFloat(transaction.amount) : 0;

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
        refundAmount: refundAmount > 0 ? refundAmount.toString() : null,
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    if (transaction) {
      await this.scheduleRefund(transaction.id, refundAmount);
    }

    return {
      success: true,
      bookingId,
      cancellationType: 'short_session',
      refundAmount,
      refundStatus: transaction ? 'pending' : 'not_applicable',
      message: 'Short session detected - refund after payment check',
      dashboardHighlight: {
        teacher: 'Session Ended Early (< 50 %)',
        student: 'Session Ended Early (< 50 %)'
      }
    };
  }

  /**
   * Scenario 9: Admin Manual Cancellation
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
    const refundAmount = transaction ? parseFloat(transaction.amount) : 0;

    await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledBy: 'admin',
        cancellationType: 'admin_manual',
        cancelledAt: now,
        cancelReason: reason,
        refundStatus: transaction ? 'pending' : 'not_applicable',
        refundAmount: refundAmount > 0 ? refundAmount.toString() : null,
        updatedAt: now
      })
      .where(eq(bookings.id, bookingId));

    if (transaction) {
      await this.scheduleRefund(transaction.id, refundAmount);
    }

    return {
      success: true,
      bookingId,
      cancellationType: 'admin_manual',
      refundAmount,
      refundStatus: transaction ? 'pending' : 'not_applicable',
      message: 'Admin cancelled class - full refund initiated',
      dashboardHighlight: {
        teacher: 'Cancelled by Admin - Refund Processing',
        student: 'Cancelled by Admin - Refund Processing'
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
