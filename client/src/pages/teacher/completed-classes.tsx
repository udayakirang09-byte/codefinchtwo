import { useQuery } from '@tanstack/react-query';
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, User, Home, MessageCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { format, isPast, addMinutes } from "date-fns";
import { getCancellationHighlight, getCancellationBadgeVariant } from "@/lib/cancellation-utils";

interface TeacherClass {
  id: string;
  student: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  subject: string;
  scheduledAt: string;
  duration: number;
  status: string;
  amount: number;
  // Cancellation fields for dashboard highlights
  cancelledBy?: string | null;
  cancellationType?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  refundStatus?: string | null;
  refundAmount?: string | null;
}

export default function TeacherCompletedClasses() {
  const { user, isAuthenticated } = useAuth();

  // Fetch all teacher classes from unified endpoint
  const { data: allClasses = [], isLoading } = useQuery<TeacherClass[]>({
    queryKey: [`/api/teacher/classes?teacherId=${user?.id}`],
    enabled: !!user?.id && isAuthenticated
  });

  // Filter for COMPLETED classes: Cancelled classes (shown immediately) OR past their end time (time-based logic)
  const completedClasses = allClasses
    .filter((classItem) => {
      // Include cancelled classes immediately regardless of scheduled time
      if (classItem.status === 'cancelled') return true;
      
      // Time-based check: class end time must be in the past for non-cancelled classes
      const classEndTime = addMinutes(new Date(classItem.scheduledAt), classItem.duration);
      return isPast(classEndTime);
    })
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  // Calculate stats excluding cancelled classes (only genuinely completed sessions)
  const actuallyCompletedClasses = completedClasses.filter(cls => cls.status !== 'cancelled');
  const cancelledCount = completedClasses.filter(cls => cls.status === 'cancelled').length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view completed classes</h2>
              <p className="text-gray-600">You need to be logged in as a teacher to access this page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            <span className="ml-3">Loading completed classes...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-home">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <CheckCircle className="h-10 w-10 text-green-600" />
            Completed Classes ✨
          </h1>
          <p className="text-xl text-gray-600">Review your past teaching sessions</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{actuallyCompletedClasses.length}</div>
              <div className="text-green-100">Total Completed</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">
                {Math.round(actuallyCompletedClasses.reduce((sum, cls) => sum + cls.duration, 0) / 60)}
              </div>
              <div className="text-blue-100">Hours Taught</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">
                ₹{actuallyCompletedClasses.reduce((sum, cls) => sum + (cls.amount || 0), 0)}
              </div>
              <div className="text-yellow-100">Total Earnings</div>
            </CardContent>
          </Card>
        </div>

        {/* Completed Classes List */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
            <CardTitle>All Completed Classes</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {completedClasses.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-600 mb-2">No completed classes yet</p>
                <p className="text-gray-500">Your completed classes will appear here after they finish</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedClasses.map((classItem) => {
                  const scheduledDate = new Date(classItem.scheduledAt);
                  const highlight = getCancellationHighlight(classItem.status, classItem.cancellationType);
                  const isCancelled = classItem.status === 'cancelled';
                  
                  return (
                    <Card 
                      key={classItem.id} 
                      className={`border-2 transition-colors duration-200 ${isCancelled ? 'hover:border-red-300' : 'hover:border-green-300'}`}
                      data-testid={`card-completed-class-${classItem.id}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-xl text-gray-800 mb-1">{classItem.subject}</h3>
                            <p className={`font-medium flex items-center gap-2 ${isCancelled ? 'text-red-600' : 'text-green-600'}`}>
                              <User className="h-4 w-4" />
                              {classItem.student.user.firstName} {classItem.student.user.lastName}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={isCancelled ? "destructive" : "outline"} 
                              className={`mb-2 ${isCancelled ? 'bg-red-100 text-red-700 border-red-300' : 'bg-green-100 text-green-700 border-green-300'}`}
                            >
                              {isCancelled ? (
                                <XCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              {isCancelled ? 'Cancelled' : 'Completed'}
                            </Badge>
                            {/* Scenario-specific dashboard highlight */}
                            <div className={`text-xs font-semibold mb-2 ${isCancelled ? 'text-red-600' : 'text-green-600'}`}>
                              {highlight.teacher}
                            </div>
                            <div className="text-sm font-semibold text-gray-700">
                              {isCancelled && classItem.refundStatus && classItem.refundStatus !== 'not_applicable' ? (
                                <>Refund: {classItem.refundStatus === 'pending' ? 'Processing' : classItem.refundStatus}</>
                              ) : (
                                <>Earned: ₹{classItem.amount || 0}</>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 mb-4 text-sm flex-wrap">
                          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{format(scheduledDate, 'PPP')}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">{format(scheduledDate, 'p')}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                            <Clock className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{classItem.duration} minutes</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            onClick={() => window.location.href = `/chat/${classItem.id}`}
                            data-testid={`button-chat-${classItem.id}`}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
