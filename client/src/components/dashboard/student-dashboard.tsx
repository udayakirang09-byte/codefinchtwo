import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, MessageCircle, Star, BookOpen, Award, Bell } from "lucide-react";
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

export default function StudentDashboard() {
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [completedClasses, setCompletedClasses] = useState<CompletedClass[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Load sample data (in real app, this would come from API)
    const sampleUpcoming: UpcomingClass[] = [
      {
        id: '1',
        mentorName: 'Sarah Johnson',
        subject: 'Python Basics',
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        duration: 60,
        videoEnabled: false,
        chatEnabled: true,
        feedbackEnabled: false,
      },
      {
        id: '2',
        mentorName: 'Mike Chen',
        subject: 'JavaScript Functions',
        scheduledAt: new Date(Date.now() + 26 * 60 * 60 * 1000), // 26 hours from now
        duration: 90,
        videoEnabled: false,
        chatEnabled: true,
        feedbackEnabled: false,
      },
    ];

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

    setUpcomingClasses(sampleUpcoming);
    setCompletedClasses(sampleCompleted);
    setNotifications([
      { id: 1, message: "Python Basics class starts in 2 hours", type: "reminder" },
      { id: 2, message: "Please submit feedback for HTML & CSS class", type: "feedback" },
    ]);

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

  const isFeedbackVisible = (completedAt: Date, feedbackDeadline: Date) => {
    return currentTime <= feedbackDeadline;
  };

  const handleJoinVideo = (classId: string) => {
    console.log(`🎥 Joining video class ${classId}`);
    // In real app: window.location.href = `/video-class/${classId}`;
  };

  const handleJoinChat = (classId: string) => {
    console.log(`💬 Opening chat for class ${classId}`);
    // In real app: window.location.href = `/chat/${classId}`;
  };

  const handleSubmitFeedback = (classId: string) => {
    console.log(`⭐ Opening feedback form for class ${classId}`);
    // In real app: window.location.href = `/feedback/${classId}`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 rounded-lg border">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back, Student! 🎓</h2>
        <p className="text-gray-700">Here's your learning dashboard with upcoming classes and recent activities.</p>
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
                    notification.type === 'reminder' ? 'bg-blue-50 border-blue-400' : 'bg-orange-50 border-orange-400'
                  }`}
                >
                  <p className="text-sm">{notification.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Classes - Next 72 Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Classes (Next 72 Hours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingClasses
              .filter(cls => cls.scheduledAt <= addHours(currentTime, 72))
              .map((upcomingClass) => {
                const videoEnabled = isVideoEnabled(upcomingClass.scheduledAt);
                const chatEnabled = isChatEnabled(upcomingClass.scheduledAt);
                
                return (
                  <div key={upcomingClass.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{upcomingClass.subject}</h3>
                        <p className="text-gray-600">with {upcomingClass.mentorName}</p>
                      </div>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {upcomingClass.duration} min
                      </Badge>
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
                        data-testid={`button-video-${upcomingClass.id}`}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        {videoEnabled ? "Join Video" : `Video in ${formatDistanceToNow(addMinutes(upcomingClass.scheduledAt, -10))}`}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={chatEnabled ? "outline" : "secondary"}
                        disabled={!chatEnabled}
                        onClick={() => handleJoinChat(upcomingClass.id)}
                        data-testid={`button-chat-${upcomingClass.id}`}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {chatEnabled ? "Open Chat" : `Chat in ${formatDistanceToNow(addHours(upcomingClass.scheduledAt, -1))}`}
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Recently Completed Classes - Feedback Available */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Recent Classes - Feedback Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completedClasses
              .filter(cls => isFeedbackVisible(cls.completedAt, cls.feedbackDeadline))
              .map((completedClass) => (
                <div key={completedClass.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{completedClass.subject}</h3>
                      <p className="text-gray-600">with {completedClass.mentorName}</p>
                    </div>
                    <Badge variant={completedClass.hasSubmittedFeedback ? "default" : "destructive"}>
                      {completedClass.hasSubmittedFeedback ? "Feedback Submitted" : "Feedback Pending"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                    <span>✅ Completed: {completedClass.completedAt.toLocaleString()}</span>
                    <span>⏰ Feedback expires: {formatDistanceToNow(completedClass.feedbackDeadline, { addSuffix: true })}</span>
                  </div>

                  {!completedClass.hasSubmittedFeedback && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleSubmitFeedback(completedClass.id)}
                      data-testid={`button-feedback-${completedClass.id}`}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </Button>
                  )}
                </div>
              ))}
            
            {completedClasses.filter(cls => isFeedbackVisible(cls.completedAt, cls.feedbackDeadline)).length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent classes requiring feedback</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col" data-testid="button-find-mentor">
              <BookOpen className="h-6 w-6 mb-2" />
              <span>Find Mentor</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col" data-testid="button-my-progress">
              <Award className="h-6 w-6 mb-2" />
              <span>My Progress</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col" data-testid="button-browse-courses">
              <Calendar className="h-6 w-6 mb-2" />
              <span>Browse Courses</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col" data-testid="button-help-center">
              <MessageCircle className="h-6 w-6 mb-2" />
              <span>Help Center</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}