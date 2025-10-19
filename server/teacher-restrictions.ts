import { db } from "./db";
import { mentors, aiModerationLogs, sessionDossiers, users } from "@shared/schema";
import { eq, and, gte, desc, count } from "drizzle-orm";
import { sendEmail, generateTeacherRestrictionEmail } from "./email";

export interface RestrictionPolicy {
  warningThreshold: number; // Number of violations before warning
  suspensionThreshold: number; // Number of violations before suspension
  banThreshold: number; // Number of violations before permanent ban
  cooldownDays: number; // Days before violations reset
}

const defaultPolicy: RestrictionPolicy = {
  warningThreshold: 3, // Warn after 3 violations
  suspensionThreshold: 5, // Suspend after 5 violations
  banThreshold: 10, // Ban after 10 violations
  cooldownDays: 90 // Reset violations after 90 days of good behavior
};

/**
 * Update teacher's account restriction status based on their moderation history
 * Called after admin reviews a session dossier with violations
 */
export async function updateTeacherRestrictionStatus(
  teacherId: string,
  policy: RestrictionPolicy = defaultPolicy
): Promise<void> {
  try {
    // Get current mentor data to check for changes
    const currentMentor = await db.query.mentors.findFirst({
      where: eq(mentors.id, teacherId),
      columns: {
        accountRestriction: true,
        userId: true
      }
    });

    if (!currentMentor) {
      throw new Error(`Teacher ${teacherId} not found`);
    }

    // Get user data for email notification
    const user = await db.query.users.findFirst({
      where: eq(users.id, currentMentor.userId),
      columns: {
        email: true,
        username: true
      }
    });

    // Count total critical and high-priority violations for this teacher
    const recentViolations = await db
      .select({ count: count() })
      .from(aiModerationLogs)
      .where(
        and(
          eq(aiModerationLogs.teacherId, teacherId),
          gte(aiModerationLogs.createdAt, new Date(Date.now() - policy.cooldownDays * 24 * 60 * 60 * 1000))
        )
      );

    const violationCount = recentViolations[0]?.count || 0;

    // Determine restriction level based on violation count
    let restrictionLevel: 'none' | 'warned' | 'suspended' | 'banned' = 'none';
    let restrictionReason: string | null = null;

    if (violationCount >= policy.banThreshold) {
      restrictionLevel = 'banned';
      restrictionReason = `Account permanently banned after ${violationCount} moderation violations in the last ${policy.cooldownDays} days.`;
    } else if (violationCount >= policy.suspensionThreshold) {
      restrictionLevel = 'suspended';
      restrictionReason = `Account suspended after ${violationCount} moderation violations. Contact support to appeal.`;
    } else if (violationCount >= policy.warningThreshold) {
      restrictionLevel = 'warned';
      restrictionReason = `Warning issued after ${violationCount} moderation violations. Continued violations will result in suspension.`;
    }

    // Update mentor record
    await db
      .update(mentors)
      .set({
        accountRestriction: restrictionLevel,
        moderationViolations: violationCount,
        lastViolationAt: new Date(),
        restrictionReason,
        isActive: restrictionLevel !== 'banned' && restrictionLevel !== 'suspended' // Deactivate if suspended/banned
      })
      .where(eq(mentors.id, teacherId));

    console.log(`✅ Updated teacher ${teacherId} restriction status: ${restrictionLevel} (${violationCount} violations)`);

    // Send email notification if restriction level changed and user exists
    if (user && restrictionLevel !== 'none' && currentMentor.accountRestriction !== restrictionLevel) {
      try {
        const emailContent = generateTeacherRestrictionEmail(
          user.email,
          user.username || 'Teacher',
          restrictionLevel,
          violationCount,
          restrictionReason || undefined
        );

        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html
        });

        console.log(`📧 Restriction notification email sent to ${user.email} (${restrictionLevel})`);
      } catch (emailError) {
        console.error(`📧 Failed to send restriction email to ${user.email}:`, emailError);
        // Don't throw - email failure shouldn't block restriction update
      }
    }

  } catch (error) {
    console.error(`❌ Error updating teacher restriction status for ${teacherId}:`, error);
    throw error;
  }
}

/**
 * Get teacher's current moderation status
 */
export async function getTeacherModerationStatus(teacherId: string) {
  try {
    const mentor = await db.query.mentors.findFirst({
      where: eq(mentors.id, teacherId),
      columns: {
        id: true,
        accountRestriction: true,
        moderationViolations: true,
        lastViolationAt: true,
        restrictionReason: true,
        isActive: true
      }
    });

    if (!mentor) {
      throw new Error(`Teacher ${teacherId} not found`);
    }

    // Get recent violation details
    const recentViolations = await db
      .select()
      .from(aiModerationLogs)
      .where(
        and(
          eq(aiModerationLogs.teacherId, teacherId),
          gte(aiModerationLogs.createdAt, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(desc(aiModerationLogs.createdAt))
      .limit(10);

    return {
      ...mentor,
      recentViolations
    };
  } catch (error) {
    console.error(`❌ Error getting teacher moderation status for ${teacherId}:`, error);
    throw error;
  }
}

/**
 * Check if teacher can start a session (not suspended or banned)
 */
export async function canTeacherStartSession(teacherId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const mentor = await db.query.mentors.findFirst({
      where: eq(mentors.id, teacherId),
      columns: {
        accountRestriction: true,
        restrictionReason: true,
        isActive: true
      }
    });

    if (!mentor) {
      return { allowed: false, reason: 'Teacher account not found' };
    }

    if (!mentor.isActive) {
      return { allowed: false, reason: 'Teacher account is inactive' };
    }

    if (mentor.accountRestriction === 'banned') {
      return { allowed: false, reason: mentor.restrictionReason || 'Account has been permanently banned due to repeated policy violations' };
    }

    if (mentor.accountRestriction === 'suspended') {
      return { allowed: false, reason: mentor.restrictionReason || 'Account is currently suspended. Please contact support.' };
    }

    return { allowed: true };
  } catch (error) {
    console.error(`❌ Error checking if teacher can start session:`, error);
    return { allowed: false, reason: 'Unable to verify teacher status' };
  }
}

/**
 * Clear a teacher's restriction (used when appeal is approved)
 */
export async function clearTeacherRestriction(teacherId: string): Promise<void> {
  try {
    await db
      .update(mentors)
      .set({
        accountRestriction: 'none',
        restrictionReason: null,
        isActive: true,
        moderationViolations: 0 // Reset violation count
      })
      .where(eq(mentors.id, teacherId));

    console.log(`✅ Restriction cleared for teacher ${teacherId}`);
  } catch (error) {
    console.error(`❌ Error clearing restriction for teacher ${teacherId}:`, error);
    throw error;
  }
}

/**
 * Appeal a restriction (admin action)
 */
export async function appealRestriction(
  teacherId: string,
  adminId: string,
  decision: 'approved' | 'rejected',
  notes: string
): Promise<void> {
  try {
    if (decision === 'approved') {
      // Reset restriction
      await db
        .update(mentors)
        .set({
          accountRestriction: 'none',
          restrictionReason: null,
          isActive: true,
          moderationViolations: 0 // Reset count on successful appeal
        })
        .where(eq(mentors.id, teacherId));

      console.log(`✅ Appeal approved for teacher ${teacherId} by admin ${adminId}`);
    } else {
      console.log(`❌ Appeal rejected for teacher ${teacherId} by admin ${adminId}: ${notes}`);
    }
  } catch (error) {
    console.error(`❌ Error processing appeal for teacher ${teacherId}:`, error);
    throw error;
  }
}
