import { db } from './db.js';
import { aiModerationLogs, sessionDossiers, bookings } from '../shared/schema.js';
import { eq, and, sql } from 'drizzle-orm';

export interface SessionDossier {
  bookingId: string;
  sessionId: string;
  crsScore: number;
  totalIncidents: number;
  chatIncidents: number;
  screenIncidents: number;
  audioIncidents: number;
  hardViolations: number;
  alertViolations: number;
  averageTAI: number;
  maxTAI: number;
  requiresReview: boolean;
  reviewPriority: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
}

/**
 * Calculate CRS (Cumulative Risk Score) for a session
 * Formula: CRS = (Σ TAI scores × incident_weight) + (hard_violations × 10) + (alert_violations × 3)
 */
export function calculateCRS(logs: any[]): number {
  let crs = 0;
  let hardViolations = 0;
  let alertViolations = 0;
  let totalTAI = 0;

  for (const log of logs) {
    const tai = log.tai || 0;
    totalTAI += tai;

    // Hard violations get highest weight
    if (log.aiVerdict === 'hard_violation') {
      hardViolations++;
      crs += 10; // Weight of 10 for hard violations
    } 
    // Alert violations get medium weight
    else if (log.aiVerdict === 'alert') {
      alertViolations++;
      crs += 3; // Weight of 3 for alerts
    }
    
    // Add TAI contribution (already weighted in TAI formula)
    crs += tai;
  }

  return Math.round(crs * 100) / 100; // Round to 2 decimal places
}

/**
 * Determine review priority based on CRS score
 */
export function determineReviewPriority(crsScore: number, hardViolations: number): 'low' | 'medium' | 'high' | 'critical' {
  // Critical: Any hard violation or CRS > 15
  if (hardViolations > 0 || crsScore > 15) {
    return 'critical';
  }
  
  // High: CRS between 10-15
  if (crsScore > 10) {
    return 'high';
  }
  
  // Medium: CRS between 5-10
  if (crsScore > 5) {
    return 'medium';
  }
  
  // Low: CRS below 5
  return 'low';
}

/**
 * Generate session summary text
 */
export function generateSessionSummary(logs: any[], crsScore: number): string {
  const totalIncidents = logs.length;
  const hardViolations = logs.filter(l => l.aiVerdict === 'hard_violation').length;
  const alertViolations = logs.filter(l => l.aiVerdict === 'alert').length;
  
  if (hardViolations > 0) {
    return `Critical session with ${hardViolations} hard violation(s) detected across ${totalIncidents} total incident(s). Immediate review required.`;
  }
  
  if (alertViolations > 0) {
    return `Session flagged with ${alertViolations} alert(s) out of ${totalIncidents} incident(s). CRS score: ${crsScore}. Manual review recommended.`;
  }
  
  return `Session completed with ${totalIncidents} minor incident(s). CRS score: ${crsScore}. Low priority review.`;
}

/**
 * Process session after class completion
 * Analyzes all moderation logs and generates a session dossier
 */
