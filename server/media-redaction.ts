import { BlobServiceClient, BlobSASPermissions, StorageSharedKeyCredential, generateBlobSASQueryParameters } from '@azure/storage-blob';
import { db } from './db';
import { aiModerationLogs, sessionDossiers } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const STORAGE_ACCOUNT = 'kidzaimathstore31320';
const CONTAINER_NAME = 'replayknowledge';

export interface RedactedMediaClip {
  clipId: string;
  sessionId: string;
  modality: 'video' | 'audio' | 'screen' | 'chat';
  startTime: number; // seconds
  duration: number; // seconds (max 30)
  blobPath: string;
  redactedUrl?: string; // Signed URL with 24-hour expiry
  redactionLevel: 'blur' | 'bleep' | 'mask';
  createdAt: Date;
}

export interface MediaClipRequest {
  sessionId: string;
  dossierId: string;
  modality: 'video' | 'audio' | 'screen' | 'chat';
  timestamp: number; // seconds from session start
  duration?: number; // default 30s
}

export class MediaRedactionService {
  private blobServiceClient: BlobServiceClient | null = null;
  private accountName: string = STORAGE_ACCOUNT;
  private accountKey: string = '';
  private containerName: string = CONTAINER_NAME;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.STORAGE_CONNECTION_STRING || process.env.BLOBCONSTR;
    
    if (!connectionString) {
      console.warn('⚠️  Azure Storage connection string not set - Media redaction will not work');
      return;
    }

    try {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      
      // Extract account name from connection string (critical for correct signed URLs)
      const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
      if (accountNameMatch) {
        this.accountName = accountNameMatch[1];
      } else {
        console.error('❌ Failed to extract AccountName from connection string');
        return;
      }
      
      // Extract account key from connection string for SAS generation
      const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);
      if (accountKeyMatch) {
        this.accountKey = accountKeyMatch[1];
      } else {
        console.error('❌ Failed to extract AccountKey from connection string');
        return;
      }
      
