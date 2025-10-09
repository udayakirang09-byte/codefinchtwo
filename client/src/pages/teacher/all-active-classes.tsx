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
import { Calendar, Clock, Video, Home, BookOpen, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Booking {
  id: string;
  studentId: string;
  scheduledAt: string;
  duration: number;
  status: string;
  subject: string;
  student: {
    user: {
      name: string;
    };
  };
}

interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  totalClasses: number;
  completedClasses: number;
  courseFee: string;
  status: string;
  enrolledAt: string;
  course: {
    title: string;
    description: string;
  };
  student: {
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

  // Get mentor ID from user email
  const { data: mentorData } = useQuery({
    queryKey: ['/api/users', user?.email, 'mentor'],
    queryFn: async () => {
      if (!user?.email) throw new Error('No user email');
      const response = await fetch(`/api/users/${encodeURIComponent(user.email)}/mentor`);
      if (!response.ok) throw new Error('Failed to fetch mentor data');
      return response.json();
    },
    enabled: !!user?.email,
  });

  const mentorId = mentorData?.id;

  // Fetch bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/mentors', mentorId, 'bookings'],
    enabled: !!mentorId,
  });

  // Fetch enrollments
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
    queryKey: ['/api/mentors', mentorId, 'enrollments'],
    enabled: !!mentorId,
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
      queryClient.invalidateQueries({ queryKey: ['/api/mentors', mentorId, 'bookings'] });
      toast({
        title: 'Booking Cancelled',
        description: 'The class has been cancelled successfully.',
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
      queryClient.invalidateQueries({ queryKey: ['/api/mentors', mentorId, 'bookings'] });
      setRescheduleDialogOpen(false);
      setSelectedBooking(null);
      setNewDateTime('');
      setErrorMessage('');
      toast({
        title: 'Booking Rescheduled',
        description: 'The class has been rescheduled successfully.',
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
      queryClient.invalidateQueries({ queryKey: ['/api/mentors', mentorId, 'bookings'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/mentors', mentorId, 'bookings'] });
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
    mutationFn: async ({ enrollmentId, userId }: { enrollmentId: string; userId: string }) => {
      const response = await apiRequest('POST', `/api/enrollments/${enrollmentId}/cancel`, { userId });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/mentors', mentorId, 'enrollments'] });
      setCancelCourseDialogOpen(false);
      setSelectedEnrollment(null);
      const refundAmount = data.refundAmount ? parseFloat(data.refundAmount) : 0;
      const refundPercentage = data.refundPercentage || 0;
      let description = 'Course cancelled successfully.';
      if (refundAmount > 0) {
        description += ` Refund of ₹${refundAmount} (${refundPercentage}%) will be processed in 48 hours.`;
      }
      toast({
        title: 'Course Cancelled',
        description,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Unable to cancel the course. Please try again.',
        variant: 'destructive',
      });
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
    if (confirm(`Are you sure you want to cancel ${selectedBookingIds.length} selected booking(s)? Any applicable payments will be refunded.`)) {
      bulkCancelMutation.mutate(selectedBookingIds);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6 mt-16">
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
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl">
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Classes</h3>
              <p className="text-gray-600 mb-6">You don't have any active classes at the moment.</p>
              <Link href="/teacher/create-course">
                <Button data-testid="button-create-course">Create a Course</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Bulk Actions Bar */}
            {activeBookings.length > 0 && (
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 font-medium">
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
                        className="rounded-xl"
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
                        className="rounded-xl"
                      >
                        {bulkCancelMutation.isPending ? 'Cancelling...' : 'Bulk Cancel'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Single Classes Section */}
            {activeBookings.length > 0 && (
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Calendar className="h-6 w-6" />
                    Single Classes
                    <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                      {activeBookings.length} scheduled
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {activeBookings.map((booking) => {
                      const scheduledDate = new Date(booking.scheduledAt);
                      
                      return (
                        <div key={booking.id} className="bg-gradient-to-r from-slate-50 to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start gap-3">
                              <Checkbox 
                                checked={selectedBookingIds.includes(booking.id)}
                                onCheckedChange={() => toggleBookingSelection(booking.id)}
                                data-testid={`checkbox-select-${booking.id}`}
                                className="mt-1"
                              />
                              <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-1">{booking.subject}</h3>
                                <p className="text-blue-600 font-medium">with {booking.student?.user?.name || 'Student'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="mb-2 bg-blue-100 text-blue-700 border-blue-300">
                                <Clock className="h-3 w-3 mr-1" />
                                {booking.duration} min
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 mb-4 text-sm">
                            <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{format(scheduledDate, 'PPP')}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                              <Clock className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">{format(scheduledDate, 'p')}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{formatDistanceToNow(scheduledDate, { addSuffix: true })}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <Button 
                              size="lg" 
                              variant="outline" 
                              onClick={() => handleReschedule(booking)}
                              disabled={cancelMutation.isPending || rescheduleMutation.isPending || bulkRescheduleMutation.isPending || bulkCancelMutation.isPending}
                              data-testid={`button-reschedule-${booking.id}`}
                              className="rounded-xl"
                            >
                              <Calendar className="w-5 h-5 mr-2" />
                              Reschedule
                            </Button>
                            <Button 
                              size="lg" 
                              variant="destructive" 
                              onClick={() => handleCancel(booking.id)}
                              disabled={cancelMutation.isPending || rescheduleMutation.isPending || bulkRescheduleMutation.isPending || bulkCancelMutation.isPending}
                              data-testid={`button-cancel-${booking.id}`}
                              className="rounded-xl"
                            >
                              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Classes Section */}
            {activeEnrollments.length > 0 && (
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-600 to-red-700 text-white">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <BookOpen className="h-6 w-6" />
                    Course Enrollments
                    <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                      {activeEnrollments.length} active
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {activeEnrollments.map((enrollment) => (
                      <div key={enrollment.id} className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-xl text-gray-800 mb-1">{enrollment.course?.title || 'Course'}</h3>
                            <p className="text-orange-600 font-medium">with {enrollment.student?.user?.name || 'Student'}</p>
                          </div>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-300">
                            Active Course
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-4">{enrollment.course?.description}</p>
                        
                        <div className="flex items-center gap-6 mb-4 text-sm">
                          <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                            <BookOpen className="h-4 w-4 text-orange-600" />
                            <span className="font-medium">{enrollment.completedClasses}/{enrollment.totalClasses} classes completed</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">Enrolled {format(new Date(enrollment.enrolledAt), 'PP')}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button 
                            size="lg" 
                            variant="outline" 
                            data-testid={`button-view-schedule-${enrollment.id}`}
                            className="rounded-xl"
                          >
                            <Calendar className="w-5 h-5 mr-2" />
                            View Schedule
                          </Button>
                          <Button 
                            size="lg" 
                            variant="destructive" 
                            onClick={() => handleCancelCourse(enrollment)}
                            disabled={cancelCourseMutation.isPending}
                            data-testid={`button-cancel-course-${enrollment.id}`}
                            className="rounded-xl"
                          >
                            {cancelCourseMutation.isPending ? 'Cancelling...' : 'Cancel Course'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
              Choose a new date and time for the class with {selectedBooking?.student?.user?.name}
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
              Reschedule {selectedBookingIds.length} selected booking(s) to a new time
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
                data-testid="input-bulk-datetime"
              />
              <p className="text-sm text-gray-500 mt-1">
                Note: Only bookings that meet the 6-hour restriction will be rescheduled.
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
              {bulkRescheduleMutation.isPending ? 'Rescheduling...' : `Reschedule ${selectedBookingIds.length} Classes`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Course Dialog */}
      <Dialog open={cancelCourseDialogOpen} onOpenChange={setCancelCourseDialogOpen}>
        <DialogContent data-testid="dialog-cancel-course">
          <DialogHeader>
            <DialogTitle>Cancel Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the course "{selectedEnrollment?.course?.title}"?
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This will cancel all future classes for this course enrollment. 
              Classes within 6 hours cannot be cancelled and will not be refunded.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelCourseDialogOpen(false)}
              data-testid="button-cancel-course-dialog"
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
