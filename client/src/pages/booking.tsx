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

export default function Booking() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/booking/:mentorId");
  const mentorId = params?.mentorId;
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
    timeSlots: Array<{id: string, time: string, dayOfWeek: string}>,
    availableSlots: Array<{day: string, times: string[]}>,
    rawTimes: string[]
  }>({
    queryKey: ["/api/mentors", mentorId, "available-times"],
    enabled: !!mentorId,
  });

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
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: "There was an error booking your session. Please try again.",
        variant: "destructive",
      });
      console.error("Booking error:", error);
    },
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
    
    if (!formData.studentName || !formData.parentEmail || !formData.selectedDate || !formData.selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const scheduledAt = new Date(`${formData.selectedDate}T${formData.selectedTime}`);
    
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
    
    // Calculate session cost based on duration and mentor's hourly rate
    const duration = parseInt(formData.duration);
    const hourlyRate = (typeof mentor.hourlyRate === 'number' ? mentor.hourlyRate : parseInt(String(mentor.hourlyRate))) || 500; // Default rate if not set
    const sessionCost = Math.round((duration / 60) * hourlyRate);
    
    // Prepare booking details for payment
    const bookingDetails = {
      userEmail: userEmail,
      mentorId,
      mentorName: `${mentor.user.firstName} ${mentor.user.lastName}`,
      scheduledAt: scheduledAt.toISOString(),
      duration: duration,
      notes: formData.notes,
      studentAge: parseInt(formData.studentAge) || null,
      studentName: formData.studentName,
      parentEmail: formData.parentEmail,
      sessionCost: sessionCost
    };
    
    // Store booking details in sessionStorage for checkout page
    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingDetails));
    
    // Redirect to checkout page for payment
    navigate(`/booking-checkout?mentorId=${mentorId}&amount=${sessionCost}`);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  // Use real mentor availability or fallback to default times
  const timeSlots = availabilityData?.rawTimes || [
    "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
  ];

  console.log("📅 Available time slots for booking:", timeSlots);

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-3xl font-bold text-foreground mb-8" data-testid="text-booking-title">
          Book a Session with {mentor.user.firstName} {mentor.user.lastName}
        </h1>

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
                    {mentor.experience} years experience • ${mentor.hourlyRate || "50"}/hour
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground">What you'll get:</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>Personalized 1-on-1 coding session</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={16} />
                    <span>Interactive learning experience</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User size={16} />
                    <span>Expert guidance and mentorship</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare size={16} />
                    <span>Follow-up resources and support</span>
                  </div>
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
                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="selectedDate">Preferred Date *</Label>
                    <Input
                      id="selectedDate"
                      type="date"
                      value={formData.selectedDate}
                      onChange={(e) => handleInputChange("selectedDate", e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      data-testid="input-session-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selectedTime">Preferred Time *</Label>
                    <Select onValueChange={(value) => handleInputChange("selectedTime", value)} required>
                      <SelectTrigger data-testid="select-session-time">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time: string) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Session Duration</Label>
                  <Select onValueChange={(value) => handleInputChange("duration", value)} defaultValue="60">
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
                      ${((parseInt(formData.duration) / 60) * parseFloat(mentor.hourlyRate || "50")).toFixed(2)}
                    </span>
                  </div>
                  
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
