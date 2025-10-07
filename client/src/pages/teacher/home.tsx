import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  TestTube,
  Wallet,
  Edit2
} from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function TeacherHome() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfile, setShowProfile] = useState(false);
  const [editingHourlyRate, setEditingHourlyRate] = useState(false);
  const [newHourlyRate, setNewHourlyRate] = useState('');
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [viewingStudents, setViewingStudents] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch teacher profile data
  const { data: teacherProfile } = useQuery<{
    qualifications?: { qualification: string; specialization: string; score: string; }[];
    subjects?: { subject: string; experience: string; }[];
    isProfileComplete?: boolean;
    totalTeachingExperience?: number;
  }>({
    queryKey: ['/api/teacher/profile', { teacherId: 'teacher@codeconnect.com' }],
    retry: false,
  });

  // Fetch real teacher stats from API
  const { data: stats = {
    totalStudents: 0,
    monthlyEarnings: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    averageRating: 0,
    totalHours: 0
  }, isLoading: statsLoading } = useQuery({
    queryKey: ['teacher-stats', 'teacher@codeconnect.com'], // Use authenticated user email
    queryFn: async () => {
      const response = await fetch('/api/teacher/stats?teacherId=teacher@codeconnect.com');
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      return response.json();
    }
  });

  // Fetch real teacher classes from API
  const { data: teacherClasses = [], isLoading: classesLoading } = useQuery({
    queryKey: ['teacher-classes', 'teacher@codeconnect.com'], // Use authenticated user email
    queryFn: async () => {
      const response = await fetch('/api/teacher/classes?teacherId=teacher@codeconnect.com');
      if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.status}`);
      }
      return response.json();
    }
  });

  // Fetch mentor data for the logged-in user
  const { data: mentorData, isLoading: mentorLoading } = useQuery<{
    mentor: {
      id: string;
      hourlyRate: string;
    };
  }>({
    queryKey: ['/api/users', user?.email, 'mentor'],
    enabled: !!user?.email,
  });

  // Fetch teacher courses
  const { data: teacherCourses = [], isLoading: coursesLoading } = useQuery<any[]>({
    queryKey: ['/api/teacher/courses', 'teacher@codeconnect.com'],
    queryFn: async () => {
      const response = await fetch('/api/teacher/courses?teacherId=teacher@codeconnect.com');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      return response.json();
    }
  });

  // Fetch students for a course
  const { data: courseStudents = [], refetch: refetchStudents } = useQuery<any[]>({
    queryKey: ['/api/courses', viewingStudents?.id, 'students'],
    enabled: !!viewingStudents?.id,
    queryFn: async () => {
      const response = await fetch(`/api/courses/${viewingStudents.id}/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      return response.json();
    }
  });

  // Mutation to update hourly rate
  const updateHourlyRateMutation = useMutation({
    mutationFn: async (hourlyRate: string) => {
      if (!mentorData?.mentor?.id) {
        throw new Error("Mentor ID not found");
      }
      const response = await apiRequest("PATCH", `/api/mentors/${mentorData.mentor.id}/hourly-rate`, { hourlyRate });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your hourly rate has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.email, 'mentor'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mentors'] });
      setEditingHourlyRate(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update hourly rate. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to update course
  const updateCourseMutation = useMutation({
    mutationFn: async ({ courseId, courseData }: { courseId: string; courseData: any }) => {
      return apiRequest('PATCH', `/api/teacher/courses/${courseId}?teacherId=teacher@codeconnect.com`, courseData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/courses'] });
      setEditingCourse(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    }
  });

  const handleSaveHourlyRate = () => {
    const rate = parseFloat(newHourlyRate);
    if (isNaN(rate) || rate <= 0) {
      toast({
        title: "Invalid Rate",
        description: "Please enter a valid hourly rate greater than 0.",
        variant: "destructive",
      });
      return;
    }
    updateHourlyRateMutation.mutate(newHourlyRate);
  };

  // Process upcoming sessions from real data with proper null handling
  const upcomingSessions = Array.isArray(teacherClasses) ? teacherClasses
    .filter((booking: any) => {
      // Only show scheduled bookings with valid future dates and student data
      const hasValidStudent = booking.student?.user?.firstName || booking.studentFirstName;
      const isFutureBooking = booking.status === 'scheduled' && new Date(booking.scheduledAt) > new Date();
      return isFutureBooking && hasValidStudent;
    })
    .slice(0, 3) // Show only first 3 upcoming sessions
    .map((booking: any) => {
      const scheduledDate = new Date(booking.scheduledAt);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const isToday = scheduledDate.toDateString() === today.toDateString();
      const isTomorrow = scheduledDate.toDateString() === tomorrow.toDateString();
      
      // Get student name from either nested object or flat structure
      const firstName = booking.student?.user?.firstName || booking.studentFirstName || 'Unknown';
      const lastName = booking.student?.user?.lastName || booking.studentLastName || 'Student';
      
      return {
        id: booking.id,
        studentName: `${firstName} ${lastName}`.trim(),
        subject: booking.subject || booking.notes || 'Programming Session',
        time: scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        date: isToday ? 'Today' : isTomorrow ? 'Tomorrow' : scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        type: "video", // Default to video for now
        duration: `${booking.duration || 60} min`
      };
    }) : [];

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
              <div className="text-2xl font-bold" data-testid="total-students">{statsLoading ? "..." : stats.totalStudents}</div>
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
              <div className="text-2xl font-bold" data-testid="monthly-earnings">{statsLoading ? "..." : `$${stats.monthlyEarnings || 0}`}</div>
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
              <div className="text-2xl font-bold" data-testid="upcoming-sessions">{statsLoading ? "..." : stats.upcomingSessions || 0}</div>
              <p className="text-xs opacity-90">Next session in 2 hours</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="average-rating">{statsLoading ? "..." : stats.averageRating || 0}</div>
              <p className="text-xs opacity-90">Based on {statsLoading ? "..." : stats.completedSessions || 0} sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Hourly Rate Configuration */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Hourly Rate Configuration
              </span>
              {mentorData?.mentor && !editingHourlyRate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewHourlyRate(mentorData.mentor.hourlyRate || '');
                    setEditingHourlyRate(true);
                  }}
                  data-testid="button-edit-hourly-rate"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Rate
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              Set your hourly rate that will be displayed to students when they search for teachers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mentorLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : editingHourlyRate ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newHourlyRate}
                    onChange={(e) => setNewHourlyRate(e.target.value)}
                    placeholder="Enter your hourly rate"
                    className="mt-2"
                    data-testid="input-hourly-rate"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveHourlyRate}
                    disabled={updateHourlyRateMutation.isPending}
                    data-testid="button-save-hourly-rate"
                  >
                    {updateHourlyRateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingHourlyRate(false);
                      setNewHourlyRate('');
                    }}
                    disabled={updateHourlyRateMutation.isPending}
                    data-testid="button-cancel-edit-hourly-rate"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : mentorData?.mentor ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Rate</p>
                  <p className="text-3xl font-bold text-green-600" data-testid="text-current-hourly-rate">
                    ${mentorData.mentor.hourlyRate || '0.00'}/hour
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    This rate is displayed on your teacher profile and the search page
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No mentor profile found. Please contact support.</div>
            )}
          </CardContent>
        </Card>

        {/* My Courses Section */}
        <Card className="bg-gradient-to-br from-white via-orange-50 to-red-50 shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Courses
              </CardTitle>
              <Link href="/teacher/create-course">
                <Button size="sm" data-testid="button-create-new-course">
                  {teacherCourses.length} courses
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
              <div className="text-gray-500">Loading courses...</div>
            ) : teacherCourses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No courses created yet</p>
                <Link href="/teacher/create-course">
                  <Button data-testid="button-create-first-course">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Create Your First Course
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {teacherCourses.map((course: any) => (
                  <div key={course.id} className="border rounded-lg p-4 bg-white" data-testid={`course-card-${course.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg" data-testid={`course-title-${course.id}`}>{course.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1" data-testid={`course-description-${course.id}`}>{course.description}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <Badge variant="outline" data-testid={`course-category-${course.id}`}>{course.category}</Badge>
                          <Badge variant="outline" data-testid={`course-level-${course.id}`}>{course.difficulty}</Badge>
                          <span className="text-sm text-gray-600" data-testid={`course-maxClasses-${course.id}`}>{course.maxClasses} classes</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={course.status === 'active' ? 'bg-green-500' : 'bg-gray-500'} data-testid={`course-status-${course.id}`}>
                            {course.status === 'active' ? '● Active' : '● Inactive'}
                          </Badge>
                          <span className="text-lg font-semibold text-green-600" data-testid={`course-price-${course.id}`}>${course.price}</span>
                          <span className="text-sm text-gray-500">Max: {course.maxStudents} students</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCourse(course)}
                          data-testid={`button-edit-course-${course.id}`}
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit Course
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setViewingStudents(course)}
                          data-testid={`button-view-students-${course.id}`}
                        >
                          <Users className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-white via-gray-50 to-blue-50 shadow-2xl border-0 rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Sessions
                </CardTitle>
                <CardDescription>Your scheduled teaching sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-gray-500">Loading upcoming sessions...</div>
                    </div>
                  ) : upcomingSessions.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-gray-500">No upcoming sessions scheduled</div>
                    </div>
                  ) : (
                    upcomingSessions.map((session, index) => (
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
                  )))}
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
            <Card className="bg-gradient-to-br from-white via-gray-50 to-purple-50 shadow-2xl border-0 rounded-2xl overflow-hidden">
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
                <Link href="/teacher/payment-config">
                  <Button variant="outline" className="w-full bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200" data-testid="button-payment-settings">
                    <Wallet className="w-4 h-4 mr-2" />
                    Payment Settings
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
                            {teacherProfile.qualifications.map((qual: { qualification: string; specialization: string; score: string; }, index: number) => (
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
                            {teacherProfile.subjects.map((subj: { subject: string; experience: string; }, index: number) => (
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
                                  <Badge variant={teacherProfile?.isProfileComplete ? "default" : "secondary"}>
                                    {teacherProfile?.isProfileComplete ? "Complete" : "Incomplete"}
                                  </Badge>
                                </p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Teaching Experience:</span>
                                <p className="text-sm mt-1">{teacherProfile?.totalTeachingExperience || 0} years</p>
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
            <Card className="bg-gradient-to-br from-white via-gray-50 to-green-50 shadow-2xl border-0 rounded-2xl overflow-hidden">
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

            {/* Performance Overview */}
            <Card className="bg-gradient-to-br from-white via-gray-50 to-blue-50 shadow-2xl border-0 rounded-2xl overflow-hidden">
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

        {/* Edit Course Dialog */}
        <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
            </DialogHeader>
            {editingCourse && (
              <form onSubmit={(e) => {
                e.preventDefault();
                updateCourseMutation.mutate({
                  courseId: editingCourse.id,
                  courseData: {
                    title: editingCourse.title,
                    description: editingCourse.description,
                    category: editingCourse.category,
                    difficulty: editingCourse.difficulty,
                    price: editingCourse.price,
                    maxStudents: editingCourse.maxStudents,
                    maxClasses: editingCourse.maxClasses,
                    status: editingCourse.status
                  }
                });
              }} className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Course Title</Label>
                  <Input
                    id="edit-title"
                    value={editingCourse.title}
                    onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={editingCourse.description}
                    onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-category">Category</Label>
                    <Input
                      id="edit-category"
                      value={editingCourse.category}
                      onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-difficulty">Difficulty</Label>
                    <Input
                      id="edit-difficulty"
                      value={editingCourse.difficulty}
                      onChange={(e) => setEditingCourse({ ...editingCourse, difficulty: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-price">Price ($)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      value={editingCourse.price}
                      onChange={(e) => setEditingCourse({ ...editingCourse, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-maxStudents">Max Students</Label>
                    <Input
                      id="edit-maxStudents"
                      type="number"
                      value={editingCourse.maxStudents}
                      onChange={(e) => setEditingCourse({ ...editingCourse, maxStudents: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-maxClasses">Max Classes</Label>
                    <Input
                      id="edit-maxClasses"
                      type="number"
                      value={editingCourse.maxClasses}
                      onChange={(e) => setEditingCourse({ ...editingCourse, maxClasses: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={updateCourseMutation.isPending}>
                    {updateCourseMutation.isPending ? "Updating..." : "Update Course"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingCourse(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* View Students Dialog */}
        <Dialog open={!!viewingStudents} onOpenChange={(open) => !open && setViewingStudents(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingStudents?.title} - Enrolled Students</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {courseStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No students enrolled in this course yet
                </div>
              ) : (
                <div className="space-y-2">
                  {courseStudents.map((student: any, index: number) => (
                    <div key={student.id || index} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{student.firstName} {student.lastName}</p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={() => setViewingStudents(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}