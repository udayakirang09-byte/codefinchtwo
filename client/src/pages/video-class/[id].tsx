import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useWebRTC } from "@/hooks/use-webrtc";
import { Video, VideoOff, Mic, MicOff, Users, MessageCircle, Phone, Settings, AlertTriangle, Wifi, WifiOff, Shield, Monitor, Home, ArrowLeft } from "lucide-react";

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
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  // Determine teacher role based on URL parameter or default to student
  const isTeacher = classId?.includes('teacher') || false;
  
  // WebRTC hook for real video functionality
  const {
    isConnected,
    participants,
    localStream,
    localVideoRef,
    isVideoEnabled,
    isAudioEnabled, 
    connectionQuality,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    disconnect
  } = useWebRTC({
    sessionId: classId || 'default',
    userId: user?.id || 'anonymous',
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
  
  const [classInfo] = useState({
    subject: "Python Basics",
    mentor: "Sarah Johnson", 
    duration: 60,
    startTime: new Date(),
    isTeacher
  });

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

  const handleEndCall = () => {
    console.log(`📞 Ending video class ${classId}`);
    disconnect();
    window.location.href = '/';
  };

  const handleOpenChat = () => {
    console.log(`💬 Opening chat for class ${classId}`);
    window.open(`/chat/${classId}`, '_blank', 'width=400,height=600');
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative">
      {/* Connecting Overlay */}
      {!isConnected && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-black z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Connecting to Class...</h2>
            <p className="text-blue-200">
              Please wait while we connect you to {classInfo.subject}
            </p>
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
              className="text-white border-gray-600 hover:bg-gray-800"
              data-testid="button-home"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="text-white border-gray-600 hover:bg-gray-800"
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
              {participants.length + 1} participants
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
              <Card className="h-full bg-gray-900 border-gray-700">
                <CardContent className="p-0 h-full relative">
                  <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {localStream && isVideoEnabled ? (
                      <>
                        {/* Local video feed */}
                        <video
                          ref={localVideoRef}
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
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm">Participants ({participants.length + 1})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-300 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    You ({isTeacher ? 'Teacher' : 'Student'})
                  </div>
                  {participants.map((participant) => (
                    <div key={participant.userId} className="text-sm text-gray-300 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      {participant.userId} ({participant.isTeacher ? 'Teacher' : 'Student'})
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Class Info */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm">Class Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="text-gray-300">
                    <strong>Subject:</strong> {classInfo.subject}
                  </div>
                  <div className="text-gray-300">
                    <strong>Duration:</strong> {classInfo.duration} minutes
                  </div>
                  <div className="text-gray-300">
                    <strong>Started:</strong> {classInfo.startTime.toLocaleTimeString()}
                  </div>
                  <div className="text-gray-300">
                    <strong>Role:</strong> {isTeacher ? 'Teacher (Host)' : 'Student'}
                  </div>
                  <div className="text-gray-300">
                    <strong>Max Participants:</strong> 6+ users supported
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleOpenChat}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    data-testid={`button-open-chat-${classId}`}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Open Chat
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={startScreenShare}
                    className="w-full bg-green-600 hover:bg-green-700 text-white border-green-600"
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
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
                        data-testid="button-check-multiple-logins"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Check Multiple Logins
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => addTeacherAlert('Test alert: All students are engaged!')}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
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
                    className="w-full text-gray-300 border-gray-600 hover:bg-gray-700"
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
    </div>
  );
}