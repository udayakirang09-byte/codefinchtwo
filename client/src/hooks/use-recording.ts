import { useState, useRef, useCallback, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

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

const CHUNK_INTERVAL_MS = 5000; // 5 seconds
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
    try {
      console.log(`⬆️ Uploading recording chunk ${partNumber} (${(blob.size / 1024).toFixed(2)} KB)`);
      
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
      
      setState(prev => ({
        ...prev,
        totalSize: prev.totalSize + blob.size,
      }));
      
      onChunkUploaded?.(partNumber);
      
    } catch (error) {
      if (attempt < MAX_RETRY_ATTEMPTS) {
        console.warn(`⚠️ Upload failed for chunk ${partNumber}, retrying (${attempt}/${MAX_RETRY_ATTEMPTS})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        return uploadChunk(blob, partNumber, attempt + 1);
      } else {
        const uploadError = new Error(`Failed to upload chunk ${partNumber} after ${MAX_RETRY_ATTEMPTS} attempts`);
        console.error(`❌ ${uploadError.message}`, error);
        onError?.(uploadError);
        throw uploadError;
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

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (compositeStreamRef.current) {
        compositeStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
  };
}
