import { BlobServiceClient, ContainerClient, BlockBlobClient, BlobSASPermissions, StorageSharedKeyCredential, generateBlobSASQueryParameters } from '@azure/storage-blob';
import { Readable } from 'stream';

const STORAGE_ACCOUNT = 'kidzaimathstore31320';
const CONTAINER_NAME = 'replayknowledge';

let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

function initializeClients() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.STORAGE_CONNECTION_STRING || process.env.BLOBCONSTR;
  
  if (!connectionString) {
    console.warn('⚠️  Azure Storage connection string not set (AZURE_STORAGE_CONNECTION_STRING, STORAGE_CONNECTION_STRING or BLOBCONSTR) - Azure Storage operations will fail');
    return null;
  }

  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    console.log(`✅ Azure Storage initialized: ${STORAGE_ACCOUNT}/${CONTAINER_NAME}`);
    return containerClient;
  } catch (error) {
    console.error('❌ Failed to initialize Azure Storage:', error);
    return null;
  }
}

function getContainerClient(): ContainerClient {
  if (!containerClient) {
    const client = initializeClients();
    if (!client) {
      throw new Error('Azure Storage not configured - STORAGE_CONNECTION_STRING environment variable missing');
    }
  }
  return containerClient!;
}

export interface RecordingPartUpload {
  studentId: string;
  classId: string;
  partNumber: number;
  buffer: Buffer;
  contentType: string;
  studentName: string;
  teacherName: string;
  subject: string;
  dateTime: string;
}

export interface RecordingPartInfo {
  blobPath: string;
  url: string;
  size: number;
  uploadedAt: Date;
}

export interface MergedRecordingInfo {
  blobPath: string;
  url: string;
  size: number;
  mergedAt: Date;
}

export class AzureStorageService {
  private container: ContainerClient | null = null;

  private getContainer(): ContainerClient {
    if (!this.container) {
      this.container = getContainerClient();
    }
    return this.container;
  }

  async uploadRecordingPart(upload: RecordingPartUpload): Promise<RecordingPartInfo> {
    // New naming convention: StudentName-TeacherName-Subject-DateTime-PartNumber.webm
    const blobPath = `${upload.studentName}-${upload.teacherName}-${upload.subject}-${upload.dateTime}-Part${upload.partNumber}.webm`;
    const blockBlobClient = this.getContainer().getBlockBlobClient(blobPath);

    await blockBlobClient.uploadData(upload.buffer, {
      blobHTTPHeaders: {
        blobContentType: upload.contentType || 'video/webm',
      },
    });

    const properties = await blockBlobClient.getProperties();

    return {
      blobPath,
      url: blockBlobClient.url,
      size: properties.contentLength || 0,
      uploadedAt: properties.lastModified || new Date(),
    };
  }

  async listRecordingParts(studentId: string, classId: string): Promise<RecordingPartInfo[]> {
    const parts: RecordingPartInfo[] = [];

    // List all blobs and filter for this booking
    for await (const blob of this.getContainer().listBlobsFlat()) {
      if (!blob.name.endsWith('.webm')) {
        continue;
      }

      // Skip merged/final recordings
      if (blob.name.includes('-Final.webm') || blob.name.includes('_merged.webm')) {
        continue;
      }

      // Check if blob belongs to this booking
      // New format: contains classId in metadata or matches old format
      const isOldFormat = blob.name.startsWith(`${studentId}_${classId}_`) && !blob.name.includes('_merged');
      const isNewFormat = blob.name.includes('-Part') && blob.name.includes(classId);
      
      if (isOldFormat || isNewFormat) {
        const blockBlobClient = this.getContainer().getBlockBlobClient(blob.name);
        parts.push({
          blobPath: blob.name,
          url: blockBlobClient.url,
          size: blob.properties.contentLength || 0,
          uploadedAt: blob.properties.lastModified || new Date(),
        });
      }
    }

    return parts.sort((a, b) => {
      // Extract part number from both old and new formats
      const oldFormatA = a.blobPath.match(/_(\d+)\.webm$/);
      const newFormatA = a.blobPath.match(/-Part(\d+)\.webm$/);
      const partNumA = parseInt((newFormatA?.[1] || oldFormatA?.[1]) || '0');
      
      const oldFormatB = b.blobPath.match(/_(\d+)\.webm$/);
      const newFormatB = b.blobPath.match(/-Part(\d+)\.webm$/);
      const partNumB = parseInt((newFormatB?.[1] || oldFormatB?.[1]) || '0');
      
      return partNumA - partNumB;
    });
  }

