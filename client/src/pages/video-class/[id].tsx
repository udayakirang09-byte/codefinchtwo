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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Video, VideoOff, Mic, MicOff, Users, MessageCircle, Phone, Settings, AlertTriangle, Wifi, WifiOff, Shield, Monitor, Home, ArrowLeft, Maximize, Minimize, Send, X } from "lucide-react";

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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Query to get booking/class schedule information
  const { data: bookingData } = useQuery<any>({
    queryKey: ['/api/bookings', classId],
    enabled: Boolean(classId),
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
    error,
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
    }
  });

  // Query to check for multiple login users
  const { data: multipleLogins, refetch: refetchMultipleLogins } = useQuery({
    queryKey: ['/api/sessions/multiple-logins'],
    enabled: isAuthenticated && Boolean(user),
    refetchInterval: 30000, // Check every 30 seconds during video session
  });

  // Fetch chat messages
  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ['/api/bookings', classId, 'messages'],
    enabled: Boolean(classId) && showChat,
    refetchInterval: 3000, // Poll every 3 seconds when chat is open
  });

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
  
  const [classInfo] = useState({
    subject: "Python Basics",
    mentor: "Sarah Johnson", 
    duration: 60,
    startTime: new Date(),
    isTeacher
  });
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [showEndWarning, setShowEndWarning] = useState(false);

  // Teacher alert system
  const addTeacherAlert = useCallback((message: string) => {
    if (isTeacher) {
      setTeacherAlerts(prev => [...prev, message]);
      toast({
        title: "Teacher Alert",
        description: message,
        variant: "default",
      });
      
      // Auto-remove alert after 10 seconds
      setTimeout(() => {
        setTeacherAlerts(prev => prev.filter(alert => alert !== message));
      }, 10000);
    }
  }, [isTeacher, toast]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative">
      {/* Class End Warning Modal */}
      {showEndWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-pulse">
          <div className="bg-gradient-to-br from-red-600 to-red-700 p-8 rounded-2xl shadow-2xl max-w-md mx-4 border-2 border-red-400">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-white mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold text-white mb-3">Class Time Completed</h2>
              <p className="text-red-100 text-lg mb-2">Session will close in 4 minutes</p>
              <p className="text-red-200 text-sm">Please wrap up your discussion</p>
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
      <div className="bg-black/50 backdrop-blur-sm border-b border-gray-700 p-4">
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
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
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
                          <span className="text-white font-medium text-sm">Recording started</span>
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
                    
                    {localStream && isVideoEnabled ? (
                      <>
                        {/* Local video feed */}
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
                        <div className="absolute top-4 left-4 bg-black/70 text-white text-sm px-2 py-1 rounded">
                          You ({isTeacher ? 'Teacher' : 'Student'})
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <VideoOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">
                          {localStream ? 'Video is turned off' : 'Camera not available'}
                        </p>
                      </div>
                    )}
                    
                    {/* Participants grid overlay (for small view) */}
                    {participants.length > 0 && (
                      <div className="absolute bottom-4 right-4 w-48 h-32 bg-gray-800/90 rounded-lg border border-gray-600 p-2">
                        <ParticipantGrid />
                      </div>
                    )}
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

      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-gray-700 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <Button
            size="lg"
            variant={isVideoEnabled ? "default" : "secondary"}
            onClick={toggleVideo}
            className={`rounded-full w-14 h-14 ${isVideoEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            data-testid="button-toggle-video"
          >
            {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>
          
          <Button
            size="lg"
            variant={isAudioEnabled ? "default" : "secondary"}
            onClick={toggleAudio}
            className={`rounded-full w-14 h-14 ${isAudioEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            data-testid="button-toggle-audio"
          >
            {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>
          
          <Button
            size="lg"
            variant="destructive"
            onClick={handleEndCall}
            className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700"
            data-testid="button-end-call"
          >
            <Phone className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Chat Panel - Slide up from bottom */}
      {showChat && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col z-50">
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