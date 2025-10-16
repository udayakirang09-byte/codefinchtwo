import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  courseId?: string;
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
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [bulkRescheduleDialogOpen, setBulkRescheduleDialogOpen] = useState(false);
  const [bulkNewDateTime, setBulkNewDateTime] = useState('');
  const [bulkErrorMessage, setBulkErrorMessage] = useState('');
  const [cancelCourseDialogOpen, setCancelCourseDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [cancelBookingDialogOpen, setCancelBookingDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [bulkCancelDialogOpen, setBulkCancelDialogOpen] = useState(false);

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

  // Bulk reschedule mutation
  const bulkRescheduleMutation = useMutation({
    mutationFn: async ({ bookingIds, scheduledAt }: { bookingIds: string[]; scheduledAt: string }) => {
      const response = await apiRequest('POST', '/api/bookings/bulk-reschedule', { bookingIds, scheduledAt });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'bookings'] });
      setBulkRescheduleDialogOpen(false);
      setBulkNewDateTime('');
      setBulkErrorMessage('');
      setSelectedBookingIds([]);
      toast({
        title: 'Bulk Reschedule Complete',
        description: data.message || `Rescheduled ${data.successful?.length || 0} bookings successfully.`,
      });
      if (data.failed && data.failed.length > 0) {
        toast({
          title: 'Some Bookings Failed',
          description: `${data.failed.length} bookings could not be rescheduled. Check the 6-hour restriction.`,
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      setBulkErrorMessage(error.message || 'Unable to bulk reschedule. Please try again.');
    },
  });

  // Bulk cancel mutation
  const bulkCancelMutation = useMutation({
    mutationFn: async (bookingIds: string[]) => {
      const response = await apiRequest('POST', '/api/bookings/bulk-cancel', { 
        bookingIds, 
        userId: user?.id 
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'bookings'] });
      setSelectedBookingIds([]);
      const refundInfo = data.totalRefundAmount && parseFloat(data.totalRefundAmount) > 0
        ? ` Refund of ₹${data.totalRefundAmount} will be processed in ${data.refundTime}.`
        : '';
      toast({
        title: 'Bulk Cancellation Complete',
        description: (data.message || `Cancelled ${data.successful?.length || 0} bookings successfully.`) + refundInfo,
      });
      if (data.failed && data.failed.length > 0) {
        toast({
          title: 'Some Bookings Failed',
          description: `${data.failed.length} bookings could not be cancelled. Check the 6-hour restriction.`,
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Bulk Cancellation Failed',
        description: error.message || 'Unable to bulk cancel. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Cancel course mutation
  const cancelCourseMutation = useMutation({
    mutationFn: async ({ enrollmentId, userId, forceCancel }: { enrollmentId: string; userId: string; forceCancel?: boolean }) => {
      try {
        const response = await apiRequest('POST', `/api/enrollments/${enrollmentId}/cancel`, { userId, forceCancel });
        return await response.json();
      } catch (error: any) {
        // apiRequest throws Error with format "${status}: ${jsonText}"
        // Try to parse the JSON from the error message
        const errorMessage = error.message || '';
        const match = errorMessage.match(/^\d+:\s*(.+)$/);
        if (match) {
          try {
            const errorData = JSON.parse(match[1]);
            if (errorData.hasNonCancellableClasses) {
              throw { isWarning: true, ...errorData };
            }
          } catch (parseError) {
            // Not JSON, fall through
          }
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'bookings'] });
      setCancelCourseDialogOpen(false);
      setSelectedEnrollment(null);
      const refundAmount = data.refundAmount ? parseFloat(data.refundAmount) : 0;
      const refundPercentage = data.refundPercentage || 0;
      let description = 'Course cancelled successfully.';
      if (data.keptClasses > 0) {
        description += ` ${data.keptClasses} class(es) within 6 hours cannot be cancelled.`;
      }
      if (refundAmount > 0) {
        description += ` Refund of ₹${refundAmount} (${refundPercentage}%) will be processed in 3-5 business days.`;
      }
      toast({
        title: 'Course Cancelled',
        description,
      });
    },
    onError: (error: any) => {
      // Check if it's a warning about non-cancellable classes
      if (error.isWarning && error.hasNonCancellableClasses) {
        // Show confirmation dialog with the warning
        const message = `${error.nonCancellableCount} class(es) are within 6 hours and cannot be cancelled.\n\nWould you like to cancel the remaining ${error.cancellableCount} class(es) and the course?`;
        
        if (window.confirm(message)) {
          // Retry with forceCancel = true
          if (selectedEnrollment && user) {
            cancelCourseMutation.mutate({
              enrollmentId: selectedEnrollment.id,
              userId: user.id,
              forceCancel: true
            });
          }
        } else {
          setCancelCourseDialogOpen(false);
          setSelectedEnrollment(null);
        }
      } else {
        toast({
          title: 'Cancellation Failed',
          description: error.message || 'Unable to cancel the course. Please try again.',
          variant: 'destructive',
        });
      }
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
    setBookingToCancel(bookingId);
    setCancelBookingDialogOpen(true);
  };

  const confirmCancelBooking = () => {
    if (!bookingToCancel) return;
    cancelMutation.mutate(bookingToCancel);
    setCancelBookingDialogOpen(false);
    setBookingToCancel(null);
  };

  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookingIds(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleBulkReschedule = () => {
    if (selectedBookingIds.length === 0) return;
    setBulkRescheduleDialogOpen(true);
    setBulkErrorMessage('');
    setBulkNewDateTime('');
  };

  const handleBulkRescheduleSubmit = () => {
    if (selectedBookingIds.length === 0 || !bulkNewDateTime) return;
    bulkRescheduleMutation.mutate({
      bookingIds: selectedBookingIds,
      scheduledAt: bulkNewDateTime,
    });
  };

  const handleBulkCancel = () => {
    if (selectedBookingIds.length === 0) return;
    setBulkCancelDialogOpen(true);
  };

  const confirmBulkCancel = () => {
    bulkCancelMutation.mutate(selectedBookingIds);
    setBulkCancelDialogOpen(false);
  };

  const handleCancelCourse = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setCancelCourseDialogOpen(true);
  };

  const confirmCancelCourse = () => {
    if (!selectedEnrollment || !user) return;
    
    cancelCourseMutation.mutate({
      enrollmentId: selectedEnrollment.id,
      userId: user.id
    });
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
            {/* Bulk Actions Bar */}
            {activeBookings.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {selectedBookingIds.length > 0 
                      ? `${selectedBookingIds.length} booking(s) selected` 
                      : 'Select bookings for bulk actions'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleBulkReschedule}
                    disabled={selectedBookingIds.length === 0 || bulkRescheduleMutation.isPending || bulkCancelMutation.isPending}
                    data-testid="button-bulk-reschedule"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Bulk Reschedule
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={handleBulkCancel}
                    disabled={selectedBookingIds.length === 0 || bulkRescheduleMutation.isPending || bulkCancelMutation.isPending}
                    data-testid="button-bulk-cancel"
                  >
                    {bulkCancelMutation.isPending ? 'Cancelling...' : 'Bulk Cancel'}
                  </Button>
                </div>
              </div>
            )}

            {/* Single Classes Section */}
            {activeBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Single Classes ({activeBookings.length})</h2>
                <div className="grid gap-4">
                  {activeBookings.map((booking) => (
                    <Card key={booking.id} className="hover:shadow-lg transition-shadow duration-200" data-testid={`card-booking-${booking.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Checkbox 
                              checked={selectedBookingIds.includes(booking.id)}
                              onCheckedChange={() => toggleBookingSelection(booking.id)}
                              data-testid={`checkbox-select-${booking.id}`}
                              className="mt-1"
                            />
                            <div>
                              <CardTitle className="text-xl font-semibold">{booking.subject}</CardTitle>
                              <CardDescription className="text-base mt-1">
                                with {booking.mentor?.user?.name || 'Mentor'}
                              </CardDescription>
                            </div>
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
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleReschedule(booking)}
                            disabled={cancelMutation.isPending || rescheduleMutation.isPending || bulkRescheduleMutation.isPending || bulkCancelMutation.isPending}
                            data-testid={`button-reschedule-${booking.id}`}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Reschedule
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleCancel(booking.id)}
                            disabled={cancelMutation.isPending || rescheduleMutation.isPending || bulkRescheduleMutation.isPending || bulkCancelMutation.isPending}
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
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleCancelCourse(enrollment)}
                            disabled={cancelCourseMutation.isPending}
                            data-testid={`button-cancel-course-${enrollment.id}`}
                          >
                            {cancelCourseMutation.isPending ? 'Cancelling...' : 'Cancel Course'}
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

      {/* Bulk Reschedule Dialog */}
      <Dialog open={bulkRescheduleDialogOpen} onOpenChange={setBulkRescheduleDialogOpen}>
        <DialogContent data-testid="dialog-bulk-reschedule">
          <DialogHeader>
            <DialogTitle>Bulk Reschedule Classes</DialogTitle>
            <DialogDescription>
              Choose a new date and time for {selectedBookingIds.length} selected booking(s)
            </DialogDescription>
          </DialogHeader>
          
          {bulkErrorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{bulkErrorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-datetime">New Date & Time</Label>
              <Input
                id="bulk-datetime"
                type="datetime-local"
                value={bulkNewDateTime}
                onChange={(e) => setBulkNewDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                data-testid="input-bulk-new-datetime"
              />
              <p className="text-sm text-gray-500 mt-1">
                Note: The 6-hour restriction applies to each booking individually. Some bookings may fail if they're too close to their scheduled time.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkRescheduleDialogOpen(false);
                setBulkErrorMessage('');
              }}
              data-testid="button-cancel-bulk-reschedule"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkRescheduleSubmit}
              disabled={!bulkNewDateTime || bulkRescheduleMutation.isPending}
              data-testid="button-confirm-bulk-reschedule"
            >
              {bulkRescheduleMutation.isPending ? 'Rescheduling...' : `Reschedule ${selectedBookingIds.length} Booking(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <Dialog open={cancelBookingDialogOpen} onOpenChange={setCancelBookingDialogOpen}>
        <DialogContent data-testid="dialog-cancel-booking">
          <DialogHeader>
            <DialogTitle>Cancel Class Booking?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? Any applicable payment will be refunded.
            </DialogDescription>
          </DialogHeader>

          {bookingToCancel && activeBookings.find(b => b.id === bookingToCancel)?.courseId && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Warning:</strong> This class is part of an enrolled course. Deleting individual classes may affect your course progress and completion. Consider using the "Cancel Course" option instead to cancel all remaining classes together.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelBookingDialogOpen(false);
                setBookingToCancel(null);
              }}
              data-testid="button-cancel-booking-cancel"
            >
              No, Keep It
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelBooking}
              disabled={cancelMutation.isPending}
              data-testid="button-confirm-cancel-booking"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Cancel Dialog */}
      <Dialog open={bulkCancelDialogOpen} onOpenChange={setBulkCancelDialogOpen}>
        <DialogContent data-testid="dialog-bulk-cancel">
          <DialogHeader>
            <DialogTitle>Cancel Multiple Bookings?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel {selectedBookingIds.length} selected booking(s)? Any applicable payments will be refunded.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkCancelDialogOpen(false)}
              data-testid="button-cancel-bulk-cancel"
            >
              No, Keep Them
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBulkCancel}
              disabled={bulkCancelMutation.isPending}
              data-testid="button-confirm-bulk-cancel"
            >
              {bulkCancelMutation.isPending ? 'Cancelling...' : `Yes, Cancel ${selectedBookingIds.length} Booking(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Course Dialog */}
      <Dialog open={cancelCourseDialogOpen} onOpenChange={setCancelCourseDialogOpen}>
        <DialogContent data-testid="dialog-cancel-course">
          <DialogHeader>
            <DialogTitle>Cancel Course Enrollment?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your enrollment in {selectedEnrollment?.course?.title || 'this course'}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Course:</span>
                <span className="text-sm">{selectedEnrollment?.course?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Mentor:</span>
                <span className="text-sm">{selectedEnrollment?.mentor?.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Progress:</span>
                <span className="text-sm">{selectedEnrollment?.completedClasses}/{selectedEnrollment?.totalClasses} classes completed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Refund:</span>
                <span className="text-sm">Will be calculated based on remaining classes</span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will cancel all future classes in this course. Any applicable refund will be processed in 3-5 business days.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelCourseDialogOpen(false);
                setSelectedEnrollment(null);
              }}
              data-testid="button-cancel-course-cancel"
            >
              Keep Course
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelCourse}
              disabled={cancelCourseMutation.isPending}
              data-testid="button-confirm-cancel-course"
            >
              {cancelCourseMutation.isPending ? 'Cancelling...' : 'Cancel Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
