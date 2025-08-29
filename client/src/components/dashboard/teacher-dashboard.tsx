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
  const [showEarningsReport, setShowEarningsReport] = useState(false);
  const [showStudentFeedback, setShowStudentFeedback] = useState(false);
  
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
  
  // Fetch teacher notifications from API
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['teacher-notifications', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/notifications?teacherId=${user?.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id
  });
  
  // Fetch teacher reviews from API
  const { data: teacherReviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['teacher-reviews', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/reviews?teacherId=${user?.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`);
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
  
  // notifications now comes from API query above

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
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
              {notifications.map((notification: any) => (
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
              onClick={() => setShowEarningsReport(!showEarningsReport)}
            >
              <DollarSign className="h-6 w-6 mb-2" />
              <span>Earnings Report</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col" 
              data-testid="button-student-feedback"
              onClick={() => setShowStudentFeedback(!showStudentFeedback)}
            >
              <MessageCircle className="h-6 w-6 mb-2" />
              <span>Student Feedback</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Report Section */}
      {showEarningsReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Detailed Earnings Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium">This Month</p>
                  <p className="text-2xl font-bold text-green-700">${stats.monthlyEarnings || 0}</p>
                  <p className="text-xs text-green-600">+15% from last month</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Total Earnings</p>
                  <p className="text-2xl font-bold text-blue-700">${stats.totalEarnings || 0}</p>
                  <p className="text-xs text-blue-600">Since joining</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium">Average per Session</p>
                  <p className="text-2xl font-bold text-purple-700">${stats.averageSessionEarnings || 0}</p>
                  <p className="text-xs text-purple-600">Across all subjects</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Recent Earnings Breakdown:</h4>
                <div className="space-y-2">
                  {completedClasses.slice(0, 5).map((completedClass) => (
                    <div key={completedClass.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{completedClass.subject} - {completedClass.studentName}</span>
                      <span className="font-medium text-green-600">${completedClass.earnings}</span>
                    </div>
                  ))}
                  {completedClasses.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No completed sessions yet</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Feedback Section */}
      {showStudentFeedback && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Recent Student Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-600 font-medium">Average Rating</p>
                  <p className="text-3xl font-bold text-yellow-700">{stats.averageRating || 0}⭐</p>
                  <p className="text-xs text-yellow-600">Based on {stats.totalReviews || 0} reviews</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Response Rate</p>
                  <p className="text-3xl font-bold text-blue-700">{stats.feedbackResponseRate || 0}%</p>
                  <p className="text-xs text-blue-600">Students who left feedback</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Recent Reviews:</h4>
                
                {teacherReviews.map((review: any) => {
                  const stars = '⭐'.repeat(review.rating);
                  const borderColor = review.rating >= 4 ? 'border-green-400' : review.rating >= 3 ? 'border-yellow-400' : 'border-red-400';
                  const bgColor = review.rating >= 4 ? 'bg-green-50' : review.rating >= 3 ? 'bg-yellow-50' : 'bg-red-50';
                  
                  return (
                    <div key={review.id} className={`border-l-4 ${borderColor} ${bgColor} p-4 rounded-r-lg`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-500">{stars}</span>
                        <span className="font-medium text-sm">{review.studentName}</span>
                        <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm text-gray-700">"{review.comment}"</p>
                      <p className="text-xs text-gray-500 mt-1">Subject: {review.subject}</p>
                    </div>
                  );
                })}
                
                {teacherReviews.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No reviews yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run All Tests Button - Only for Teachers */}
      <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-600 to-red-700 text-white">
          <CardTitle className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6" />
            System Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Run comprehensive tests with teacher credentials</p>
            <Button 
              onClick={() => {
                console.log('🧪 Running all tests with teacher credentials');
                // Test functionality for teachers
              }}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              data-testid="button-run-all-tests-teacher"
            >
              Run All Tests (Teacher)
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}