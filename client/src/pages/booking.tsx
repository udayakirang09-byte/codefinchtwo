import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, User, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import type { MentorWithUser } from "@shared/schema";

// Helper function to get timezone abbreviation
function getTimezoneAbbreviation(): string {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Common timezone mappings
  const timezoneMap: { [key: string]: string } = {
    'Asia/Kolkata': 'IST',
    'Asia/Calcutta': 'IST',
    'America/New_York': 'EST',
    'America/Chicago': 'CST',
    'America/Denver': 'MST',
    'America/Los_Angeles': 'PST',
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'Asia/Tokyo': 'JST',
    'Australia/Sydney': 'AEDT',
  };

  if (timezoneMap[timezone]) {
    return timezoneMap[timezone];
  }

  // Fallback: get offset-based abbreviation
  const offset = new Date().getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset > 0 ? '-' : '+';
  
  if (minutes === 0) {
    return `UTC${sign}${hours}`;
  }
  return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
}

// Helper function to get today's date in local timezone as YYYY-MM-DD
function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to get date N days from now in local timezone
function getDateNDaysFromNow(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function Booking() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/booking/:mentorId");
  
  const mentorId = params ? (params as { mentorId: string }).mentorId : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to book a session with a mentor.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate, toast]);

  const [formData, setFormData] = useState({
    studentName: "",
    studentAge: "",
    parentEmail: "",
    selectedDate: "",
    selectedTime: "",
    duration: "60",
    subject: "",
    notes: "",
  });

  const { data: mentor, isLoading } = useQuery<MentorWithUser>({
    queryKey: ["/api/mentors", mentorId],
    enabled: !!mentorId,
  });

  // Fetch student details for auto-population
  const { data: studentData, isLoading: studentLoading } = useQuery<any>({
    queryKey: ["/api/users", user?.email, "student"],
    enabled: !!user?.email,
  });

  // Fetch available time slots from mentor's real schedule - MUST be before conditional returns
  const { data: availabilityData } = useQuery<{
    timeSlots: Array<{id: string, time: string, dayOfWeek: string, startTime: string, endTime: string}>,
    availableSlots: Array<{day: string, times: string[]}>,
    rawTimes: string[]
  }>({
    queryKey: ["/api/mentors", mentorId, "available-times"],
    enabled: !!mentorId,
  });

  // Fetch mentor subjects from Class Fee Configuration
  const { data: mentorSubjects } = useQuery<{
    subjects: Array<{id: string, subject: string, classFee: string, experience: string, priority: number}>,
    message?: string
  }>({
    queryKey: ["/api/mentors", mentorId, "subjects"],
    enabled: !!mentorId,
  });

  // Fetch global payment mode configuration
  const { data: paymentModeConfig } = useQuery<{ paymentMode: 'dummy' | 'realtime' }>({
    queryKey: ['admin-payment-mode-config'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/payment-config');
        const result = await response.json();
        return result as { paymentMode: 'dummy' | 'realtime' };
      } catch (error) {
        console.error('Failed to fetch payment mode:', error);
        return { paymentMode: 'dummy' as const };
      }
    },
  });

  // Get selected subject's fee from mentorSubjects
  const selectedSubjectFee = formData.subject && mentorSubjects
    ? mentorSubjects.subjects.find(s => s.subject === formData.subject)?.classFee
    : null;

  // Auto-populate form fields when student data loads
  useEffect(() => {
    if (studentData && user) {
      setFormData(prev => ({
        ...prev,
        studentName: studentData.user ? `${studentData.user.firstName} ${studentData.user.lastName}` : "",
        studentAge: studentData.age?.toString() || "",
        parentEmail: studentData.parentEmail || user.email,
      }));
    }
  }, [studentData, user]);

  // Calculate displayed session cost using selected subject's fee
  const calculateSessionCost = (): number => {
    const duration = parseInt(formData.duration) || 60;
    
    // Check if there's a subject-specific fee
    if (selectedSubjectFee) {
      // Subject fees are flat per-class, regardless of duration
      return parseFloat(selectedSubjectFee);
    } else {
      // Fall back to hourly rate (multiplied by duration)
      const hourlyRate = (typeof mentor?.hourlyRate === 'number' ? mentor.hourlyRate : parseFloat(String(mentor?.hourlyRate))) || 500;
      return Math.round((duration / 60) * hourlyRate);
    }
  };

  const displayedCost = calculateSessionCost();

  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Confirmed!",
        description: "Your session has been successfully booked. You'll receive a confirmation email shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      navigate("/");
    },
    onError: (error: any) => {
      const errorMessage = error.message || "There was an error booking your session. Please try again.";
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Booking error:", error);
    },
  });

  // Fetch teacher's existing bookings to check for overlaps - MUST be before conditional returns
  const { data: teacherBookings } = useQuery<any[]>({
    queryKey: ["/api/mentors", mentorId, "bookings"],
    enabled: !!mentorId && !!formData.selectedDate,
  });

  if (!match || !mentorId) {
    return <div>Booking page not found</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded-xl"></div>
              <div className="h-96 bg-muted rounded-xl"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Mentor not found</h1>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation
    // Student name validation
    const trimmedStudentName = formData.studentName.trim();
    if (!trimmedStudentName) {
      toast({
        title: "Student Name Required",
        description: "Please enter the student's name.",
        variant: "destructive",
      });
      return;
    }

    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(trimmedStudentName)) {
      toast({
        title: "Invalid Student Name",
        description: "Student name can only contain letters, spaces, hyphens, and apostrophes.",
        variant: "destructive",
      });
      return;
    }

    // Student age validation (optional but if provided must be valid)
    if (formData.studentAge) {
      const age = parseInt(formData.studentAge);
      if (isNaN(age) || age < 5 || age > 18) {
        toast({
          title: "Invalid Age",
          description: "Student age must be between 5 and 18 years.",
          variant: "destructive",
        });
        return;
      }
    }

    // Parent email validation
    const trimmedParentEmail = formData.parentEmail.trim();
    if (!trimmedParentEmail) {
      toast({
        title: "Parent Email Required",
        description: "Please enter the parent/guardian email address.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedParentEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Date validation
    if (!formData.selectedDate) {
      toast({
        title: "Date Required",
        description: "Please select a session date.",
        variant: "destructive",
      });
      return;
    }

    const selectedDate = new Date(formData.selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast({
        title: "Invalid Date",
        description: "Please select a future date for the session.",
        variant: "destructive",
      });
      return;
    }

    // Time validation
    if (!formData.selectedTime) {
      toast({
        title: "Time Required",
        description: "Please select a session time.",
        variant: "destructive",
      });
      return;
    }

    // Subject validation - REQUIRED
    if (!formData.subject || !formData.subject.trim()) {
      toast({
        title: "Subject Required",
        description: "Please select a subject for the session.",
        variant: "destructive",
      });
      return;
    }

    // Keep datetime string in local timezone (don't convert to UTC)
    const scheduledAt = `${formData.selectedDate}T${formData.selectedTime}`;
    
    // Get authenticated user info
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      toast({
        title: "Authentication Required",
        description: "Please login to book a session.",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate session cost based on duration and mentor's rate
    // Priority: 1. Subject-specific fee (flat per-class), 2. Hourly rate, 3. Default (500)
    const duration = parseInt(formData.duration);
    let sessionCost: number;
    
    // Check if there's a subject-specific fee
    if (selectedSubjectFee) {
      // Subject fees are flat per-class, regardless of duration
      sessionCost = parseFloat(selectedSubjectFee);
      console.log(`💰 Using subject-specific fee: ₹${sessionCost} for ${formData.subject} (flat per-class)`);
    } else {
      // Fall back to hourly rate (multiplied by duration)
      const hourlyRate = (typeof mentor.hourlyRate === 'number' ? mentor.hourlyRate : parseInt(String(mentor.hourlyRate))) || 500;
      sessionCost = Math.round((duration / 60) * hourlyRate);
      console.log(`💰 Using hourly rate: ₹${hourlyRate}/hour × ${duration}min = ₹${sessionCost}`);
    }
    
    // Prepare booking details for payment
    const bookingDetails = {
      userEmail: userEmail,
      mentorId,
      mentorName: `${mentor.user.firstName} ${mentor.user.lastName}`,
      scheduledAt: scheduledAt,
      duration: duration,
      subject: formData.subject || 'General Programming', // Default if not selected
      notes: formData.notes,
      studentAge: parseInt(formData.studentAge) || null,
      studentName: formData.studentName,
      parentEmail: formData.parentEmail,
      sessionCost: sessionCost
    };
    
    // Check payment mode to determine flow
    const paymentMode = paymentModeConfig?.paymentMode || 'dummy';
    
    if (paymentMode === 'dummy') {
      // Dummy mode: Create booking directly without payment
      console.log('💳 Dummy payment mode: Creating booking directly without payment');
      bookingMutation.mutate(bookingDetails);
    } else {
      // Realtime mode: Store booking details and redirect to payment checkout
      console.log('💳 Realtime payment mode: Redirecting to Stripe checkout');
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingDetails));
      navigate(`/booking-checkout?mentorId=${mentorId}&amount=${sessionCost}`);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  // Helper function to generate hourly intervals from a time range
  const generateHourlySlots = (startTime: string, endTime: string): string[] => {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    // Generate hourly slots up to (but not including) the end time
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`);
    }
    
    return slots;
  };

  // Helper function to format time in AM/PM
  const formatTimeAMPM = (time24: string): string => {
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  // Get day of week from selected date (0 = Sunday, 1 = Monday, etc.)
  const getDayOfWeek = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Generate time slots based on selected date
  const getAvailableTimeSlotsForDate = (): string[] => {
    if (!formData.selectedDate || !availabilityData?.timeSlots) {
      return [];
    }

    const dayOfWeek = getDayOfWeek(formData.selectedDate);
    const selectedDate = new Date(formData.selectedDate);
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    
    console.log(`📅 Selected date: ${formData.selectedDate}, Day: ${dayOfWeek}`);
    
    // Filter slots for the selected day
    const daySlots = availabilityData.timeSlots.filter(
      slot => slot.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase()
    );
    
    console.log(`📅 Found ${daySlots.length} slots for ${dayOfWeek}:`, daySlots);
    
    // Generate hourly intervals for each slot
    const allTimeSlots: string[] = [];
    daySlots.forEach(slot => {
      const hourlySlots = generateHourlySlots(slot.startTime, slot.endTime);
      allTimeSlots.push(...hourlySlots);
    });
    
    // Remove duplicates and sort
    let uniqueSlots = Array.from(new Set(allTimeSlots)).sort();
    
    // Filter out past times if today
    if (isToday) {
      uniqueSlots = uniqueSlots.filter(time => {
        const [hour, minute] = time.split(':').map(Number);
        return hour > currentHour || (hour === currentHour && minute > currentMinute);
      });
    }
    
    // Filter out times that overlap with teacher's existing bookings
    if (teacherBookings && teacherBookings.length > 0) {
      const duration = parseInt(formData.duration) || 60;
      uniqueSlots = uniqueSlots.filter(time => {
        const slotDateTime = new Date(`${formData.selectedDate}T${time}:00`);
        const slotEndTime = new Date(slotDateTime.getTime() + duration * 60000);
        
        // Check if this slot conflicts with any existing booking
        return !teacherBookings.some(booking => {
          const bookingStart = new Date(booking.scheduledAt);
          const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
          
          // Check for overlap: slot starts before booking ends AND slot ends after booking starts
          return slotDateTime < bookingEnd && slotEndTime > bookingStart;
        });
      });
    }
    
    console.log(`📅 Available time slots for ${dayOfWeek}:`, uniqueSlots);
    
    return uniqueSlots;
  };

  const timeSlots = getAvailableTimeSlotsForDate();

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-booking-title">
            Book a Session with {mentor.user.firstName} {mentor.user.lastName}
          </h1>
          <Button 
            variant="outline" 
            onClick={() => navigate("/mentors")}
            data-testid="button-go-to-mentors"
          >
            ← Go to Mentors List
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Mentor Info */}
          <Card>
            <CardHeader>
              <CardTitle>Mentor Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold" data-testid="avatar-mentor-booking">
                  {mentor.user.profileImageUrl ? (
                    <img 
                      src={mentor.user.profileImageUrl} 
                      alt={`${mentor.user.firstName} ${mentor.user.lastName}`} 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    getInitials(mentor.user.firstName, mentor.user.lastName)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground" data-testid="text-mentor-name-booking">
                    {mentor.user.firstName} {mentor.user.lastName}
                  </h3>
                  <p className="text-muted-foreground" data-testid="text-mentor-title-booking">
                    {mentor.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {mentor.experience} years experience
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Teacher Specialties:</h4>
                <div className="flex flex-wrap gap-2">
                  {mentorSubjects && mentorSubjects.subjects.length > 0 ? (
                    mentorSubjects.subjects.map((subject: any, index: number) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        {subject.subject} ({subject.experience})
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No specialties listed</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <h4 className="font-medium text-foreground">Subjects & Courses:</h4>
                <div className="flex flex-wrap gap-2">
                  {mentorSubjects && mentorSubjects.subjects.length > 0 ? (
                    mentorSubjects.subjects.map((subject: any, index: number) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                        title={`${subject.experience} experience`}
                      >
                        {subject.subject} - ₹{subject.classFee}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No subjects listed</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Student Name *</Label>
                    <Input
                      id="studentName"
                      value={formData.studentName}
                      onChange={(e) => handleInputChange("studentName", e.target.value)}
                      placeholder="Enter student's name"
                      required
                      data-testid="input-student-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentAge">Student Age</Label>
                    <Input
                      id="studentAge"
                      type="number"
                      value={formData.studentAge}
                      onChange={(e) => handleInputChange("studentAge", e.target.value)}
                      placeholder="Age"
                      min="5"
                      max="18"
                      data-testid="input-student-age"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentEmail">Parent/Guardian Email *</Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => handleInputChange("parentEmail", e.target.value)}
                    placeholder="parent@example.com"
                    required
                    data-testid="input-parent-email"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="selectedDate">Preferred Date *</Label>
                    <Input
                      id="selectedDate"
                      type="date"
                      value={formData.selectedDate}
                      onChange={(e) => handleInputChange("selectedDate", e.target.value)}
                      min={getTodayLocalDate()}
                      max={getDateNDaysFromNow(5)}
                      required
                      data-testid="input-session-date"
                    />
                    <p className="text-xs text-muted-foreground">Bookings available for next 5 days only</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selectedTime">Preferred Time ({getTimezoneAbbreviation()}) *</Label>
                    <Select value={formData.selectedTime} onValueChange={(value) => handleInputChange("selectedTime", value)} required>
                      <SelectTrigger data-testid="select-session-time">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.length > 0 ? (
                          timeSlots.map((time: string) => (
                            <SelectItem key={time} value={time}>
                              {formatTimeAMPM(time)}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-slots" disabled>No time slots available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Session Duration</Label>
                  <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
                    <SelectTrigger data-testid="select-session-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select value={formData.subject} onValueChange={(value) => handleInputChange("subject", value)} required>
                    <SelectTrigger data-testid="select-session-subject">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {mentorSubjects && mentorSubjects.subjects.length > 0 ? (
                        <>
                          {mentorSubjects.subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.subject}>
                              {subject.subject} - ₹{subject.classFee}
                            </SelectItem>
                          ))}
                        </>
                      ) : (
                        <SelectItem value="no-subjects" disabled>
                          Teacher has not configured any subjects yet
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Any specific topics or goals for the session?"
                    rows={3}
                    data-testid="textarea-session-notes"
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-medium">Total Cost:</span>
                    <span className="text-2xl font-bold text-primary" data-testid="text-total-cost">
                      ₹{displayedCost.toFixed(2)}
                    </span>
                  </div>
                  {formData.subject && selectedSubjectFee && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Using subject-specific flat fee for {formData.subject}
                    </p>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={bookingMutation.isPending}
                    data-testid="button-confirm-booking"
                  >
                    {bookingMutation.isPending ? "Booking..." : "Confirm Booking"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