export async function processSessionAfterClass(bookingId: string, sessionId: string): Promise<SessionDossier | null> {
  try {
    console.log(`📊 [POST-CLASS] Processing session: ${sessionId} (Booking: ${bookingId})`);

    // Fetch all moderation logs for this session
    const logs = await db
      .select()
      .from(aiModerationLogs)
      .where(
        and(
          eq(aiModerationLogs.bookingId, bookingId),
          eq(aiModerationLogs.sessionId, sessionId)
        )
      );

    console.log(`📊 [POST-CLASS] Found ${logs.length} moderation logs`);

    // If no incidents, no dossier needed
    if (logs.length === 0) {
      console.log(`✅ [POST-CLASS] No incidents - session clean`);
      return null;
    }

    // Count incidents by modality
    const chatIncidents = logs.filter((l: any) => l.modality === 'chat').length;
    const screenIncidents = logs.filter((l: any) => l.modality === 'screen').length;
    const audioIncidents = logs.filter((l: any) => l.modality === 'audio').length;

    // Count violations by severity
    const hardViolations = logs.filter((l: any) => l.aiVerdict === 'hard_violation').length;
    const alertViolations = logs.filter((l: any) => l.aiVerdict === 'alert').length;

    // Calculate TAI statistics
    const taiScores = logs.map((l: any) => l.tai || 0);
    const averageTAI = taiScores.length > 0 
      ? taiScores.reduce((a: number, b: number) => a + b, 0) / taiScores.length 
      : 0;
    const maxTAI = taiScores.length > 0 ? Math.max(...taiScores) : 0;

    // Calculate CRS
    const crsScore = calculateCRS(logs);

    // Determine if review is required (CRS > 3 or any hard violations)
    const requiresReview = crsScore > 3 || hardViolations > 0;

    // Determine priority
    const reviewPriority = determineReviewPriority(crsScore, hardViolations);

    // Generate summary
    const summary = generateSessionSummary(logs, crsScore);

    // Create session dossier
    const dossier: SessionDossier = {
      bookingId,
      sessionId,
      crsScore,
      totalIncidents: logs.length,
      chatIncidents,
      screenIncidents,
      audioIncidents,
      hardViolations,
      alertViolations,
      averageTAI: Math.round(averageTAI * 100) / 100,
      maxTAI: Math.round(maxTAI * 100) / 100,
      requiresReview,
      reviewPriority,
      summary
    };

    console.log(`📊 [POST-CLASS] Session dossier:`, {
      crsScore: dossier.crsScore,
      totalIncidents: dossier.totalIncidents,
      requiresReview: dossier.requiresReview,
      priority: dossier.reviewPriority
    });

    // Save to database
    await db.insert(sessionDossiers).values({
      bookingId,
      sessionId,
      crs: crsScore.toString(),
      safetyScore: ((100 - Math.min(crsScore * 5, 100))).toString(), // Convert CRS to safety score (0-100)
      crsJson: {
        totalIncidents: logs.length,
        chatIncidents,
        screenIncidents,
        audioIncidents,
        hardViolations,
        alertViolations,
        averageTAI: dossier.averageTAI,
        maxTAI: dossier.maxTAI,
        reviewPriority,
        summary
      },
      reviewStatus: requiresReview ? 'queued' : 'passed'
    });

    console.log(`✅ [POST-CLASS] Session dossier saved to database`);

    return dossier;
  } catch (error) {
    console.error(`❌ [POST-CLASS] Error processing session ${sessionId}:`, error);
    return null;
  }
}

/**
 * Get pending review queue for admins
 * Priority is derived from crsJson.reviewPriority in the JSON field
 */
export async function getAdminReviewQueue(priority?: 'low' | 'medium' | 'high' | 'critical') {
  try {
    const results = await db
      .select({
        dossier: sessionDossiers,
        booking: bookings
      })
      .from(sessionDossiers)
      .leftJoin(bookings, eq(sessionDossiers.bookingId, bookings.id))
      .where(eq(sessionDossiers.reviewStatus, 'queued'))
      .orderBy(sessionDossiers.createdAt);

    // Filter by priority if specified (priority is in crsJson)
    if (priority) {
      return results.filter((r: any) => {
        const crsJson = r.dossier.crsJson as any;
        return crsJson?.reviewPriority === priority;
      });
    }

    // Sort by priority (critical first) using crsJson data
    return results.sort((a: any, b: any) => {
      const aPriority = (a.dossier.crsJson as any)?.reviewPriority || 'low';
      const bPriority = (b.dossier.crsJson as any)?.reviewPriority || 'low';
      
      const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
      return (priorityOrder[aPriority as keyof typeof priorityOrder] || 4) - 
             (priorityOrder[bPriority as keyof typeof priorityOrder] || 4);
    });
  } catch (error) {
    console.error('❌ [REVIEW-QUEUE] Error fetching review queue:', error);
    return [];
  }
}

/**
 * Mark a session dossier as reviewed
 */
export async function markSessionReviewed(
  dossierId: string, 
  reviewedBy: string, 
  reviewNotes?: string,
  actionTaken?: string
) {
  try {
    await db
      .update(sessionDossiers)
      .set({
        reviewStatus: 'reviewed',
        reviewedBy,
        adminNotes: reviewNotes,
        reviewedAt: new Date()
      })
      .where(eq(sessionDossiers.id, dossierId));

    console.log(`✅ [REVIEW-QUEUE] Dossier ${dossierId} marked as reviewed by ${reviewedBy}`);
    return true;
  } catch (error) {
    console.error(`❌ [REVIEW-QUEUE] Error marking dossier ${dossierId} as reviewed:`, error);
    return false;
  }
}
