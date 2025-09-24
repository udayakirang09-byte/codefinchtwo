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
    // Navigate to video page for this class
    window.location.href = `/video-class/${classId}`;
  };

  const handleJoinChat = (classId: string) => {
    // Navigate to chat page for this class
    window.location.href = `/chat/${classId}`;
  };

  const handleManageClass = (classId: string) => {
    // For now, show a confirmation dialog with options
    const action = window.confirm(
      `Manage Class ${classId}\n\n` +
      `Choose an action:\n` +
      `• OK: Reschedule class\n` +
      `• Cancel: Close this dialog\n\n` +
      `(More management options will be available soon)`
    );
    
    if (action) {
      // Handle reschedule action
      alert(`Reschedule functionality for class ${classId} will be implemented soon.`);
      // TODO: Implement reschedule dialog/modal
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* Ultra Modern Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 rounded-3xl shadow-2xl border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Welcome Back, Teacher! 👨‍🏫</h1>
                <p className="text-purple-100 text-xl font-medium">Manage your classes, track earnings, and connect with your students</p>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 text-center min-w-[120px]">
                  <div className="text-white text-3xl font-bold">
                    {statsLoading ? "..." : stats?.totalStudents || 0}
                  </div>
                  <div className="text-purple-100 text-sm font-medium">Total Students</div>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 text-center min-w-[120px]">
                  <div className="text-white text-3xl font-bold">
                    {statsLoading ? "..." : `$${stats?.monthlyEarnings || 0}`}
                  </div>
                  <div className="text-purple-100 text-sm font-medium">Monthly Earnings</div>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 text-center min-w-[120px]">
                  <div className="text-white text-3xl font-bold">
                    {statsLoading ? "..." : `${stats?.averageRating || 0}⭐`}
                  </div>
                  <div className="text-purple-100 text-sm font-medium">Average Rating</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-blue-300/20 rounded-full blur-3xl"></div>
        </div>

        {/* Beautiful Notifications Panel */}
        {notifications.length > 0 && (
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Bell className="h-6 w-6" />
                Notifications
                <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                  {notifications.filter((n: any) => !n.isRead).length} new
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {notifications.map((notification: any) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 rounded-xl border-l-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
                      notification.isRead 
                        ? 'bg-gray-50 border-gray-300 opacity-70' 
                        : notification.type === 'reminder' 
                          ? 'bg-blue-50 border-blue-400 hover:bg-blue-100' 
                          : notification.type === 'message'
                            ? 'bg-green-50 border-green-400 hover:bg-green-100'
                            : 'bg-orange-50 border-orange-400 hover:bg-orange-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 leading-relaxed">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDistanceToNow(notification.timestamp || new Date(), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {!notification.isRead && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Classes - Redesigned */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Calendar className="h-6 w-6" />
              Upcoming Classes
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                {upcomingClasses.length} scheduled
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {upcomingClasses.map((upcomingClass) => {
                const videoEnabled = isVideoEnabled(upcomingClass.scheduledAt);
                const chatEnabled = isChatEnabled(upcomingClass.scheduledAt);
                
                return (
                  <div key={upcomingClass.id} className="bg-gradient-to-r from-slate-50 to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-xl text-gray-800 mb-1">{upcomingClass.subject}</h3>
                        <p className="text-blue-600 font-medium">with {upcomingClass.studentName}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2 bg-blue-100 text-blue-700 border-blue-300">
                          <Clock className="h-3 w-3 mr-1" />
                          {upcomingClass.duration} min
                        </Badge>
                        <p className="text-lg text-green-600 font-bold">${upcomingClass.rate}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 mb-4 text-sm">
                      <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{upcomingClass.scheduledAt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">{upcomingClass.scheduledAt.toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{formatDistanceToNow(upcomingClass.scheduledAt, { addSuffix: true })}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        size="lg"
                        variant={videoEnabled ? "default" : "secondary"}
                        disabled={!videoEnabled}
                        onClick={() => handleJoinVideo(upcomingClass.id)}
                        className={`${videoEnabled ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' : ''} rounded-xl`}
                        data-testid={`button-teacher-video-${upcomingClass.id}`}
                      >
                        <Video className="h-5 w-5 mr-2" />
                        {videoEnabled ? "Start Class" : `Available in ${formatDistanceToNow(addMinutes(upcomingClass.scheduledAt, -10))}`}
                      </Button>
                      
                      <Button
                        size="lg"
                        variant={chatEnabled ? "outline" : "secondary"}
                        disabled={!chatEnabled}
                        onClick={() => handleJoinChat(upcomingClass.id)}
                        className={`${chatEnabled ? 'border-blue-300 text-blue-700 hover:bg-blue-50' : ''} rounded-xl`}
                        data-testid={`button-teacher-chat-${upcomingClass.id}`}
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        {chatEnabled ? "Chat" : `Chat in ${formatDistanceToNow(addHours(upcomingClass.scheduledAt, -1))}`}
                      </Button>

                      <Button
                        size="lg"
                        variant="ghost"
                        onClick={() => handleManageClass(upcomingClass.id)}
                        className="hover:bg-gray-100 rounded-xl"
                        data-testid={`button-manage-class-${upcomingClass.id}`}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                );
              })}
              {upcomingClasses.length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
                    <Calendar className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Upcoming Classes</h3>
                    <p className="text-gray-600">Your schedule is clear! Time to connect with new students.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recently Completed Classes */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
            <CardTitle className="flex items-center gap-3 text-xl">
              <BookOpen className="h-6 w-6" />
              Recently Completed Classes
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                {completedClasses.length} completed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {completedClasses.map((completedClass) => (
                <div key={completedClass.id} className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 mb-1">{completedClass.subject}</h3>
                      <p className="text-emerald-600 font-medium">with {completedClass.studentName}</p>
                    </div>
                    <Badge className="bg-green-600 hover:bg-green-700 text-white shadow-lg">
                      Earned ${completedClass.earnings}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg w-fit">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Completed: {completedClass.completedAt.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              {completedClasses.length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-green-50 rounded-2xl p-8 border border-green-200">
                    <BookOpen className="h-16 w-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Completed Classes Yet</h3>
                    <p className="text-gray-600">Your completed sessions will appear here once you finish teaching.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-700 text-white">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Users className="h-6 w-6" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Button 
                variant="outline" 
                className="h-32 p-6 flex-col hover:bg-green-50 hover:border-green-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                data-testid="button-create-course"
                onClick={() => window.location.href = '/teacher/create-course'}
              >
                <BookOpen className="h-10 w-10 mb-3 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-bold text-lg">Create Course</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Design new curriculum</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-32 p-6 flex-col hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                data-testid="button-manage-schedule"
                onClick={() => window.location.href = '/teacher/manage-schedule'}
              >
                <Calendar className="h-10 w-10 mb-3 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-bold text-lg">Manage Schedule</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Set availability times</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-32 p-6 flex-col hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                data-testid="button-earnings-report"
                onClick={() => setShowEarningsReport(!showEarningsReport)}
              >
                <DollarSign className="h-10 w-10 mb-3 text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-bold text-lg">Earnings Report</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Track your income</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-32 p-6 flex-col hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                data-testid="button-student-feedback"
                onClick={() => setShowStudentFeedback(!showStudentFeedback)}
              >
                <MessageCircle className="h-10 w-10 mb-3 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-bold text-lg">Student Feedback</span>
                <span className="text-xs text-gray-500 mt-1 text-center">View reviews & ratings</span>
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
      <Card className="shadow-2xl bg-gradient-to-br from-white via-gray-50 to-blue-50 border-0 rounded-2xl overflow-hidden">
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
              onClick={async () => {
                console.log('🧪 Running tests for teacher...');
                try {
                  const response = await fetch('/api/test/run-all', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userRole: 'teacher', testType: 'comprehensive' })
                  });
                  if (response.ok) {
                    const results = await response.json();
                    console.log('✅ Teacher test results:', results);
                    alert(`Tests completed! ${results.summary.passed}/${results.summary.total} passed`);
                  }
                } catch (error) {
                  console.error('Failed to run tests:', error);
                  alert('❌ Failed to run tests. Check console for details.');
                }
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