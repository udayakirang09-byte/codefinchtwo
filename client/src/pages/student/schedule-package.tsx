import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, addDays, startOfDay, parse, isToday, isBefore } from "date-fns";

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

interface AvailableTimesResponse {
  timeSlots: AvailableTime[];
}

interface ScheduledSession {
  scheduledAt: Date;
  notes?: string;
}

interface DateTimeSelection {
  date: Date;
  time: string;
}

export default function SchedulePackage() {
  const params = useParams<{ packageId: string }>();
  const packageId = params.packageId;
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast} = useToast();

  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedSessions, setSelectedSessions] = useState<DateTimeSelection[]>([]);

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
    queryFn: async () => {
      if (!studentId) throw new Error('No student ID');
      const response = await fetch(`/api/bulk-packages/student/${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch packages');
      return response.json();
    },
    enabled: !!studentId,
  });

  // Find the specific package
  const packageData = packages?.find(pkg => pkg.id === packageId);

  // Fetch mentor's available times
  const { data: availableTimes } = useQuery<AvailableTimesResponse | AvailableTime[]>({
    queryKey: ["/api/mentors", packageData?.mentorId, "available-times"],
    queryFn: async () => {
      if (!packageData?.mentorId) throw new Error('No mentor ID');
      const response = await fetch(`/api/mentors/${packageData.mentorId}/available-times`);
      if (!response.ok) throw new Error('Failed to fetch available times');
      return response.json();
    },
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
        description: `${selectedSessions.length} class(es) scheduled successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-packages/student", studentId] });
      setSelectedSessions([]);
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
    if (selectedSessions.length === 0) {
      toast({
        title: "No times selected",
        description: "Please select at least one time slot",
        variant: "destructive",
      });
      return;
    }

    if (selectedSessions.length > (packageData?.remainingClasses || 0)) {
      toast({
        title: "Too many classes",
        description: `You only have ${packageData?.remainingClasses} remaining classes`,
        variant: "destructive",
      });
      return;
    }

    const sessions: ScheduledSession[] = selectedSessions.map(session => {
      // Parse time string (e.g., "14:00")
      const [hours, minutes] = session.time.split(':').map(Number);
      
      // Create a new date with the selected date and time (in local timezone)
      const scheduledDate = new Date(session.date);
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      return {
        scheduledAt: scheduledDate,
        notes: `Scheduled from ${packageData?.totalClasses} class package`
      };
    });

    scheduleClassesMutation.mutate(sessions);
  };

  const toggleTimeSelection = (time: string) => {
    if (!selectedDate || !packageData) return;

    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const existingIndex = selectedSessions.findIndex(
      s => format(s.date, "yyyy-MM-dd") === dateKey && s.time === time
    );

    if (existingIndex >= 0) {
      // Remove this selection
      setSelectedSessions(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      // Check if we've reached the limit
      if (selectedSessions.length >= packageData.remainingClasses) {
        toast({
          title: "All classes selected",
          description: "All available classes are selected. You can unselect any specific time to select this time.",
          variant: "default",
        });
        return;
      }
      // Add this selection
      setSelectedSessions(prev => [...prev, { date: selectedDate, time }]);
    }
  };

  // Get available time slots for selected date
  const getAvailableTimeSlotsForDate = (date: Date) => {
    // Handle the API response structure: { timeSlots: [...] } or just [...]
    let timeSlotsArray: AvailableTime[];
    
    if (!availableTimes) {
      return [];
    }
    
    // Check if it's the wrapped response format
    if ('timeSlots' in availableTimes) {
      timeSlotsArray = availableTimes.timeSlots;
    } else {
      timeSlotsArray = availableTimes as AvailableTime[];
    }
    
    if (!Array.isArray(timeSlotsArray)) {
      return [];
    }

    const dayName = format(date, "EEEE");
    const slots = timeSlotsArray.filter(slot => slot.dayOfWeek === dayName);

    // Generate time slots from start to end time
    const timeSlots: string[] = [];
    const now = new Date();
    const isSelectedDateToday = isToday(date);
    
    slots.forEach(slot => {
      const start = parse(slot.startTime, "HH:mm", date);
      const end = parse(slot.endTime, "HH:mm", date);
      
      let current = start;
      while (current < end) {
        // If selected date is today, only include future times
        if (isSelectedDateToday) {
          const timeSlot = parse(format(current, "HH:mm"), "HH:mm", now);
          if (timeSlot > now) {
            timeSlots.push(format(current, "HH:mm"));
          }
        } else {
          timeSlots.push(format(current, "HH:mm"));
        }
        
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

      {/* Student Info Header */}
      {studentData && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="text-lg font-semibold">{studentData.name || user?.email}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-lg">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  fromDate={startOfDay(new Date())}
                  toDate={addDays(startOfDay(new Date()), 30)}
                  disabled={(date) => 
                    date < startOfDay(new Date()) || 
                    date > addDays(startOfDay(new Date()), 30)
                  }
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
                  {availableSlots.map((time) => {
                    const isSelected = selectedDate && selectedSessions.some(
                      s => format(s.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd") && s.time === time
                    );
                    return (
                      <Button
                        key={time}
                        variant={isSelected ? "default" : "outline"}
                        className="w-full justify-between"
                        onClick={() => toggleTimeSelection(time)}
                        data-testid={`time-slot-${time}`}
                      >
                        <span>{time}</span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Times selected:</span>
                    <span className="font-medium">{selectedSessions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining after:</span>
                    <span className="font-medium">{packageData.remainingClasses - selectedSessions.length}</span>
                  </div>
                </div>

                {/* Selected Classes List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Selected Classes:</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {[...selectedSessions]
                      .sort((a, b) => {
                        const dateCompare = a.date.getTime() - b.date.getTime();
                        if (dateCompare !== 0) return dateCompare;
                        return a.time.localeCompare(b.time);
                      })
                      .map((session, index) => {
                        const dateKey = format(session.date, "yyyy-MM-dd");
                        return (
                          <Button
                            key={`${dateKey}-${session.time}-${index}`}
                            variant="outline"
                            className="w-full justify-between hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
                            onClick={() => {
                              setSelectedSessions(prev => prev.filter((_, i) => i !== index));
                            }}
                            data-testid={`selected-class-${index}`}
                          >
                            <span className="text-left flex-1">
                              <div className="font-medium">{format(session.date, "EEE, MMM d, yyyy")}</div>
                              <div className="text-sm text-muted-foreground">{session.time}</div>
                            </span>
                            <XCircle className="h-4 w-4 ml-2" />
                          </Button>
                        );
                      })}
                  </div>
                  <p className="text-xs text-muted-foreground italic">Click on any class to unselect it</p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleScheduleClasses}
                  disabled={scheduleClassesMutation.isPending}
                  data-testid="button-schedule"
                >
                  {scheduleClassesMutation.isPending ? "Scheduling..." : `Schedule ${selectedSessions.length} Class${selectedSessions.length > 1 ? 'es' : ''}`}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
