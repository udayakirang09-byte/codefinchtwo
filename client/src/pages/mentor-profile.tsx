import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Star, Users, Clock, Calendar, Video, MessageSquare, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import type { MentorWithUser, ReviewWithDetails, TimeSlot } from "@shared/schema";

// Helper function to format time in AM/PM format
const formatTimeAMPM = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function MentorProfile() {
  const [match, params] = useRoute("/mentors/:id");
  const [, navigate] = useLocation();
  
  if (!params) {
    return <div>Mentor not found</div>;
  }
  
  const mentorId = (params as { id: string }).id;
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const { data: mentor, isLoading: mentorLoading } = useQuery<MentorWithUser>({
    queryKey: ["/api/mentors", mentorId],
    enabled: !!mentorId,
  });

  const { data: reviews = [] } = useQuery<ReviewWithDetails[]>({
    queryKey: ["/api/mentors", mentorId, "reviews"],
    enabled: !!mentorId,
  });

  const { data: timeSlots = [] } = useQuery<TimeSlot[]>({
    queryKey: [`/api/teacher/schedule?teacherId=${mentor?.user?.email}`],
    enabled: !!mentor?.user?.email,
  });

  if (!match || !mentorId) {
    return <div>Mentor not found</div>;
  }

  if (mentorLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-64 bg-muted rounded-xl mb-6"></div>
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-muted rounded mb-6"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-muted rounded-xl"></div>
                <div className="h-32 bg-muted rounded-xl"></div>
              </div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Mentor not found</h1>
          <p className="text-muted-foreground mb-8">The mentor you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  // Group time slots by day of week
  const groupedTimeSlots = timeSlots.reduce((acc: Record<string, string[]>, slot: TimeSlot) => {
    if (!acc[slot.dayOfWeek]) {
      acc[slot.dayOfWeek] = [];
    }
    const timeRange = `${formatTimeAMPM(slot.startTime)} - ${formatTimeAMPM(slot.endTime)}`;
    acc[slot.dayOfWeek].push(timeRange);
    return acc;
  }, {});

  const stockImage = `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600`;

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/" className="text-primary hover:underline mb-6 inline-block" data-testid="link-back-home">
          ← Back to mentors
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <img 
              src={stockImage} 
              alt={`${mentor.user.firstName} ${mentor.user.lastName} teaching`} 
              className="w-full h-64 object-cover rounded-xl mb-6"
              data-testid="img-mentor-hero"
            />

            <div className="flex items-start space-x-4 mb-6">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold" data-testid="avatar-mentor-large">
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
                <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-mentor-name">
                  {mentor.user.firstName} {mentor.user.lastName}
                </h1>
                <p className="text-xl text-muted-foreground mb-2" data-testid="text-mentor-title">
                  {mentor.title}
                </p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center" data-testid="stat-mentor-rating">
                    <Star className="text-accent mr-1" size={16} />
                    <span>{parseFloat(mentor.rating || "0").toFixed(1)} ({reviews.length} reviews)</span>
                  </div>
                  <div className="flex items-center" data-testid="stat-mentor-students">
                    <Users className="mr-1" size={16} />
                    <span>{mentor.totalStudents} students taught</span>
                  </div>
                  <div className="flex items-center" data-testid="stat-mentor-experience" title="Total experience across all subjects">
                    <Clock className="mr-1" size={16} />
                    <span>{mentor.experience} years total experience</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-mentor-description">
                {mentor.description}
              </p>
              {(mentor as any).country && (mentor as any).country !== 'NA-Country' && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Country:</span> {(mentor as any).country}
                  </p>
                </div>
              )}
            </div>

            {((mentor as any).qualifications && (mentor as any).qualifications.length > 0) && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">Education</h2>
                <div className="space-y-3">
                  {(mentor as any).qualifications.map((qual: any, index: number) => (
                    <Card key={index} className="bg-muted/50">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-foreground">{qual.qualification}</h4>
                        <p className="text-sm text-muted-foreground">Specialization: {qual.specialization}</p>
                        <p className="text-sm text-muted-foreground">Score: {qual.score}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Specialties</h2>
              <div className="flex flex-wrap gap-3">
                {((mentor as any).signupSubjects && (mentor as any).signupSubjects.length > 0) ? (
                  (mentor as any).signupSubjects.map((subject: any, index: number) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-sm px-3 py-1"
                      data-testid={`badge-specialty-${index}`}
                    >
                      {subject.subject} ({subject.experience})
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No specialties listed</p>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Subjects & Courses</h2>
              <div className="flex flex-wrap gap-3">
                {((mentor as any).subjects && (mentor as any).subjects.length > 0) ? (
                  (mentor as any).subjects.map((subject: any, index: number) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-sm px-3 py-1"
                      data-testid={`badge-subject-${index}`}
                      title={`${subject.experience} experience - ₹${subject.classFee} per class`}
                    >
                      {subject.subject} - ₹{subject.classFee}
                    </Badge>
                  ))
                ) : ((mentor as any).subjectsWithExperience && (mentor as any).subjectsWithExperience.length > 0) ? (
                  (mentor as any).subjectsWithExperience.map((item: any, index: number) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-sm px-3 py-1"
                      data-testid={`badge-subject-exp-${index}`}
                      title={`${item.experience} years experience in ${item.subject}`}
                    >
                      {item.subject} ({item.experience} years)
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No subjects listed</p>
                )}
              </div>
            </div>

            {reviews.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Student Reviews</h2>
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review) => (
                    <Card key={review.id} data-testid={`review-${review.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground font-bold">
                            {getInitials(review.student.user.firstName, review.student.user.lastName)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-foreground">
                                {review.student.user.firstName} {review.student.user.lastName}
                              </h4>
                              <div className="flex items-center space-x-1 text-accent">
                                {[...Array(review.rating)].map((_, i) => (
                                  <Star key={i} size={14} fill="currentColor" />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-muted-foreground">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-muted-foreground">1-on-1 sessions</p>
                </div>

                <div className="space-y-3 mb-6">
                  {isAuthenticated ? (
                    <>
                      <Link href={`/booking/${mentor.id}`}>
                        <Button className="w-full" size="lg" data-testid="button-book-session">
                          <Calendar className="mr-2" size={20} />
                          Book a Session
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        data-testid="button-video-call"
                        onClick={() => {
                          console.log('Start Video Call button clicked');
                          navigate(`/booking/${mentor.id}`);
                        }}
                      >
                        <Video className="mr-2" size={20} />
                        Start Video Call
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        data-testid="button-send-message"
                        onClick={() => {
                          console.log('Send Message button clicked');
                          navigate(`/booking/${mentor.id}`);
                        }}
                      >
                        <MessageSquare className="mr-2" size={20} />
                        Send Message
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="w-full" 
                      size="lg" 
                      variant="secondary"
                      data-testid="button-login-to-book"
                      onClick={() => {
                        toast({
                          title: "Login Required",
                          description: "Please login to book a session with this mentor.",
                          variant: "destructive",
                        });
                        navigate("/login");
                      }}
                    >
                      <LogIn className="mr-2" size={20} />
                      Login to Book Session
                    </Button>
                  )}
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <p>✓ Safe & secure platform</p>
                  <p>✓ Parent supervision welcome</p>
                  <p>✓ 100% satisfaction guarantee</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Availability</h3>
                <div className="space-y-2">
                  {Object.keys(groupedTimeSlots).length > 0 ? (
                    Object.entries(groupedTimeSlots).map(([day, times], index) => (
                      <div key={index} className="flex justify-between items-center text-sm" data-testid={`availability-${index}`}>
                        <span className="text-muted-foreground">{day}</span>
                        <span className="text-foreground">{times.join(", ")}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No availability set. Please contact the mentor for scheduling.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
