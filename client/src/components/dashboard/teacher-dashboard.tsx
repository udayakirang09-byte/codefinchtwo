import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, MessageCircle, Users, BookOpen, DollarSign, Bell, TrendingUp } from "lucide-react";
import { formatDistanceToNow, addHours, addMinutes } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface UpcomingClass {
  id: string;
  studentName: string;
  subject: string;
  scheduledAt: Date;
  duration: number;
  videoEnabled: boolean;
  chatEnabled: boolean;
  rate: number;
}

interface CompletedClass {
  id: string;
  studentName: string;
  subject: string;
  completedAt: Date;
  earnings: number;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Fetch teacher's classes from API
  const { data: teacherClasses = [], isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['teacher-classes', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/classes?teacherId=${user?.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id
  });
  
  // Fetch teacher stats from API
  const { data: stats = {
    totalStudents: 0,
    monthlyEarnings: 0,
    averageRating: 0,
    completedSessions: 0
  }, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['teacher-stats', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/stats?teacherId=${user?.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id
  });
  
  const upcomingClasses = Array.isArray(teacherClasses) ? teacherClasses.filter((booking: any) => 
    booking.status === 'scheduled' && new Date(booking.scheduledAt) > new Date()
  ).map((booking: any) => ({
    id: booking.id,
    studentName: booking.student?.user?.firstName + ' ' + (booking.student?.user?.lastName || ''),
    subject: booking.subject,
    scheduledAt: new Date(booking.scheduledAt),
    duration: booking.duration,
    videoEnabled: true,
    chatEnabled: true,
    rate: booking.amount
  })) : [];
  
  const completedClasses = Array.isArray(teacherClasses) ? teacherClasses.filter((booking: any) => 
    booking.status === 'completed'
  ).map((booking: any) => ({
    id: booking.id,
    studentName: booking.student?.user?.firstName + ' ' + (booking.student?.user?.lastName || ''),
    subject: booking.subject,
    completedAt: new Date(booking.scheduledAt),
    earnings: booking.amount
  })) : [];
  
  const notifications = [
    { id: 1, message: "Class with student starts soon", type: "reminder" },
    { id: 2, message: "New student message received", type: "message" },
    { id: 3, message: "You have pending feedback requests", type: "feedback" },
  ];

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const isVideoEnabled = (scheduledAt: Date) => {
    const tenMinutesBefore = addMinutes(scheduledAt, -10);
    return currentTime >= tenMinutesBefore && currentTime <= addHours(scheduledAt, 2);
  };

  const isChatEnabled = (scheduledAt: Date) => {
    const oneHourBefore = addHours(scheduledAt, -1);
    return currentTime >= oneHourBefore;
  };

  const handleJoinVideo = (classId: string) => {
    console.log(`🎥 Starting video class ${classId} as teacher`);
  };

  const handleJoinChat = (classId: string) => {
    console.log(`💬 Opening teacher chat for class ${classId}`);
  };

  const handleManageClass = (classId: string) => {
    console.log(`⚙️ Managing class ${classId}`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-100 p-6 rounded-lg border">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back, Teacher! 👨‍🏫</h2>
        <p className="text-gray-700">Manage your classes, track earnings, and connect with your students.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Monthly Earnings</p>
                <p className="text-2xl font-bold">${stats.monthlyEarnings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">{stats.averageRating}⭐</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Completed Sessions</p>
                <p className="text-2xl font-bold">{stats.completedSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 rounded-lg border-l-4 ${
                    notification.type === 'reminder' ? 'bg-blue-50 border-blue-400' : 
                    notification.type === 'message' ? 'bg-green-50 border-green-400' :
                    'bg-orange-50 border-orange-400'
                  }`}
                >
                  <p className="text-sm">{notification.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingClasses.map((upcomingClass) => {
              const videoEnabled = isVideoEnabled(upcomingClass.scheduledAt);
              const chatEnabled = isChatEnabled(upcomingClass.scheduledAt);
              
              return (
                <div key={upcomingClass.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{upcomingClass.subject}</h3>
                      <p className="text-gray-600">with {upcomingClass.studentName}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-2">
                        <Clock className="h-3 w-3 mr-1" />
                        {upcomingClass.duration} min
                      </Badge>
                      <p className="text-sm text-green-600 font-medium">${upcomingClass.rate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                    <span>📅 {upcomingClass.scheduledAt.toLocaleDateString()}</span>
                    <span>🕒 {upcomingClass.scheduledAt.toLocaleTimeString()}</span>
                    <span>⏰ {formatDistanceToNow(upcomingClass.scheduledAt, { addSuffix: true })}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={videoEnabled ? "default" : "secondary"}
                      disabled={!videoEnabled}
                      onClick={() => handleJoinVideo(upcomingClass.id)}
                      data-testid={`button-teacher-video-${upcomingClass.id}`}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      {videoEnabled ? "Start Class" : `Available in ${formatDistanceToNow(addMinutes(upcomingClass.scheduledAt, -10))}`}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={chatEnabled ? "outline" : "secondary"}
                      disabled={!chatEnabled}
                      onClick={() => handleJoinChat(upcomingClass.id)}
                      data-testid={`button-teacher-chat-${upcomingClass.id}`}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {chatEnabled ? "Chat" : `Chat in ${formatDistanceToNow(addHours(upcomingClass.scheduledAt, -1))}`}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleManageClass(upcomingClass.id)}
                      data-testid={`button-manage-class-${upcomingClass.id}`}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recently Completed Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Recently Completed Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completedClasses.map((completedClass) => (
              <div key={completedClass.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{completedClass.subject}</h3>
                    <p className="text-gray-600">with {completedClass.studentName}</p>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    Earned ${completedClass.earnings}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600">
                  ✅ Completed: {completedClass.completedAt.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col" 
              data-testid="button-create-course"
              onClick={() => window.location.href = '/teacher/create-course'}
            >
              <BookOpen className="h-6 w-6 mb-2" />
              <span>Create Course</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col" 
              data-testid="button-manage-schedule"
              onClick={() => window.location.href = '/teacher/manage-schedule'}
            >
              <Calendar className="h-6 w-6 mb-2" />
              <span>Manage Schedule</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col" 
              data-testid="button-earnings-report"
              onClick={() => alert('Earnings Report: Total earnings this month: ₹12,500. Click OK to see detailed breakdown.')}
            >
              <DollarSign className="h-6 w-6 mb-2" />
              <span>Earnings Report</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col" 
              data-testid="button-student-feedback"
              onClick={() => alert('Recent Feedback:\n⭐⭐⭐⭐⭐ "Excellent teaching style!" - Sarah\n⭐⭐⭐⭐⭐ "Very helpful and patient" - Mike\n⭐⭐⭐⭐⭐ "Clear explanations" - Alex')}
            >
              <MessageCircle className="h-6 w-6 mb-2" />
              <span>Student Feedback</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}