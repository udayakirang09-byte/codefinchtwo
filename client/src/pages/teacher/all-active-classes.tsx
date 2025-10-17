import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, MessageCircle, Home, Users, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { useAuth } from '@/hooks/use-auth';
import { format, isPast, addMinutes, formatDistanceToNow } from 'date-fns';

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
}

export default function AllActiveClasses() {
  const { user } = useAuth();

  // Fetch all teacher classes from unified endpoint
  const { data: allClasses = [], isLoading } = useQuery<TeacherClass[]>({
    queryKey: [`/api/teacher/classes?teacherId=${user?.id}`],
    enabled: !!user?.id
  });

  // Filter for ACTIVE classes: NOT cancelled AND NOT past their end time (time-based logic)
  const activeClasses = allClasses.filter((classItem) => {
    // Exclude cancelled classes only
    if (classItem.status === 'cancelled') return false;
    
    // Time-based check: class end time must NOT be in the past
    const classEndTime = addMinutes(new Date(classItem.scheduledAt), classItem.duration);
    return !isPast(classEndTime);
  });

  const handleJoinVideo = (classId: string) => {
    window.location.href = `/video/${classId}`;
  };

  const handleJoinChat = (classId: string) => {
    window.location.href = `/chat/${classId}`;
  };

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
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3" data-testid="text-page-title">
            <Calendar className="h-10 w-10 text-blue-600" />
            All Active Classes 📚
          </h1>
          <p className="text-xl text-gray-600">Manage your upcoming teaching sessions</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{activeClasses.length}</div>
              <div className="text-blue-100">Active Classes</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">
                {new Set(activeClasses.map(c => c.student.user.firstName + c.student.user.lastName)).size}
              </div>
              <div className="text-purple-100">Unique Students</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">
                {Math.round(activeClasses.reduce((sum, cls) => sum + cls.duration, 0) / 60)}
              </div>
              <div className="text-green-100">Hours Scheduled</div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <span className="ml-3 text-gray-600">Loading your active classes...</span>
          </div>
        ) : activeClasses.length === 0 ? (
          <Card className="shadow-lg border-0">
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Classes</h3>
              <p className="text-gray-600 mb-6">You don't have any active classes at the moment.</p>
              <Link href="/">
                <Button data-testid="button-home-empty">Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle>Active Classes - {activeClasses.length} Scheduled</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {activeClasses.map((classItem) => {
                  const scheduledDate = new Date(classItem.scheduledAt);
                  const classEndTime = addMinutes(scheduledDate, classItem.duration);
                  const now = new Date();
                  const isVideoEnabled = scheduledDate <= addMinutes(now, 5); // 5 min before
                  const isChatEnabled = scheduledDate <= addMinutes(now, 60); // 1 hour before

                  return (
                    <Card 
                      key={classItem.id} 
                      className="border-2 hover:border-blue-300 transition-colors duration-200" 
                      data-testid={`card-active-class-${classItem.id}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-xl text-gray-800 mb-1">{classItem.subject}</h3>
                            <p className="text-blue-600 font-medium">
                              with {classItem.student.user.firstName} {classItem.student.user.lastName}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                            <Clock className="h-3 w-3 mr-1" />
                            {classItem.duration} min
                          </Badge>
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
                            <AlertCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{formatDistanceToNow(scheduledDate, { addSuffix: true })}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-3 flex-wrap">
                          <Button 
                            size="lg" 
                            variant={isVideoEnabled ? "default" : "secondary"}
                            disabled={!isVideoEnabled}
                            onClick={() => handleJoinVideo(classItem.id)}
                            className={`rounded-xl ${isVideoEnabled ? 'bg-green-600 hover:bg-green-700' : ''}`}
                            data-testid={`button-teacher-video-${classItem.id}`}
                          >
                            <Video className="h-5 w-5 mr-2" />
                            {isVideoEnabled ? "Start Class" : `Video in ${formatDistanceToNow(scheduledDate)}`}
                          </Button>
                          <Button 
                            size="lg" 
                            variant={isChatEnabled ? "outline" : "secondary"}
                            disabled={!isChatEnabled}
                            onClick={() => handleJoinChat(classItem.id)}
                            className={`rounded-xl ${isChatEnabled ? 'border-blue-300 text-blue-700 hover:bg-blue-50' : ''}`}
                            data-testid={`button-teacher-chat-${classItem.id}`}
                          >
                            <MessageCircle className="h-5 w-5 mr-2" />
                            {isChatEnabled ? "Chat" : `Chat in ${formatDistanceToNow(scheduledDate)}`}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
