import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Video, MessageCircle, Star, BookOpen, Award, Bell, Users, TrendingUp, Search, Filter, X, Play } from "lucide-react";
import { formatDistanceToNow, isWithinInterval, addHours, addMinutes } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface UpcomingClass {
  id: string;
  mentorName: string;
  subject: string;
  scheduledAt: Date;
  duration: number;
  videoEnabled: boolean;
  chatEnabled: boolean;
  feedbackEnabled: boolean;
}

interface CompletedClass {
  id: string;
  mentorName: string;
  subject: string;
  completedAt: Date;
  feedbackDeadline: Date;
  hasSubmittedFeedback: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

interface StudentStats {
  activeClasses: number;
  hoursLearned: number;
  progressRate: number;
  totalBookings: number;
  completedClasses: number;
  achievementsCount: number;
}

interface UiConfigResponse {
  footerLinks: {
    studentCommunity: boolean;
    mentorCommunity: boolean;
    achievementBadges: boolean;
    discussionForums: boolean;
    projectShowcase: boolean;
    communityEvents: boolean;
    successStories: boolean;
    contactUs: boolean;
  };
  showHelpCenter: boolean;
}

export default function StudentDashboard() {
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [completedClasses, setCompletedClasses] = useState<CompletedClass[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [teacherFilter, setTeacherFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");

  // Get authenticated user from auth context
  const { user, isAuthenticated } = useAuth();
  
  // Get the actual student ID from the database using the user's email
  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['/api/users', user?.email, 'student'],
    queryFn: async () => {
      if (!user?.email) throw new Error('No user email');
      const response = await fetch(`/api/users/${encodeURIComponent(user.email)}/student`);
      if (!response.ok) throw new Error('Failed to fetch student data');
      return response.json();
    },
    enabled: !!user?.email && isAuthenticated,
  });
  
  const studentId = studentData?.id;

  // Fetch student statistics from the database
  const { data: studentStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/students', studentId, 'stats'],
    queryFn: async () => {
      if (!studentId) throw new Error('No student ID available');
      const response = await fetch(`/api/students/${studentId}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch student stats');
      }
      return response.json() as Promise<StudentStats>;
    },
    enabled: !!studentId,
    // Default fallback data while loading
    placeholderData: {
      activeClasses: 0,
      hoursLearned: 0,
      progressRate: 0,
      totalBookings: 0,
      completedClasses: 0,
      achievementsCount: 0
    }
  });

  // Fetch notifications for the authenticated user
  const { data: userNotifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/users', user?.id, 'notifications'], 
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID available');
      const response = await fetch(`/api/users/${user.id}/notifications`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    enabled: !!user?.id && isAuthenticated,
  });

  // Fetch UI configuration for Help Center visibility
  const { data: uiConfig } = useQuery<UiConfigResponse>({
    queryKey: ['/api/admin/ui-config'],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch upcoming classes for the student
  const { data: upcomingClassesData, isLoading: upcomingLoading } = useQuery({
    queryKey: ['/api/students', studentId, 'bookings'],
    queryFn: async () => {
      if (!studentId) throw new Error('No student ID available');
      const response = await fetch(`/api/students/${studentId}/bookings`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
    enabled: !!studentId,
  });

  // Process upcoming classes from bookings data
  const processUpcomingClasses = () => {
    if (upcomingClassesData) {
      const now = new Date();
      
      const upcoming = upcomingClassesData
        .filter((booking: any) => {
          const scheduledTime = new Date(booking.scheduledAt);
          const classEndTime = addMinutes(scheduledTime, booking.duration + 2); // class end + 2 minutes
          return booking.status === 'scheduled' && now < classEndTime;
        })
        .map((booking: any) => ({
          id: booking.id,
          mentorName: `${booking.mentor.user.firstName} ${booking.mentor.user.lastName}`,
          subject: booking.notes || 'Programming Session',
          scheduledAt: new Date(booking.scheduledAt),
          duration: booking.duration,
          videoEnabled: true,
          chatEnabled: true,
          feedbackEnabled: false,
        }));
      
      setUpcomingClasses(upcoming);
    }
  };

  // Process completed classes from bookings data
  const processCompletedClasses = () => {
    if (upcomingClassesData) {
      const now = new Date();
      const twelveHoursAgo = addHours(now, -12);
      
      const completed = upcomingClassesData
        .filter((booking: any) => {
          const scheduledTime = new Date(booking.scheduledAt);
          const classEndTime = addMinutes(scheduledTime, booking.duration + 2);
          
          // ONLY include scheduled bookings that have ended (NOT completed status)
          // Completed status means feedback was already submitted
          return (
            booking.status === 'scheduled' && 
            now >= classEndTime && 
            scheduledTime >= twelveHoursAgo
          );
        })
        .map((booking: any) => ({
          id: booking.id,
          mentorName: `${booking.mentor.user.firstName} ${booking.mentor.user.lastName}`,
          subject: booking.notes || 'Programming Session',
          completedAt: new Date(booking.scheduledAt),
          feedbackDeadline: addHours(new Date(booking.scheduledAt), 12),
          hasSubmittedFeedback: false,
        }));
      
      setCompletedClasses(completed);
    }
  };

  // Process notifications from API data
  const processNotifications = () => {
    if (userNotifications) {
      const processedNotifications = userNotifications.map((notif: any) => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        isRead: notif.isRead,
        createdAt: new Date(notif.createdAt),
      }));
      setNotifications(processedNotifications);
    }
  };

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Process data when it loads
  useEffect(() => {
    processUpcomingClasses();
    processCompletedClasses();
  }, [upcomingClassesData]);

  useEffect(() => {
    processNotifications();
  }, [userNotifications]);

  const isVideoEnabled = (scheduledAt: Date) => {
    const fiveMinutesBefore = addMinutes(scheduledAt, -5);
    return currentTime >= fiveMinutesBefore && currentTime <= addHours(scheduledAt, 2);
  };

  const isChatEnabled = (scheduledAt: Date) => {
    const oneHourBefore = addHours(scheduledAt, -1);
    return currentTime >= oneHourBefore;
  };

  const isFeedbackVisible = (completedAt: Date, feedbackDeadline: Date, hasSubmitted: boolean) => {
    return !hasSubmitted && currentTime <= feedbackDeadline;
  };

  const handleJoinVideo = (classId: string) => {
    console.log(`🎥 Joining video class ${classId}`);
    window.location.href = `/video-class/${classId}`;
  };

  const handleJoinChat = (classId: string) => {
    console.log(`💬 Opening chat for class ${classId}`);
    window.location.href = `/chat/${classId}`;
  };

  const handleSubmitFeedback = (classId: string) => {
    console.log(`⭐ Opening feedback form for class ${classId}`);
    window.location.href = `/feedback/${classId}`;
  };

  const handleFeedbackSubmitted = async (classId: string) => {
    try {
      // Submit feedback to API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          classId, 
          feedback: "Great class! Very helpful mentor.", 
          rating: 5 
        })
      });
      
      if (response.ok) {
        console.log(`✅ Feedback submitted successfully for class ${classId}`);
        // Immediately remove the class from completed classes list
        setCompletedClasses(prev => prev.filter(cls => cls.id !== classId));
      } else {
        console.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Still remove from UI for demo purposes
      setCompletedClasses(prev => prev.filter(cls => cls.id !== classId));
    }
  };

  const handleFindMentor = () => {
    console.log(`🔍 Navigating to find mentor page`);
    window.location.href = '/mentors';
  };

  const handleMyProgress = () => {
    console.log(`📊 Opening student progress dashboard`);
    window.location.href = '/student/progress';
  };

  const handleBrowseCourses = () => {
    console.log(`📚 Opening courses catalog`);
    window.location.href = '/courses';
  };

  const handleHelpCenter = () => {
    console.log(`❓ Opening help center`);
    window.location.href = '/help';
  };

  const handleViewRecordings = () => {
    console.log(`🎥 Opening recorded sessions`);
    window.location.href = '/recordings';
  };

  const handleCompletedClasses = () => {
    console.log(`✅ Opening completed classes`);
    window.location.href = '/student/completed-classes';
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notification.id 
          ? { ...notif, isRead: true }
          : notif
      )
    );

    // Navigate based on notification type
    switch (notification.type) {
      case 'class_reminder':
        // Find the related class and scroll to it or navigate to classes page
        console.log(`🔔 Class reminder clicked - showing upcoming classes`);
        const classesSection = document.querySelector('[data-testid="section-upcoming-classes"]');
        if (classesSection) {
          classesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.location.href = '/student/classes';
        }
        break;

      case 'feedback_request':
        // Scroll to completed classes section for feedback
        console.log(`📝 Feedback request clicked - showing feedback section`);
        const feedbackSection = document.querySelector('[data-testid="section-completed-classes"]');
        if (feedbackSection) {
          feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.location.href = '/student/feedback';
        }
        break;

      case 'achievement':
        // Navigate to achievements/progress page
        console.log(`🏆 Achievement notification clicked - showing progress`);
        window.location.href = '/student/progress';
        break;

      case 'booking_confirmation':
        // Navigate to bookings page
        console.log(`✅ Booking confirmation clicked - showing bookings`);
        window.location.href = '/student/bookings';
        break;

      case 'payment_success':
        // Navigate to payment history
        console.log(`💳 Payment notification clicked - showing payment history`);
        window.location.href = '/student/payments';
        break;

      default:
        console.log(`📌 General notification clicked: ${notification.type}`);
        // For unknown types, just mark as read (already done above)
        break;
    }
  };

  // Filter classes that need feedback and are still visible, plus additional filtering by teacher name and course
  const visibleCompletedClasses = completedClasses.filter(cls => {
    const needsFeedback = isFeedbackVisible(cls.completedAt, cls.feedbackDeadline, cls.hasSubmittedFeedback);
    const matchesTeacher = teacherFilter === "" || cls.mentorName.toLowerCase().includes(teacherFilter.toLowerCase());
    const matchesCourse = courseFilter === "" || cls.subject.toLowerCase().includes(courseFilter.toLowerCase());
    
    return needsFeedback && matchesTeacher && matchesCourse;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* Ultra Modern Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 rounded-3xl shadow-2xl border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Welcome Back, Student! 🎓</h1>
                <p className="text-indigo-100 text-xl font-medium">Continue your coding journey with personalized learning experiences</p>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <div 
                  className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 text-center min-w-[120px] cursor-pointer hover:bg-white/30 transition-all duration-200"
                  onClick={() => window.location.href = '/student/active-classes'}
                  data-testid="card-active-classes"
                >
                  <div className="text-white text-3xl font-bold">
                    {statsLoading ? "..." : studentStats?.activeClasses || 0}
                  </div>
                  <div className="text-indigo-100 text-sm font-medium">Active Classes</div>
                </div>
                <div 
                  className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 text-center min-w-[120px] cursor-pointer hover:bg-white/30 transition-all duration-200"
                  onClick={() => window.location.href = '/student/learning-hours'}
                  data-testid="card-hours-learned"
                >
                  <div className="text-white text-3xl font-bold">
                    {statsLoading ? "..." : studentStats?.hoursLearned || 0}
                  </div>
                  <div className="text-indigo-100 text-sm font-medium">Hours Learned</div>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 text-center min-w-[120px]">
                  <div className="text-white text-3xl font-bold">
                    {statsLoading ? "..." : `${studentStats?.progressRate || 0}%`}
                  </div>
                  <div className="text-indigo-100 text-sm font-medium">Progress Rate</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl"></div>
        </div>

        {/* Beautiful Notifications Panel */}
        {notifications.length > 0 && (
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Bell className="h-6 w-6" />
                Notifications
                <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                  {notifications.filter(n => !n.isRead).length} new
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 rounded-xl border-l-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
                      notification.isRead 
                        ? 'bg-gray-50 border-gray-300 opacity-70' 
                        : notification.type === 'class_reminder' 
                          ? 'bg-blue-50 border-blue-400 hover:bg-blue-100' 
                          : notification.type === 'feedback_request'
                            ? 'bg-orange-50 border-orange-400 hover:bg-orange-100'
                            : 'bg-green-50 border-green-400 hover:bg-green-100'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">{notification.title}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
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
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden" data-testid="section-upcoming-classes">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Calendar className="h-6 w-6" />
              Upcoming Classes (Next 72 Hours)
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                {upcomingClasses.filter(cls => cls.scheduledAt <= addHours(currentTime, 72)).length} classes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {upcomingClasses
                .filter(cls => cls.scheduledAt <= addHours(currentTime, 72))
                .map((upcomingClass) => {
                  const videoEnabled = isVideoEnabled(upcomingClass.scheduledAt);
                  const chatEnabled = isChatEnabled(upcomingClass.scheduledAt);
                  
                  return (
                    <div key={upcomingClass.id} className="group border rounded-2xl p-6 bg-gradient-to-r from-white to-blue-50/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-blue-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-2xl text-gray-800 mb-1">{upcomingClass.subject}</h3>
                          <p className="text-blue-600 font-semibold text-lg">with {upcomingClass.mentorName}</p>
                        </div>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 px-3 py-1">
                          <Clock className="h-4 w-4 mr-1" />
                          {upcomingClass.duration} min
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-8 mb-6 text-sm text-gray-600">
                        <span className="flex items-center font-medium">📅 {upcomingClass.scheduledAt.toLocaleDateString()}</span>
                        <span className="flex items-center font-medium">🕒 {upcomingClass.scheduledAt.toLocaleTimeString()}</span>
                        <span className="flex items-center font-semibold text-purple-600">⏰ {formatDistanceToNow(upcomingClass.scheduledAt, { addSuffix: true })}</span>
                      </div>

                      <div className="flex gap-4">
                        <Button
                          size="lg"
                          variant={videoEnabled ? "default" : "secondary"}
                          disabled={!videoEnabled}
                          onClick={() => handleJoinVideo(upcomingClass.id)}
                          data-testid={`button-video-${upcomingClass.id}`}
                          className={`flex-1 h-12 text-base font-semibold rounded-xl ${
                            videoEnabled 
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg' 
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <Video className="h-5 w-5 mr-2" />
                          {videoEnabled ? "Join Video Call" : `Video in ${formatDistanceToNow(addMinutes(upcomingClass.scheduledAt, -5))}`}
                        </Button>
                        
                        <Button
                          size="lg"
                          variant={chatEnabled ? "outline" : "secondary"}
                          disabled={!chatEnabled}
                          onClick={() => handleJoinChat(upcomingClass.id)}
                          data-testid={`button-chat-${upcomingClass.id}`}
                          className={`flex-1 h-12 text-base font-semibold rounded-xl border-2 ${
                            chatEnabled 
                              ? 'border-blue-600 text-blue-600 hover:bg-blue-50 shadow-md' 
                              : 'border-gray-300 text-gray-500 bg-gray-50'
                          }`}
                        >
                          <MessageCircle className="h-5 w-5 mr-2" />
                          {chatEnabled ? "Open Chat" : `Chat in ${formatDistanceToNow(addHours(upcomingClass.scheduledAt, -1))}`}
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Recently Completed Classes - Enhanced */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden" data-testid="section-completed-classes">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
            <CardTitle className="flex items-center gap-3 text-xl">
              <BookOpen className="h-6 w-6" />
              Recent Classes - Feedback Available
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                {visibleCompletedClasses.length} pending
              </Badge>
            </CardTitle>
            
            {/* Filter Controls */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Filter by teacher name..."
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                  className="pl-10 bg-white/90 border-white/30 placeholder-gray-500 text-gray-800 h-10"
                  data-testid="input-teacher-filter"
                />
                {teacherFilter && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTeacherFilter("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    data-testid="button-clear-teacher-filter"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="relative flex-1">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Filter by course/subject..."
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="pl-10 bg-white/90 border-white/30 placeholder-gray-500 text-gray-800 h-10"
                  data-testid="input-course-filter"
                />
                {courseFilter && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCourseFilter("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    data-testid="button-clear-course-filter"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {visibleCompletedClasses.map((completedClass) => (
                <div key={completedClass.id} className="border rounded-2xl p-6 bg-gradient-to-r from-emerald-50 to-teal-50/50 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 mb-1">{completedClass.subject}</h3>
                      <p className="text-emerald-600 font-semibold">with {completedClass.mentorName}</p>
                    </div>
                    <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-300 animate-pulse">
                      ⏰ Feedback Pending
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-8 mb-6 text-sm text-gray-600">
                    <span className="font-medium">✅ Completed: {completedClass.completedAt.toLocaleString()}</span>
                    <span className="font-semibold text-orange-600">⏰ Feedback expires: {formatDistanceToNow(completedClass.feedbackDeadline, { addSuffix: true })}</span>
                  </div>

                  <Button
                    size="lg"
                    onClick={() => {
                      handleSubmitFeedback(completedClass.id);
                      // Mark as submitted for demo purposes
                      setTimeout(() => handleFeedbackSubmitted(completedClass.id), 1000);
                    }}
                    data-testid={`button-feedback-${completedClass.id}`}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Star className="h-5 w-5 mr-2" />
                    Submit Feedback Now
                  </Button>
                </div>
              ))}
              
              {visibleCompletedClasses.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-8xl mb-6">📚</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">All caught up!</h3>
                  <p className="text-gray-500 text-lg">No recent classes requiring feedback</p>
                  <p className="text-gray-400">Complete some classes to leave feedback!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ultra Modern Quick Actions */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-700 text-white">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Award className="h-6 w-6" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <Button 
                variant="outline" 
                className="h-32 p-6 flex-col hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                data-testid="button-find-mentor"
                onClick={handleFindMentor}
              >
                <BookOpen className="h-10 w-10 mb-3 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-bold text-lg">Find Mentor</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Browse experienced teachers</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-32 p-6 flex-col hover:bg-green-50 hover:border-green-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                data-testid="button-my-progress"
                onClick={handleMyProgress}
              >
                <TrendingUp className="h-10 w-10 mb-3 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-bold text-lg">My Progress</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Track your achievements</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-32 p-6 flex-col hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                data-testid="button-browse-courses"
                onClick={handleBrowseCourses}
              >
                <Calendar className="h-10 w-10 mb-3 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-bold text-lg">Browse Courses</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Explore new topics</span>
              </Button>
              {uiConfig?.showHelpCenter && (
                <Button 
                  variant="outline" 
                  className="h-32 p-6 flex-col hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-help-center"
                  onClick={handleHelpCenter}
                >
                  <Users className="h-10 w-10 mb-3 text-orange-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold text-lg">Help Center</span>
                  <span className="text-xs text-gray-500 mt-1 text-center">Get support & guides</span>
                </Button>
              )}
              <Button 
                variant="outline" 
                className="h-32 p-6 flex-col hover:bg-red-50 hover:border-red-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                data-testid="button-view-recordings"
                onClick={handleViewRecordings}
              >
                <Play className="h-10 w-10 mb-3 text-red-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-bold text-lg">View Recordings</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Watch past sessions</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-32 p-6 flex-col hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                data-testid="button-completed-classes"
                onClick={handleCompletedClasses}
              >
                <Star className="h-10 w-10 mb-3 text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-bold text-lg">Completed Classes</span>
                <span className="text-xs text-gray-500 mt-1 text-center">View past classes</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-32 p-6 flex-col hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                data-testid="button-all-active-classes"
                onClick={() => window.location.href = '/student/all-active-classes'}
              >
                <Calendar className="h-10 w-10 mb-3 text-indigo-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-bold text-lg">All Active Classes</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Manage your schedule</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}