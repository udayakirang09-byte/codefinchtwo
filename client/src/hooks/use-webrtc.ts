import { useState, useEffect, useRef, useCallback } from "react";

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
}

export function useWebRTC({
  sessionId,
  userId,
  isTeacher,
  onParticipantJoin,
  onParticipantLeave
}: UseWebRTCProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'disconnected'>('disconnected');
  const [isPolite, setIsPolite] = useState(false); // For perfect negotiation
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      // Fallback to audio-only if video fails
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setLocalStream(audioStream);
        return audioStream;
      } catch (audioError) {
        console.error('Failed to get audio stream:', audioError);
        return null;
      }
    }
  }, []);

  // Create peer connection for a participant
  const createPeerConnection = useCallback((targetUserId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection({ iceServers });
    
    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
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
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Share screen
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      
      peerConnectionsRef.current.forEach((peerConnection) => {
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
      
      // Update local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      
      // Handle screen share end
      videoTrack.onended = () => {
        initializeLocalStream();
      };
      
    } catch (error) {
      console.error('Failed to start screen share:', error);
    }
  }, [initializeLocalStream]);

  // Connect to WebSocket and join session
  const connect = useCallback(async () => {
    try {
      setError(null); // Clear any previous errors
      console.log('Starting connection process...');
      
      // Initialize local stream first with timeout
      const streamPromise = initializeLocalStream();
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Camera/microphone access timeout')), 10000)
      );
      
      const stream = await Promise.race([streamPromise, timeoutPromise]);
      
      if (!stream) {
        const errorMessage = 'Camera and microphone access denied. Please allow access to join the video session.';
        setError(errorMessage);
        setConnectionQuality('disconnected');
        throw new Error(errorMessage);
      }
      
      console.log('Local stream initialized successfully');
      
      // Connect to WebSocket on specific path to avoid Vite HMR conflicts
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/video-signaling`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        
        // Authenticate first
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'authenticate',
            userId,
            sessionToken: 'placeholder-token' // In production: use real JWT/session
          }));
        }
      };
      
      wsRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'authenticated':
            console.log('Authenticated successfully');
            setIsConnected(true);
            setConnectionQuality('good');
            
            // Now join video session after authentication
            if (wsRef.current) {
              wsRef.current.send(JSON.stringify({
                type: 'join-video-session',
                sessionId,
                isTeacher
              }));
            }
            break;
            
          case 'auth-failed':
            console.error('Authentication failed:', data.message);
            setConnectionQuality('disconnected');
            break;
            
          case 'error':
            console.error('WebSocket error:', data.message);
            setConnectionQuality('poor');
            break;
            
          case 'session-joined':
            console.log('Joined session with participants:', data.participants);
            
            // Create participants map
            const newParticipants = new Map<string, Participant>();
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
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason, 'Clean:', event.wasClean);
        setIsConnected(false);
        setConnectionQuality('disconnected');
        
        // Show error if connection closed unexpectedly
        if (!event.wasClean) {
          setError(`Connection lost: ${event.reason || 'Unknown error'}`);
        }
      };
      
      wsRef.current.onerror = (error: Event) => {
        console.error('WebSocket error event:', error);
        console.error('WebSocket ready state:', wsRef.current?.readyState);
        setConnectionQuality('poor');
        setError('WebSocket connection error. Please check your network connection.');
      };
      
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionQuality('disconnected');
      if (!error || typeof error !== 'object' || !('message' in error)) {
        setError('Failed to connect to video session');
      }
      // Error message already set if it's the camera/mic error
    }
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

  // Auto-connect on mount (only once)
  useEffect(() => {
    let mounted = true;
    
    if (mounted) {
      connect();
    }
    
    return () => {
      mounted = false;
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  return {
    isConnected,
    participants: Array.from(participants.values()),
    localStream,
    localVideoRef,
    isVideoEnabled,
    isAudioEnabled,
    connectionQuality,
    error,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    connect,
    disconnect
  };
}