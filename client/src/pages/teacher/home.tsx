import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar,
  Users,
  BookOpen,
  DollarSign,
  Clock,
  MessageSquare,
  Video,
  Star,
  TrendingUp,
  FileText,
  Settings,
  Bell,
  X,
  TestTube
} from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { apiRequest } from '@/lib/queryClient';

export default function TeacherHome() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch teacher profile data
  const { data: teacherProfile } = useQuery({
    queryKey: ['/api/teacher/profile', { teacherId: 'teacher@codeconnect.com' }],
    retry: false,
  });

  // Mock data - in production this would come from real APIs
  const stats = {
    totalStudents: 47,
    monthlyEarnings: 3250,
    upcomingSessions: 8,
    completedSessions: 156,
    averageRating: 4.8,
    totalHours: 342
  };

  const upcomingSessions = [
    {
      id: 1,
      studentName: "Alex Johnson",
      subject: "React.js Fundamentals",
      time: "2:00 PM",
      date: "Today",
      type: "video",
      duration: "60 min"
    },
    {
      id: 2,
      studentName: "Sarah Chen",
      subject: "Python Data Structures",
      time: "4:30 PM",
      date: "Today",
      type: "chat",
      duration: "45 min"
    },
    {
      id: 3,
      studentName: "Mike Rodriguez",
      subject: "JavaScript ES6",
      time: "10:00 AM",
      date: "Tomorrow",
      type: "video",
      duration: "90 min"
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: "session_completed",
      message: "Completed session with Emma Wilson",
      time: "2 hours ago",
      icon: <Video className="h-4 w-4" />
    },
    {
      id: 2,
      type: "rating_received",
      message: "Received 5-star rating from David Kim",
      time: "4 hours ago",
      icon: <Star className="h-4 w-4" />
    },
    {
      id: 3,
      type: "new_booking",
      message: "New booking from Jennifer Liu",
      time: "6 hours ago",
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: 4,
      type: "message_received",
      message: "New message from Tom Anderson",
      time: "8 hours ago",
      icon: <MessageSquare className="h-4 w-4" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, Teacher!
              </h1>
              <p className="text-gray-600 mt-2">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" data-testid="button-notifications">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Link href="/teacher/manage-schedule">
                <Button data-testid="button-manage-schedule">
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage Schedule
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-students">{stats.totalStudents}</div>
              <p className="text-xs opacity-90">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
              <DollarSign className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="monthly-earnings">${stats.monthlyEarnings}</div>
              <p className="text-xs opacity-90">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +18% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
              <Clock className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="upcoming-sessions">{stats.upcomingSessions}</div>
              <p className="text-xs opacity-90">Next session in 2 hours</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="average-rating">{stats.averageRating}</div>
              <p className="text-xs opacity-90">Based on {stats.completedSessions} sessions</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2">
            <Card className="!shadow-2xl !bg-gradient-to-br !from-white !via-gray-50 !to-blue-50 !border-0 !rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Sessions
                </CardTitle>
                <CardDescription>Your scheduled teaching sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingSessions.map((session, index) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`session-${index}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {session.studentName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-semibold" data-testid={`session-student-${index}`}>{session.studentName}</h3>
                          <p className="text-sm text-gray-600" data-testid={`session-subject-${index}`}>{session.subject}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" data-testid={`session-type-${index}`}>
                              {session.type === 'video' ? <Video className="w-3 h-3 mr-1" /> : <MessageSquare className="w-3 h-3 mr-1" />}
                              {session.type}
                            </Badge>
                            <span className="text-xs text-gray-500" data-testid={`session-duration-${index}`}>{session.duration}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" data-testid={`session-time-${index}`}>{session.time}</p>
                        <p className="text-sm text-gray-600" data-testid={`session-date-${index}`}>{session.date}</p>
                        <Button size="sm" className="mt-2" data-testid={`session-join-${index}`}>
                          Join Session
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t">
                  <Link href="/teacher/manage-schedule">
                    <Button variant="outline" className="w-full" data-testid="button-view-all-sessions">
                      View All Sessions
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed & Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="!shadow-2xl !bg-gradient-to-br !from-white !via-gray-50 !to-purple-50 !border-0 !rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/teacher/create-course">
                  <Button className="w-full" data-testid="button-create-course">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Create Course
                  </Button>
                </Link>
                <Link href="/teacher/manage-schedule">
                  <Button variant="outline" className="w-full" data-testid="button-set-availability">
                    <Calendar className="w-4 h-4 mr-2" />
                    Set Availability
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" data-testid="button-view-analytics">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
                <Dialog open={showProfile} onOpenChange={setShowProfile}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" data-testid="button-manage-profile">
                      <FileText className="w-4 h-4 mr-2" />
                      Teacher Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Teacher Profile Details
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Qualifications Section */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-blue-700">Educational Qualifications</h3>
                        {teacherProfile?.qualifications && teacherProfile.qualifications.length > 0 ? (
                          <div className="grid gap-4">
                            {teacherProfile.qualifications.map((qual, index) => (
                              <div key={index} className="border rounded-lg p-4 bg-blue-50">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <span className="text-sm font-medium text-gray-600">Qualification:</span>
                                    <p className="text-sm mt-1">{qual.qualification || 'Not specified'}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-600">Specialization:</span>
                                    <p className="text-sm mt-1">{qual.specialization || 'Not specified'}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-600">Score/Grade:</span>
                                    <p className="text-sm mt-1">{qual.score || 'Not specified'}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 bg-gray-50 p-4 rounded-lg">
                            <p>No qualification details available. Please update your profile during signup.</p>
                          </div>
                        )}
                      </div>

                      {/* Subjects Section */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-green-700">Teaching Subjects & Experience</h3>
                        {teacherProfile?.subjects && teacherProfile.subjects.length > 0 ? (
                          <div className="grid gap-4">
                            {teacherProfile.subjects.map((subj, index) => (
                              <div key={index} className="border rounded-lg p-4 bg-green-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-sm font-medium text-gray-600">Subject:</span>
                                    <p className="text-sm mt-1">{subj.subject || 'Not specified'}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-600">Experience:</span>
                                    <p className="text-sm mt-1">{subj.experience || 'Not specified'}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 bg-gray-50 p-4 rounded-lg">
                            <p>No subject details available. Please update your profile during signup.</p>
                          </div>
                        )}
                      </div>

                      {/* Additional Profile Info */}
                      {teacherProfile && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-purple-700">Additional Information</h3>
                          <div className="bg-purple-50 border rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm font-medium text-gray-600">Profile Complete:</span>
                                <p className="text-sm mt-1">
                                  <Badge variant={teacherProfile.isProfileComplete ? "default" : "secondary"}>
                                    {teacherProfile.isProfileComplete ? "Complete" : "Incomplete"}
                                  </Badge>
                                </p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Teaching Experience:</span>
                                <p className="text-sm mt-1">{teacherProfile.totalTeachingExperience || 0} years</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="!shadow-2xl !bg-gradient-to-br !from-white !via-gray-50 !to-green-50 !border-0 !rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={activity.id} className="flex items-start gap-3" data-testid={`activity-${index}`}>
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm" data-testid={`activity-message-${index}`}>{activity.message}</p>
                        <p className="text-xs text-gray-500" data-testid={`activity-time-${index}`}>{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Testing */}
            <Card className="!shadow-2xl !bg-gradient-to-r !from-orange-500 !via-red-500 !to-pink-500 text-white !border-0 !rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  System Testing
                </CardTitle>
                <CardDescription className="text-orange-100">
                  Run comprehensive tests with teacher credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
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
                    variant="secondary" 
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    data-testid="button-run-all-tests-teacher"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Run All Tests (Teacher)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card className="!shadow-2xl !bg-gradient-to-br !from-white !via-gray-50 !to-blue-50 !border-0 !rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Session Completion Rate</span>
                    <span data-testid="completion-rate">96%</span>
                  </div>
                  <Progress value={96} className="h-2 mt-1" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Student Satisfaction</span>
                    <span data-testid="satisfaction-rate">4.8/5.0</span>
                  </div>
                  <Progress value={96} className="h-2 mt-1" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Response Time</span>
                    <span data-testid="response-time">&lt; 2 hours</span>
                  </div>
                  <Progress value={85} className="h-2 mt-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}