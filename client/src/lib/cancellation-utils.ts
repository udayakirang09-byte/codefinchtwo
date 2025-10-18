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
  cancellationType?: string | null
): DashboardHighlight {
  // If not cancelled, show completion message
  if (status !== 'cancelled' || !cancellationType) {
    return {
      teacher: 'Demo Completed Successfully',
      student: 'Demo Completed Successfully'
    };
  }

  // Map cancellation type to dashboard messages (matches CancellationService logic)
  switch (cancellationType) {
    case 'teacher_cancelled':
      return {
        teacher: 'You Cancelled This Demo Class',
        student: 'Class Cancelled by Teacher'
      };

    case 'student_cancelled':
      return {
        teacher: 'Class Cancelled by Student',
        student: 'You Cancelled This Demo Class'
      };

    case 'late_join':
      return {
        teacher: 'Teacher No-Show - Cancelled',
        student: 'Is Student Lost - Class Cancelled'
      };

    case 'teacher_no_show':
      return {
        teacher: 'Teacher Overstay No Show - Duration Exceeded - Cancelled',
        student: 'Teacher Overstay No Show - Duration Exceeded - Cancelled'
      };

    case 'low_presence':
      return {
        teacher: 'Is Student Lost - Class Cancelled',
        student: 'Refund Processing - Teacher Inactive'
      };

    case 'connectivity_issue':
      return {
        teacher: 'Connectivity Issue Detected - Network Issue',
        student: 'Class Interrupted - Network Issue'
      };

    case 'short_session':
      return {
        teacher: 'Session Ended Early (< 50 %)',
        student: 'Session Ended Early (< 50 %)'
      };

    case 'admin_manual':
      return {
        teacher: 'Cancelled by Admin - Refund Processing',
        student: 'Cancelled by Admin - Refund Processing'
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
