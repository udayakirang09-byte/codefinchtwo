import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, Clock, User, Mail, ArrowRight, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

export default function BookingSuccess() {
  const [location] = useLocation();
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Extract mentor ID from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const mentorId = urlParams.get('mentorId');

  useEffect(() => {
    // Try to get booking details from sessionStorage (if still available)
    const storedBooking = sessionStorage.getItem('pendingBooking');
    if (storedBooking) {
      const booking = JSON.parse(storedBooking);
      setBookingDetails(booking);
      // Clear the stored booking details since payment is complete
      sessionStorage.removeItem('pendingBooking');
    }
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-success-title">
              Booking Confirmed!
            </h1>
            <p className="text-lg text-gray-600">
              Your session has been successfully booked and payment processed.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Booking Details */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Calendar className="h-5 w-5" />
                  Session Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookingDetails ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                      <h3 className="font-bold text-lg mb-2" data-testid="text-mentor-name">
                        {bookingDetails.mentorName}
                      </h3>
                      <p className="text-gray-600 mb-4">Programming Mentor</p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span data-testid="text-session-date">
                            {new Date(bookingDetails.scheduledAt).toLocaleDateString('en-IN', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span data-testid="text-session-time">
                            {new Date(bookingDetails.scheduledAt).toLocaleTimeString('en-IN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} ({bookingDetails.duration} minutes)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-blue-600" />
                          <span data-testid="text-student-name">{bookingDetails.studentName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span data-testid="text-parent-email">{bookingDetails.parentEmail}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Amount Paid:</span>
                        <span className="text-green-600" data-testid="text-amount-paid">₹{bookingDetails.sessionCost}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Payment completed successfully</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Your booking was successful!</p>
                    <p className="text-sm text-gray-500">
                      Check your email for detailed booking information.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <ArrowRight className="h-5 w-5" />
                  What's Next?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3">Before Your Session:</h4>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li>✓ Make sure you are able to login to application</li>
                      <li>✓ Prepare any questions you'd like to discuss</li>
                      <li>✓ Test your video call setup (camera & microphone)</li>
                      <li>✓ Have a notepad ready for key learnings</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3">Session Access:</h4>
                    <ul className="space-y-2 text-sm text-green-700">
                      <li>✓ Join via in app video session</li>
                      <li>✓ Sessions are recorded for your reference</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <Link href="/student/active-classes" data-testid="link-dashboard">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Go to Student Home page
                      </Button>
                    </Link>
                    
                    <Link href="/mentors" data-testid="link-book-another">
                      <Button variant="outline" className="w-full">
                        Book Another Session
                      </Button>
                    </Link>
                    
                    <Link href="/" data-testid="link-home">
                      <Button variant="ghost" className="w-full">
                        <Home className="h-4 w-4 mr-2" />
                        Back to Home
                      </Button>
                    </Link>
                  </div>
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