// IndexedDB wrapper for persisting recording chunks
const DB_NAME = 'RecordingChunksDB';
const DB_VERSION = 1;
const STORE_NAME = 'chunks';

export interface RecordingChunk {
  id: string;
  sessionId: string;
  partNumber: number;
  blob: Blob;
  timestamp: number;
  retryCount: number;
}

class RecordingDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('sessionId', 'sessionId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveChunk(chunk: RecordingChunk): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(chunk);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getChunk(id: string): Promise<RecordingChunk | undefined> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getChunksBySession(sessionId: string): Promise<RecordingChunk[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('sessionId');
      const request = index.getAll(sessionId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllChunks(): Promise<RecordingChunk[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteChunk(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteChunksBySession(sessionId: string): Promise<void> {
    if (!this.db) await this.init();
    
    const chunks = await this.getChunksBySession(sessionId);
    const deletePromises = chunks.map(chunk => this.deleteChunk(chunk.id));
    await Promise.all(deletePromises);
  }

  async incrementRetryCount(id: string): Promise<void> {
    const chunk = await this.getChunk(id);
    if (chunk) {
      chunk.retryCount++;
      await this.saveChunk(chunk);
    }
  }
}

export const recordingDB = new RecordingDB();