  async mergeRecordingParts(studentId: string, classId: string, studentName?: string, teacherName?: string, subject?: string, dateTime?: string): Promise<MergedRecordingInfo> {
    const parts = await this.listRecordingParts(studentId, classId);

    if (parts.length === 0) {
      throw new Error(`No recording parts found for ${studentId}_${classId}`);
    }

    // Extract metadata from first part if not provided
    let mergedBlobPath: string;
    if (studentName && teacherName && subject && dateTime) {
      // New naming convention: StudentName-TeacherName-Subject-DateTime-Final.webm
      mergedBlobPath = `${studentName}-${teacherName}-${subject}-${dateTime}-Final.webm`;
    } else {
      // Fallback: try to extract from first part's name (new format)
      const firstPartName = parts[0].blobPath;
      const match = firstPartName.match(/^(.+)-Part\d+\.webm$/);
      if (match) {
        mergedBlobPath = `${match[1]}-Final.webm`;
      } else {
        // Old format fallback
        mergedBlobPath = `${studentId}_${classId}_merged.webm`;
      }
    }
    
    const mergedBlobClient = this.getContainer().getBlockBlobClient(mergedBlobPath);

    const buffers: Buffer[] = [];
    for (const part of parts) {
      const partBlobClient = this.getContainer().getBlockBlobClient(part.blobPath);
      const downloadResponse = await partBlobClient.download(0);
      
      if (!downloadResponse.readableStreamBody) {
        throw new Error(`Failed to download part: ${part.blobPath}`);
      }

      const chunks: Buffer[] = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.from(chunk));
      }
      buffers.push(Buffer.concat(chunks));
    }

    const mergedBuffer = Buffer.concat(buffers);

    await mergedBlobClient.uploadData(mergedBuffer, {
      blobHTTPHeaders: {
        blobContentType: 'video/webm',
      },
    });

    const properties = await mergedBlobClient.getProperties();

    return {
      blobPath: mergedBlobPath,
      url: mergedBlobClient.url,
      size: properties.contentLength || 0,
      mergedAt: properties.lastModified || new Date(),
    };
  }

  async deleteOldRecordings(retentionMonths: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);

    let deletedCount = 0;

    for await (const blob of this.getContainer().listBlobsFlat()) {
      if (blob.properties.lastModified && blob.properties.lastModified < cutoffDate) {
        const blobClient = this.getContainer().getBlockBlobClient(blob.name);
        await blobClient.delete();
        deletedCount++;
        console.log(`🗑️  Deleted old recording: ${blob.name}`);
      }
    }

    return deletedCount;
  }

  async generateSasUrl(blobPath: string, expiresInMinutes: number = 60): Promise<string> {
    const blobClient = this.getContainer().getBlockBlobClient(blobPath);
    
    const startsOn = new Date();
    const expiresOn = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    
    const sasUrl = await blobClient.generateSasUrl({
      permissions: BlobSASPermissions.parse("r"),
      startsOn,
      expiresOn,
    });

    return sasUrl;
  }

  async deleteRecordingParts(studentId: string, classId: string): Promise<void> {
    const parts = await this.listRecordingParts(studentId, classId);
    
    for (const part of parts) {
      const blobClient = this.getContainer().getBlockBlobClient(part.blobPath);
      await blobClient.delete();
      console.log(`🗑️  Deleted recording part: ${part.blobPath}`);
    }
  }

  async getMergedRecording(studentId: string, classId: string): Promise<MergedRecordingInfo | null> {
    // Try to find merged recording in both old and new formats
    const parts: MergedRecordingInfo[] = [];
    
    for await (const blob of this.getContainer().listBlobsFlat()) {
      const isOldFormat = blob.name === `${studentId}_${classId}_merged.webm`;
      const isNewFormat = blob.name.includes('-Final.webm') && blob.name.includes(classId);
      
      if (isOldFormat || isNewFormat) {
        const blobClient = this.getContainer().getBlockBlobClient(blob.name);
        parts.push({
          blobPath: blob.name,
          url: blobClient.url,
          size: blob.properties.contentLength || 0,
          mergedAt: blob.properties.lastModified || new Date(),
        });
      }
    }
    
    // Return the most recent merged recording (sorted by mergedAt descending)
    if (parts.length > 0) {
      return parts.sort((a, b) => b.mergedAt.getTime() - a.mergedAt.getTime())[0];
    }
    
    return null;
  }

  async deleteMergedRecording(studentId: string, classId: string): Promise<void> {
    // Find and delete merged recordings in both old and new formats
    for await (const blob of this.getContainer().listBlobsFlat()) {
      const isOldFormat = blob.name === `${studentId}_${classId}_merged.webm`;
      const isNewFormat = blob.name.includes('-Final.webm') && blob.name.includes(classId);
      
      if (isOldFormat || isNewFormat) {
        const blobClient = this.getContainer().getBlockBlobClient(blob.name);
        try {
          await blobClient.delete();
          console.log(`🗑️  Deleted merged recording: ${blob.name}`);
        } catch (error: any) {
          if (error.statusCode !== 404) {
            throw error;
          }
        }
      }
    }
  }
}

export const azureStorage = new AzureStorageService();

export interface MergeRecordingPartsInput {
  studentId: string;
  classId: string;
  parts: string[];
}

export async function mergeRecordingParts(input: MergeRecordingPartsInput): Promise<MergedRecordingInfo> {
  return await azureStorage.mergeRecordingParts(input.studentId, input.classId);
}
