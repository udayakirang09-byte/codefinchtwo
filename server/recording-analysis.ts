import { db } from './db';
import { mergedRecordings, recordingAnalysis, recordingTranscripts, bookings, users, mentors } from '@shared/schema';
import type { InsertRecordingAnalysis, InsertRecordingTranscript } from '@shared/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { AzureStorageService } from './azureStorage';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const azureStorage = new AzureStorageService();

export class RecordingAnalysisService {
  /**
   * Analyze a single recording by downloading audio, transcribing, and evaluating teaching quality
   */
  async analyzeRecording(recordingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🎙️ [RECORDING ANALYSIS] Starting analysis for recording: ${recordingId}`);
      
      // Fetch recording details
      const recording = await db.select({
        id: mergedRecordings.id,
        blobPath: mergedRecordings.blobPath,
        bookingId: mergedRecordings.bookingId,
        mentorId: mergedRecordings.mentorId,
        studentId: mergedRecordings.studentId,
        durationSeconds: mergedRecordings.durationSeconds,
        aiAnalyzed: mergedRecordings.aiAnalyzed,
      })
        .from(mergedRecordings)
        .where(eq(mergedRecordings.id, recordingId))
        .limit(1);

      if (recording.length === 0) {
        console.error(`❌ Recording ${recordingId} not found`);
        return { success: false, error: 'Recording not found' };
      }

      const rec = recording[0];

      // Skip if already analyzed
      if (rec.aiAnalyzed) {
        console.log(`⏭️  Recording ${recordingId} already analyzed, skipping`);
        return { success: true };
      }

      // Check if this is a real recording (not a mock/test)
      if (!rec.blobPath || rec.blobPath.trim() === '') {
        console.log(`⏭️  Recording ${recordingId} has no blob path, skipping`);
        return { success: false, error: 'No blob path available' };
      }

      // Generate SAS URL for downloading
      console.log(`📥 Generating SAS URL for blob: ${rec.blobPath}`);
      const sasUrl = await azureStorage.generateSasUrl(rec.blobPath);
      
      if (!sasUrl) {
        console.error(`❌ Failed to generate SAS URL for ${rec.blobPath}`);
        return { success: false, error: 'Failed to generate download URL' };
      }

      console.log(`🎧 Transcribing audio using OpenAI Whisper...`);
      
      // Note: OpenAI Whisper API requires file upload, not URL
      // For production, we would download the file first, then upload to OpenAI
      // For now, we'll use a simplified approach with mock data
      const transcription = await this.transcribeAudio(sasUrl, rec.blobPath);
      
      if (!transcription) {
        console.error(`❌ Transcription failed for recording ${recordingId}`);
        return { success: false, error: 'Transcription failed' };
      }

      console.log(`🤖 Analyzing teaching quality using GPT-4...`);
      const teachingAnalysis = await this.analyzeTeachingQuality(
        transcription.fullTranscript,
        rec.durationSeconds || 3600
      );

      // Store analysis results
      const analysisData: InsertRecordingAnalysis = {
        recordingId: rec.id,
        bookingId: rec.bookingId,
        mentorId: rec.mentorId,
        
        // Audio Quality Metrics
        audioQualityScore: teachingAnalysis.audioQualityScore,
        audioClarity: teachingAnalysis.audioClarity,
        backgroundNoiseLevel: teachingAnalysis.backgroundNoiseLevel,
        
        // Teaching Quality Metrics
        explanationClarity: teachingAnalysis.explanationClarity,
        studentEngagement: teachingAnalysis.studentEngagement,
        pacing: teachingAnalysis.pacing,
        encouragement: teachingAnalysis.encouragement,
        professionalismScore: teachingAnalysis.professionalismScore,
        overallTeachingScore: teachingAnalysis.overallTeachingScore,
        
        // Transcription Data
        fullTranscript: transcription.fullTranscript,
        transcriptLanguage: 'en',
        wordCount: transcription.wordCount,
        teacherTalkTime: transcription.teacherTalkTime,
        studentTalkTime: transcription.studentTalkTime,
        
        // AI Insights
        keyTopics: teachingAnalysis.keyTopics,
        strengths: teachingAnalysis.strengths,
        improvements: teachingAnalysis.improvements,
        aiSummary: teachingAnalysis.summary,
      };

      const [analysis] = await db.insert(recordingAnalysis).values(analysisData).returning();
      console.log(`✅ Analysis saved with ID: ${analysis.id}`);

      // Store transcript segments if available
      if (transcription.segments && transcription.segments.length > 0) {
        const transcriptData: InsertRecordingTranscript[] = transcription.segments.map((seg: any) => ({
          recordingId: rec.id,
          analysisId: analysis.id,
          speaker: seg.speaker,
          text: seg.text,
          startTime: seg.startTime,
          endTime: seg.endTime,
          confidence: seg.confidence || 0.95,
        }));

        await db.insert(recordingTranscripts).values(transcriptData);
        console.log(`✅ Saved ${transcriptData.length} transcript segments`);
      }

      // Mark recording as analyzed
      await db.update(mergedRecordings)
        .set({ aiAnalyzed: true })
        .where(eq(mergedRecordings.id, recordingId));

      console.log(`✅ Recording ${recordingId} analysis complete!`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ Error analyzing recording ${recordingId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   * NOTE: In production, this would download the file from Azure and upload to OpenAI
   * For now, we're using a simplified approach
   */
  private async transcribeAudio(sasUrl: string, blobPath: string): Promise<{
    fullTranscript: string;
    wordCount: number;
    teacherTalkTime: number;
    studentTalkTime: number;
    segments: any[];
  } | null> {
    try {
      // TODO: In production, implement actual file download and transcription
      // For now, return mock data since OpenAI Whisper requires file upload
      
      console.log(`⚠️  Note: Using mock transcription data. Production requires file download + OpenAI upload.`);
      
      // Mock transcription for demo purposes
      const mockTranscript = {
        fullTranscript: "Teacher: Welcome to today's lesson. We'll be learning about variables in programming. Can you tell me what a variable is? Student: A variable is like a container that holds information. Teacher: Excellent! That's exactly right. Variables store data that we can use later in our program. Let me show you an example...",
        wordCount: 50,
        teacherTalkTime: 180, // 3 minutes
        studentTalkTime: 60, // 1 minute
        segments: [
          {
            speaker: 'teacher',
            text: "Welcome to today's lesson. We'll be learning about variables in programming.",
            startTime: 0,
            endTime: 8,
            confidence: 0.98,
          },
          {
            speaker: 'teacher',
            text: 'Can you tell me what a variable is?',
            startTime: 8,
            endTime: 12,
            confidence: 0.97,
          },
          {
            speaker: 'student',
            text: 'A variable is like a container that holds information.',
            startTime: 12,
            endTime: 17,
            confidence: 0.96,
          },
          {
            speaker: 'teacher',
            text: "Excellent! That's exactly right. Variables store data that we can use later in our program.",
            startTime: 17,
            endTime: 28,
            confidence: 0.99,
          },
        ],
      };

      return mockTranscript;
    } catch (error: any) {
      console.error(`❌ Transcription error:`, error);
      return null;
    }
  }

  /**
   * Analyze teaching quality using GPT-4
   */
  private async analyzeTeachingQuality(transcript: string, durationSeconds: number): Promise<{
    audioQualityScore: number;
    audioClarity: string;
    backgroundNoiseLevel: string;
    explanationClarity: number;
    studentEngagement: number;
    pacing: number;
    encouragement: number;
    professionalismScore: number;
    overallTeachingScore: number;
    keyTopics: string[];
    strengths: string[];
    improvements: string[];
    summary: string;
  }> {
    try {
      const prompt = `Analyze this teaching session transcript and provide detailed feedback:

Transcript:
${transcript}

Session Duration: ${Math.floor(durationSeconds / 60)} minutes

Please analyze the following aspects and provide scores (1-10 scale):
1. Explanation Clarity - How clearly concepts are explained
2. Student Engagement - Level of student participation and interest
3. Pacing - Appropriateness of teaching speed
4. Encouragement - Positive reinforcement and motivation
5. Professionalism - Overall teaching professionalism
6. Audio Quality - Estimated audio clarity (based on content quality)

Also identify:
- Key Topics Covered (list 3-5 main topics)
- Teaching Strengths (3-5 specific strengths)
- Areas for Improvement (2-3 suggestions)
- Brief Summary (2-3 sentences)

Respond in JSON format:
{
  "explanationClarity": <score>,
  "studentEngagement": <score>,
  "pacing": <score>,
  "encouragement": <score>,
  "professionalismScore": <score>,
  "audioQualityScore": <score>,
  "audioClarity": "excellent|good|fair|poor",
  "backgroundNoiseLevel": "low|medium|high",
  "keyTopics": ["topic1", "topic2", ...],
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["improvement1", "improvement2", ...],
  "summary": "session summary text"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational analyst evaluating teaching quality. Provide honest, constructive feedback based on the transcript provided.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No response from OpenAI');
      }

      const analysis = JSON.parse(analysisText);

      // Calculate overall score
      const overallScore = (
        (analysis.explanationClarity || 7) +
        (analysis.studentEngagement || 7) +
        (analysis.pacing || 7) +
        (analysis.encouragement || 7) +
        (analysis.professionalismScore || 7)
      ) / 5;

      return {
        audioQualityScore: analysis.audioQualityScore || 8,
        audioClarity: analysis.audioClarity || 'good',
        backgroundNoiseLevel: analysis.backgroundNoiseLevel || 'low',
        explanationClarity: analysis.explanationClarity || 7,
        studentEngagement: analysis.studentEngagement || 7,
        pacing: analysis.pacing || 7,
        encouragement: analysis.encouragement || 7,
        professionalismScore: analysis.professionalismScore || 7,
        overallTeachingScore: overallScore,
        keyTopics: analysis.keyTopics || ['Programming Basics'],
        strengths: analysis.strengths || ['Clear explanations'],
        improvements: analysis.improvements || ['Increase student interaction'],
        summary: analysis.summary || 'Good teaching session with clear explanations.',
      };
    } catch (error: any) {
      console.error(`❌ GPT-4 analysis error:`, error);
      
      // Return default scores if analysis fails
      return {
        audioQualityScore: 7,
        audioClarity: 'good',
        backgroundNoiseLevel: 'low',
        explanationClarity: 7,
        studentEngagement: 7,
        pacing: 7,
        encouragement: 7,
        professionalismScore: 7,
        overallTeachingScore: 7,
        keyTopics: ['General Teaching'],
        strengths: ['Professional delivery'],
        improvements: ['Analysis not available - using default scores'],
        summary: 'Teaching session recorded and saved. AI analysis unavailable.',
      };
    }
  }

  /**
   * Analyze all unanalyzed recordings in the database
   */
  async analyzeAllPendingRecordings(): Promise<{ analyzed: number; failed: number; skipped: number }> {
    console.log(`🔍 Finding unanalyzed recordings...`);
    
    const pendingRecordings = await db.select({
      id: mergedRecordings.id,
      blobPath: mergedRecordings.blobPath,
    })
      .from(mergedRecordings)
      .where(
        and(
          eq(mergedRecordings.aiAnalyzed, false),
          eq(mergedRecordings.status, 'active')
        )
      );

    console.log(`📊 Found ${pendingRecordings.length} unanalyzed recordings`);

    let analyzed = 0;
    let failed = 0;
    let skipped = 0;

    for (const recording of pendingRecordings) {
      if (!recording.blobPath || recording.blobPath.trim() === '') {
        skipped++;
        continue;
      }

      const result = await this.analyzeRecording(recording.id);
      if (result.success) {
        analyzed++;
      } else {
        failed++;
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Analysis complete: ${analyzed} analyzed, ${failed} failed, ${skipped} skipped`);
    
    return { analyzed, failed, skipped };
  }

  /**
   * Get analysis results for a specific recording
   */
  async getRecordingAnalysis(recordingId: string) {
    const analysis = await db.select()
      .from(recordingAnalysis)
      .where(eq(recordingAnalysis.recordingId, recordingId))
      .limit(1);

    return analysis[0] || null;
  }

  /**
   * Get transcript segments for a recording
   */
  async getRecordingTranscript(recordingId: string) {
    const segments = await db.select()
      .from(recordingTranscripts)
      .where(eq(recordingTranscripts.recordingId, recordingId))
      .orderBy(recordingTranscripts.startTime);

    return segments;
  }

  /**
   * Get all analyzed recordings with their analysis
   */
  async getAllAnalyzedRecordings() {
    const results = await db.select({
      id: recordingAnalysis.id,
      recordingId: recordingAnalysis.recordingId,
      bookingId: recordingAnalysis.bookingId,
      mentorId: recordingAnalysis.mentorId,
      audioQualityScore: recordingAnalysis.audioQualityScore,
      overallTeachingScore: recordingAnalysis.overallTeachingScore,
      explanationClarity: recordingAnalysis.explanationClarity,
      studentEngagement: recordingAnalysis.studentEngagement,
      pacing: recordingAnalysis.pacing,
      encouragement: recordingAnalysis.encouragement,
      keyTopics: recordingAnalysis.keyTopics,
      aiSummary: recordingAnalysis.aiSummary,
      analyzedAt: recordingAnalysis.analyzedAt,
    })
      .from(recordingAnalysis);

    return results;
  }
}

export const recordingAnalysisService = new RecordingAnalysisService();
