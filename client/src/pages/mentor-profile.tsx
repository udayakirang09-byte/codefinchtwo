import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Star, Users, Clock, Calendar, Video, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import type { MentorWithUser, ReviewWithDetails } from "@shared/schema";

export default function MentorProfile() {
  const [match, params] = useRoute("/mentors/:id");
  const mentorId = params?.id;

  const { data: mentor, isLoading: mentorLoading } = useQuery<MentorWithUser>({
    queryKey: ["/api/mentors", mentorId],
    enabled: !!mentorId,
  });

  const { data: reviews = [] } = useQuery<ReviewWithDetails[]>({
    queryKey: ["/api/mentors", mentorId, "reviews"],
    enabled: !!mentorId,
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
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center" data-testid="stat-mentor-rating">
                    <Star className="text-accent mr-1" size={16} />
                    <span>{parseFloat(mentor.rating || "0").toFixed(1)} ({reviews.length} reviews)</span>
                  </div>
                  <div className="flex items-center" data-testid="stat-mentor-students">
                    <Users className="mr-1" size={16} />
                    <span>{mentor.totalStudents} students taught</span>
                  </div>
                  <div className="flex items-center" data-testid="stat-mentor-experience">
                    <Clock className="mr-1" size={16} />
                    <span>{mentor.experience} years experience</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-mentor-description">
                {mentor.description}
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Specialties</h2>
              <div className="flex flex-wrap gap-3">
                {mentor.specialties?.map((specialty, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-sm px-3 py-1"
                    data-testid={`badge-specialty-${index}`}
                  >
                    {specialty}
                  </Badge>
                ))}
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
                  <div className="text-3xl font-bold text-foreground mb-2" data-testid="text-hourly-rate">
                    ${mentor.hourlyRate || "50"}/hr
                  </div>
                  <p className="text-muted-foreground">1-on-1 sessions</p>
                </div>

                <div className="space-y-3 mb-6">
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
                      alert('Video calling feature coming soon! Book a session for now.');
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
                      alert('Messaging feature coming soon! Book a session to get started.');
                    }}
                  >
                    <MessageSquare className="mr-2" size={20} />
                    Send Message
                  </Button>
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
                  {mentor.availableSlots && mentor.availableSlots.length > 0 ? (
                    mentor.availableSlots.map((slot, index) => (
                      <div key={index} className="flex justify-between items-center text-sm" data-testid={`availability-${index}`}>
                        <span className="text-muted-foreground">{slot.day}</span>
                        <span className="text-foreground">{slot.times.join(", ")}</span>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Monday - Friday</span>
                        <span className="text-foreground">4:00 PM - 8:00 PM</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Saturday</span>
                        <span className="text-foreground">10:00 AM - 2:00 PM</span>
                      </div>
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
