import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Clock, User, DollarSign, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

type DaySchedule = {
  enabled: boolean;
  time: string;
};

type WeeklySchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

export default function CourseEnrollment() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/course-enrollment/:courseId");
  
  const courseId = params ? (params as { courseId: string }).courseId : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    monday: { enabled: false, time: '' },
    tuesday: { enabled: false, time: '' },
    wednesday: { enabled: false, time: '' },
    thursday: { enabled: false, time: '' },
    friday: { enabled: false, time: '' },
    saturday: { enabled: false, time: '' },
    sunday: { enabled: false, time: '' },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to enroll in a course.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate, toast]);

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery<any>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  // Fetch teacher availability
  const { data: availabilityData } = useQuery<{
    timeSlots: Array<{id: string, time: string, dayOfWeek: string, startTime: string, endTime: string}>,
    availableSlots: Array<{day: string, times: string[]}>,
    rawTimes: string[]
  }>({
    queryKey: ["/api/mentors", course?.mentorId, "available-times"],
    enabled: !!course?.mentorId,
  });

  // Fetch student details for auto-population
  const { data: studentData } = useQuery<any>({
    queryKey: ["/api/users", user?.email, "student"],
    enabled: !!user?.email,
  });

  const enrollmentMutation = useMutation({
    mutationFn: async (enrollmentData: any) => {
      const response = await apiRequest("POST", "/api/course-enrollments", enrollmentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Enrollment Successful!",
        description: "You've been enrolled in the course. Classes will be created based on your schedule.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/course-enrollments"] });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Enrollment Failed",
        description: "There was an error enrolling in the course. Please try again.",
        variant: "destructive",
      });
      console.error("Enrollment error:", error);
    },
  });

  if (!match || !courseId) {
    return <div>Course enrollment page not found</div>;
  }

  if (courseLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
            <div className="h-96 bg-muted rounded-xl"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Course not found</h1>
          <Button onClick={() => navigate("/courses")}>Back to Courses</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleDayToggle = (day: keyof WeeklySchedule, checked: boolean) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: checked, time: checked ? prev[day].time : '' }
    }));
  };

  const handleTimeChange = (day: keyof WeeklySchedule, time: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], time }
    }));
  };

  const getAvailableTimesForDay = (dayLabel: string) => {
    if (!availabilityData?.availableSlots) return [];
    const daySlot = availabilityData.availableSlots.find(
      slot => slot.day.toLowerCase() === dayLabel.toLowerCase()
    );
    return daySlot?.times || [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Strict validation for course data
    if (typeof course.maxClasses !== 'number' || course.maxClasses <= 0 || isNaN(course.maxClasses)) {
      toast({
        title: "Invalid Course Data",
        description: "This course does not have a valid number of classes set. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    if (typeof course.price !== 'number' || course.price <= 0 || isNaN(course.price)) {
      toast({
        title: "Invalid Course Data",
        description: "This course does not have a valid price set. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    // Validate at least one day is selected
    const selectedDays = Object.entries(weeklySchedule).filter(([_, schedule]) => schedule.enabled);
    if (selectedDays.length === 0) {
      toast({
        title: "No Schedule Selected",
        description: "Please select at least one day for your classes.",
        variant: "destructive",
      });
      return;
    }

    // Strict validation for all selected days having valid times
    const missingTimes = selectedDays.filter(([_, schedule]) => !schedule.time || schedule.time.trim() === '');
    if (missingTimes.length > 0) {
      toast({
        title: "Missing Time Slots",
        description: "Please select a valid time for all enabled days.",
        variant: "destructive",
      });
      return;
    }

    // Prepare enrollment data
    const scheduleData = selectedDays.map(([day, schedule]) => ({
      day,
      time: schedule.time
    }));

    enrollmentMutation.mutate({
      courseId: course.id,
      studentEmail: user?.email,
      mentorId: course.mentorId,
      schedule: scheduleData,
      totalClasses: course.maxClasses,
      courseFee: course.price
    });
  };

  const selectedDaysCount = Object.values(weeklySchedule).filter(s => s.enabled).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2" data-testid="text-enrollment-title">
            Enroll in Course
          </h1>
          <p className="text-gray-600">Complete your enrollment and set up your weekly schedule</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Course Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-500">Course Name</Label>
                  <p className="font-semibold text-lg" data-testid="text-course-name">{course.title}</p>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-500">Instructor</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4" />
                    <span data-testid="text-instructor-name">
                      {course.mentor?.user?.firstName} {course.mentor?.user?.lastName}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-500">Number of Classes</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold" data-testid="text-class-count">{course.maxClasses} classes</span>
                  </div>
                </div>

                {course.duration && (
                  <div>
                    <Label className="text-sm text-gray-500">Course Duration</Label>
                    <p data-testid="text-course-duration">{course.duration}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Label className="text-sm text-gray-500">Total Course Fee</Label>
                  <p className="text-3xl font-bold text-green-600" data-testid="text-course-fee">
                    ₹{course.price}
                  </p>
                </div>

                {selectedDaysCount > 0 && course.maxClasses && (
                  <div className="pt-4 border-t">
                    <Label className="text-sm text-gray-500">Selected Schedule</Label>
                    <p className="text-sm text-gray-700 mt-1" data-testid="text-selected-days">
                      {selectedDaysCount} day{selectedDaysCount > 1 ? 's' : ''} per week
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ~{Math.ceil(course.maxClasses / selectedDaysCount)} weeks to complete
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enrollment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>
                  Select the days and times you'd like to attend classes. Only available time slots are shown.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    {DAYS_OF_WEEK.map(({ key, label }) => {
                      const availableTimes = getAvailableTimesForDay(label);
                      const hasAvailability = availableTimes.length > 0;

                      if (!hasAvailability) return null;

                      return (
                        <div key={key} className="flex items-center gap-4 p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors" data-testid={`schedule-row-${key}`}>
                          <div className="flex items-center space-x-3 w-32">
                            <Checkbox
                              id={`day-${key}`}
                              checked={weeklySchedule[key].enabled}
                              onCheckedChange={(checked) => handleDayToggle(key, checked as boolean)}
                              data-testid={`checkbox-${key}`}
                            />
                            <Label htmlFor={`day-${key}`} className="font-medium cursor-pointer">
                              {label}
                            </Label>
                          </div>

                          <div className="flex-1">
                            {weeklySchedule[key].enabled && (
                              <Select 
                                value={weeklySchedule[key].time} 
                                onValueChange={(time) => handleTimeChange(key, time)}
                              >
                                <SelectTrigger data-testid={`select-time-${key}`}>
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableTimes.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {!weeklySchedule[key].enabled && (
                              <p className="text-sm text-gray-500 italic">
                                {availableTimes.length} time slot{availableTimes.length > 1 ? 's' : ''} available
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedDaysCount === 0 && course.maxClasses && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Tip:</strong> Select the days and times that work best for you. 
                        Classes will be automatically scheduled until all {course.maxClasses} classes are completed.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4 pt-6 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate("/courses")}
                      className="flex-1"
                      data-testid="button-cancel-enrollment"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={enrollmentMutation.isPending || selectedDaysCount === 0}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      data-testid="button-confirm-enrollment"
                    >
                      {enrollmentMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Enrolling...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Confirm Enrollment - ₹{course.price}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
