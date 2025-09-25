import { useState, useEffect, useCallback, useRef } from "react";
import { useRoute } from "wouter";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Video, VideoOff, Mic, MicOff, Users, MessageCircle, Phone, Settings, AlertTriangle, Wifi, WifiOff } from "lucide-react";

export default function VideoClass() {
  const [, params] = useRoute("/video-class/:id");
  const classId = params?.id;
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'disconnected'>('disconnected');
  const [participants, setParticipants] = useState(6); // 1 teacher + 5 students maximum
  const [teacherAlerts, setTeacherAlerts] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Determine teacher role based on URL parameter or default to student
  const isTeacher = classId?.includes('teacher') || false;
  
  const [classInfo, setClassInfo] = useState({
    subject: "Python Basics",
    mentor: "Sarah Johnson",
    duration: 60,
    startTime: new Date(),
    isTeacher
  });

  // Reconnection logic using ref for stable attempt counting
  const attemptReconnection = useCallback(async () => {
    if (reconnectAttemptsRef.current >= 3) {
      setConnectionQuality('disconnected');
      toast({
        title: "Connection Failed",
        description: "Unable to reconnect after 3 attempts. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsReconnecting(true);
    reconnectAttemptsRef.current += 1;
    
    try {
      // Simulate reconnection attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure
      const success = Math.random() > 0.3; // 70% success rate
      
      if (success) {
        setIsConnected(true);
        setIsReconnecting(false);
        reconnectAttemptsRef.current = 0;
        setConnectionQuality('good');
        toast({
          title: "Reconnected",
          description: "Successfully reconnected to the video session.",
        });
      } else {
        setIsReconnecting(false);
        setTimeout(attemptReconnection, 3000); // Retry after 3 seconds
      }
    } catch (error) {
      setIsReconnecting(false);
      setTimeout(attemptReconnection, 3000);
    }
  }, [toast]);

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

  // Main connection effect
  useEffect(() => {
    console.log(`🎥 Initializing video class ${classId}`);
    
    // Simulate initial connection
    const connectTimeout = setTimeout(() => {
      setIsConnected(true);
      setConnectionQuality('good');
      
      if (classInfo.isTeacher) {
        addTeacherAlert("Video session started successfully. You are the host.");
      }
    }, 2000);

    // Simulate random connection issues for demonstration
    const connectionMonitor = setInterval(() => {
      if (isConnected && Math.random() < 0.05) { // 5% chance of connection issue
        setIsConnected(false);
        setConnectionQuality('poor');
        toast({
          title: "Connection Issue",
          description: "Attempting to reconnect...",
          variant: "destructive",
        });
        attemptReconnection();
      }
    }, 10000);

    return () => {
      clearTimeout(connectTimeout);
      clearInterval(connectionMonitor);
    };
  }, [classId, isConnected, classInfo.isTeacher, addTeacherAlert, attemptReconnection, toast]);

  const handleEndCall = () => {
    console.log(`📞 Ending video class ${classId}`);
    window.location.href = '/';
  };

  const handleToggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    console.log(`📹 Video ${!isVideoOn ? 'enabled' : 'disabled'}`);
  };

  const handleToggleAudio = () => {
    setIsAudioOn(!isAudioOn);
    console.log(`🎤 Audio ${!isAudioOn ? 'enabled' : 'disabled'}`);
  };

  const handleOpenChat = () => {
    console.log(`💬 Opening chat for class ${classId}`);
    window.open(`/chat/${classId}`, '_blank', 'width=400,height=600');
  };

  // Show connecting overlay when not connected or reconnecting
  const showConnectingOverlay = !isConnected || isReconnecting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative">
      {/* Connecting Overlay */}
      {showConnectingOverlay && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-black z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isReconnecting ? 'Reconnecting to Class...' : 'Connecting to Class...'}
            </h2>
            <p className="text-blue-200">
              Please wait while we connect you to {classInfo.subject}
            </p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-gray-700 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-white">{classInfo.subject}</h1>
            <p className="text-gray-300">with {classInfo.mentor}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-green-600">
              <Users className="h-3 w-3 mr-1" />
              {participants} participants
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
            {classInfo.isTeacher && (
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
            {/* Main Video */}
            <div className="lg:col-span-3">
              <Card className="h-full bg-gray-900 border-gray-700">
                <CardContent className="p-0 h-full relative">
                  <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {isVideoOn ? (
                      <>
                        {/* Simulated video feed */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
                        <div className="relative z-10 text-center">
                          <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <span className="text-4xl font-bold text-white">SJ</span>
                          </div>
                          <h3 className="text-2xl font-bold text-white">{classInfo.mentor}</h3>
                          <p className="text-blue-200">Teaching {classInfo.subject}</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <VideoOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">Video is turned off</p>
                      </div>
                    )}
                    
                    {/* Your video (small) */}
                    <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg border-2 border-gray-600 flex items-center justify-center">
                      {isVideoOn ? (
                        <div className="text-center">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mb-1">
                            <span className="text-xs font-bold text-white">You</span>
                          </div>
                        </div>
                      ) : (
                        <VideoOff className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Teacher Alerts */}
              {classInfo.isTeacher && teacherAlerts.length > 0 && (
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
                      {isReconnecting ? 'Attempting to reconnect...' : 'Connection unstable'}
                    </p>
                    {!isConnected && !isReconnecting && (
                      <Button 
                        size="sm" 
                        onClick={attemptReconnection}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                        data-testid="button-reconnect"
                      >
                        Reconnect
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
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
                    <strong>Role:</strong> {classInfo.isTeacher ? 'Teacher (Host)' : 'Student'}
                  </div>
                  <div className="text-gray-300">
                    <strong>Max Participants:</strong> 6 (1 teacher + 5 students)
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
                  {classInfo.isTeacher && (
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
            variant={isVideoOn ? "default" : "secondary"}
            onClick={handleToggleVideo}
            className={`rounded-full w-14 h-14 ${isVideoOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            data-testid="button-toggle-video"
          >
            {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>
          
          <Button
            size="lg"
            variant={isAudioOn ? "default" : "secondary"}
            onClick={handleToggleAudio}
            className={`rounded-full w-14 h-14 ${isAudioOn ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            data-testid="button-toggle-audio"
          >
            {isAudioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
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