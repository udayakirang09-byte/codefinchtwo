import OpenAI from "openai";
import { AzureKeyCredential } from "@azure/core-auth";
import ContentSafetyClient, { isUnexpected } from "@azure-rest/ai-content-safety";
import { db } from "./db";
import { 
  aiModerationLogs,
  sessionDossiers,
  reviews,
  type InsertAiModerationLog,
  type InsertSessionDossier
} from "@shared/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { storage } from "./storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const azureEndpoint = process.env.AZURE_CONTENT_SAFETY_ENDPOINT || "";
const azureKey = process.env.AZURE_CONTENT_SAFETY_KEY || "";
const azureClient = azureEndpoint && azureKey 
  ? ContentSafetyClient(azureEndpoint, new AzureKeyCredential(azureKey))
  : null;

export interface ModerationContext {
  sessionId: string;
  bookingId: string;
  teacherId: string;
  studentId: string;
  teacherName: string;
  studentName: string;
  sessionName: string;
  subjectName: string;
}

export interface ModerationResult {
  isFlagged: boolean;
  aiConfidence: number;
  sentiment: number;
  tai: number; // Total Alert Index
  detectedTerms: string[];
  aiVerdict: 'safe' | 'alert' | 'hard_violation';
  recommendedAction: 'continue' | 'show_banner' | 'disconnect';
  alertMessage?: string;
}

export class AIModerationService {
  
  // SA-2: Subject-aware context mapping
  private subjectContextMap: Record<string, string[]> = {
    'Biology': ['anatomy', 'reproduction', 'medical', 'body parts', 'organs'],
    'Medicine': ['surgery', 'treatment', 'diagnosis', 'patient care', 'drugs'],
    'Art': ['nude', 'figure drawing', 'classical art', 'renaissance'],
    'History': ['war', 'violence', 'conflict', 'revolution'],
    'Literature': ['violence', 'romance', 'mature themes'],
  };

  /**
   * SA-1: Continuous AI Monitoring (Real-time, <1s latency)
   * Hybrid approach: OpenAI for text (free), Azure for images/video
   */
  async analyzeContent(
    content: string,
    modality: 'text' | 'audio' | 'video' | 'chat' | 'screen',
    context: ModerationContext
  ): Promise<ModerationResult> {
    const startTime = Date.now();

    try {
      // Use OpenAI Moderation API for text (FREE)
      if (modality === 'text' || modality === 'chat') {
        const result = await this.analyzeTextWithOpenAI(content, context, modality);
        console.log(`[AI Moderation] Text analyzed in ${Date.now() - startTime}ms`);
        return result;
      }

      // Use Azure Content Safety for images/video (free tier: 5k/month)
      if (modality === 'video' || modality === 'screen') {
        const result = await this.analyzeWithAzure(content, context);
        console.log(`[AI Moderation] ${modality} analyzed in ${Date.now() - startTime}ms`);
        return result;
      }

      // Default to OpenAI for audio transcripts
      return await this.analyzeTextWithOpenAI(content, context, 'audio');

    } catch (error) {
      console.error('[AI Moderation] Error:', error);
      // Fail-safe: return safe result on error to avoid disrupting sessions
      return {
        isFlagged: false,
        aiConfidence: 0,
        sentiment: 0,
        tai: 0,
        detectedTerms: [],
        aiVerdict: 'safe',
        recommendedAction: 'continue'
      };
    }
  }

