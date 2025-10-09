import { BlobServiceClient, ContainerClient, BlockBlobClient, BlobSASPermissions, StorageSharedKeyCredential, generateBlobSASQueryParameters } from '@azure/storage-blob';
import { Readable } from 'stream';

const STORAGE_ACCOUNT = 'kidzaimathstore31320';
const CONTAINER_NAME = 'replayknowledge';

let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

function initializeClients() {
  const connectionString = process.env.STORAGE_CONNECTION_STRING || process.env.BLOBCONSTR;
  
  if (!connectionString) {
    console.warn('⚠️  STORAGE_CONNECTION_STRING environment variable not set - Azure Storage operations will fail');
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
    const blobPath = `${upload.studentId}_${upload.classId}_${upload.partNumber}.webm`;
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
    const prefix = `${studentId}_${classId}_`;
    const parts: RecordingPartInfo[] = [];

    for await (const blob of this.getContainer().listBlobsFlat({ prefix })) {
      if (!blob.name.endsWith('.webm') || blob.name.includes('_merged')) {
        continue;
      }

      const blockBlobClient = this.getContainer().getBlockBlobClient(blob.name);
      parts.push({
        blobPath: blob.name,
        url: blockBlobClient.url,
        size: blob.properties.contentLength || 0,
        uploadedAt: blob.properties.lastModified || new Date(),
      });
    }

    return parts.sort((a, b) => {
      const partNumA = parseInt(a.blobPath.match(/_(\d+)\.webm$/)?.[1] || '0');
      const partNumB = parseInt(b.blobPath.match(/_(\d+)\.webm$/)?.[1] || '0');
      return partNumA - partNumB;
    });
  }

  async mergeRecordingParts(studentId: string, classId: string): Promise<MergedRecordingInfo> {
    const parts = await this.listRecordingParts(studentId, classId);

    if (parts.length === 0) {
      throw new Error(`No recording parts found for ${studentId}_${classId}`);
    }

    const mergedBlobPath = `${studentId}_${classId}_merged.webm`;
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
    const mergedBlobPath = `${studentId}_${classId}_merged.webm`;
    const blobClient = this.getContainer().getBlockBlobClient(mergedBlobPath);

    try {
      const properties = await blobClient.getProperties();
      return {
        blobPath: mergedBlobPath,
        url: blobClient.url,
        size: properties.contentLength || 0,
        mergedAt: properties.lastModified || new Date(),
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async deleteMergedRecording(studentId: string, classId: string): Promise<void> {
    const mergedBlobPath = `${studentId}_${classId}_merged.webm`;
    const blobClient = this.getContainer().getBlockBlobClient(mergedBlobPath);
    
    try {
      await blobClient.delete();
      console.log(`🗑️  Deleted merged recording: ${mergedBlobPath}`);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return;
      }
      throw error;
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
