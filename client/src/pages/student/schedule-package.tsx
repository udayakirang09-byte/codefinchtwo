import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, addDays, startOfDay, parse } from "date-fns";

interface Mentor {
  id: string;
  name: string;
  email: string;
  profilePhotoUrl?: string;
}

interface BulkPackage {
  id: string;
  studentId: string;
  mentorId: string;
  totalClasses: number;
  usedClasses: number;
  remainingClasses: number;
  pricePerClass: string;
  totalAmount: string;
  subject: string;
  sessionDuration: number;
  status: "active" | "depleted" | "expired";
  expiryDate?: string;
  createdAt: string;
  mentor?: Mentor;
}

interface AvailableTime {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface ScheduledSession {
  scheduledAt: Date;
  notes?: string;
}

export default function SchedulePackage() {
  const params = useParams<{ packageId: string }>();
  const packageId = params.packageId;
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

  // Get student ID from the user's email
  const { data: studentData } = useQuery({
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

  // Fetch all packages for this student
  const { data: packages, isLoading } = useQuery<BulkPackage[]>({
    queryKey: ["/api/bulk-packages/student", studentId],
    enabled: !!studentId,
  });

  // Find the specific package
  const packageData = packages?.find(pkg => pkg.id === packageId);

  // Fetch mentor's available times
  const { data: availableTimes } = useQuery<AvailableTime[]>({
    queryKey: ["/api/mentors", packageData?.mentorId, "available-times"],
    enabled: !!packageData?.mentorId,
  });

  // Schedule classes mutation
  const scheduleClassesMutation = useMutation({
    mutationFn: async (sessions: ScheduledSession[]) => {
      const response = await apiRequest(
        "POST",
        `/api/bulk-packages/${packageId}/schedule-class`,
        {
          scheduledSessions: sessions.map(s => ({
            scheduledAt: s.scheduledAt.toISOString(),
            notes: s.notes || ""
          }))
        }
      );
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: `${selectedTimes.length} class(es) scheduled successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-packages/student", studentId] });
      setSelectedTimes([]);
      setSelectedDate(undefined);
      setLocation("/student/my-packages");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule classes",
        variant: "destructive",
      });
    },
  });

  const handleScheduleClasses = () => {
    if (!selectedDate || selectedTimes.length === 0) {
      toast({
        title: "No times selected",
        description: "Please select at least one time slot",
        variant: "destructive",
      });
      return;
    }

    if (selectedTimes.length > (packageData?.remainingClasses || 0)) {
      toast({
        title: "Too many classes",
        description: `You only have ${packageData?.remainingClasses} remaining classes`,
        variant: "destructive",
      });
      return;
    }

    const sessions: ScheduledSession[] = selectedTimes.map(time => ({
      scheduledAt: parse(`${format(selectedDate, "yyyy-MM-dd")} ${time}`, "yyyy-MM-dd HH:mm", new Date()),
      notes: `Scheduled from ${packageData?.totalClasses} class package`
    }));

    scheduleClassesMutation.mutate(sessions);
  };

  const toggleTimeSelection = (time: string) => {
    setSelectedTimes(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  // Get available time slots for selected date
  const getAvailableTimeSlotsForDate = (date: Date) => {
    if (!availableTimes) return [];

    const dayName = format(date, "EEEE");
    const slots = availableTimes.filter(slot => slot.dayOfWeek === dayName);

    // Generate time slots from start to end time
    const timeSlots: string[] = [];
    slots.forEach(slot => {
      const start = parse(slot.startTime, "HH:mm", date);
      const end = parse(slot.endTime, "HH:mm", date);
      
      let current = start;
      while (current < end) {
        timeSlots.push(format(current, "HH:mm"));
        current = addDays(current, 0);
        current.setHours(current.getHours() + 1);
      }
    });

    return timeSlots.sort();
  };

  const availableSlots = selectedDate ? getAvailableTimeSlotsForDate(selectedDate) : [];

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">Loading package details...</div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-xl font-semibold mb-2">Package Not Found</p>
            <p className="text-muted-foreground mb-6">
              This package doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => setLocation("/student/my-packages")}>
              Back to My Packages
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (packageData.remainingClasses === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => setLocation("/student/my-packages")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Packages
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold mb-2">No Classes Remaining</p>
            <p className="text-muted-foreground mb-6">
              You've used all classes in this package.
            </p>
            <Button onClick={() => setLocation("/student/my-packages")}>
              Back to My Packages
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => setLocation("/student/my-packages")}
        className="mb-6"
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to My Packages
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Package Info & Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Your Classes</CardTitle>
              <CardDescription>
                Package: {packageData.totalClasses} Class Package - {packageData.subject}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Package Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining Classes</p>
                    <p className="text-2xl font-bold">{packageData.remainingClasses}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Session Duration</p>
                    <p className="text-2xl font-bold">{packageData.sessionDuration}min</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Mentor</p>
                    <p className="text-lg font-semibold">{packageData.mentor?.name || 'Not assigned'}</p>
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Select a Date</h3>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < startOfDay(new Date())}
                  className="rounded-md border"
                  data-testid="calendar-selector"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Time Slots & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Times</CardTitle>
              <CardDescription>
                {selectedDate 
                  ? `${format(selectedDate, "EEEE, MMMM d, yyyy")}`
                  : "Select a date to see available times"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedDate ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Please select a date from the calendar
                </p>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No available times on this date
                </p>
              ) : (
                <div className="space-y-2">
                  {availableSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTimes.includes(time) ? "default" : "outline"}
                      className="w-full justify-between"
                      onClick={() => toggleTimeSelection(time)}
                      data-testid={`time-slot-${time}`}
                    >
                      <span>{time}</span>
                      {selectedTimes.includes(time) && (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedTimes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{selectedDate && format(selectedDate, "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Times selected:</span>
                    <span className="font-medium">{selectedTimes.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining after:</span>
                    <span className="font-medium">{packageData.remainingClasses - selectedTimes.length}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleScheduleClasses}
                  disabled={scheduleClassesMutation.isPending}
                  data-testid="button-schedule"
                >
                  {scheduleClassesMutation.isPending ? "Scheduling..." : `Schedule ${selectedTimes.length} Class${selectedTimes.length > 1 ? 'es' : ''}`}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