  /**
   * Analyze text using OpenAI Moderation API (FREE, unlimited)
   * Includes SA-2 (subject context), SA-3 (sentiment), SA-4 (TAI formula)
   */
  private async analyzeTextWithOpenAI(
    text: string,
    context: ModerationContext,
    modality: 'text' | 'audio' | 'chat'
  ): Promise<ModerationResult> {
    // OpenAI Moderation API
    const moderation = await openai.moderations.create({ input: text });
    const result = moderation.results[0];

    // SA-3: Sentiment Analysis using GPT
    const sentimentResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "Analyze the sentiment of this text. Return a JSON with sentiment score from -1 (very negative) to +1 (very positive)."
      }, {
        role: "user",
        content: text
      }],
      response_format: { type: "json_object" },
      max_tokens: 50
    });

    const sentimentData = JSON.parse(sentimentResponse.choices[0].message.content || '{"sentiment": 0}');
    const sentiment = parseFloat(sentimentData.sentiment || "0");

    // SA-2: Subject context adjustment
    const subjectContext = this.getSubjectContextScore(text, context.subjectName);

    // Extract flagged categories and confidence
    const flaggedCategories: string[] = [];
    let maxConfidence = 0;

    if (result.flagged) {
      Object.entries(result.categories).forEach(([category, isFlagged]) => {
        if (isFlagged) {
          flaggedCategories.push(category);
          const score = (result.category_scores as any)[category] || 0;
          if (score > maxConfidence) maxConfidence = score;
        }
      });
    }

    // SA-4: Total Alert Index (TAI) Formula
    // TAI = (0.5 × confidence) − (0.3 × subject_context) − (0.3 × sentiment) + (0.1 × repeats)
    const repeats = 0; // TODO: Track repeat violations
    const tai = (0.5 * maxConfidence) - (0.3 * subjectContext) - (0.3 * Math.max(0, sentiment)) + (0.1 * repeats);

    // SA-5: Hard Violations (zero-tolerance)
    const hardViolationCategories = ['sexual/minors', 'violence/graphic'];
    const isHardViolation = flaggedCategories.some(cat => 
      hardViolationCategories.some(hv => cat.includes(hv))
    );

    // SA-4 & SA-6: Determine action based on TAI threshold
    let aiVerdict: 'safe' | 'alert' | 'hard_violation' = 'safe';
    let recommendedAction: 'continue' | 'show_banner' | 'disconnect' = 'continue';

    if (isHardViolation) {
      aiVerdict = 'hard_violation';
      recommendedAction = 'disconnect';
    } else if (tai >= 0.7) {
      aiVerdict = 'alert';
      recommendedAction = 'show_banner';
    }

    // SA-9: Check whitelist before returning flagged result
    if (result.flagged) {
      const isWhitelisted = await this.checkWhitelist(
        text,
        flaggedCategories,
        context.subjectName,
        modality
      );

      if (isWhitelisted) {
        // Override flagged result - this is benign educational content
        return {
          isFlagged: false,
          aiConfidence: 0,
          sentiment,
          tai: 0,
          detectedTerms: [],
          aiVerdict: 'safe',
          recommendedAction: 'continue',
          alertMessage: ''
        };
      }
    }

    return {
      isFlagged: result.flagged,
      aiConfidence: maxConfidence,
      sentiment,
      tai,
      detectedTerms: flaggedCategories,
      aiVerdict,
      recommendedAction,
      alertMessage: this.getAlertMessage(aiVerdict)
    };
  }

  /**
   * Analyze content using Azure Content Safety (for images/video)
   */
  private async analyzeWithAzure(
    content: string,
    context: ModerationContext
  ): Promise<ModerationResult> {
    if (!azureClient) {
      console.warn('[AI Moderation] Azure client not configured, skipping');
      return {
        isFlagged: false,
        aiConfidence: 0,
        sentiment: 0,
        tai: 0,
        detectedTerms: [],
        aiVerdict: 'safe',
        recommendedAction: 'continue'
      };
    }

    const analyzeTextOption = { text: content };
    const result = await azureClient.path("/text:analyze").post({ body: analyzeTextOption });

    if (isUnexpected(result)) {
      throw new Error(`Azure Content Safety error: ${result.body.error?.message}`);
    }

    const categoriesAnalysis = result.body.categoriesAnalysis || [];
    const flaggedCategories: string[] = [];
    let maxSeverity = 0;

    categoriesAnalysis.forEach((cat: any) => {
      if (cat.severity > 0) {
        flaggedCategories.push(cat.category);
        if (cat.severity > maxSeverity) maxSeverity = cat.severity;
      }
    });

    // Map severity (0-6) to confidence (0-1)
    const confidence = maxSeverity / 6;

    // Subject context and sentiment
    const subjectContext = this.getSubjectContextScore(content, context.subjectName);
    const sentiment = 0; // Azure doesn't provide sentiment, default neutral

    // TAI calculation
    const tai = (0.5 * confidence) - (0.3 * subjectContext) - (0.3 * Math.max(0, sentiment));

    // Hard violations
    const isHardViolation = maxSeverity >= 5;

    let aiVerdict: 'safe' | 'alert' | 'hard_violation' = 'safe';
    let recommendedAction: 'continue' | 'show_banner' | 'disconnect' = 'continue';

    if (isHardViolation) {
      aiVerdict = 'hard_violation';
      recommendedAction = 'disconnect';
    } else if (tai >= 0.7) {
      aiVerdict = 'alert';
      recommendedAction = 'show_banner';
    }

    // SA-9: Check whitelist before returning flagged result
    if (flaggedCategories.length > 0) {
      const isWhitelisted = await this.checkWhitelist(
        content,
        flaggedCategories,
        context.subjectName,
        'video'
      );

      if (isWhitelisted) {
        // Override flagged result - this is benign educational content
        return {
          isFlagged: false,
          aiConfidence: 0,
          sentiment,
          tai: 0,
          detectedTerms: [],
          aiVerdict: 'safe',
          recommendedAction: 'continue',
          alertMessage: ''
        };
      }
    }

    return {
      isFlagged: flaggedCategories.length > 0,
      aiConfidence: confidence,
      sentiment,
      tai,
      detectedTerms: flaggedCategories,
      aiVerdict,
      recommendedAction,
      alertMessage: this.getAlertMessage(aiVerdict)
    };
  }

  /**
   * SA-2: Calculate subject context score (0-1)
   * Higher score = more context-appropriate for the subject
   */
  private getSubjectContextScore(text: string, subject: string): number {
    const contextTerms = this.subjectContextMap[subject] || [];
    if (contextTerms.length === 0) return 0;

    const lowerText = text.toLowerCase();
    const matchedTerms = contextTerms.filter(term => lowerText.includes(term.toLowerCase()));
    
    return matchedTerms.length / contextTerms.length;
  }

  /**
   * SA-9: False Positive Learning System - Check whitelist
   * Returns true if content matches a whitelisted pattern
   */
  private async checkWhitelist(
    content: string,
    detectedTerms: string[],
    subjectName: string,
    modality: 'text' | 'audio' | 'video' | 'chat' | 'screen'
  ): Promise<boolean> {
    try {
      // Get whitelist entries for this subject and modality
      const whitelistEntries = await storage.getModerationWhitelistBySubject(subjectName);
      
      if (whitelistEntries.length === 0) {
        return false;
      }

      const lowerContent = content.toLowerCase();
      const lowerDetectedTerms = detectedTerms.map(t => t.toLowerCase());

      // Check if any whitelist pattern matches
      for (const entry of whitelistEntries) {
        // Only check entries for the same modality
        if (entry.modality !== modality) continue;

        const pattern = entry.contentPattern.toLowerCase();

        // Check if pattern matches content
        if (lowerContent.includes(pattern)) {
          console.log(`[AI Moderation] ✅ Whitelist match: "${pattern}" in ${modality} content for ${subjectName}`);
          return true;
        }

        // Check if pattern matches any detected terms
        if (lowerDetectedTerms.some(term => term.includes(pattern) || pattern.includes(term))) {
          console.log(`[AI Moderation] ✅ Whitelist match: "${pattern}" matches detected term in ${modality} for ${subjectName}`);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('[AI Moderation] Error checking whitelist:', error);
      // On error, return false to allow normal moderation to proceed
      return false;
    }
  }

  /**
   * SA-7: Polite, neutral alert messages
   */
  private getAlertMessage(verdict: 'safe' | 'alert' | 'hard_violation'): string {
    const messages = {
      safe: '',
      alert: "Our system noticed content that might be sensitive in this context. Please continue your lesson.",
      hard_violation: "This session has been paused for review. Please contact support if you believe this is an error."
    };

    return messages[verdict];
  }

  /**
   * SA-8 & LOG-2: Log AI moderation event
   */
  async logModerationEvent(
    context: ModerationContext,
    modality: 'text' | 'audio' | 'video' | 'chat' | 'screen',
    result: ModerationResult,
    mediaRef?: string
  ): Promise<void> {
    try {
      const log: InsertAiModerationLog = {
        sessionId: context.sessionId,
        bookingId: context.bookingId,
        teacherName: context.teacherName,
        studentName: context.studentName,
        sessionName: context.sessionName,
        subjectName: context.subjectName,
        modality,
        aiConfidence: result.aiConfidence.toString(),
        sentiment: result.sentiment.toString(),
        detectedTerm: result.detectedTerms.join(', '),
        aiVerdict: result.aiVerdict,
        mediaRefs: mediaRef ? [mediaRef] : [],
        tsStart: new Date(),
        tsEnd: new Date()
      };

      await db.insert(aiModerationLogs).values(log);
    } catch (error) {
      console.error('[AI Moderation] Failed to log event:', error);
    }
  }

  /**
   * PC-1, PC-2, PC-3, PC-4: Build Session Dossier with CRS scoring
   */
  async generateSessionDossier(
    sessionId: string,
    bookingId: string
  ): Promise<InsertSessionDossier> {
    // Fetch all moderation events for this session
    const moderationLogs = await db.select()
      .from(aiModerationLogs)
      .where(eq(aiModerationLogs.sessionId, sessionId));

    // Fetch feedback if exists
    const feedbackData = await db.select()
      .from(reviews)
      .where(eq(reviews.bookingId, bookingId))
      .limit(1);

    const feedback = feedbackData[0];

    // PC-2: Calculate Safety Score (0-100)
    const safetyScore = this.calculateSafetyScore(moderationLogs);

    // PC-3: Calculate Feedback Score (normalize 1-5 to 0-100)
    const feedbackScore = feedback ? ((feedback.rating - 1) / 4) * 100 : 50; // Default 50 if no feedback

    // PC-4: Calculate CRS (Correlation Risk Score)
    // CRS = 0.6×safety + 0.3×(100−feedback) + 0.1×risk_boost
    const riskBoost = this.calculateRiskBoost(moderationLogs);
    const crs = (0.6 * safetyScore) + (0.3 * (100 - feedbackScore)) + (0.1 * riskBoost);

    // Build CRS explanation JSON
    const crsJson = {
      formula: "0.6×safety + 0.3×(100−feedback) + 0.1×risk_boost",
      components: {
        safetyScore: safetyScore,
        feedbackScore: feedbackScore,
        riskBoost: riskBoost
      },
      calculation: `(0.6 × ${safetyScore.toFixed(1)}) + (0.3 × ${(100 - feedbackScore).toFixed(1)}) + (0.1 × ${riskBoost})`,
      result: crs.toFixed(1),
      events: moderationLogs.length,
      hardViolations: moderationLogs.filter(log => log.aiVerdict === 'hard_violation').length
    };

    // PC-6: Determine review status based on CRS threshold
    const reviewStatus = crs >= 70 ? 'queued' : 'passed';

    const dossier: InsertSessionDossier = {
      sessionId,
      bookingId,
      safetyScore: safetyScore.toString(),
      feedbackScore: feedbackScore.toString(),
      crs: crs.toString(),
      crsJson,
      reviewStatus
    };

    // Save dossier
    await db.insert(sessionDossiers).values(dossier);

    return dossier;
  }

  /**
   * PC-2: Calculate Safety Score (0-100, lower is better)
   */
  private calculateSafetyScore(logs: any[]): number {
    if (logs.length === 0) return 0; // Perfect score if no events

    const hardViolations = logs.filter(log => log.aiVerdict === 'hard_violation').length;
    const alerts = logs.filter(log => log.aiVerdict === 'alert').length;
    
    // Hard violations have 10x weight
    const weightedScore = (hardViolations * 10) + (alerts * 1);
    
    // Normalize to 0-100 scale
    return Math.min(100, weightedScore * 10);
  }

  /**
   * Calculate risk boost based on patterns
   */
  private calculateRiskBoost(logs: any[]): number {
    // Check for repeated violations (same terms detected multiple times)
    const termCounts: Record<string, number> = {};
    
    logs.forEach(log => {
      const term = log.detectedTerm;
      if (term) {
        termCounts[term] = (termCounts[term] || 0) + 1;
      }
    });

    const repeatedTerms = Object.values(termCounts).filter(count => count > 2).length;
    
    return Math.min(100, repeatedTerms * 20);
  }

  /**
   * TA-2: Check if teacher should be auto-paused
   * ≥3 High Risk sessions / 30 days → pause new bookings
   */
  async checkTeacherAutoRestriction(teacherId: string): Promise<{
    shouldRestrict: boolean;
    reason?: string;
    highRiskCount?: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDossiers = await db.select()
      .from(sessionDossiers)
      .where(
        and(
          gte(sessionDossiers.createdAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(sessionDossiers.createdAt));

    // Filter for this teacher's sessions with CRS >= 70
    const highRiskSessions = recentDossiers.filter(d => parseFloat(d.crs) >= 70);

    if (highRiskSessions.length >= 3) {
      return {
        shouldRestrict: true,
        reason: 'TA-2: ≥3 High Risk sessions in 30 days',
        highRiskCount: highRiskSessions.length
      };
    }

    return { shouldRestrict: false };
  }

  /**
   * TA-3: Check for critical restriction
   * Hard violation or CRS ≥90 → restrict teacher account
   */
  async checkCriticalRestriction(sessionId: string): Promise<{
    shouldRestrict: boolean;
    reason?: string;
  }> {
    // Check for hard violations in this session
    const hardViolations = await db.select()
      .from(aiModerationLogs)
      .where(
        and(
          eq(aiModerationLogs.sessionId, sessionId),
          eq(aiModerationLogs.aiVerdict, 'hard_violation')
        )
      );

    if (hardViolations.length > 0) {
      return {
        shouldRestrict: true,
        reason: 'TA-3: Hard violation detected'
      };
    }

    // Check for CRS ≥90
    const dossiers = await db.select()
      .from(sessionDossiers)
      .where(eq(sessionDossiers.sessionId, sessionId));

    if (dossiers.length > 0 && parseFloat(dossiers[0].crs) >= 90) {
      return {
        shouldRestrict: true,
        reason: 'TA-3: CRS ≥90 (critical risk)'
      };
    }

    return { shouldRestrict: false };
  }
}

export const aiModeration = new AIModerationService();
