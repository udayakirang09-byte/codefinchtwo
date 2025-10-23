import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWebRTC } from "@/hooks/use-webrtc";
import { useRecording } from "@/hooks/use-recording";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Video, VideoOff, Mic, MicOff, Users, MessageCircle, Phone, Settings, AlertTriangle, Wifi, WifiOff, Shield, Monitor, Home, ArrowLeft, Maximize, Minimize, Send, X, Hand } from "lucide-react";
import { evaluateBitrateQuality } from "@shared/webrtc-health";

export default function VideoClass() {
  const [, params] = useRoute("/video-class/:id");
  const [, setLocation] = useLocation();
  
  if (!params) {
    return <div>Invalid class ID</div>;
  }
  
  const classId = (params as { id: string }).id;
  
  const [teacherAlerts, setTeacherAlerts] = useState<string[]>([]);
  const [multipleLoginUsers, setMultipleLoginUsers] = useState<Array<{userId: string, sessionCount: number, user: any}>>([]);
  const [lastAlertedUsers, setLastAlertedUsers] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isHandRaised, setIsHandRaised] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Ref for moderation alert callback to avoid closure issues
  const moderationAlertRef = useRef<((message: string, severity?: 'moderate' | 'critical') => void) | null>(null);
  
  // R2.4: Jitter tracking - track last warning time to avoid spam
  const lastJitterWarningRef = useRef<number>(0);
  
  // R2.6: Bitrate tracking - track last warning time to avoid spam
  const lastBitrateWarningRef = useRef<number>(0);
  
  // Query to get booking/class schedule information
  const { data: bookingData } = useQuery<any>({
    queryKey: ['/api/bookings', classId],
    enabled: Boolean(classId),
  });

  // Query to get course enrollments if this is a course class
  const { data: courseEnrollments } = useQuery<any[]>({
    queryKey: ['/api/courses', bookingData?.courseId, 'enrollments'],
    enabled: Boolean(bookingData?.courseId),
  });
  
  // Determine teacher role based on booking data
  const isTeacher = useMemo(() => {
    if (!bookingData || !user?.id) return false;
    // Check if current user's ID matches the mentor's user ID
    return bookingData.mentor?.user?.id === user.id;
  }, [bookingData, user?.id]);
  
  // WebRTC hook for real video functionality
  // Only pass real userId after auth loads to prevent duplicate participants
  const {
    isConnected,
    participants,
    localStream,
    localVideoRef,
    isVideoEnabled,
    isAudioEnabled, 
    connectionQuality,
    detectedConnectionType,
    isRecoveringConnection,
    error,
    healthScore,
    healthDetails,
    currentMetrics,
    currentQualityLevel,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    disconnect
  } = useWebRTC({
    sessionId: classId || 'default',
    userId: (!isLoading && user?.id) ? user.id : 'loading', // Wait for auth before using real ID
    isTeacher,
    onParticipantJoin: (participant) => {
      if (isTeacher) {
        addTeacherAlert(`${participant.isTeacher ? 'Teacher' : 'Student'} joined the session`);
      }
    },
    onParticipantLeave: (userId) => {
      if (isTeacher) {
        addTeacherAlert(`Participant ${userId} left the session`);
      }
    },
    onModerationAlert: (message, severity) => {
      if (isTeacher && moderationAlertRef.current) {
        // GL-1: Auto-expand guidelines panel on moderation alerts (both moderate and critical)
        moderationAlertRef.current(message, severity);
      }
    }
  });

  // Recording hook - only for teacher
  const recording = useRecording({
    sessionId: classId || 'default',
    userId: user?.id || 'unknown',
    role: isTeacher ? 'teacher' : 'student',
    onError: (error) => {
      console.error('Recording error:', error);
      toast({
        title: "Recording Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onChunkUploaded: (partNumber) => {
      console.log(`✅ Recording chunk ${partNumber} uploaded successfully`);
    },
    onRecordingComplete: () => {
      console.log('✅ Recording completed');
      toast({
        title: "Recording Saved",
        description: "The session recording has been saved successfully",
      });
    },
  });

  // Validate participant access - placed after useWebRTC to access participants
  const participantAccessError = useMemo(() => {
    if (!bookingData || !user?.id) return null;

    const teacherId = bookingData.mentor?.user?.id;
    
    // If user is the teacher, always allow
    if (user.id === teacherId) return null;

    // For single class (no courseId): Only the specific student can join
    if (!bookingData.courseId) {
      const studentUserId = bookingData.student?.user?.id;
      if (user.id !== studentUserId) {
        return "You are not enrolled in this class. Only the enrolled student and teacher can join.";
      }
      return null;
    }

    // For course class: Check if user is enrolled in the course
    if (bookingData.courseId && courseEnrollments) {
      const isEnrolled = courseEnrollments.some(
        enrollment => enrollment.student?.user?.id === user.id
      );
      
      if (!isEnrolled) {
        return "You are not enrolled in this course. Only enrolled students and the teacher can join.";
      }
      
      // Check participant limit for courses (max 5: 1 teacher + 4 students)
      // Count only other participants (excluding current user)
      const otherParticipants = participants.filter(p => p.userId !== user.id);
      if (otherParticipants.length >= 5) {
        return "This session has reached the maximum participant limit (5 participants).";
      }
      
      return null;
    }

    return null;
  }, [bookingData, user?.id, courseEnrollments, participants]);

  // Query to check for multiple login users
  const { data: multipleLogins, refetch: refetchMultipleLogins } = useQuery({
    queryKey: ['/api/sessions/multiple-logins'],
    enabled: isAuthenticated && Boolean(user),
    refetchInterval: 30000, // Check every 30 seconds during video session
  });

  // Fetch chat messages (always enabled to detect new messages)
  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ['/api/bookings', classId, 'messages'],
    enabled: Boolean(classId),
    refetchInterval: 3000, // Poll every 3 seconds to detect new messages
  });
  
  // Track previous message count to detect new messages and initial load state
  const prevMessagesLengthRef = useRef(messages.length);
  const isInitialLoadRef = useRef(true);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      return apiRequest('POST', `/api/bookings/${classId}/messages`, {
        senderId: user?.id,
        senderName: user?.email?.split('@')[0] || user?.id || 'User',
        message: messageText
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', classId, 'messages'] });
      setNewMessage("");
    }
  });
  
  // Derive class info from bookingData
  const classInfo = useMemo(() => {
    if (!bookingData) {
      return {
        subject: "Loading...",
        mentor: "Loading...",
        duration: 60,
        startTime: new Date(),
        isTeacher
      };
    }
    
    const mentorName = bookingData.mentor?.user 
      ? `${bookingData.mentor.user.firstName} ${bookingData.mentor.user.lastName}`
      : "Unknown Mentor";
    
    return {
      subject: bookingData.subject || "Class",
      mentor: mentorName,
      duration: bookingData.duration || 60,
      startTime: bookingData.scheduledAt ? new Date(bookingData.scheduledAt) : new Date(),
      isTeacher
    };
  }, [bookingData, isTeacher]);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [showEndWarning, setShowEndWarning] = useState(false);

  // GL-1: In-class guidelines panel state
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [guidelinesAutoExpanded, setGuidelinesAutoExpanded] = useState(false);

  // GL-2: Teacher review notification banner (once per day)
  const [showReviewNotification, setShowReviewNotification] = useState(false);

  // Check if review notification should be shown (once per day)
  useEffect(() => {
    if (!isTeacher) return;
    
    const lastShownDate = localStorage.getItem('teacherReviewNotificationLastShown');
    const today = new Date().toDateString();
    
    if (lastShownDate !== today) {
      setShowReviewNotification(true);
    }
  }, [isTeacher]);

  // Dismiss review notification
  const dismissReviewNotification = useCallback(() => {
    const today = new Date().toDateString();
    localStorage.setItem('teacherReviewNotificationLastShown', today);
    setShowReviewNotification(false);
  }, []);

  // Teacher alert system
  const addTeacherAlert = useCallback((message: string, moderationSeverity?: 'moderate' | 'critical') => {
    if (isTeacher) {
      setTeacherAlerts(prev => [...prev, message]);
      toast({
        title: "Teacher Alert",
        description: message,
        variant: moderationSeverity === 'critical' ? "destructive" : "default",
      });
      
      // GL-1: Auto-expand guidelines panel on all moderation alerts (both moderate and critical)
      if (moderationSeverity) {
        setShowGuidelines(true);
        setGuidelinesAutoExpanded(true);
      }
      
      // Auto-remove alert after 10 seconds
      setTimeout(() => {
        setTeacherAlerts(prev => prev.filter(alert => alert !== message));
      }, 10000);
    }
  }, [isTeacher, toast]);

  // Update moderation alert ref when addTeacherAlert changes
  useEffect(() => {
    moderationAlertRef.current = addTeacherAlert;
  }, [addTeacherAlert]);

  // Multiple login detection effect with deduplication
  useEffect(() => {
    if (multipleLogins && Array.isArray(multipleLogins) && multipleLogins.length > 0) {
      const currentUsers = multipleLogins.filter(login => login.sessionCount > 1);
      
      if (currentUsers.length > 0) {
        setMultipleLoginUsers(currentUsers);
        
        if (isTeacher) {
          // Only alert for new users or users with increased session count
          currentUsers.forEach(userLogin => {
            const alertKey = `${userLogin.userId}-${userLogin.sessionCount}`;
            
            if (!lastAlertedUsers.has(alertKey)) {
              const alertMessage = `Security Alert: User ${userLogin.user.firstName} ${userLogin.user.lastName} (${userLogin.user.email}) has ${userLogin.sessionCount} active sessions`;
              addTeacherAlert(alertMessage);
              
              // Update alerted users set
              setLastAlertedUsers(prev => {
                const newSet = new Set(prev);
                newSet.add(alertKey);
                return newSet;
              });
            }
          });
        }
      } else {
        setMultipleLoginUsers([]);
        setLastAlertedUsers(new Set()); // Clear when no multiple logins
      }
    }
  }, [multipleLogins, isTeacher, addTeacherAlert, lastAlertedUsers]);

  // Initialize teacher alert when connected
  useEffect(() => {
    if (isConnected && isTeacher) {
      addTeacherAlert("Video session started successfully. You are the host.");
    }
  }, [isConnected, isTeacher, addTeacherAlert]);
  
  // R2.4: Monitor jitter and alert on high audio quality degradation (>50ms)
  useEffect(() => {
    if (!currentMetrics || !isConnected) return;
    
    const jitter = currentMetrics.jitter;
    const now = Date.now();
    const MIN_WARNING_INTERVAL = 60000; // Only warn once per minute
    
    // Alert when jitter exceeds 50ms (audio quality degradation threshold)
    if (jitter > 50 && now - lastJitterWarningRef.current > MIN_WARNING_INTERVAL) {
      toast({
        title: "Audio Quality Warning",
        description: `High jitter detected (${Math.round(jitter)}ms). Audio may be choppy or distorted. Target is <20ms for optimal quality.`,
        variant: "default",
      });
      lastJitterWarningRef.current = now;
    }
  }, [currentMetrics, isConnected, toast]);
  
  // R2.6: Monitor bitrate and alert on low bandwidth (critical or low quality)
  useEffect(() => {
    if (!currentMetrics || !isConnected) return;
    if (currentMetrics.videoBitrate === undefined || currentMetrics.videoBitrate === 0) return;
    
    const videoBitrate = currentMetrics.videoBitrate;
    const audioBitrate = currentMetrics.audioBitrate || 0;
    const now = Date.now();
    const MIN_WARNING_INTERVAL = 60000; // Only warn once per minute
    
    // Evaluate bitrate quality and alert if low or critical
    const bitrateQuality = evaluateBitrateQuality(videoBitrate, audioBitrate);
    
    if (bitrateQuality.shouldAlert && now - lastBitrateWarningRef.current > MIN_WARNING_INTERVAL) {
      toast({
        title: bitrateQuality.quality === 'critical' ? "Critical Bitrate Warning" : "Low Bitrate Warning",
        description: bitrateQuality.message,
        variant: bitrateQuality.quality === 'critical' ? "destructive" : "default",
      });
      lastBitrateWarningRef.current = now;
    }
  }, [currentMetrics, isConnected, toast]);
  
  // Auto-recording timer: Start recording 1 minute after class scheduled time
  useEffect(() => {
    if (!bookingData || !isConnected) {
      console.log('🎬 Recording timer - waiting for conditions:', {
        hasBookingData: !!bookingData,
        isConnected,
        participantCount: participants.length
      });
      return;
    }
    
    const booking = bookingData as any; // Type assertion for booking data
    const scheduledTime = new Date(booking.scheduledAt);
    const recordingStartTime = new Date(scheduledTime.getTime() + 60000); // +1 minute
    const now = new Date();
    const timeUntilRecording = recordingStartTime.getTime() - now.getTime();
    
    console.log('🎬 Recording timer check:', {
      scheduledTime: scheduledTime.toISOString(),
      recordingStartTime: recordingStartTime.toISOString(),
      currentTime: now.toISOString(),
      timeUntilRecording,
      isRecording,
      willStartIn: timeUntilRecording > 0 ? `${Math.round(timeUntilRecording / 1000)}s` : 'now'
    });
    
    if (timeUntilRecording > 0) {
      console.log(`⏱️ Recording will start in ${Math.round(timeUntilRecording / 1000)} seconds`);
      const recordingTimer = setTimeout(() => {
        console.log('🔴 STARTING RECORDING NOW');
        setIsRecording(true);
        toast({
          title: "Recording Started",
          description: "This session is now being recorded",
          variant: "default",
        });
      }, timeUntilRecording);
      
      return () => clearTimeout(recordingTimer);
    } else if (!isRecording) {
      // If we're past the recording time and not already recording, start immediately
      console.log('🔴 Recording time passed - starting immediately');
      setIsRecording(true);
      toast({
        title: "Recording Started",
        description: "This session is now being recorded",
        variant: "default",
      });
    }
  }, [bookingData, isConnected, isRecording, toast]);

  // Actually start/stop MediaRecorder when isRecording changes
  useEffect(() => {
    // Only teacher should record
    if (!isTeacher) return;
    
    if (isRecording && localStream && !recording.isRecording) {
      // Get remote streams from participants
      const remoteStreams = participants
        .map(p => p.stream)
        .filter((stream): stream is MediaStream => stream !== undefined);
      
      console.log(`🎬 Starting MediaRecorder with ${remoteStreams.length} remote streams`);
      recording.startRecording(localStream, remoteStreams);
    } else if (!isRecording && recording.isRecording) {
      console.log('🛑 Stopping MediaRecorder');
      recording.stopRecording();
    }
  }, [isRecording, isTeacher, localStream, participants, recording]);
  
  // Session auto-close system: Warning and disconnect after class time
  useEffect(() => {
    if (!bookingData || !isConnected) return;
    
    const booking = bookingData as any; // Type assertion for booking data
    const scheduledTime = new Date(booking.scheduledAt);
    const classEndTime = new Date(scheduledTime.getTime() + booking.duration * 60000);
    const disconnectTime = new Date(classEndTime.getTime() + 4 * 60000); // +4 minutes
    const now = new Date();
    
    const timeUntilEnd = classEndTime.getTime() - now.getTime();
    const timeUntilDisconnect = disconnectTime.getTime() - now.getTime();
    
    console.log('⏰ Session timer check:', {
      classEndTime: classEndTime.toISOString(),
      disconnectTime: disconnectTime.toISOString(),
      currentTime: now.toISOString(),
      timeUntilEnd,
      timeUntilDisconnect,
      shouldShowWarning: timeUntilEnd <= 0 && timeUntilDisconnect > 0
    });
    
    // If class has ended but not yet time to disconnect - show persistent warning
    if (timeUntilEnd <= 0 && timeUntilDisconnect > 0) {
      console.log('🚨 Class ended - showing persistent warning');
      setShowEndWarning(true);
      
      // Auto-disconnect after remaining time
      const disconnectTimer = setTimeout(() => {
        console.log('⏰ Auto-disconnecting after 4 minutes');
        toast({
          title: "Session Ended",
          description: "Class time has completed. Disconnecting...",
          variant: "destructive",
        });
        disconnect();
        setLocation('/');
      }, timeUntilDisconnect);
      
      return () => {
        clearTimeout(disconnectTimer);
        setShowEndWarning(false);
      };
    }
    
    // If class hasn't ended yet, schedule the warning
    if (timeUntilEnd > 0) {
      const warningTimer = setTimeout(() => {
        console.log('🚨 Class time reached - showing warning');
        setShowEndWarning(true);
      }, timeUntilEnd);
      
      return () => clearTimeout(warningTimer);
    }
  }, [bookingData, isConnected, disconnect, setLocation, toast]);

  const handleEndCall = () => {
    console.log(`📞 Ending video class ${classId}`);
    disconnect();
    // Navigate to student home page
    setLocation('/');
  };

  const toggleHandRaise = () => {
    const newHandRaisedState = !isHandRaised;
    setIsHandRaised(newHandRaisedState);
    
    if (newHandRaisedState) {
      toast({
        title: "Hand Raised",
        description: "The teacher has been notified",
        variant: "default",
      });
      
      // TODO: Send hand raise notification via WebSocket to teacher
      // For now, we'll use the chat system to notify
      if (!isTeacher) {
        sendMessageMutation.mutate(`🖐️ ${user?.email?.split('@')[0] || 'Student'} raised their hand`);
      }
    } else {
      toast({
        title: "Hand Lowered",
        description: "Hand has been lowered",
        variant: "default",
      });
    }
  };

  const handleOpenChat = () => {
    setShowChat(!showChat);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showChat]);

  // Auto-open chat when receiving new messages from other participants
  useEffect(() => {
    // Skip the initial load when messages are first populated from history
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevMessagesLengthRef.current = messages.length;
      return;
    }
    
    // Detect new messages by comparing with previous count
    if (messages.length > prevMessagesLengthRef.current && messages.length > 0) {
      // Get the latest message
      const latestMessage = messages[messages.length - 1];
      
      // Check if the message is from another participant (not current user)
      if (latestMessage.senderId !== user?.id && !showChat) {
        setShowChat(true);
        toast({
          title: "New Message",
          description: `${latestMessage.senderName}: ${latestMessage.message.substring(0, 50)}${latestMessage.message.length > 50 ? '...' : ''}`,
          variant: "default",
        });
      }
    }
    
    // Update the previous message count
    prevMessagesLengthRef.current = messages.length;
  }, [messages, user?.id, showChat, toast]);

  const toggleFullscreen = () => {
    const videoContainer = document.querySelector('.video-container');
    
    if (!document.fullscreenElement) {
      videoContainer?.requestFullscreen().then(() => {
        setIsFullscreen(true);
        toast({
          title: "Fullscreen Mode",
          description: "Press ESC to exit fullscreen",
        });
      }).catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Participant grid component for multiple video streams
  const ParticipantGrid = () => {
    if (participants.length === 0) {
      return (
        <div className="text-center text-gray-400">
          <Users className="h-16 w-16 mx-auto mb-4" />
          <p>Waiting for participants to join...</p>
        </div>
      );
    }

    // Dynamic grid layout for unlimited participants
    const gridCols = participants.length <= 4 ? 'grid-cols-2' : 
                     participants.length <= 9 ? 'grid-cols-3' : 'grid-cols-4';
    
    return (
      <div className={`grid ${gridCols} gap-2 h-full overflow-auto`}>
        {participants.map((participant) => (
          <div key={participant.userId} className="bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center relative">
            {participant.stream ? (
              <video
                autoPlay
                playsInline
                muted={false}
                className="w-full h-full object-cover rounded-lg"
                ref={(el) => {
                  if (el && participant.stream) {
                    el.srcObject = participant.stream;
                  }
                }}
              />
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <span className="text-sm font-bold text-white">
                    {participant.userId.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-300">{participant.userId}</p>
              </div>
            )}
            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
              {participant.isTeacher ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Show loading screen while auth is loading
  if (isLoading || !user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading video session...</p>
        </div>
      </div>
    );
  }

  // Show error if participant access is denied
  if (participantAccessError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="max-w-md mx-4">
          <Card className="bg-gradient-to-br from-red-900 to-red-800 border-red-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-100 mb-4">{participantAccessError}</p>
              <Button 
                onClick={() => setLocation('/')} 
                className="w-full bg-white text-red-900 hover:bg-gray-100"
                data-testid="button-back-home"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh min-h-[600px] flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
      {/* Class End Warning Banner - Non-blocking */}
      {showEndWarning && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 shadow-lg border-b-2 border-yellow-400">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-900 animate-pulse" />
            <div className="text-center">
              <h3 className="text-lg font-bold text-yellow-900">Class Time Completed</h3>
              <p className="text-yellow-800 text-sm">Session will close in 4 minutes - Please wrap up your discussion</p>
            </div>
          </div>
        </div>
      )}

      {/* GL-2: Teacher Review Notification Banner (Once per day) */}
      {isTeacher && showReviewNotification && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-500 to-blue-600 p-3 shadow-lg border-b-2 border-blue-400">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Shield className="h-5 w-5 text-blue-900 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-blue-900">Content Guidelines Reminder</h3>
                <p className="text-blue-800 text-xs">Please review our session content guidelines to ensure a safe learning environment</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowGuidelines(true)}
                className="bg-white/90 hover:bg-white text-blue-900 border-blue-300 text-xs"
                data-testid="button-view-guidelines"
              >
                View Guidelines
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={dismissReviewNotification}
                className="text-blue-900 hover:bg-blue-400/20 h-8 w-8 p-0"
                data-testid="button-dismiss-review-notification"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Connecting Overlay */}
      {!isConnected && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-black z-50 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            {error ? (
              <>
                <AlertTriangle className="h-24 w-24 text-yellow-400 mb-6 mx-auto" />
                <h2 className="text-2xl font-bold text-white mb-4">Unable to Connect</h2>
                <p className="text-blue-200 mb-6">{error}</p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="default"
                    data-testid="button-retry"
                  >
                    Retry
                  </Button>
                  <Button 
                    onClick={() => setLocation('/')} 
                    variant="outline"
                    className="text-white border-white hover:bg-white/10"
                    data-testid="button-back-home"
                  >
                    Go Home
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-6 mx-auto"></div>
                <h2 className="text-2xl font-bold text-white mb-2">Connecting to Class...</h2>
                <p className="text-blue-200 mb-6">
                  Please wait while we connect you to {classInfo.subject}
                </p>
                <Button 
                  onClick={() => {
                    disconnect();
                    setLocation('/');
                  }} 
                  variant="outline"
                  className="text-white border-white hover:bg-white/10"
                  data-testid="button-cancel-connect"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-gray-700 p-2 md:p-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/')}
              className="!bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white/50"
              data-testid="button-home"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="!bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white/50"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="ml-4">
              <h1 className="text-xl font-bold text-white">{classInfo.subject}</h1>
              <p className="text-gray-300">with {classInfo.mentor}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-green-600">
              <Users className="h-3 w-3 mr-1" />
              {participants.length} participants
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-white border-gray-600 ${
                connectionQuality === 'good' ? 'bg-green-600/20 border-green-600' :
                connectionQuality === 'poor' ? 'bg-yellow-600/20 border-yellow-600' :
                'bg-red-600/20 border-red-600'
              }`}
            >
              {connectionQuality === 'good' ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {connectionQuality === 'good' ? 'Connected' : 
               connectionQuality === 'poor' ? 'Poor Connection' : 'Disconnected'}
            </Badge>
            <Badge variant="outline" className="text-white border-gray-600">
              {new Date().toLocaleTimeString()}
            </Badge>
            {isTeacher && (
              <Badge className="bg-purple-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Teacher
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 p-2 md:p-4 overflow-auto min-h-0">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
            {/* Main Video Area */}
            <div className="lg:col-span-3">
              <Card className="h-full bg-gray-900 border-gray-700 video-container">
                <CardContent className="p-0 h-full relative">
                  <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {/* Top Right Controls */}
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                      {/* Recording Indicator */}
                      {isRecording && isConnected && (
                        <div className="flex items-center gap-3 bg-black/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-red-500/30 shadow-lg shadow-red-500/20">
                          <div className="relative">
                            <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white font-medium text-sm">
                              {recording.isRecording ? 'Recording' : 'Preparing...'}
                            </span>
                            {recording.partNumber > 0 && (
                              <span className="text-gray-400 text-xs">
                                Chunk {recording.partNumber} • {(recording.totalSize / 1024 / 1024).toFixed(1)} MB
                              </span>
                            )}
                            {recording.error && (
                              <span className="text-red-400 text-xs">
                                {recording.error}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Maximize Button */}
                      <Button
                        onClick={toggleFullscreen}
                        variant="outline"
                        size="icon"
                        className="!bg-black/80 backdrop-blur-sm border-gray-600 hover:bg-gray-700 text-white"
                        data-testid="button-maximize-video"
                      >
                        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                      </Button>
                    </div>
                    
                    {/* Main Video Display Logic: Prioritize Remote Participants */}
                    {(() => {
                      // Get remote participants (not current user)
                      const remoteParticipants = participants.filter(p => p.userId !== user?.id);
                      
                      // Show remote participant video at full size if available
                      if (remoteParticipants.length > 0 && remoteParticipants[0].stream) {
                        return (
                          <>
                            {/* Remote Participant Video - Full Size */}
                            <video
                              autoPlay
                              playsInline
                              muted={false}
                              className="w-full h-full object-cover rounded-lg"
                              ref={(el) => {
                                if (el && remoteParticipants[0].stream) {
                                  el.srcObject = remoteParticipants[0].stream;
                                }
                              }}
                            />
                            <div className="absolute top-4 left-4 bg-black/70 text-white text-sm px-2 py-1 rounded z-10">
                              {remoteParticipants[0].isTeacher ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                            </div>
                            
                            {/* Local Video - Picture in Picture */}
                            {localStream && isVideoEnabled && (
                              <div className="absolute bottom-4 right-4 w-56 h-40 bg-gray-900 rounded-lg border-2 border-gray-600 overflow-hidden shadow-2xl z-10">
                                <video
                                  ref={(el) => {
                                    if (el && localStream) {
                                      el.srcObject = localStream;
                                    }
                                    if (localVideoRef) {
                                      (localVideoRef as any).current = el;
                                    }
                                  }}
                                  autoPlay
                                  playsInline
                                  muted
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                                  You ({isTeacher ? 'Teacher' : 'Student'})
                                </div>
                              </div>
                            )}
                            
                            {/* Additional remote participants overlay (if more than 1) */}
                            {remoteParticipants.length > 1 && (
                              <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg z-10">
                                +{remoteParticipants.length - 1} more participant(s)
                              </div>
                            )}
                          </>
                        );
                      }
                      
                      // Fallback: Show local video if no remote participants yet
                      if (localStream && isVideoEnabled) {
                        return (
                          <>
                            <video
                              ref={(el) => {
                                if (el && localStream) {
                                  el.srcObject = localStream;
                                }
                                if (localVideoRef) {
                                  (localVideoRef as any).current = el;
                                }
                              }}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute top-4 left-4 bg-black/70 text-white text-sm px-2 py-1 rounded z-10">
                              You ({isTeacher ? 'Teacher' : 'Student'}) - Waiting for others...
                            </div>
                          </>
                        );
                      }
                      
                      // No video available
                      return (
                        <div className="text-center">
                          <VideoOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-400">
                            {localStream ? 'Video is turned off' : 'Camera not available'}
                          </p>
                          <p className="text-gray-500 text-sm mt-2">Waiting for participants...</p>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Security Alerts for Multiple Logins */}
              {isTeacher && multipleLoginUsers.length > 0 && (
                <Card className="bg-red-800 border-red-700" data-testid="card-security-alert">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm flex items-center" data-testid="title-security-alert">
                      <Shield className="h-4 w-4 mr-2" />
                      Security Alert - Multiple Logins
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2" data-testid="content-security-alert">
                    {multipleLoginUsers.map((userLogin, index) => (
                      <div key={index} className="text-sm text-red-100 p-2 bg-red-900/50 rounded" data-testid={`alert-user-${userLogin.userId}`}>
                        <div className="font-semibold" data-testid={`text-user-name-${userLogin.userId}`}>{userLogin.user.firstName} {userLogin.user.lastName}</div>
                        <div className="text-xs text-red-200" data-testid={`text-user-email-${userLogin.userId}`}>{userLogin.user.email}</div>
                        <div className="text-xs text-red-300" data-testid={`text-session-count-${userLogin.userId}`}>{userLogin.sessionCount} active sessions</div>
                      </div>
                    ))}
                    <div className="text-xs text-red-200 mt-2 p-2 bg-red-900/30 rounded" data-testid="text-security-warning">
                      ⚠️ Students with multiple active sessions may be sharing accounts or using multiple devices
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Teacher Alerts */}
              {isTeacher && teacherAlerts.length > 0 && (
                <Card className="bg-purple-800 border-purple-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Teacher Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {teacherAlerts.slice(-3).map((alert, index) => (
                      <div key={index} className="text-sm text-purple-100 p-2 bg-purple-900/50 rounded">
                        {alert}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* GL-1: In-Class Guidelines Panel (Auto-expands on moderation alerts) */}
              {isTeacher && (showGuidelines || guidelinesAutoExpanded) && (
                <Card className={`border-2 ${guidelinesAutoExpanded ? 'bg-gradient-to-br from-orange-800 to-red-800 border-red-600 animate-pulse' : 'bg-gradient-to-br from-blue-800 to-indigo-800 border-blue-600'}`} data-testid="card-guidelines-panel">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-sm flex items-center" data-testid="title-guidelines-panel">
                        <Shield className="h-4 w-4 mr-2" />
                        Content Guidelines
                        {guidelinesAutoExpanded && (
                          <Badge className="ml-2 bg-red-500 text-white animate-bounce" data-testid="badge-alert">
                            Alert
                          </Badge>
                        )}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowGuidelines(false);
                          setGuidelinesAutoExpanded(false);
                        }}
                        className="text-white hover:bg-white/10 h-6 w-6 p-0"
                        data-testid="button-close-guidelines"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3" data-testid="content-guidelines">
                    <div className="text-xs text-white bg-white/10 p-3 rounded" data-testid="text-guidelines-intro">
                      <p className="font-semibold mb-2">🎓 Educational Session Guidelines</p>
                      <p className="mb-2">Maintain a safe and productive learning environment by following these guidelines:</p>
                    </div>
                    
                    <div className="space-y-2 text-xs text-white" data-testid="list-guidelines">
                      <div className="bg-white/10 p-2 rounded" data-testid="guideline-appropriate-content">
                        <p className="font-semibold">✅ Appropriate Content</p>
                        <p className="text-white/90">Focus on educational material relevant to the subject</p>
                      </div>
                      <div className="bg-white/10 p-2 rounded" data-testid="guideline-professional-language">
                        <p className="font-semibold">✅ Professional Language</p>
                        <p className="text-white/90">Use respectful and professional communication</p>
                      </div>
                      <div className="bg-white/10 p-2 rounded" data-testid="guideline-safe-environment">
                        <p className="font-semibold">✅ Safe Environment</p>
                        <p className="text-white/90">Ensure content is age-appropriate and educational</p>
                      </div>
                      <div className="bg-red-900/30 p-2 rounded border border-red-500/30" data-testid="guideline-prohibited">
                        <p className="font-semibold text-red-200">❌ Prohibited</p>
                        <p className="text-red-100">Inappropriate, violent, or harmful content</p>
                      </div>
                    </div>

                    {guidelinesAutoExpanded && (
                      <div className="text-xs text-red-100 bg-red-900/50 p-3 rounded border border-red-500" data-testid="text-moderation-alert">
                        <p className="font-semibold mb-1">⚠️ Moderation Alert Triggered</p>
                        <p>Content monitoring has flagged potential concerns. Please review these guidelines and ensure your session content is appropriate.</p>
                      </div>
                    )}

                    <div className="text-xs text-white/70 bg-white/5 p-2 rounded" data-testid="text-monitoring-notice">
                      <p>💡 All sessions are monitored by AI to ensure safety and quality.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Connection Status */}
              {(!isConnected || connectionQuality === 'poor') && (
                <Card className="bg-yellow-800 border-yellow-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm flex items-center">
                      <WifiOff className="h-4 w-4 mr-2" />
                      Connection Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-yellow-100 text-sm mb-3">
                      {!isConnected ? 'Attempting to connect...' : 'Connection unstable'}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Participants List */}
              <Card className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border-slate-700/50 shadow-xl backdrop-blur">
                <CardHeader className="pb-3 border-b border-slate-700/50">
                  <CardTitle className="text-white text-base font-semibold flex items-center">
                    <Users className="h-4 w-4 mr-2 text-blue-400" />
                    Participants ({participants.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <div className="text-sm text-gray-200 flex items-center p-2.5 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full mr-3 animate-pulse shadow-lg shadow-green-500/50"></div>
                    <span className="font-medium">You ({isTeacher ? 'Teacher' : 'Student'})</span>
                  </div>
                  {participants.filter(p => p.userId !== user?.id).map((participant) => (
                    <div key={participant.userId} className="text-sm text-gray-300 flex items-center p-2.5 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-3 shadow-md shadow-blue-500/50"></div>
                      <span>{participant.userId} ({participant.isTeacher ? 'Teacher' : 'Student'})</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Class Info */}
              <Card className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border-slate-700/50 shadow-xl backdrop-blur">
                <CardHeader className="pb-3 border-b border-slate-700/50">
                  <CardTitle className="text-white text-base font-semibold flex items-center">
                    <Video className="h-4 w-4 mr-2 text-purple-400" />
                    Class Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm pt-4">
                  <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-700/30">
                    <div className="text-purple-400 mt-0.5">📚</div>
                    <div className="flex-1">
                      <div className="text-gray-400 text-xs">Subject</div>
                      <div className="text-gray-200 font-medium">{classInfo.subject}</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-700/30">
                    <div className="text-blue-400 mt-0.5">⏱️</div>
                    <div className="flex-1">
                      <div className="text-gray-400 text-xs">Duration</div>
                      <div className="text-gray-200 font-medium">{classInfo.duration} minutes</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-700/30">
                    <div className="text-green-400 mt-0.5">🕐</div>
                    <div className="flex-1">
                      <div className="text-gray-400 text-xs">Started</div>
                      <div className="text-gray-200 font-medium">{classInfo.startTime.toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-700/30">
                    <div className="text-yellow-400 mt-0.5">👤</div>
                    <div className="flex-1">
                      <div className="text-gray-400 text-xs">Role</div>
                      <div className="text-gray-200 font-medium">{isTeacher ? 'Teacher (Host)' : 'Student'}</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                    <div className="text-blue-400 mt-0.5">👥</div>
                    <div className="flex-1">
                      <div className="text-gray-400 text-xs">Max Participants</div>
                      <div className="text-gray-200 font-medium">6+ users supported</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border-slate-700/50 shadow-xl backdrop-blur">
                <CardHeader className="pb-3 border-b border-slate-700/50">
                  <CardTitle className="text-white text-base font-semibold flex items-center">
                    <Settings className="h-4 w-4 mr-2 text-cyan-400" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleOpenChat}
                    className="w-full !bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-blue-600 shadow-lg shadow-blue-600/20 transition-all"
                    data-testid={`button-open-chat-${classId}`}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Open Chat
                  </Button>
                  
                  {isTeacher && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={startScreenShare}
                      className="w-full !bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-green-600 shadow-lg shadow-green-600/20 transition-all"
                      data-testid="button-screen-share"
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      Share Screen
                    </Button>
                  )}
                  
                  {!isTeacher && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={toggleHandRaise}
                      className={`w-full ${isHandRaised ? '!bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' : '!bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'} text-white border-${isHandRaised ? 'yellow' : 'blue'}-600 shadow-lg shadow-${isHandRaised ? 'yellow' : 'blue'}-600/20 transition-all`}
                      data-testid="button-hand-raise"
                    >
                      <Hand className={`h-4 w-4 mr-2 ${isHandRaised ? 'animate-bounce' : ''}`} />
                      {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
                    </Button>
                  )}
                  
                  {isTeacher && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refetchMultipleLogins()}
                        className="w-full !bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white border-orange-600 shadow-lg shadow-orange-600/20 transition-all"
                        data-testid="button-check-multiple-logins"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Check Multiple Logins
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => addTeacherAlert('Test alert: All students are engaged!')}
                        className="w-full !bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-purple-600 shadow-lg shadow-purple-600/20 transition-all"
                        data-testid="button-test-alert"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Test Alert
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full !bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/50 transition-all"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Health Score Indicator */}
      {isConnected && healthScore !== null && healthDetails && (
        <div className="bg-black/60 backdrop-blur-sm border-t border-gray-700/50 px-4 py-2 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Connection Quality Badge - All 5 Quality Bands */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                healthDetails.quality === 'excellent' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                healthDetails.quality === 'good' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                healthDetails.quality === 'fair' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                healthDetails.quality === 'poor' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                'bg-red-500/20 text-red-400 border-2 border-red-500/50 animate-pulse' // critical - more severe styling
              }`} data-testid="connection-quality-badge">
                {healthDetails.quality === 'critical' ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                <span className="capitalize">{healthDetails.quality}</span>
              </div>
              
              {/* Health Score */}
              <div className="text-xs text-gray-400">
                Health Score: <span className={`font-bold ${
                  healthDetails.quality === 'excellent' ? 'text-green-400' :
                  healthDetails.quality === 'good' ? 'text-blue-400' :
                  healthDetails.quality === 'fair' ? 'text-yellow-400' :
                  healthDetails.quality === 'poor' ? 'text-orange-400' :
                  'text-red-400'
                }`} data-testid="health-score-value">{Math.round(healthScore)}</span>/100
              </div>
              
              {/* Video Quality Level */}
              {currentQualityLevel && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  currentQualityLevel === '720p' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  currentQualityLevel === '480p' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  currentQualityLevel === '360p' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`} data-testid="quality-level-indicator">
                  <span className="font-mono">{currentQualityLevel === 'audio-only' ? '🎤' : '📹'}</span>
                  <span>{currentQualityLevel === 'audio-only' ? 'Audio Only' : currentQualityLevel}</span>
                </div>
              )}
              
              {/* R2.7: Connection Type Indicator (P2P vs TURN vs SFU) */}
              {detectedConnectionType && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  detectedConnectionType === 'p2p' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  detectedConnectionType === 'relay_udp' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  detectedConnectionType === 'relay_tcp' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                  detectedConnectionType === 'relay_tls' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                  'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`} data-testid="connection-type-indicator" title={
                  detectedConnectionType === 'p2p' ? 'Direct P2P connection (optimal)' :
                  detectedConnectionType === 'relay_udp' ? 'TURN relay via UDP (NAT traversal)' :
                  detectedConnectionType === 'relay_tcp' ? 'TURN relay via TCP (firewall bypass)' :
                  detectedConnectionType === 'relay_tls' ? 'TURN relay via TLS (encrypted)' :
                  'SFU media server (multi-participant)'
                }>
                  <span className="font-mono">{detectedConnectionType === 'p2p' ? '🔗' : detectedConnectionType === 'sfu' ? '🎛️' : '🌐'}</span>
                  <span className="uppercase">{detectedConnectionType.replace('_', ' ')}</span>
                </div>
              )}
              
              {/* Connection Recovery Indicator */}
              {isRecoveringConnection && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse" data-testid="recovery-indicator">
                  <span className="font-mono">🔄</span>
                  <span>Reconnecting...</span>
                </div>
              )}
              
              {/* Detailed Metrics */}
              {currentMetrics && (
                <div className="hidden md:flex items-center gap-3 text-xs">
                  <span data-testid="packet-loss-value" className="text-gray-500">
                    Loss: {currentMetrics.packetLoss.toFixed(1)}%
                  </span>
                  <span data-testid="rtt-value" className="text-gray-500">
                    RTT: {Math.round(currentMetrics.rtt)}ms
                  </span>
                  <span 
                    data-testid="jitter-value" 
                    className={`font-medium ${
                      currentMetrics.jitter < 20 ? 'text-green-400' :
                      currentMetrics.jitter < 50 ? 'text-yellow-400' :
                      'text-orange-400'
                    }`}
                    title={`Jitter ${currentMetrics.jitter < 20 ? 'excellent' : currentMetrics.jitter < 50 ? 'acceptable' : 'high - audio may be affected'} (target: <20ms)`}
                  >
                    Jitter: {Math.round(currentMetrics.jitter)}ms
                    {currentMetrics.jitter < 20 && ' ✓'}
                  </span>
                  {currentMetrics.videoBitrate !== undefined && currentMetrics.videoBitrate > 0 && (
                    <span 
                      data-testid="video-bitrate-value" 
                      className={`font-medium ${
                        currentMetrics.videoBitrate >= 1200 && currentMetrics.videoBitrate <= 1500 ? 'text-green-400' :
                        currentMetrics.videoBitrate >= 800 ? 'text-blue-400' :
                        currentMetrics.videoBitrate >= 400 ? 'text-yellow-400' :
                        'text-orange-400'
                      }`}
                      title={`Video bitrate ${currentMetrics.videoBitrate >= 1200 && currentMetrics.videoBitrate <= 1500 ? 'optimal' : currentMetrics.videoBitrate >= 800 ? 'good' : currentMetrics.videoBitrate >= 400 ? 'acceptable' : 'low - quality may be affected'} (target: 1.2-1.5 Mbps)`}
                    >
                      Video: {Math.round(currentMetrics.videoBitrate)} kbps
                      {currentMetrics.videoBitrate >= 1200 && currentMetrics.videoBitrate <= 1500 && ' ✓'}
                    </span>
                  )}
                  {currentMetrics.audioBitrate !== undefined && currentMetrics.audioBitrate > 0 && (
                    <span 
                      data-testid="audio-bitrate-value" 
                      className={`font-medium ${
                        currentMetrics.audioBitrate >= 64 && currentMetrics.audioBitrate <= 128 ? 'text-green-400' :
                        currentMetrics.audioBitrate >= 32 ? 'text-yellow-400' :
                        'text-orange-400'
                      }`}
                      title={`Audio bitrate ${currentMetrics.audioBitrate >= 64 && currentMetrics.audioBitrate <= 128 ? 'optimal' : currentMetrics.audioBitrate >= 32 ? 'acceptable' : 'low - quality may be affected'} (target: 64-128 kbps)`}
                    >
                      Audio: {Math.round(currentMetrics.audioBitrate)} kbps
                      {currentMetrics.audioBitrate >= 64 && currentMetrics.audioBitrate <= 128 && ' ✓'}
                    </span>
                  )}
                  {currentMetrics.freezeCount !== undefined && (
                    <span 
                      data-testid="freeze-count-value" 
                      className={`font-medium ${
                        currentMetrics.freezeCount === 0 ? 'text-green-400' :
                        currentMetrics.freezeCount <= 1 ? 'text-blue-400' :
                        currentMetrics.freezeCount <= 3 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}
                      title={`Video freezes ${currentMetrics.freezeCount === 0 ? 'none detected' : currentMetrics.freezeCount <= 1 ? 'minimal - good quality' : currentMetrics.freezeCount <= 3 ? 'moderate - noticeable' : 'high - poor quality'} (target: <1 freeze/10s)`}
                    >
                      Freezes: {currentMetrics.freezeCount.toFixed(1)}/10s
                      {currentMetrics.freezeCount === 0 && ' ✓'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-black/80 backdrop-blur-sm border-t border-gray-700 p-3 md:p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 md:gap-4">
          <Button
            size="lg"
            variant={isVideoEnabled ? "default" : "secondary"}
            onClick={toggleVideo}
            className={`rounded-full w-12 h-12 md:w-14 md:h-14 ${isVideoEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            data-testid="button-toggle-video"
          >
            {isVideoEnabled ? <Video className="h-5 w-5 md:h-6 md:w-6" /> : <VideoOff className="h-5 w-5 md:h-6 md:w-6" />}
          </Button>
          
          <Button
            size="lg"
            variant={isAudioEnabled ? "default" : "secondary"}
            onClick={toggleAudio}
            className={`rounded-full w-12 h-12 md:w-14 md:h-14 ${isAudioEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            data-testid="button-toggle-audio"
          >
            {isAudioEnabled ? <Mic className="h-5 w-5 md:h-6 md:w-6" /> : <MicOff className="h-5 w-5 md:h-6 md:w-6" />}
          </Button>
          
          <Button
            size="lg"
            variant="destructive"
            onClick={handleEndCall}
            className="rounded-full w-12 h-12 md:w-14 md:h-14 bg-red-600 hover:bg-red-700"
            data-testid="button-end-call"
          >
            <Phone className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </div>
      </div>

      {/* Chat Panel - Slide up from bottom */}
      {showChat && (
        <div className="fixed bottom-16 md:bottom-20 right-2 md:right-6 w-[calc(100vw-1rem)] max-w-md h-[calc(100dvh-140px)] max-h-[500px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col z-50">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Class Chat
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(false)}
              className="text-white hover:bg-white/20"
              data-testid="button-close-chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-800">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message: any) => {
                const isOwn = message.senderId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-slate-700 text-gray-100 rounded-bl-sm'
                      }`}
                    >
                      {!isOwn && (
                        <div className="text-xs text-gray-300 mb-1 font-medium">
                          {message.senderName}
                        </div>
                      )}
                      <div className="text-sm">{message.message}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {new Date(message.sentAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>
          
          <div className="p-4 bg-slate-900 border-t border-slate-700">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 bg-slate-800 border-slate-600 text-white placeholder-gray-400"
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}