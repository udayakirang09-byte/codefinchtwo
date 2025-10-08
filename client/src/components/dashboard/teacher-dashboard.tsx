import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Video, MessageCircle, Users, BookOpen, DollarSign, Bell, TrendingUp, CreditCard, CheckCircle, Save, Edit2, Plus } from "lucide-react";
import { formatDistanceToNow, addHours, addMinutes } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

interface TeacherStats {
  totalStudents: number;
  monthlyEarnings: number;
  averageRating: number;
  completedSessions: number;
  totalEarnings?: number;
  averageSessionEarnings?: number;
  totalReviews?: number;
  feedbackResponseRate?: number;
  totalHours?: number;
}

interface TeacherNotification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface TeacherReview {
  id: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface TeacherCourse {
  id: string;
  name: string;
  subject: string;
  description?: string;
  price: number;
  schedule?: any;
}

interface TeacherSubject {
  id: string;
  subject: string;
  experience: string;
  classFee: number;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEarningsReport, setShowEarningsReport] = useState(false);
  const [showStudentFeedback, setShowStudentFeedback] = useState(false);
  const [showCompletedClasses, setShowCompletedClasses] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingFee, setEditingFee] = useState<string>("");
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newExperience, setNewExperience] = useState("");
  const [newClassFee, setNewClassFee] = useState("500");
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [upiId, setUpiId] = useState("");
  
  // Fetch teacher's classes from API
  const { data: teacherClasses = [], isLoading: classesLoading, error: classesError } = useQuery<UpcomingClass[]>({
    queryKey: [`/api/teacher/classes?teacherId=${user?.id}`],
    enabled: !!user?.id
  });
  
  // Fetch teacher stats from API
  const { data: stats = {
    totalStudents: 0,
    monthlyEarnings: 0,
    averageRating: 0,
    completedSessions: 0
  }, isLoading: statsLoading, error: statsError } = useQuery<TeacherStats>({
    queryKey: [`/api/teacher/stats?teacherId=${user?.id}`],
    enabled: !!user?.id
  });
  
  // Fetch teacher notifications from API
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<TeacherNotification[]>({
    queryKey: [`/api/teacher/notifications?teacherId=${user?.id}`],
    enabled: !!user?.id
  });
  
  // Fetch teacher reviews from API
  const { data: teacherReviews = [], isLoading: reviewsLoading } = useQuery<TeacherReview[]>({
    queryKey: [`/api/teacher/reviews?teacherId=${user?.id}`],
    enabled: !!user?.id
  });

  // Fetch teacher courses from API
  const { data: teacherCourses = [], isLoading: coursesLoading } = useQuery<TeacherCourse[]>({
    queryKey: [`/api/teacher/courses?teacherId=${user?.id}`],
    enabled: !!user?.id
  });

  // Fetch mentor data first
  const { data: mentorData } = useQuery<{id: string; userId: string; fullName: string; bio?: string; upiId?: string}>({
    queryKey: [`/api/mentors/by-user/${user?.id}`],
    enabled: !!user?.id
  });

  // Fetch teacher audio analytics from API (chains two requests)
  const { data: audioAnalytics, isLoading: audioLoading } = useQuery<{
    totalClasses: number;
    encourageInvolvement: number;
    pleasantCommunication: number;
    avoidPersonalDetails: number;
    overallScore: number;
  }>({
    queryKey: [`/api/teacher/audio-aggregate/${mentorData?.id}`],
    enabled: !!mentorData?.id
  });

  // Fetch available subjects from the platform
  const { data: availableSubjects = [] } = useQuery<Array<{id: string; name: string}>>({
    queryKey: ['/api/subjects'],
  });

  const { data: teacherSubjects = [], isLoading: subjectsLoading } = useQuery<TeacherSubject[]>({
    queryKey: [`/api/teacher-subjects/${mentorData?.id}/fees`],
    enabled: !!mentorData?.id
  });

  // Mutation for updating subject fee
  const updateSubjectFeeMutation = useMutation({
    mutationFn: async ({ subjectId, classFee }: { subjectId: string; classFee: number }) => {
      return apiRequest('PATCH', `/api/teacher-subjects/${subjectId}/fee`, { classFee });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class fee updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher-subjects/${mentorData?.id}/fees`] });
      setEditingSubjectId(null);
      setEditingFee("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update class fee",
        variant: "destructive",
      });
    }
  });

  // Mutation for adding new subject
  const addSubjectMutation = useMutation({
    mutationFn: async ({ mentorId, subject, experience, classFee }: { mentorId: string; subject: string; experience: string; classFee: number }) => {
      return apiRequest('POST', '/api/teacher-subjects/add', { mentorId, subject, experience, classFee });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject added successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher-subjects/${mentorData?.id}/fees`] });
      setShowAddSubjectDialog(false);
      setNewSubject("");
      setNewExperience("");
      setNewClassFee("500");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add subject",
        variant: "destructive",
      });
    }
  });

  // Mutation for updating UPI ID
  const updateUpiMutation = useMutation({
    mutationFn: async ({ mentorId, upiId }: { mentorId: string; upiId: string }) => {
      return apiRequest('PUT', `/api/mentors/${mentorId}/upi`, { upiId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "UPI ID updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/mentors/by-user/${user?.id}`] });
      setIsEditingUpi(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update UPI ID",
        variant: "destructive",
      });
    }
  });

  // Initialize UPI ID from mentor data
  useEffect(() => {
    if (mentorData?.upiId && !isEditingUpi) {
      setUpiId(mentorData.upiId);
    }
  }, [mentorData, isEditingUpi]);
  
  const upcomingClasses = Array.isArray(teacherClasses) ? teacherClasses.filter((booking: any) => {
    const scheduledAt = new Date(booking.scheduledAt);
    const classEndTime = addMinutes(scheduledAt, booking.duration + 2); // class end + 2 minutes
    return booking.status === 'scheduled' && new Date() < classEndTime;
  }).map((booking: any) => ({
    id: booking.id,
    studentName: booking.student?.user?.firstName + ' ' + (booking.student?.user?.lastName || ''),
    subject: booking.subject,
    scheduledAt: new Date(booking.scheduledAt),
    duration: booking.duration,
    videoEnabled: true,
    chatEnabled: true,
    rate: booking.amount
  })) : [];
  
  const completedClasses = Array.isArray(teacherClasses) ? teacherClasses.filter((booking: any) => {
    // Only show classes where feedback has been submitted (status === 'completed')
    // This matches the same condition as the student's Completed Classes page
    return booking.status === 'completed';
  }).map((booking: any) => ({
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
    const fiveMinutesBefore = addMinutes(scheduledAt, -5);
    return currentTime >= fiveMinutesBefore && currentTime <= addHours(scheduledAt, 2);
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

        {/* Teacher Audio Analytics Performance Card */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-rose-500 to-pink-600 text-white">
            <CardTitle className="flex items-center gap-3 text-xl">
              <TrendingUp className="h-6 w-6" />
              Class Quality Analytics
              {audioAnalytics && (
                <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                  Based on {audioAnalytics.totalClasses} classes
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {audioLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading analytics...</div>
              </div>
            ) : !audioAnalytics ? (
              <div className="text-center py-12">
                <div className="bg-pink-50 rounded-2xl p-8 border border-pink-200">
                  <TrendingUp className="h-16 w-16 text-pink-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Analytics Data Yet</h3>
                  <p className="text-gray-600">
                    Complete a few classes to see your teaching quality metrics and performance analytics.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Encourage Involvement Score */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 text-center">
                  <div className="mb-3">
                    <div 
                      className={`text-4xl font-bold mb-2 ${
                        audioAnalytics.encourageInvolvement >= 9 
                          ? 'text-green-600' 
                          : audioAnalytics.encourageInvolvement >= 8 
                            ? 'text-blue-600' 
                            : 'text-red-600'
                      }`}
                      data-testid="metric-encourage-involvement"
                    >
                      {audioAnalytics.encourageInvolvement.toFixed(1)}
                      <span className="text-lg text-gray-500">/10</span>
                    </div>
                    <div 
                      className={`w-full h-2 rounded-full ${
                        audioAnalytics.encourageInvolvement >= 9 
                          ? 'bg-green-200' 
                          : audioAnalytics.encourageInvolvement >= 8 
                            ? 'bg-blue-200' 
                            : 'bg-red-200'
                      }`}
                    >
                      <div 
                        className={`h-full rounded-full ${
                          audioAnalytics.encourageInvolvement >= 9 
                            ? 'bg-green-500' 
                            : audioAnalytics.encourageInvolvement >= 8 
                              ? 'bg-blue-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${(audioAnalytics.encourageInvolvement / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm">Student Involvement</h4>
                  <p className="text-xs text-gray-600 mt-1">Encouraging participation</p>
                </div>

                {/* Pleasant Communication Score */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 text-center">
                  <div className="mb-3">
                    <div 
                      className={`text-4xl font-bold mb-2 ${
                        audioAnalytics.pleasantCommunication >= 9 
                          ? 'text-green-600' 
                          : audioAnalytics.pleasantCommunication >= 8 
                            ? 'text-blue-600' 
                            : 'text-red-600'
                      }`}
                      data-testid="metric-pleasant-communication"
                    >
                      {audioAnalytics.pleasantCommunication.toFixed(1)}
                      <span className="text-lg text-gray-500">/10</span>
                    </div>
                    <div 
                      className={`w-full h-2 rounded-full ${
                        audioAnalytics.pleasantCommunication >= 9 
                          ? 'bg-green-200' 
                          : audioAnalytics.pleasantCommunication >= 8 
                            ? 'bg-blue-200' 
                            : 'bg-red-200'
                      }`}
                    >
                      <div 
                        className={`h-full rounded-full ${
                          audioAnalytics.pleasantCommunication >= 9 
                            ? 'bg-green-500' 
                            : audioAnalytics.pleasantCommunication >= 8 
                              ? 'bg-blue-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${(audioAnalytics.pleasantCommunication / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm">Communication Style</h4>
                  <p className="text-xs text-gray-600 mt-1">Pleasant & professional</p>
                </div>

                {/* Avoid Personal Details Score */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-xl p-6 text-center">
                  <div className="mb-3">
                    <div 
                      className={`text-4xl font-bold mb-2 ${
                        audioAnalytics.avoidPersonalDetails >= 9 
                          ? 'text-green-600' 
                          : audioAnalytics.avoidPersonalDetails >= 8 
                            ? 'text-blue-600' 
                            : 'text-red-600'
                      }`}
                      data-testid="metric-avoid-personal-details"
                    >
                      {audioAnalytics.avoidPersonalDetails.toFixed(1)}
                      <span className="text-lg text-gray-500">/10</span>
                    </div>
                    <div 
                      className={`w-full h-2 rounded-full ${
                        audioAnalytics.avoidPersonalDetails >= 9 
                          ? 'bg-green-200' 
                          : audioAnalytics.avoidPersonalDetails >= 8 
                            ? 'bg-blue-200' 
                            : 'bg-red-200'
                      }`}
                    >
                      <div 
                        className={`h-full rounded-full ${
                          audioAnalytics.avoidPersonalDetails >= 9 
                            ? 'bg-green-500' 
                            : audioAnalytics.avoidPersonalDetails >= 8 
                              ? 'bg-blue-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${(audioAnalytics.avoidPersonalDetails / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm">Professional Boundaries</h4>
                  <p className="text-xs text-gray-600 mt-1">Avoiding personal topics</p>
                </div>

                {/* Overall Score */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200 rounded-xl p-6 text-center">
                  <div className="mb-3">
                    <div 
                      className={`text-4xl font-bold mb-2 ${
                        audioAnalytics.overallScore >= 9 
                          ? 'text-green-600' 
                          : audioAnalytics.overallScore >= 8 
                            ? 'text-blue-600' 
                            : 'text-red-600'
                      }`}
                      data-testid="metric-overall-score"
                    >
                      {audioAnalytics.overallScore.toFixed(1)}
                      <span className="text-lg text-gray-500">/10</span>
                    </div>
                    <div 
                      className={`w-full h-2 rounded-full ${
                        audioAnalytics.overallScore >= 9 
                          ? 'bg-green-200' 
                          : audioAnalytics.overallScore >= 8 
                            ? 'bg-blue-200' 
                            : 'bg-red-200'
                      }`}
                    >
                      <div 
                        className={`h-full rounded-full ${
                          audioAnalytics.overallScore >= 9 
                            ? 'bg-green-500' 
                            : audioAnalytics.overallScore >= 8 
                              ? 'bg-blue-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${(audioAnalytics.overallScore / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm">Overall Excellence</h4>
                  <p className="text-xs text-gray-600 mt-1">Combined class quality</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Fee Configuration Section */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
            <CardTitle className="flex items-center gap-3 text-xl">
              <DollarSign className="h-6 w-6" />
              Class Fee Configuration
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                {teacherSubjects.length} subjects
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {subjectsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading subjects...</div>
              </div>
            ) : teacherSubjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-amber-50 rounded-2xl p-8 border border-amber-200">
                  <DollarSign className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Subjects Configured</h3>
                  <p className="text-gray-600">
                    Add subjects to your profile to configure class fees.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {teacherSubjects.map((subject: any) => (
                  <div 
                    key={subject.id} 
                    className="bg-gradient-to-r from-gray-50 to-amber-50 border border-amber-200 rounded-xl p-5 hover:shadow-md transition-all duration-200"
                    data-testid={`subject-fee-${subject.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-lg mb-1">{subject.subject}</h4>
                        <p className="text-sm text-gray-600">
                          Experience: {subject.experience}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {editingSubjectId === subject.id ? (
                          <>
                            <Input
                              type="number"
                              value={editingFee}
                              onChange={(e) => setEditingFee(e.target.value)}
                              placeholder="Enter fee"
                              className="w-32"
                              data-testid={`input-fee-${subject.id}`}
                            />
                            <Button
                              onClick={() => {
                                const fee = parseFloat(editingFee);
                                if (isNaN(fee) || fee < 100 || fee > 2500) {
                                  toast({
                                    title: "Invalid Fee",
                                    description: "Class fee must be between ₹100 and ₹2500",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                updateSubjectFeeMutation.mutate({ 
                                  subjectId: subject.id, 
                                  classFee: fee 
                                });
                              }}
                              disabled={updateSubjectFeeMutation.isPending}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`button-save-fee-${subject.id}`}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              {updateSubjectFeeMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingSubjectId(null);
                                setEditingFee("");
                              }}
                              variant="outline"
                              size="sm"
                              data-testid={`button-cancel-fee-${subject.id}`}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                ₹{subject.classFee || "500.00"}
                              </div>
                              <div className="text-xs text-gray-500">per class</div>
                            </div>
                            <Button
                              onClick={() => {
                                setEditingSubjectId(subject.id);
                                setEditingFee(subject.classFee || "500.00");
                              }}
                              variant="outline"
                              size="sm"
                              data-testid={`button-edit-fee-${subject.id}`}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add Subject Button and Dialog */}
            <div className="mt-6 flex justify-center">
              <Dialog open={showAddSubjectDialog} onOpenChange={setShowAddSubjectDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                    data-testid="button-add-subject"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Subject</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject Name</Label>
                      <Select value={newSubject} onValueChange={setNewSubject}>
                        <SelectTrigger data-testid="select-subject-name">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubjects.map((subject: any) => (
                            <SelectItem key={subject.id} value={subject.name}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Teaching Experience</Label>
                      <Input
                        id="experience"
                        value={newExperience}
                        onChange={(e) => setNewExperience(e.target.value)}
                        placeholder="e.g., 5 years"
                        data-testid="input-subject-experience"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="classFee">Class Fee (₹) - Min: 100, Max: 2500</Label>
                      <Input
                        id="classFee"
                        type="number"
                        min="100"
                        max="2500"
                        value={newClassFee}
                        onChange={(e) => setNewClassFee(e.target.value)}
                        placeholder="e.g., 500"
                        data-testid="input-subject-fee"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddSubjectDialog(false);
                          setNewSubject("");
                          setNewExperience("");
                          setNewClassFee("500");
                        }}
                        data-testid="button-cancel-add-subject"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (!newSubject || !newExperience || !newClassFee) {
                            toast({
                              title: "Missing Information",
                              description: "Please fill in all fields",
                              variant: "destructive",
                            });
                            return;
                          }
                          const fee = parseFloat(newClassFee);
                          if (isNaN(fee) || fee < 100 || fee > 2500) {
                            toast({
                              title: "Invalid Fee",
                              description: "Class fee must be between ₹100 and ₹2500",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (!mentorData?.id) {
                            toast({
                              title: "Error",
                              description: "Mentor data not found. Please ensure you are registered as a teacher.",
                              variant: "destructive",
                            });
                            return;
                          }
                          addSubjectMutation.mutate({ 
                            mentorId: mentorData.id, 
                            subject: newSubject, 
                            experience: newExperience, 
                            classFee: fee 
                          });
                        }}
                        disabled={addSubjectMutation.isPending}
                        className="bg-amber-600 hover:bg-amber-700"
                        data-testid="button-save-subject"
                      >
                        {addSubjectMutation.isPending ? "Adding..." : "Add Subject"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> These fees will be used when students book classes for specific subjects. 
                Course fees can still be set separately when creating courses.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* UPI ID Configuration Section */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
            <CardTitle className="flex items-center gap-3 text-xl">
              <CreditCard className="h-6 w-6" />
              Payment Configuration
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                {mentorData?.upiId ? 'Configured' : 'Not Set'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5">
                <Label htmlFor="upiId" className="text-sm font-semibold text-gray-700 mb-2 block">
                  UPI ID for Payment Collection
                </Label>
                <p className="text-xs text-gray-600 mb-3">
                  Add your UPI ID to receive payments from students directly
                </p>
                <div className="flex items-center gap-3">
                  {isEditingUpi ? (
                    <>
                      <Input
                        id="upiId"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okicici"
                        className="flex-1"
                        data-testid="input-upi-id"
                      />
                      <Button
                        onClick={() => {
                          if (!upiId.trim()) {
                            toast({
                              title: "Invalid UPI ID",
                              description: "Please enter a valid UPI ID",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (!mentorData?.id) {
                            toast({
                              title: "Error",
                              description: "Mentor data not found",
                              variant: "destructive",
                            });
                            return;
                          }
                          updateUpiMutation.mutate({ 
                            mentorId: mentorData.id, 
                            upiId: upiId.trim() 
                          });
                        }}
                        disabled={updateUpiMutation.isPending}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="button-save-upi"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {updateUpiMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditingUpi(false);
                          setUpiId(mentorData?.upiId || "");
                        }}
                        variant="outline"
                        size="sm"
                        data-testid="button-cancel-upi"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 bg-white px-4 py-2.5 rounded-lg border border-gray-200">
                        <span className="text-gray-700 font-medium" data-testid="text-upi-id">
                          {mentorData?.upiId || "Not configured"}
                        </span>
                      </div>
                      <Button
                        onClick={() => {
                          setIsEditingUpi(true);
                          setUpiId(mentorData?.upiId || "");
                        }}
                        variant="outline"
                        size="sm"
                        data-testid="button-edit-upi"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        {mentorData?.upiId ? "Edit" : "Add"}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your UPI ID will be used to receive payments from students. 
                  Make sure it's correct to avoid payment issues.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                        {videoEnabled ? "Start Class" : `Available in ${formatDistanceToNow(addMinutes(upcomingClass.scheduledAt, -5))}`}
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

        {/* Teacher Courses */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-red-700 text-white">
            <CardTitle className="flex items-center gap-3 text-xl">
              <BookOpen className="h-6 w-6" />
              My Courses
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                {teacherCourses.length} courses
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {coursesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading courses...</div>
                </div>
              ) : teacherCourses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-orange-50 rounded-2xl p-8 border border-orange-200">
                    <BookOpen className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Courses Created Yet</h3>
                    <p className="text-gray-600 mb-4">Start creating courses to teach your expertise to students.</p>
                    <Button 
                      onClick={() => window.location.href = '/teacher/create-course'}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Create Your First Course
                    </Button>
                  </div>
                </div>
              ) : (
                teacherCourses.map((course: any) => (
                  <div key={course.id} className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-800 mb-2">{course.title}</h3>
                        <p className="text-gray-600 mb-3 leading-relaxed">{course.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                            {course.category}
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            {course.difficulty}
                          </Badge>
                          {course.duration && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              {course.duration}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          ${course.price}
                        </div>
                        <div className="text-sm text-gray-500">
                          Max: {course.maxStudents} students
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between bg-white/70 px-4 py-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${course.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm font-medium text-gray-700">
                          {course.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          onClick={() => window.location.href = `/teacher/courses/${course.id}/edit`}
                          data-testid={`button-edit-course-${course.id}`}
                        >
                          Edit Course
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-orange-600 hover:bg-orange-700"
                          onClick={() => window.location.href = `/teacher/courses/${course.id}`}
                          data-testid={`button-view-course-${course.id}`}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
              <Button 
                variant="outline" 
                className="h-32 p-6 flex-col hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                data-testid="button-payment-config"
                onClick={() => window.location.href = '/teacher/payment-config'}
              >
                <CreditCard className="h-10 w-10 mb-3 text-orange-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-bold text-lg">Payment Setup</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Configure payment methods</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-32 p-6 flex-col hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                data-testid="button-completed-classes"
                onClick={() => setShowCompletedClasses(!showCompletedClasses)}
              >
                <CheckCircle className="h-10 w-10 mb-3 text-indigo-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-bold text-lg">Completed Classes</span>
                <span className="text-xs text-gray-500 mt-1 text-center">View past sessions</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-32 p-6 flex-col hover:bg-teal-50 hover:border-teal-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                data-testid="button-all-active-classes"
                onClick={() => window.location.href = '/teacher/all-active-classes'}
              >
                <Calendar className="h-10 w-10 mb-3 text-teal-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-bold text-lg">All Active Classes</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Manage your schedule</span>
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

      {/* Completed Classes Section */}
      {showCompletedClasses && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Completed Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium">Total Completed</p>
                  <p className="text-3xl font-bold text-green-700">{completedClasses.length}</p>
                  <p className="text-xs text-green-600">Classes with feedback</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Total Hours</p>
                  <p className="text-3xl font-bold text-blue-700">{stats.totalHours || 0}</p>
                  <p className="text-xs text-blue-600">Teaching time</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Recent Completed Classes:</h4>
                
                {completedClasses.slice(0, 10).map((cls: CompletedClass) => (
                  <div key={cls.id} className="border-l-4 border-green-400 bg-green-50 p-4 rounded-r-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-sm">{cls.studentName}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatDistanceToNow(new Date(cls.completedAt), { addSuffix: true })}
                        </span>
                      </div>
                      <span className="text-green-700 font-semibold">${cls.earnings}</span>
                    </div>
                    <p className="text-sm text-gray-700">Subject: {cls.subject}</p>
                  </div>
                ))}
                
                {completedClasses.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No completed classes yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}