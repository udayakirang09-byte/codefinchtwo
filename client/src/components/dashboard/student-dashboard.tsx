import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Video, MessageCircle, Star, BookOpen, Award, Bell, Users, TrendingUp, Home, GraduationCap, BarChart3, Mail, User } from "lucide-react";
import { formatDistanceToNow, isWithinInterval, addHours, addMinutes } from "date-fns";

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

export default function StudentDashboard() {
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [completedClasses, setCompletedClasses] = useState<CompletedClass[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Load real data from API with proper time filtering
    const loadUpcomingClasses = async () => {
      try {
        const response = await fetch('/api/classes/upcoming');
        if (response.ok) {
          const classes = await response.json();
          // Filter for next 72 hours
          const next72Hours = addHours(currentTime, 72);
          const filtered = classes.filter((cls: any) => {
            const classTime = new Date(cls.scheduledAt);
            return classTime >= currentTime && classTime <= next72Hours;
          });
          setUpcomingClasses(filtered);
        } else {
          // Fallback to sample data
          const sampleUpcoming: UpcomingClass[] = [
            {
              id: '1',
              mentorName: 'Sarah Johnson',
              subject: 'Python Basics',
              scheduledAt: new Date(Date.now() + 50 * 60 * 1000), // 50 minutes from now
              duration: 60,
              videoEnabled: false,
              chatEnabled: true,
              feedbackEnabled: false,
            },
            {
              id: '2',
              mentorName: 'Mike Chen',
              subject: 'JavaScript Functions',
              scheduledAt: new Date(Date.now() + 30 * 60 * 60 * 1000), // 30 hours from now
              duration: 90,
              videoEnabled: false,
              chatEnabled: true,
              feedbackEnabled: false,
            },
          ];
          setUpcomingClasses(sampleUpcoming);
        }
      } catch (error) {
        console.error('Failed to load upcoming classes:', error);
      }
    };

    const loadCompletedClasses = async () => {
      try {
        const response = await fetch('/api/classes/completed');
        if (response.ok) {
          const classes = await response.json();
          // Filter for last 12 hours that need feedback
          const last12Hours = addHours(currentTime, -12);
          const filtered = classes.filter((cls: any) => {
            const completedTime = new Date(cls.completedAt);
            const deadlineTime = new Date(cls.feedbackDeadline);
            return completedTime >= last12Hours && 
                   !cls.hasSubmittedFeedback && 
                   currentTime <= deadlineTime;
          });
          setCompletedClasses(filtered);
        } else {
          // Fallback to sample data
          const sampleCompleted: CompletedClass[] = [
            {
              id: '3',
              mentorName: 'Alex Rivera',
              subject: 'HTML & CSS Intro',
              completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
              feedbackDeadline: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours from now
              hasSubmittedFeedback: false,
            },
          ];
          setCompletedClasses(sampleCompleted);
        }
      } catch (error) {
        console.error('Failed to load completed classes:', error);
      }
    };

    loadUpcomingClasses();
    loadCompletedClasses();

    const sampleNotifications: Notification[] = [
      { 
        id: '1', 
        title: 'Class Reminder', 
        message: 'Python Basics class starts in 2 hours', 
        type: 'class_reminder', 
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      },
      { 
        id: '2', 
        title: 'Feedback Request', 
        message: 'Please submit feedback for HTML & CSS class', 
        type: 'feedback_request', 
        isRead: false,
        createdAt: new Date(Date.now() - 45 * 60 * 1000)
      },
      { 
        id: '3', 
        title: 'Achievement Unlocked', 
        message: 'You earned the "First Steps" badge!', 
        type: 'achievement', 
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
    ];

    setNotifications(sampleNotifications);

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

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  // Filter classes that need feedback and are still visible
  const visibleCompletedClasses = completedClasses.filter(cls => 
    isFeedbackVisible(cls.completedAt, cls.feedbackDeadline, cls.hasSubmittedFeedback)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-indigo-300/30 rounded-full blur-2xl"></div>
      </div>
      
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-gray-900/90 backdrop-blur-sm p-6 flex flex-col">
          {/* Profile Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/api/placeholder/40/40" alt="Student" />
                <AvatarFallback className="bg-purple-600 text-white">S</AvatarFallback>
              </Avatar>
              <span className="text-white font-medium text-lg">Student</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2 flex-1">
            <div 
              className="flex items-center gap-3 px-4 py-3 text-white bg-purple-600 rounded-lg cursor-pointer"
              data-testid="nav-home"
            >
              <Home size={20} />
              <span className="font-medium">Home</span>
            </div>
            <div 
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
              data-testid="nav-courses"
              onClick={() => window.location.href = '/courses'}
            >
              <BookOpen size={20} />
              <span className="font-medium">Courses</span>
            </div>
            <div 
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
              data-testid="nav-grades"
              onClick={() => window.location.href = '/student/progress'}
            >
              <BarChart3 size={20} />
              <span className="font-medium">Grades</span>
            </div>
            <div 
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
              data-testid="nav-messages"
            >
              <Mail size={20} />
              <span className="font-medium">Messages</span>
            </div>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-white/80">Welcome back! Here's what's happening with your learning.</p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  data-testid="button-notifications"
                >
                  <Bell size={16} className="mr-2" />
                  Notifications
                </Button>
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/api/placeholder/40/40" alt="Student" />
                  <AvatarFallback className="bg-purple-600 text-white">S</AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Upcoming Classes */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-white mb-6">Upcoming Classes</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {/* Sample upcoming classes */}
                  {upcomingClasses.slice(0, 4).map((upcomingClass, index) => (
                    <Card 
                      key={upcomingClass.id} 
                      className={`${
                        index === 0 ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 
                        index === 1 ? 'bg-gray-100' : 
                        'bg-gray-100'
                      } border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer`}
                      data-testid={`card-class-${upcomingClass.id}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`font-bold text-lg ${index === 0 ? 'text-white' : 'text-gray-800'}`}>
                            {upcomingClass.subject}
                          </h3>
                          <div className={`p-2 rounded-full ${index === 0 ? 'bg-white/20' : 'bg-purple-100'}`}>
                            <Clock size={16} className={index === 0 ? 'text-white' : 'text-purple-600'} />
                          </div>
                        </div>
                        
                        <p className={`text-sm mb-3 ${index === 0 ? 'text-white/80' : 'text-gray-600'}`}>
                          {upcomingClass.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className={`text-sm mb-4 ${index === 0 ? 'text-white/90' : 'text-gray-700'}`}>
                          {upcomingClass.scheduledAt.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                        
                        {isVideoEnabled(upcomingClass.scheduledAt) && (
                          <Button
                            size="sm"
                            className={index === 0 ? 'bg-white/20 hover:bg-white/30 text-white border-white/30' : 'bg-purple-600 hover:bg-purple-700 text-white'}
                            onClick={() => handleJoinVideo(upcomingClass.id)}
                            data-testid={`button-join-${upcomingClass.id}`}
                          >
                            <Video size={14} className="mr-2" />
                            Join
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Fill empty slots */}
                  {[...Array(Math.max(0, 4 - upcomingClasses.length))].map((_, index) => (
                    <Card key={`empty-${index}`} className="bg-gray-100/50 border-gray-200 border-dashed shadow-sm">
                      <CardContent className="p-6 text-center">
                        <div className="text-gray-400 mb-2">
                          <Calendar size={24} className="mx-auto mb-2" />
                        </div>
                        <p className="text-gray-500 text-sm">No class scheduled</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Progress Tracking */}
                <Card className="bg-white/95 backdrop-blur-sm border-none shadow-lg mb-6">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Progress Tracking</h3>
                    
                    {/* Circular Progress - Simplified */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative w-32 h-32">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-600 rounded-full p-2">
                          <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-purple-600">124%</div>
                              <div className="text-xs text-gray-600">3,050 pts</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Subject Progress Bars */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Math</span>
                          <span className="text-sm text-purple-600 font-medium">8 lvl</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">English</span>
                          <span className="text-sm text-purple-600 font-medium">9 lvl</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Notification Panel */}
                <Card className="bg-white/95 backdrop-blur-sm border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Bell size={20} />
                      Notification Panel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-800">Recent Alerts</p>
                          <p className="text-gray-600">Your math assignment is due tomorrow</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="text-sm">
                          <p className="text-gray-600">New message from mentor Sarah</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mentor Profiles */}
                <Card className="bg-white/95 backdrop-blur-sm border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-800">Mentor Profiles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Avatar className="w-12 h-12 mx-auto mb-3">
                          <AvatarImage src="/api/placeholder/48/48" alt="Gucari" />
                          <AvatarFallback className="bg-blue-600 text-white">G</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-gray-800 text-sm">Gucari</p>
                        <p className="text-xs text-gray-600">Mentors</p>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Avatar className="w-12 h-12 mx-auto mb-3">
                          <AvatarImage src="/api/placeholder/48/48" alt="Atrieyus" />
                          <AvatarFallback className="bg-purple-600 text-white">A</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-gray-800 text-sm">Atrieyus</p>
                        <p className="text-xs text-gray-600">Mentors</p>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Avatar className="w-12 h-12 mx-auto mb-3">
                          <AvatarImage src="/api/placeholder/48/48" alt="Gontan" />
                          <AvatarFallback className="bg-green-600 text-white">G</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-gray-800 text-sm">Gontan</p>
                        <p className="text-xs text-gray-600">Mentors</p>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Avatar className="w-12 h-12 mx-auto mb-3">
                          <AvatarImage src="/api/placeholder/48/48" alt="Mentors" />
                          <AvatarFallback className="bg-orange-600 text-white">M</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-gray-800 text-sm">Mentors</p>
                        <p className="text-xs text-gray-600">Mentors</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}