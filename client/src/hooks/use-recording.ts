import { useState, useRef, useCallback, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { recordingDB, type RecordingChunk } from '@/lib/recording-db';

interface RecordingOptions {
  sessionId: string;
  userId: string;
  role: 'teacher' | 'student';
  onError?: (error: Error) => void;
  onChunkUploaded?: (partNumber: number) => void;
  onRecordingComplete?: () => void;
}

interface RecordingState {
  isRecording: boolean;
  partNumber: number;
  totalSize: number;
  error: string | null;
}

const CHUNK_INTERVAL_MS = 25000; // 25 seconds - optimized to reduce write frequency
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

export function useRecording(options: RecordingOptions) {
  const { sessionId, userId, role, onError, onChunkUploaded, onRecordingComplete } = options;
  
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    partNumber: 0,
    totalSize: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const compositeStreamRef = useRef<MediaStream | null>(null);
  const partNumberRef = useRef(0);
  const uploadQueueRef = useRef<Array<{ blob: Blob; partNumber: number }>>([]);
  const isUploadingRef = useRef(false);

  // Upload chunk with retry logic
  const uploadChunk = useCallback(async (blob: Blob, partNumber: number, attempt = 1): Promise<void> => {
    const chunkId = `${sessionId}-${partNumber}`;
    
    // Check persisted retry count before attempting upload
    let persistedRetryCount = 0;
    try {
      const persistedChunk = await recordingDB.getChunk(chunkId);
      persistedRetryCount = persistedChunk?.retryCount || 0;
      
      // If already exceeded retry limit, delete and fail
      if (persistedRetryCount >= MAX_RETRY_ATTEMPTS) {
        console.warn(`⚠️ Chunk ${partNumber} already exceeded retry limit (${persistedRetryCount} attempts), deleting`);
        await recordingDB.deleteChunk(chunkId);
        const uploadError = new Error(`Chunk ${partNumber} exceeded retry limit`);
        onError?.(uploadError);
        throw uploadError;
      }
    } catch (err) {
      console.warn('Failed to check persisted retry count:', err);
    }
    
    try {
      console.log(`⬆️ Uploading recording chunk ${partNumber} (${(blob.size / 1024).toFixed(2)} KB), total attempts: ${persistedRetryCount + 1}`);
      
      // Get session token from localStorage
      const sessionToken = localStorage.getItem('sessionToken');
      
      const response = await fetch(
        `/api/recordings/upload-part?bookingId=${sessionId}&partNumber=${partNumber}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'video/webm',
            ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}),
          },
          body: blob,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      console.log(`✅ Successfully uploaded chunk ${partNumber}`);
      
      // Delete chunk from IndexedDB after successful upload
      try {
        await recordingDB.deleteChunk(chunkId);
        console.log(`🗑️ Deleted chunk ${partNumber} from IndexedDB`);
      } catch (err) {
        console.warn('Failed to delete chunk from IndexedDB:', err);
      }
      
      setState(prev => ({
        ...prev,
        totalSize: prev.totalSize + blob.size,
      }));
      
      onChunkUploaded?.(partNumber);
      
    } catch (error) {
      // Increment retry count in IndexedDB
      try {
        await recordingDB.incrementRetryCount(chunkId);
        persistedRetryCount += 1;
        console.log(`📈 Incremented retry count for chunk ${partNumber} to ${persistedRetryCount}`);
      } catch (err) {
        console.warn('Failed to increment retry count in IndexedDB:', err);
      }
      
      // Check if we've exceeded the retry limit (using both persisted and local attempt counter as fallback)
      const hasExceededLimit = persistedRetryCount >= MAX_RETRY_ATTEMPTS || attempt >= MAX_RETRY_ATTEMPTS;
      
      if (hasExceededLimit) {
        // Delete chunk from IndexedDB after exhausting retries
        try {
          await recordingDB.deleteChunk(chunkId);
          console.log(`🗑️ Deleted chunk ${partNumber} from IndexedDB after ${persistedRetryCount || attempt} total attempts`);
        } catch (err) {
          console.warn('Failed to delete chunk from IndexedDB:', err);
        }
        
        const totalAttempts = Math.max(persistedRetryCount, attempt);
        const uploadError = new Error(`Failed to upload chunk ${partNumber} after ${totalAttempts} attempts`);
        console.error(`❌ ${uploadError.message}`, error);
        onError?.(uploadError);
        throw uploadError;
      } else {
        console.warn(`⚠️ Upload failed for chunk ${partNumber}, retrying (${persistedRetryCount}/${MAX_RETRY_ATTEMPTS}, local: ${attempt}/${MAX_RETRY_ATTEMPTS})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        return uploadChunk(blob, partNumber, attempt + 1);
      }
    }
  }, [sessionId, userId, onChunkUploaded, onError]);

  // Process upload queue
  const processUploadQueue = useCallback(async () => {
    if (isUploadingRef.current || uploadQueueRef.current.length === 0) {
      return;
    }

    isUploadingRef.current = true;

    while (uploadQueueRef.current.length > 0) {
      const chunk = uploadQueueRef.current.shift();
      if (chunk) {
        try {
          await uploadChunk(chunk.blob, chunk.partNumber);
        } catch (error) {
          // Error already handled in uploadChunk
          setState(prev => ({
            ...prev,
            error: `Upload failed for chunk ${chunk.partNumber}`,
          }));
        }
      }
    }

    isUploadingRef.current = false;
  }, [uploadChunk]);

  // Start recording
  const startRecording = useCallback((localStream: MediaStream, remoteStreams: MediaStream[] = []) => {
    try {
      // Create composite stream (teacher records both local and remote)
      const compositeStream = new MediaStream();
      
      // Add all local tracks
      localStream.getTracks().forEach(track => {
        compositeStream.addTrack(track);
        console.log(`🎬 Added local ${track.kind} track to recording`);
      });
      
      // Add remote tracks (for teacher recording students)
      if (role === 'teacher') {
        remoteStreams.forEach((remoteStream, index) => {
          remoteStream.getTracks().forEach(track => {
            compositeStream.addTrack(track);
            console.log(`🎬 Added remote ${track.kind} track ${index} to recording`);
          });
        });
      }

      compositeStreamRef.current = compositeStream;

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(compositeStream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      // Handle data available
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          partNumberRef.current += 1;
          const partNumber = partNumberRef.current;
          
          console.log(`📦 Recording chunk ${partNumber} available (${(event.data.size / 1024).toFixed(2)} KB)`);
          
          // Persist chunk to IndexedDB as backup
          const chunkId = `${sessionId}-${partNumber}`;
          try {
            await recordingDB.saveChunk({
              id: chunkId,
              sessionId,
              partNumber,
              blob: event.data,
              timestamp: Date.now(),
              retryCount: 0,
            });
            console.log(`💾 Saved chunk ${partNumber} to IndexedDB`);
          } catch (err) {
            console.warn('Failed to save chunk to IndexedDB:', err);
          }
          
          // Queue upload
          uploadQueueRef.current.push({
            blob: event.data,
            partNumber,
          });
          
          // Process queue
          processUploadQueue();
        }
      };

      mediaRecorder.onerror = (error) => {
        console.error('❌ MediaRecorder error:', error);
        const recError = new Error('Recording failed');
        setState(prev => ({ ...prev, error: 'Recording failed', isRecording: false }));
        onError?.(recError);
      };

      mediaRecorder.onstop = () => {
        console.log('🛑 Recording stopped');
        setState(prev => ({ ...prev, isRecording: false }));
        onRecordingComplete?.();
      };

      // Start recording with chunk intervals
      mediaRecorder.start(CHUNK_INTERVAL_MS);
      mediaRecorderRef.current = mediaRecorder;
      partNumberRef.current = 0;

      setState({
        isRecording: true,
        partNumber: 0,
        totalSize: 0,
        error: null,
      });

      console.log(`✅ Recording started (${mimeType})`);
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      const startError = error instanceof Error ? error : new Error('Failed to start recording');
      setState(prev => ({ ...prev, error: startError.message }));
      onError?.(startError);
    }
  }, [role, processUploadQueue, onError, onRecordingComplete]);

  // Flush any buffered recording data
  const flushRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('📤 Flushing buffered recording data...');
      mediaRecorderRef.current.requestData();
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Flush any buffered data before stopping
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData();
        // Give time for the data to be processed
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      mediaRecorderRef.current.stop();
      
      // Wait for any pending uploads to complete
      while (uploadQueueRef.current.length > 0 || isUploadingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Clean up streams
      if (compositeStreamRef.current) {
        compositeStreamRef.current.getTracks().forEach(track => track.stop());
        compositeStreamRef.current = null;
      }
      
      mediaRecorderRef.current = null;
      console.log('✅ Recording stopped and cleanup complete');
    }
  }, []);

  // Rehydrate persisted chunks on mount
  useEffect(() => {
    const rehydrateChunks = async () => {
      try {
        const persistedChunks = await recordingDB.getChunksBySession(sessionId);
        if (persistedChunks.length > 0) {
          console.log(`🔄 Rehydrating ${persistedChunks.length} persisted chunks for session ${sessionId}`);
          
          // Sort by part number to maintain order
          const sortedChunks = persistedChunks.sort((a, b) => a.partNumber - b.partNumber);
          
          // Re-enqueue chunks for upload
          for (const chunk of sortedChunks) {
            // Only retry if not too many retries already
            if (chunk.retryCount < MAX_RETRY_ATTEMPTS) {
              uploadQueueRef.current.push({
                blob: chunk.blob,
                partNumber: chunk.partNumber,
              });
            } else {
              console.warn(`⚠️ Chunk ${chunk.partNumber} exceeded retry limit, deleting from IndexedDB`);
              await recordingDB.deleteChunk(chunk.id);
            }
          }
          
          // Process the rehydrated queue
          processUploadQueue();
        }
      } catch (err) {
        console.error('Failed to rehydrate chunks from IndexedDB:', err);
      }
    };

    rehydrateChunks();
  }, [sessionId, processUploadQueue]);

  // Cleanup on unmount and handle page unload
  useEffect(() => {
    // Handle page unload - flush recording before leaving
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log('⚠️ Page unloading - flushing recording data...');
        flushRecording();
        // Give browser time to process the flush (best effort)
        const start = Date.now();
        while (Date.now() - start < 300) {
          // Synchronous delay
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (compositeStreamRef.current) {
        compositeStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [flushRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    flushRecording,
  };
}
