import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, Home, BookOpen } from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { useAuth } from '@/hooks/use-auth';
import { format, isPast } from 'date-fns';

interface Booking {
  id: string;
  mentorId: string;
  scheduledAt: string;
  duration: number;
  status: string;
  subject: string;
  mentor: {
    user: {
      name: string;
    };
  };
}

interface Enrollment {
  id: string;
  courseId: string;
  mentorId: string;
  totalClasses: number;
  completedClasses: number;
  courseFee: string;
  status: string;
  enrolledAt: string;
  course: {
    title: string;
    description: string;
  };
  mentor: {
    user: {
      name: string;
    };
  };
}

export default function AllActiveClasses() {
  const { user } = useAuth();

  // Get student ID from user email
  const { data: studentData } = useQuery({
    queryKey: ['/api/users', user?.email, 'student'],
    queryFn: async () => {
      if (!user?.email) throw new Error('No user email');
      const response = await fetch(`/api/users/${encodeURIComponent(user.email)}/student`);
      if (!response.ok) throw new Error('Failed to fetch student data');
      return response.json();
    },
    enabled: !!user?.email,
  });

  const studentId = studentData?.id;

  // Fetch bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/students', studentId, 'bookings'],
    enabled: !!studentId,
  });

  // Fetch enrollments
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
    queryKey: ['/api/students', studentId, 'enrollments'],
    enabled: !!studentId,
  });

  const isLoading = bookingsLoading || enrollmentsLoading;

  // Filter active bookings (scheduled and not past)
  const activeBookings = bookings.filter(booking => {
    if (booking.status !== 'scheduled') return false;
    const classEndTime = new Date(new Date(booking.scheduledAt).getTime() + booking.duration * 60000);
    return !isPast(classEndTime);
  });

  // Filter active enrollments
  const activeEnrollments = enrollments.filter(enrollment => enrollment.status === 'active');

  const hasActiveClasses = activeBookings.length > 0 || activeEnrollments.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-6 mt-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">All Active Classes</h1>
            <p className="text-gray-600 mt-2">Manage your upcoming sessions and course enrollments</p>
          </div>
          <Link href="/">
            <Button variant="outline" data-testid="button-home">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-gray-600">Loading your active classes...</p>
          </div>
        ) : !hasActiveClasses ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Classes</h3>
              <p className="text-gray-600 mb-6">You don't have any active classes at the moment.</p>
              <Link href="/mentors">
                <Button data-testid="button-find-mentor">Find a Mentor</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Single Classes Section */}
            {activeBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Single Classes ({activeBookings.length})</h2>
                <div className="grid gap-4">
                  {activeBookings.map((booking) => (
                    <Card key={booking.id} className="hover:shadow-lg transition-shadow duration-200" data-testid={`card-booking-${booking.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl font-semibold">{booking.subject}</CardTitle>
                            <CardDescription className="text-base mt-1">
                              with {booking.mentor?.user?.name || 'Mentor'}
                            </CardDescription>
                          </div>
                          <Badge variant="default" data-testid={`badge-status-${booking.id}`}>Scheduled</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{format(new Date(booking.scheduledAt), 'PPP')}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{format(new Date(booking.scheduledAt), 'p')} ({booking.duration} min)</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button size="sm" data-testid={`button-join-${booking.id}`}>
                            <Video className="w-4 h-4 mr-2" />
                            Join Session
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`button-reschedule-${booking.id}`}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Reschedule
                          </Button>
                          <Button size="sm" variant="destructive" data-testid={`button-cancel-${booking.id}`}>
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Course Classes Section */}
            {activeEnrollments.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Course Classes ({activeEnrollments.length})</h2>
                <div className="grid gap-4">
                  {activeEnrollments.map((enrollment) => (
                    <Card key={enrollment.id} className="hover:shadow-lg transition-shadow duration-200" data-testid={`card-enrollment-${enrollment.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl font-semibold">{enrollment.course?.title || 'Course'}</CardTitle>
                            <CardDescription className="text-base mt-1">
                              with {enrollment.mentor?.user?.name || 'Mentor'}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" data-testid={`badge-enrollment-${enrollment.id}`}>Active Course</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{enrollment.course?.description}</p>
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center text-gray-600">
                            <BookOpen className="w-4 h-4 mr-2" />
                            <span>{enrollment.completedClasses}/{enrollment.totalClasses} classes completed</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>Enrolled {format(new Date(enrollment.enrolledAt), 'PP')}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button size="sm" variant="outline" data-testid={`button-view-schedule-${enrollment.id}`}>
                            <Calendar className="w-4 h-4 mr-2" />
                            View Schedule
                          </Button>
                          <Button size="sm" variant="destructive" data-testid={`button-cancel-course-${enrollment.id}`}>
                            Cancel Course
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
