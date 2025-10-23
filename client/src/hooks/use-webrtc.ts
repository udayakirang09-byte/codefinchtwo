import { useState, useEffect, useRef, useCallback } from "react";
import { calculateHealthScore, type NetworkMetrics, type HealthScore } from "@shared/webrtc-health";
import { apiRequest } from "@/lib/queryClient";

interface Participant {
  userId: string;
  isTeacher: boolean;
  stream?: MediaStream;
  peerConnection?: RTCPeerConnection;
}

interface UseWebRTCProps {
  sessionId: string;
  userId: string;
  isTeacher: boolean;
  onParticipantJoin?: (participant: Participant) => void;
  onParticipantLeave?: (userId: string) => void;
  onModerationAlert?: (message: string, severity: 'moderate' | 'critical') => void;
}

export function useWebRTC({
  sessionId,
  userId,
  isTeacher,
  onParticipantJoin,
  onParticipantLeave,
  onModerationAlert
}: UseWebRTCProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'disconnected'>('disconnected');
  const [isPolite, setIsPolite] = useState(false); // For perfect negotiation
  const [error, setError] = useState<string | null>(null);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [healthDetails, setHealthDetails] = useState<HealthScore | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<NetworkMetrics | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const cameraStreamRef = useRef<MediaStream | null>(null); // Keep camera/mic stream separate
  const screenStreamRef = useRef<MediaStream | null>(null); // Keep screen stream separate
  const isSharingScreenRef = useRef<boolean>(false); // Track screen sharing state
  
  // Auto-repair state tracking (R2.3)
  const lastRepairAttemptRef = useRef<number>(0);
  const repairAttemptsCountRef = useRef<number>(0);
  const isRepairingRef = useRef<boolean>(false);
  const poorQualityStartTimeRef = useRef<number | null>(null);
  
  // Quality degradation state (R3.1-R3.2)
  type QualityLevel = '720p' | '480p' | '360p' | 'audio-only';
  const [currentQualityLevel, setCurrentQualityLevel] = useState<QualityLevel>('720p');
  const lastQualityChangeRef = useRef<number>(0);
  const qualityStableTimeRef = useRef<number | null>(null);
  
  // ICE servers configuration with TURN for NAT traversal
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Add TURN servers for production deployment
    // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' }
  ];

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    console.log('🎥 Requesting camera and microphone access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      
      console.log('✅ Camera and microphone access granted', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });
      
      // Store in both state and ref for camera stream
      cameraStreamRef.current = stream;
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Check if there's a pending join waiting for stream initialization
      if (wsRef.current && (wsRef.current as any).pendingJoin) {
        const { sessionId: pendingSessionId, isTeacher: pendingIsTeacher } = (wsRef.current as any).pendingJoin;
        console.log('✅ Local stream now ready - processing pending join');
        console.log('📊 Stream details:', {
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length
        });
        wsRef.current.send(JSON.stringify({
          type: 'join-video-session',
          sessionId: pendingSessionId,
          isTeacher: pendingIsTeacher
        }));
        // Clear pending join
        delete (wsRef.current as any).pendingJoin;
      }
      
      return stream;
    } catch (error) {
      console.error('❌ Failed to get local stream:', error);
      // Fallback to audio-only if video fails
      try {
        console.log('🔄 Trying audio-only fallback...');
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ Audio-only access granted');
        cameraStreamRef.current = audioStream;
        setLocalStream(audioStream);
        
        // Check for pending join in audio-only fallback case
        if (wsRef.current && (wsRef.current as any).pendingJoin) {
          const { sessionId: pendingSessionId, isTeacher: pendingIsTeacher } = (wsRef.current as any).pendingJoin;
          console.log('✅ Audio stream ready - processing pending join');
          wsRef.current.send(JSON.stringify({
            type: 'join-video-session',
            sessionId: pendingSessionId,
            isTeacher: pendingIsTeacher
          }));
          delete (wsRef.current as any).pendingJoin;
        }
        
        return audioStream;
      } catch (audioError) {
        console.error('❌ Failed to get audio stream:', audioError);
        return null;
      }
    }
  }, []);

  // Create peer connection for a participant
  const createPeerConnection = useCallback((targetUserId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection({ iceServers });
    
    // Add tracks to peer connection
    // CRITICAL: Always use camera stream for audio (microphone), even during screen share
    // Video track depends on whether we're screen sharing or not
    if (cameraStreamRef.current) {
      const audioTrack = cameraStreamRef.current.getAudioTracks()[0];
      
      // Always add microphone audio from camera stream
      if (audioTrack) {
        peerConnection.addTrack(audioTrack, cameraStreamRef.current);
        console.log(`🎤 Added microphone audio track for peer ${targetUserId}`);
      }
      
      // Add video track - use screen if sharing, otherwise camera
      if (isSharingScreenRef.current && screenStreamRef.current) {
        const screenVideoTrack = screenStreamRef.current.getVideoTracks()[0];
        if (screenVideoTrack) {
          peerConnection.addTrack(screenVideoTrack, screenStreamRef.current);
          console.log(`🖥️ Added screen video track for peer ${targetUserId}`);
        }
      } else {
        const cameraVideoTrack = cameraStreamRef.current.getVideoTracks()[0];
        if (cameraVideoTrack) {
          peerConnection.addTrack(cameraVideoTrack, cameraStreamRef.current);
          console.log(`📹 Added camera video track for peer ${targetUserId}`);
        }
      }
    }
    
    // Handle incoming remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setParticipants(prev => {
        const updated = new Map(prev);
        const participant = updated.get(targetUserId);
        if (participant) {
          participant.stream = remoteStream;
          updated.set(targetUserId, participant);
        }
        return updated;
      });
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc-ice-candidate',
          sessionId,
          userId,
          targetUserId,
          candidate: event.candidate
        }));
      }
    };
    
    // Monitor connection state
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log(`Peer connection with ${targetUserId}: ${state}`);
      
      if (state === 'connected') {
        setConnectionQuality('good');
      } else if (state === 'failed' || state === 'disconnected') {
        setConnectionQuality('poor');
      }
    };
    
    peerConnectionsRef.current.set(targetUserId, peerConnection);
    return peerConnection;
  }, [localStream, sessionId, userId]);

  // Send WebRTC offer to a participant (with perfect negotiation)
  const sendOffer = useCallback(async (targetUserId: string) => {
    try {
      const peerConnection = createPeerConnection(targetUserId);
      
      // Implement perfect negotiation: only polite peer sends offers
      const shouldSendOffer = isPolite || userId < targetUserId; // Deterministic politeness
      
      if (shouldSendOffer) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'webrtc-offer',
            sessionId,
            userId,
            targetUserId,
            offer
          }));
        }
      }
    } catch (error) {
      console.error('Failed to send offer:', error);
    }
  }, [createPeerConnection, sessionId, userId, isPolite]);

  // Handle WebRTC offer from a participant
  const handleOffer = useCallback(async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = createPeerConnection(fromUserId);
      await peerConnection.setRemoteDescription(offer);
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc-answer',
          sessionId,
          userId,
          targetUserId: fromUserId,
          answer
        }));
      }
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  }, [createPeerConnection, sessionId, userId]);

  // Handle WebRTC answer from a participant
  const handleAnswer = useCallback(async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(fromUserId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }
  }, []);

  // Handle ICE candidate from a participant
  const handleIceCandidate = useCallback(async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(fromUserId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    // Toggle the appropriate video track (screen or camera)
    const stream = isSharingScreenRef.current && screenStreamRef.current 
      ? screenStreamRef.current 
      : cameraStreamRef.current;
      
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    // CRITICAL: Always toggle the microphone from camera stream, never screen audio
    if (cameraStreamRef.current) {
      const audioTrack = cameraStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log(`🎤 Microphone ${audioTrack.enabled ? 'enabled' : 'muted'}`);
      }
    }
  }, []);

  // Collect WebRTC stats from peer connections
  const collectStats = useCallback(async () => {
    if (peerConnectionsRef.current.size === 0) {
      return null;
    }

    // Collect stats from all peer connections
    const allMetrics: NetworkMetrics[] = [];
    
    // Convert Map entries to array for iteration
    const peerEntries = Array.from(peerConnectionsRef.current.entries());
    
    for (const [peerId, pc] of peerEntries) {
      try {
        const stats = await pc.getStats();
        
        let packetLoss = 0;
        let rtt = 0;
        let jitter = 0;
        let freezeCount = 0;
        
        stats.forEach((report) => {
          // Inbound RTP (receiving)
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            if (report.packetsLost && report.packetsReceived) {
              const totalPackets = report.packetsLost + report.packetsReceived;
              packetLoss = (report.packetsLost / totalPackets) * 100;
            }
            
            if (report.jitter) {
              jitter = report.jitter * 1000; // Convert to ms
            }
            
            if (report.freezeCount) {
              freezeCount = report.freezeCount;
            }
          }
          
          // Candidate pair (for RTT)
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            if (report.currentRoundTripTime) {
              rtt = report.currentRoundTripTime * 1000; // Convert to ms
            }
          }
        });
        
        const metrics: NetworkMetrics = {
          packetLoss,
          rtt,
          jitter,
          freezeCount,
        };
        
        allMetrics.push(metrics);
      } catch (error) {
        console.error(`Failed to collect stats for peer ${peerId}:`, error);
      }
    }
    
    // Average all metrics if multiple peers
    if (allMetrics.length > 0) {
      const avgMetrics: NetworkMetrics = {
        packetLoss: allMetrics.reduce((sum, m) => sum + m.packetLoss, 0) / allMetrics.length,
        rtt: allMetrics.reduce((sum, m) => sum + m.rtt, 0) / allMetrics.length,
        jitter: allMetrics.reduce((sum, m) => sum + m.jitter, 0) / allMetrics.length,
        freezeCount: Math.max(...allMetrics.map(m => m.freezeCount)),
      };
      
      // Calculate health score
      const health = calculateHealthScore(avgMetrics);
      
      // Update state
      setCurrentMetrics(avgMetrics);
      setHealthScore(health.score);
      setHealthDetails(health);
      
      // Update connection quality based on health score
      if (health.score >= 60) {
        setConnectionQuality('good');
      } else if (health.score >= 40) {
        setConnectionQuality('poor');
      } else {
        setConnectionQuality('disconnected');
      }
      
      console.log('📊 WebRTC Stats:', {
        metrics: avgMetrics,
        health: health.score,
        quality: health.quality,
      });
      
      // R2.4: Submit stats to backend API for database storage
      try {
        await apiRequest('POST', '/api/webrtc/stats', {
          sessionId,
          userId,
          timestamp: new Date().toISOString(),
          packetLoss: avgMetrics.packetLoss,
          rtt: avgMetrics.rtt,
          jitter: avgMetrics.jitter,
          freezeCount: avgMetrics.freezeCount || 0,
          healthScore: health.score,
          quality: health.quality,
          connectionState: 'connected'
        });
      } catch (error) {
        console.error('❌ Failed to submit WebRTC stats:', error);
        // Don't throw - stats submission failure shouldn't break the connection
      }
      
      return { metrics: avgMetrics, health };
    }
    
    return null;
  }, [sessionId, userId]);

  // R2.3: ICE Restart for connection recovery
  const performICERestart = useCallback(async () => {
    if (isRepairingRef.current) {
      console.log('⚠️ ICE restart already in progress, skipping...');
      return;
    }

    console.log('🔧 [AUTO-REPAIR] Starting ICE restart for all peer connections...');
    isRepairingRef.current = true;
    let restartedCount = 0;

    try {
      const peerEntries = Array.from(peerConnectionsRef.current.entries());
      for (const [peerId, pc] of peerEntries) {
        try {
          console.log(`🔄 Restarting ICE for peer ${peerId}`);
          
          // Create new offer with iceRestart flag
          const offer = await pc.createOffer({ iceRestart: true });
          await pc.setLocalDescription(offer);
          
          // Send ICE restart offer via existing WebSocket handler with correct payload
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'webrtc-offer',
              sessionId,
              userId,
              targetUserId: peerId,
              offer,  // Correct field name to match handler
              iceRestart: true  // Flag to indicate this is an ICE restart
            }));
          }
          
          restartedCount++;
          console.log(`✅ ICE restart initiated for peer ${peerId}`);
        } catch (err) {
          console.error(`❌ Failed to restart ICE for peer ${peerId}:`, err);
        }
      }

      repairAttemptsCountRef.current++;
      lastRepairAttemptRef.current = Date.now();
      
      console.log(`✅ [AUTO-REPAIR] ICE restart completed for ${restartedCount}/${peerConnectionsRef.current.size} peers`);
    } finally {
      // Allow next repair after cooldown
      setTimeout(() => {
        isRepairingRef.current = false;
      }, 5000); // 5 second cooldown
    }
  }, []);

  // R2.3: Adjust bitrate to reduce bandwidth usage
  const adjustBitrate = useCallback(async (targetBitrate: number) => {
    console.log(`🔧 [AUTO-REPAIR] Adjusting bitrate to ${targetBitrate} kbps`);
    
    const peerEntries = Array.from(peerConnectionsRef.current.entries());
    for (const [peerId, pc] of peerEntries) {
      const senders = pc.getSenders();
      
      for (const sender of senders) {
        if (sender.track?.kind === 'video') {
          const parameters = sender.getParameters();
          
          if (!parameters.encodings) {
            parameters.encodings = [{}];
          }
          
          parameters.encodings.forEach((encoding) => {
            encoding.maxBitrate = targetBitrate * 1000; // Convert to bps
          });
          
          try {
            await sender.setParameters(parameters);
            console.log(`✅ Bitrate adjusted for peer ${peerId}`);
          } catch (err) {
            console.error(`❌ Failed to adjust bitrate for peer ${peerId}:`, err);
          }
        }
      }
    }
  }, []);

  // R3.1: Change video resolution dynamically
  const changeVideoResolution = useCallback(async (qualityLevel: QualityLevel) => {
    if (!localStream || qualityLevel === currentQualityLevel) {
      return;
    }

    console.log(`📹 [QUALITY] Changing resolution from ${currentQualityLevel} to ${qualityLevel}`);
    
    try {
      const videoTrack = localStream.getVideoTracks()[0];
      
      if (qualityLevel === 'audio-only') {
        // Disable video entirely
        if (videoTrack) {
          videoTrack.enabled = false;
          console.log('✅ [QUALITY] Video disabled (audio-only mode)');
        }
        setCurrentQualityLevel('audio-only');
        setIsVideoEnabled(false);
        lastQualityChangeRef.current = Date.now(); // Update timestamp for cooldown
        return;
      }
      
      // Resolution constraints for each quality level
      const constraints: Record<Exclude<QualityLevel, 'audio-only'>, MediaTrackConstraints> = {
        '720p': { width: 1280, height: 720 },
        '480p': { width: 854, height: 480 },
        '360p': { width: 640, height: 360 }
      };
      
      if (videoTrack) {
        // Re-enable video track if upgrading from audio-only
        if (!videoTrack.enabled) {
          videoTrack.enabled = true;
          setIsVideoEnabled(true);
          console.log('✅ [QUALITY] Video re-enabled from audio-only mode');
        }
        
        // Apply new constraints to the track
        await videoTrack.applyConstraints(constraints[qualityLevel]);
        console.log(`✅ [QUALITY] Resolution changed to ${qualityLevel}`);
        setCurrentQualityLevel(qualityLevel);
        lastQualityChangeRef.current = Date.now();
      }
    } catch (error) {
      console.error(`❌ [QUALITY] Failed to change resolution to ${qualityLevel}:`, error);
    }
  }, [localStream, currentQualityLevel]);

  // R3.1: Progressive quality degradation
  const degradeQuality = useCallback(async () => {
    const now = Date.now();
    const MIN_QUALITY_CHANGE_INTERVAL = 60000; // 60 seconds between changes to prevent oscillation
    
    // Prevent rapid quality changes (but allow first degradation)
    if (lastQualityChangeRef.current !== 0 && now - lastQualityChangeRef.current < MIN_QUALITY_CHANGE_INTERVAL) {
      console.log('⏱️ [QUALITY] Quality change too soon, skipping...');
      return;
    }
    
    console.log(`⬇️ [QUALITY] Degrading quality from ${currentQualityLevel}`);
    
    // Progressive degradation ladder
    switch (currentQualityLevel) {
      case '720p':
        await changeVideoResolution('480p');
        break;
      case '480p':
        await changeVideoResolution('360p');
        break;
      case '360p':
        // Before going audio-only, also reduce bitrate further
        await adjustBitrate(200); // Floor: 200 kbps
        await changeVideoResolution('audio-only');
        break;
      case 'audio-only':
        console.log('⚠️ [QUALITY] Already at minimum quality (audio-only)');
        break;
    }
  }, [currentQualityLevel, changeVideoResolution, adjustBitrate]);

  // R3.2: Quality recovery when connection improves
  const upgradeQuality = useCallback(async () => {
    const now = Date.now();
    const MIN_STABLE_TIME = 30000; // 30 seconds of good quality before upgrading
    const MIN_QUALITY_CHANGE_INTERVAL = 60000; // 60 seconds between changes to prevent oscillation
    
    // Prevent rapid quality changes (but allow first upgrade)
    if (lastQualityChangeRef.current !== 0 && now - lastQualityChangeRef.current < MIN_QUALITY_CHANGE_INTERVAL) {
      console.log('⏱️ [QUALITY] Quality change too soon, skipping upgrade...');
      return;
    }
    
    // Track stable good quality period
    if (qualityStableTimeRef.current === null) {
      qualityStableTimeRef.current = now;
      console.log('⏱️ [QUALITY] Starting stable quality timer...');
      return;
    }
    
    const stableDuration = now - qualityStableTimeRef.current;
    if (stableDuration < MIN_STABLE_TIME) {
      console.log(`⏱️ [QUALITY] Quality stable for ${stableDuration}ms, need ${MIN_STABLE_TIME}ms`);
      return;
    }
    
    console.log(`⬆️ [QUALITY] Upgrading quality from ${currentQualityLevel}`);
    qualityStableTimeRef.current = null; // Reset timer
    
    // Progressive upgrade ladder
    switch (currentQualityLevel) {
      case 'audio-only':
        await changeVideoResolution('360p');
        await adjustBitrate(500); // Restore to 500 kbps
        break;
      case '360p':
        await changeVideoResolution('480p');
        await adjustBitrate(800); // Medium bitrate
        break;
      case '480p':
        await changeVideoResolution('720p');
        await adjustBitrate(1500); // High bitrate
        break;
      case '720p':
        console.log('✅ [QUALITY] Already at maximum quality (720p)');
        break;
    }
  }, [currentQualityLevel, changeVideoResolution, adjustBitrate]);

  // Share screen
  const startScreenShare = useCallback(async () => {
    try {
      console.log('🖥️ Starting screen share...');
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      console.log('✅ Screen capture granted', {
        videoTracks: screenStream.getVideoTracks().length,
        audioTracks: screenStream.getAudioTracks().length
      });
      
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      
      // Store screen stream in ref and update state flag
      screenStreamRef.current = screenStream;
      isSharingScreenRef.current = true;
      
      // Replace ONLY the video track in all existing peer connections
      // Keep audio sender on the microphone track
      let replacedCount = 0;
      peerConnectionsRef.current.forEach((peerConnection, peerId) => {
        const videoSender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (videoSender) {
          console.log(`🔄 Replacing video track with screen for peer ${peerId}`);
          videoSender.replaceTrack(screenVideoTrack).then(() => {
            console.log(`✅ Screen track sent to peer ${peerId}`);
            replacedCount++;
          }).catch(err => {
            console.error(`❌ Failed to replace track for peer ${peerId}:`, err);
          });
        } else {
          console.warn(`⚠️ No video sender found for peer ${peerId}`);
        }
      });
      
      console.log(`📊 Replaced video track in ${replacedCount} peer connections`);
      
      // Update local video element to show screen share
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
        console.log('🎥 Updated local video element with screen share');
      }
      
      // Handle screen share end - restore camera
      screenVideoTrack.onended = () => {
        console.log('🛑 Screen share ended, restoring camera...');
        
        // Clear screen sharing state
        screenStreamRef.current = null;
        isSharingScreenRef.current = false;
        
        // Restore camera video track in all peer connections
        if (cameraStreamRef.current) {
          const cameraVideoTrack = cameraStreamRef.current.getVideoTracks()[0];
          
          if (cameraVideoTrack) {
            peerConnectionsRef.current.forEach((peerConnection, peerId) => {
              const videoSender = peerConnection.getSenders().find(s => 
                s.track && s.track.kind === 'video'
              );
              if (videoSender) {
                videoSender.replaceTrack(cameraVideoTrack).then(() => {
                  console.log(`✅ Restored camera track for peer ${peerId}`);
                });
              }
            });
            
            // Restore local video element to camera
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = cameraStreamRef.current;
            }
          }
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to start screen share:', error);
    }
  }, []);

  // Connect to WebSocket and join session
  const connect = useCallback(async () => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        setError(null); // Clear any previous errors
        console.log('📞 Starting connection process...');
        
        // Check if mediaDevices is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn('⚠️ Camera/microphone not supported in this environment');
          // Continue without media for now (chat-only mode)
        } else {
          // Initialize local stream first with timeout
          console.log('⏱️ Requesting media access with 10s timeout...');
          const streamPromise = initializeLocalStream();
          const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Camera/microphone access timeout')), 10000)
          );
          
          const stream = await Promise.race([streamPromise, timeoutPromise]);
          
          if (!stream) {
            const errorMessage = 'Camera and microphone access denied. Please allow access to join the video session.';
            console.error('❌', errorMessage);
            setError(errorMessage);
            setConnectionQuality('disconnected');
            reject(new Error(errorMessage));
            return;
          }
          
          console.log('✅ Local stream initialized successfully');
        }
        
        // Connect to WebSocket on specific path to avoid Vite HMR conflicts
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/video-signaling`;
        
        console.log('Connecting to WebSocket:', wsUrl);
        const ws = new WebSocket(wsUrl);
        
        // Track if promise is settled to prevent double resolve/reject
        let isSettled = false;
        
        // Set timeout for connection
        const connectionTimeout = setTimeout(() => {
          if (!isSettled && ws.readyState !== WebSocket.OPEN) {
            isSettled = true;
            ws.close();
            const errorMsg = 'WebSocket connection timeout';
            console.error('❌', errorMsg);
            setError(errorMsg);
            setConnectionQuality('disconnected');
            wsRef.current = null;
            reject(new Error(errorMsg));
          }
        }, 10000); // 10 second timeout
        
        ws.onopen = () => {
          console.log('WebSocket connected successfully');
          
          // Authenticate first
          ws.send(JSON.stringify({
            type: 'authenticate',
            userId,
            sessionToken: 'placeholder-token' // In production: use real JWT/session
          }));
        };
        
        ws.onerror = (error: Event) => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(connectionTimeout);
            console.error('WebSocket error event:', error);
            console.error('WebSocket ready state:', ws.readyState);
            const errorMsg = 'WebSocket connection error. Please check your network connection.';
            setConnectionQuality('poor');
            setError(errorMsg);
            wsRef.current = null;
            reject(new Error(errorMsg));
          }
        };
        
        // Store the WebSocket reference
        wsRef.current = ws;
        
        ws.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'authenticated':
              if (!isSettled) {
                isSettled = true;
                clearTimeout(connectionTimeout);
                console.log('Authenticated successfully');
                setIsConnected(true);
                setConnectionQuality('good');
                resolve(); // Resolve the Promise on successful authentication
              }
              
              // CRITICAL FIX: Only join video session if local stream is ready
              // This prevents creating peer connections without tracks
              if (cameraStreamRef.current && wsRef.current) {
                console.log('✅ Local stream ready - joining video session immediately');
                console.log('📊 Stream details:', {
                  videoTracks: cameraStreamRef.current.getVideoTracks().length,
                  audioTracks: cameraStreamRef.current.getAudioTracks().length
                });
                wsRef.current.send(JSON.stringify({
                  type: 'join-video-session',
                  sessionId,
                  isTeacher
                }));
              } else {
                console.warn('⚠️ Local stream not ready yet - will join after initialization completes');
                // Store pending join - will be processed when stream is ready
                (wsRef.current as any).pendingJoin = { sessionId, isTeacher };
              }
              break;
            
          case 'auth-failed':
            if (!isSettled) {
              isSettled = true;
              clearTimeout(connectionTimeout);
              const errorMsg = `Authentication failed: ${data.message}`;
              console.error('❌', errorMsg);
              setError(errorMsg);
              setConnectionQuality('disconnected');
              ws.close();
              wsRef.current = null;
              reject(new Error(errorMsg));
            }
            break;
            
          case 'error':
            console.error('WebSocket error:', data.message);
            setConnectionQuality('poor');
            break;
            
          case 'session-joined':
            console.log('Joined session with participants:', data.participants);
            
            // Create participants map
            const newParticipants = new Map<string, Participant>();
            
            // Add local user to participants first
            newParticipants.set(userId, {
              userId,
              isTeacher,
              stream: localStream || undefined
            });
            
            // Add remote participants
            data.participants.forEach((p: any) => {
              if (p.userId !== userId) {
                newParticipants.set(p.userId, {
                  userId: p.userId,
                  isTeacher: p.isTeacher
                });
              }
            });
            setParticipants(newParticipants);
            
            // Determine politeness and send offers to existing participants  
            setIsPolite(data.participants.length > 0); // First to join is impolite
            
            data.participants.forEach((p: any) => {
              if (p.userId !== userId) {
                sendOffer(p.userId);
              }
            });
            break;
            
          case 'user-joined':
            console.log('New user joined:', data.userId);
            const newParticipant: Participant = {
              userId: data.userId,
              isTeacher: data.isTeacher
            };
            
            setParticipants(prev => {
              const updated = new Map(prev);
              updated.set(data.userId, newParticipant);
              return updated;
            });
            
            onParticipantJoin?.(newParticipant);
            
            // Send offer to new participant
            sendOffer(data.userId);
            break;
            
          case 'user-left':
            console.log('User left:', data.userId);
            
            setParticipants(prev => {
              const updated = new Map(prev);
              updated.delete(data.userId);
              return updated;
            });
            
            // Clean up peer connection
            const peerConnection = peerConnectionsRef.current.get(data.userId);
            if (peerConnection) {
              peerConnection.close();
              peerConnectionsRef.current.delete(data.userId);
            }
            
            onParticipantLeave?.(data.userId);
            break;
            
          case 'webrtc-offer':
            await handleOffer(data.fromUserId, data.offer);
            break;
            
          case 'webrtc-answer':
            await handleAnswer(data.fromUserId, data.answer);
            break;
            
          case 'webrtc-ice-candidate':
            await handleIceCandidate(data.fromUserId, data.candidate);
            break;
            
          case 'session-join-blocked':
            console.error('❌ Session join blocked:', data.reason);
            setError(data.reason || 'Unable to join session: Your account is restricted');
            setConnectionQuality('disconnected');
            // Close the connection
            if (wsRef.current) {
              wsRef.current.close();
              wsRef.current = null;
            }
            break;

          case 'moderation-alert':
            console.warn('🚨 AI Moderation Alert:', data.message);
            onModerationAlert?.(data.message || 'Content policy violation detected', 'critical');
            break;

          case 'moderation-warning':
            console.warn('⚠️ AI Moderation Warning:', data.message);
            onModerationAlert?.(data.message || 'Please ensure content is appropriate', 'moderate');
            break;
        }
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason, 'Clean:', event.wasClean);
        setIsConnected(false);
        setConnectionQuality('disconnected');
        
        // If promise not yet settled, reject it regardless of clean/unclean close
        if (!isSettled) {
          isSettled = true;
          clearTimeout(connectionTimeout);
          const errorMsg = event.wasClean 
            ? 'Connection closed before authentication' 
            : `Connection lost: ${event.reason || 'Unknown error'}`;
          setError(errorMsg);
          wsRef.current = null;
          reject(new Error(errorMsg));
        } else if (!event.wasClean) {
          // If already settled but unclean close, just show error
          setError(`Connection lost: ${event.reason || 'Unknown error'}`);
        }
      };
      
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionQuality('disconnected');
      if (!error || typeof error !== 'object' || !('message' in error)) {
        setError('Failed to connect to video session');
        reject(new Error('Failed to connect to video session'));
      } else {
        reject(error);
      }
      // Error message already set if it's the camera/mic error
    }
    });
  }, [sessionId, userId, isTeacher, initializeLocalStream, sendOffer, handleOffer, handleAnswer, handleIceCandidate, onParticipantJoin, onParticipantLeave]);

  // Disconnect from session
  const disconnect = useCallback(() => {
    // Leave video session
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'leave-video-session',
        sessionId
      }));
    }
    
    // Close all peer connections
    peerConnectionsRef.current.forEach((peerConnection) => {
      peerConnection.close();
    });
    peerConnectionsRef.current.clear();
    
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setParticipants(new Map());
    setConnectionQuality('disconnected');
  }, [sessionId, userId, localStream]);

  // Update local participant's stream when localStream changes
  useEffect(() => {
    if (localStream) {
      console.log('🎬 Updating local participant stream', {
        userId,
        hasStream: !!localStream,
        videoTracks: localStream.getVideoTracks().length,
        audioTracks: localStream.getAudioTracks().length
      });
      
      setParticipants(prev => {
        const updated = new Map(prev);
        const localParticipant = updated.get(userId);
        if (localParticipant) {
          console.log('✅ Found local participant, attaching stream');
          localParticipant.stream = localStream;
          updated.set(userId, localParticipant);
        } else {
          console.log('⚠️ Local participant not found in map, creating new one');
          updated.set(userId, {
            userId,
            isTeacher: false, // Will be updated when session joins
            stream: localStream
          });
        }
        console.log('📋 Current participants:', Array.from(updated.keys()));
        return updated;
      });
    }
  }, [localStream, userId]);

  // Collect WebRTC stats periodically when connected
  useEffect(() => {
    if (!isConnected || peerConnectionsRef.current.size === 0) {
      return;
    }

    console.log('📊 Starting WebRTC stats collection (every 3s)');
    
    // Collect stats immediately
    collectStats();
    
    // Then collect every 3 seconds
    const statsInterval = setInterval(async () => {
      await collectStats();
    }, 3000);

    return () => {
      console.log('🛑 Stopping WebRTC stats collection');
      clearInterval(statsInterval);
    };
  }, [isConnected, collectStats]);

  // R2.3: Auto-repair trigger - Monitor health and initiate repairs
  useEffect(() => {
    if (!isConnected || !healthDetails) {
      // Reset poor quality tracking when disconnected
      poorQualityStartTimeRef.current = null;
      return;
    }

    const now = Date.now();
    const BASE_REPAIR_INTERVAL = 30000; // 30 seconds base interval
    const POOR_QUALITY_THRESHOLD = 10000; // 10 seconds of poor quality before repair
    const MAX_REPAIR_ATTEMPTS = 5; // Max attempts before giving up

    // Implement exponential backoff: 30s, 60s, 120s, 240s, 480s
    const repairInterval = BASE_REPAIR_INTERVAL * Math.pow(2, Math.min(repairAttemptsCountRef.current, MAX_REPAIR_ATTEMPTS - 1));

    // Track when poor/critical quality starts
    if (healthDetails.quality === 'fair' || healthDetails.quality === 'poor' || healthDetails.quality === 'critical') {
      if (poorQualityStartTimeRef.current === null) {
        poorQualityStartTimeRef.current = now;
        console.log(`⚠️ [AUTO-REPAIR] ${healthDetails.quality} quality detected, starting timer... (next repair in ${repairInterval/1000}s)`);
      }
    } else {
      // Quality improved to good/excellent, reset tracking and upgrade quality if stable
      if (poorQualityStartTimeRef.current !== null) {
        console.log('✅ [AUTO-REPAIR] Quality improved, resetting timer and attempt counter');
        poorQualityStartTimeRef.current = null;
        repairAttemptsCountRef.current = 0; // Reset on recovery
      }
      
      // Try to upgrade quality if connection is stable
      if (healthDetails.quality === 'good' || healthDetails.quality === 'excellent') {
        upgradeQuality();
      }
      return;
    }

    // Check if we should trigger repair
    const poorQualityDuration = now - poorQualityStartTimeRef.current;
    const timeSinceLastRepair = now - lastRepairAttemptRef.current;

    if (
      poorQualityDuration >= POOR_QUALITY_THRESHOLD &&
      timeSinceLastRepair >= repairInterval &&
      !isRepairingRef.current &&
      repairAttemptsCountRef.current < MAX_REPAIR_ATTEMPTS
    ) {
      console.log(`🚨 [AUTO-REPAIR] Triggering repair after ${poorQualityDuration}ms of ${healthDetails.quality} quality`);
      
      // Reset timer
      poorQualityStartTimeRef.current = null;

      // Enhanced repair ladder: Quality Degradation → Bitrate → ICE Restart
      if (healthDetails.quality === 'critical') {
        // Critical: ICE restart immediately
        console.log('🔧 [AUTO-REPAIR] Strategy: ICE restart (critical quality)');
        performICERestart();
      } else if (healthDetails.quality === 'poor') {
        // Poor: Degrade quality first, then bitrate
        if (currentQualityLevel !== 'audio-only') {
          console.log('🔧 [AUTO-REPAIR] Strategy: Quality degradation + bitrate reduction');
          degradeQuality();
          adjustBitrate(300); // Aggressive bitrate reduction
        } else {
          console.log('🔧 [AUTO-REPAIR] Strategy: ICE restart (already at minimum quality)');
          performICERestart();
        }
      } else if (healthDetails.quality === 'fair') {
        // Fair: Just degrade quality
        console.log('🔧 [AUTO-REPAIR] Strategy: Quality degradation');
        degradeQuality();
      }
    }
  }, [isConnected, healthDetails, performICERestart, adjustBitrate, degradeQuality, upgradeQuality, currentQualityLevel]);

  // Auto-connect on mount and reconnect when userId changes
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    // Don't connect if userId is still loading or invalid
    if (!userId || userId === 'loading') {
      console.log('⏳ Waiting for valid userId before connecting...');
      return;
    }
    
    const initConnection = async () => {
      while (mounted && retryCount < maxRetries) {
        try {
          console.log(`🔄 Attempt ${retryCount + 1}/${maxRetries} to connect WebRTC...`);
          await connect();
          console.log('✅ WebRTC connected successfully');
          break; // Exit retry loop on success
        } catch (error) {
          retryCount++;
          console.error(`❌ Connection attempt ${retryCount} failed:`, error);
          
          if (retryCount < maxRetries && mounted) {
            const delay = retryCount * 2000; // Exponential backoff
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else if (retryCount >= maxRetries) {
            const errorMsg = 'Failed to establish video connection after 3 attempts. Please refresh the page.';
            console.error('❌ Max retries reached:', errorMsg);
            setError(errorMsg);
            setConnectionQuality('disconnected');
          }
        }
      }
    };
    
    initConnection();
    
    return () => {
      mounted = false;
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Reconnect when userId changes from 'loading' to real ID

  return {
    isConnected,
    participants: Array.from(participants.values()),
    localStream,
    localVideoRef,
    isVideoEnabled,
    isAudioEnabled,
    connectionQuality,
    error,
    healthScore,
    healthDetails,
    currentMetrics,
    currentQualityLevel,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    connect,
    disconnect
  };
}