import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Video, Home, BookOpen, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { format, isPast } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';

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
  const { toast } = useToast();
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newDateTime, setNewDateTime] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest('PATCH', `/api/bookings/${bookingId}/cancel`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'bookings'] });
      toast({
        title: 'Booking Cancelled',
        description: 'Your class has been cancelled successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Unable to cancel the booking. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Reschedule booking mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({ bookingId, scheduledAt }: { bookingId: string; scheduledAt: string }) => {
      const response = await apiRequest('PATCH', `/api/bookings/${bookingId}/reschedule`, { scheduledAt });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'bookings'] });
      setRescheduleDialogOpen(false);
      setSelectedBooking(null);
      setNewDateTime('');
      setErrorMessage('');
      toast({
        title: 'Booking Rescheduled',
        description: 'Your class has been rescheduled successfully.',
      });
    },
    onError: (error: any) => {
      setErrorMessage(error.message || 'Unable to reschedule the booking. Please try again.');
    },
  });

  const handleReschedule = (booking: Booking) => {
    setSelectedBooking(booking);
    setRescheduleDialogOpen(true);
    setErrorMessage('');
    setNewDateTime('');
  };

  const handleRescheduleSubmit = () => {
    if (!selectedBooking || !newDateTime) return;

    rescheduleMutation.mutate({
      bookingId: selectedBooking.id,
      scheduledAt: newDateTime,
    });
  };

  const handleCancel = (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      cancelMutation.mutate(bookingId);
    }
  };

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
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleReschedule(booking)}
                            disabled={cancelMutation.isPending || rescheduleMutation.isPending}
                            data-testid={`button-reschedule-${booking.id}`}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Reschedule
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleCancel(booking.id)}
                            disabled={cancelMutation.isPending || rescheduleMutation.isPending}
                            data-testid={`button-cancel-${booking.id}`}
                          >
                            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
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

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent data-testid="dialog-reschedule">
          <DialogHeader>
            <DialogTitle>Reschedule Class</DialogTitle>
            <DialogDescription>
              Choose a new date and time for your class with {selectedBooking?.mentor?.user?.name}
            </DialogDescription>
          </DialogHeader>
          
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="datetime">New Date & Time</Label>
              <Input
                id="datetime"
                type="datetime-local"
                value={newDateTime}
                onChange={(e) => setNewDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                data-testid="input-new-datetime"
              />
              <p className="text-sm text-gray-500 mt-1">
                Note: Rescheduling is not allowed within 6 hours of the scheduled class time.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRescheduleDialogOpen(false);
                setErrorMessage('');
              }}
              data-testid="button-cancel-reschedule"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleSubmit}
              disabled={!newDateTime || rescheduleMutation.isPending}
              data-testid="button-confirm-reschedule"
            >
              {rescheduleMutation.isPending ? 'Rescheduling...' : 'Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
