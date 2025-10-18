/**
 * Utility functions for cancellation dashboard highlights
 * Maps cancellation types to scenario-specific messages for teacher and student views
 */

export interface DashboardHighlight {
  teacher: string;
  student: string;
}

/**
 * Get dashboard highlight message based on cancellation type
 * Returns scenario-specific messages for both teacher and student perspectives
 */
export function getCancellationHighlight(
  status: string,
  cancellationType?: string | null,
  classType?: 'demo' | 'booked'
): DashboardHighlight {
  // If not cancelled, show completion message
  if (status !== 'cancelled' || !cancellationType) {
    return {
      teacher: classType === 'demo' ? 'Demo Completed Successfully' : 'Class Completed Successfully',
      student: classType === 'demo' ? 'Demo Completed Successfully' : 'Class Completed Successfully'
    };
  }

  // Map cancellation type to dashboard messages (matches screenshot specification)
  switch (cancellationType) {
    case 'teacher_cancelled':
      return {
        teacher: classType === 'demo' ? 'You Cancelled This Demo Class' : 'You Cancelled This Class - Refund Processing',
        student: classType === 'demo' ? 'Teacher Cancelled - You May Reschedule' : 'Class Cancelled by Teacher'
      };

    case 'student_cancelled':
      return {
        teacher: classType === 'demo' ? 'Student Cancelled This Demo Class' : 'Student Cancelled This Class - Refund Processing',
        student: classType === 'demo' ? 'You Cancelled This Demo Class' : 'You Cancelled This Class - Refund in Process'
      };

    case 'late_join':
      return {
        teacher: 'Teacher No-Show - Cancelled',
        student: 'Teacher No-Show - Cancelled'
      };

    case 'teacher_no_show':
      return {
        teacher: 'Teacher Overstay No Show - Duration Exceeded - Cancelled',
        student: 'Teacher No-Show - Cancelled'
      };

    case 'low_presence':
      return {
        teacher: 'Is Student Lost - Class Cancelled',
        student: 'Refund Processing - Teacher Inactive'
      };

    case 'connectivity_issue':
      return {
        teacher: 'Connectivity Issue Detected - Network Issue',
        student: classType === 'demo' ? 'Class Interrupted - Network Issue' : 'Connectivity Issue - Pending Review'
      };

    case 'short_session':
      return {
        teacher: classType === 'demo' ? 'Session Ended Early (< 50 %)' : 'Short Session Detected - No Refund',
        student: classType === 'demo' ? 'Session Ended Early (< 50 %)' : 'Short Session Detected - Refund Processing'
      };

    case 'admin_manual':
      return {
        teacher: classType === 'demo' ? 'Cancelled by Admin' : 'Cancelled by Admin - Refund Processing',
        student: classType === 'demo' ? 'Cancelled by Admin' : 'Cancelled by Admin - Refund Processing'
      };

    default:
      // Fallback for unknown cancellation types
      return {
        teacher: 'Class Cancelled',
        student: 'Class Cancelled'
      };
  }
}

/**
 * Get badge variant based on cancellation type
 * Returns appropriate color scheme for status badge
 */
export function getCancellationBadgeVariant(status: string): 'default' | 'destructive' | 'outline' | 'secondary' {
  if (status === 'cancelled') {
    return 'destructive';
  }
  if (status === 'completed') {
    return 'default';
  }
  return 'secondary';
}