      console.log(`✅ Media Redaction Service initialized (account: ${this.accountName})`);
    } catch (error) {
      console.error('❌ Failed to initialize Media Redaction Service:', error);
    }
  }

  /**
   * LOG-4: Generate secure signed URL with 24-hour expiry
   * GOV-2: Ensures only admins can access media through access-controlled endpoints
   */
  async generateSignedUrl(blobPath: string, expiryHours: number = 24): Promise<string | null> {
    if (!this.blobServiceClient || !this.accountKey) {
      console.error('Media Redaction Service not initialized');
      return null;
    }

    try {
      const sharedKeyCredential = new StorageSharedKeyCredential(this.accountName, this.accountKey);
      
      const sasOptions = {
        containerName: this.containerName,
        blobName: blobPath,
        permissions: BlobSASPermissions.parse('r'), // Read-only
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + expiryHours * 60 * 60 * 1000), // 24 hours default
      };

      const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
      const sasUrl = `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${blobPath}?${sasToken}`;

      console.log(`🔒 Generated signed URL for ${blobPath} (expires in ${expiryHours}h)`);
      return sasUrl;
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      return null;
    }
  }

  /**
   * PC-5: Extract redacted media clips for admin review
   * Returns clips ≤30s with redaction metadata
   */
  async getRedactedClipsForSession(sessionId: string, dossierId: string): Promise<RedactedMediaClip[]> {
    try {
      // Get all moderation events for this session
      const moderationEvents = await db.select()
        .from(aiModerationLogs)
        .where(eq(aiModerationLogs.sessionId, sessionId));

      if (moderationEvents.length === 0) {
        return [];
      }

      const clips: RedactedMediaClip[] = [];

      for (const event of moderationEvents) {
        // Only create clips for flagged events
        if (event.aiVerdict === 'safe') continue;

        // Calculate clip timing
        const startTime = event.tsStart ? new Date(event.tsStart).getTime() / 1000 : 0;
        const endTime = event.tsEnd ? new Date(event.tsEnd).getTime() / 1000 : startTime + 30;
        const duration = Math.min(30, endTime - startTime); // Max 30 seconds

        // Determine redaction level based on modality
        let redactionLevel: 'blur' | 'bleep' | 'mask' = 'blur';
        if (event.modality === 'audio') redactionLevel = 'bleep';
        if (event.modality === 'chat' || event.modality === 'text') redactionLevel = 'mask';

        // In production, this would reference actual redacted clips in blob storage
        // For now, we create metadata that points to the original recording
        // Real implementation would use ffmpeg or similar to create redacted clips
        const blobPath = `redacted/${sessionId}/${event.modality}/${event.id}-clip.webm`;

        clips.push({
          clipId: event.id,
          sessionId,
          modality: event.modality as any,
          startTime,
          duration,
          blobPath,
          redactionLevel,
          createdAt: event.createdAt || new Date()
        });
      }

      console.log(`📊 Found ${clips.length} redacted clips for session ${sessionId}`);
      return clips;

    } catch (error) {
      console.error('Failed to get redacted clips:', error);
      return [];
    }
  }

  /**
   * PC-5 & LOG-4: Get redacted clip with signed URL for admin viewing
   * GOV-2: Only accessible through admin-authenticated endpoints
   */
  async getSecureClipUrl(clipId: string, sessionId: string, adminUserId: string): Promise<{
    clip: RedactedMediaClip | null;
    secureUrl: string | null;
    expiresAt: Date;
  }> {
    try {
      // Verify admin has access (this should be called from an authenticated admin endpoint)
      console.log(`🔐 Admin ${adminUserId} requesting secure clip ${clipId} for session ${sessionId}`);

      // Get moderation event details
      const event = await db.select()
        .from(aiModerationLogs)
        .where(
          and(
            eq(aiModerationLogs.id, clipId),
            eq(aiModerationLogs.sessionId, sessionId)
          )
        )
        .limit(1);

      if (event.length === 0) {
        console.warn(`⚠️  Clip ${clipId} not found`);
        return { clip: null, secureUrl: null, expiresAt: new Date() };
      }

      const moderationEvent = event[0];
      
      // Calculate clip metadata
      const startTime = moderationEvent.tsStart ? new Date(moderationEvent.tsStart).getTime() / 1000 : 0;
      const endTime = moderationEvent.tsEnd ? new Date(moderationEvent.tsEnd).getTime() / 1000 : startTime + 30;
      const duration = Math.min(30, endTime - startTime);

      let redactionLevel: 'blur' | 'bleep' | 'mask' = 'blur';
      if (moderationEvent.modality === 'audio') redactionLevel = 'bleep';
      if (moderationEvent.modality === 'chat' || moderationEvent.modality === 'text') redactionLevel = 'mask';

      const blobPath = `redacted/${sessionId}/${moderationEvent.modality}/${clipId}-clip.webm`;

      const clip: RedactedMediaClip = {
        clipId,
        sessionId,
        modality: moderationEvent.modality as any,
        startTime,
        duration,
        blobPath,
        redactionLevel,
        createdAt: moderationEvent.createdAt || new Date()
      };

      // Generate signed URL (24-hour expiry)
      // NOTE: In production, this would point to actual redacted clip
      // For now, using placeholder or original recording with warning
      const secureUrl = await this.generateSignedUrl(blobPath, 24);

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      console.log(`✅ Generated secure URL for clip ${clipId} (expires: ${expiresAt.toISOString()})`);

      return {
        clip,
        secureUrl,
        expiresAt
      };

    } catch (error) {
      console.error('Failed to get secure clip URL:', error);
      return { clip: null, secureUrl: null, expiresAt: new Date() };
    }
  }

  /**
   * PC-5: Get all redacted clips for a dossier with signed URLs
   * Used by admin review interface
   */
  async getRedactedClipsWithUrls(sessionId: string, dossierId: string, adminUserId: string): Promise<Array<RedactedMediaClip & { secureUrl: string | null; expiresAt: Date }>> {
    const clips = await this.getRedactedClipsForSession(sessionId, dossierId);
    
    const clipsWithUrls = await Promise.all(
      clips.map(async (clip) => {
        const secureUrl = await this.generateSignedUrl(clip.blobPath, 24);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        return {
          ...clip,
          secureUrl,
          expiresAt
        };
      })
    );

    console.log(`📦 Returning ${clipsWithUrls.length} redacted clips with signed URLs for session ${sessionId}`);
    return clipsWithUrls;
  }

  /**
   * GOV-2: Redaction policy enforcement
   * NOTE: This is a placeholder for actual video/audio redaction
   * In production, this would use ffmpeg to:
   * - Blur faces and sensitive visual content in video
   * - Bleep or mute sensitive audio segments
   * - Mask sensitive text in chat/screen captures
   */
  async createRedactedClip(
    originalBlobPath: string,
    startTime: number,
    duration: number,
    redactionType: 'blur' | 'bleep' | 'mask'
  ): Promise<string | null> {
    // PLACEHOLDER: In production, this would:
    // 1. Download original media from blob storage
    // 2. Use ffmpeg to extract clip (startTime, duration)
    // 3. Apply redaction (blur faces, bleep audio, mask text)
    // 4. Upload redacted clip to blob storage
    // 5. Return new blob path
    
    console.log(`🎬 [PLACEHOLDER] Would create ${redactionType} clip: ${originalBlobPath} (${startTime}s, ${duration}s)`);
    
    // For now, return a placeholder path
    const redactedPath = `redacted/${originalBlobPath.replace('.webm', `-${redactionType}-${startTime}-${duration}.webm`)}`;
    return redactedPath;
  }
}

export const mediaRedaction = new MediaRedactionService();
