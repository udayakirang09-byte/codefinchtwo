import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Smartphone, Shield, User, Clock, Calendar } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

// Load Stripe
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const BookingCheckoutForm = ({ bookingDetails }: { bookingDetails: any }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-success?mentorId=${bookingDetails.mentorId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "There was an error processing your payment.",
          variant: "destructive",
        });
      } else {
        // Payment successful - create the booking
        await createBooking();
      }
    } catch (err) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment processing.",
        variant: "destructive",
      });
    }

    setProcessing(false);
  };

  const createBooking = async () => {
    try {
      // Create the booking after successful payment
      const bookingData = {
        userEmail: bookingDetails.userEmail,
        mentorId: bookingDetails.mentorId,
        scheduledAt: new Date(bookingDetails.scheduledAt),
        duration: bookingDetails.duration,
        notes: bookingDetails.notes,
        studentAge: bookingDetails.studentAge,
      };

      await apiRequest("POST", "/api/bookings", bookingData);
      
      // Clear the stored booking details
      sessionStorage.removeItem('pendingBooking');
      
      toast({
        title: "Booking Confirmed!",
        description: `Your session with ${bookingDetails.mentorName} has been booked successfully.`,
      });

      // Redirect to success page
      navigate(`/booking-success?mentorId=${bookingDetails.mentorId}`);
    } catch (error) {
      toast({
        title: "Booking Error",
        description: "Payment was successful but there was an error creating your booking. Please contact support.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <h3 className="font-bold text-lg mb-3 text-blue-900">Payment Methods Available</h3>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center bg-white px-3 py-2 rounded-lg border shadow-sm">
            <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
            <span className="text-sm font-medium">Credit/Debit Cards</span>
          </div>
          <div className="flex items-center bg-white px-3 py-2 rounded-lg border shadow-sm">
            <Smartphone className="h-4 w-4 mr-2 text-purple-600" />
            <span className="text-sm font-medium">UPI & Digital Wallets</span>
          </div>
          <div className="flex items-center bg-white px-3 py-2 rounded-lg border shadow-sm">
            <Shield className="h-4 w-4 mr-2 text-green-600" />
            <span className="text-sm font-medium">Net Banking</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
        <PaymentElement 
          options={{
            layout: "tabs"
          }}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || processing}
        className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
        data-testid="button-complete-payment"
      >
        {processing ? (
          <>
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
            Processing Payment...
          </>
        ) : (
          `Complete Payment - ₹${bookingDetails.sessionCost}`
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        🔒 Secured by Stripe • Your payment information is encrypted and secure
      </p>
    </form>
  );
};

export default function BookingCheckout() {
  const [location] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const { toast } = useToast();

  // Extract parameters from URL
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const mentorId = urlParams.get('mentorId');
  const amount = parseFloat(urlParams.get('amount') || '0');

  useEffect(() => {
    // Get booking details from sessionStorage
    const storedBooking = sessionStorage.getItem('pendingBooking');
    if (!storedBooking) {
      toast({
        title: "Booking Error",
        description: "No booking details found. Please start the booking process again.",
        variant: "destructive",
      });
      return;
    }

    const booking = JSON.parse(storedBooking);
    setBookingDetails(booking);

    // Create PaymentIntent for the booking
    apiRequest("POST", "/api/create-payment-intent", { 
      amount: booking.sessionCost,
      mentorId: booking.mentorId,
      bookingDetails: {
        scheduledAt: booking.scheduledAt,
        duration: booking.duration,
        studentName: booking.studentName
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error('Failed to create payment intent');
        }
      })
      .catch((error) => {
        console.error('Payment setup error:', error);
        toast({
          title: "Setup Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      });
  }, []);

  if (!bookingDetails) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
        <Footer />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center min-h-[60vh] p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Setting up your payment...</h2>
              <p className="text-gray-600">Please wait while we prepare your secure checkout</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/booking/${mentorId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4" data-testid="link-back-booking">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Booking
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Session Booking</h1>
            <p className="text-gray-600 mt-2">Secure checkout powered by Stripe</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Booking Summary */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  Session Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                    <h3 className="font-bold text-lg mb-2">{bookingDetails.mentorName}</h3>
                    <p className="text-gray-600 mb-4">Programming Mentor</p>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>{new Date(bookingDetails.scheduledAt).toLocaleDateString('en-IN', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>{new Date(bookingDetails.scheduledAt).toLocaleTimeString('en-IN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} ({bookingDetails.duration} minutes)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Session includes:</h4>
                    <ul className="space-y-1 text-sm text-green-700">
                      <li>✓ 1-on-1 mentoring session</li>
                      <li>✓ Personalized learning plan</li>
                      <li>✓ Code review and feedback</li>
                      <li>✓ Resource recommendations</li>
                      <li>✓ Follow-up notes and summary</li>
                    </ul>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span className="text-blue-600">₹{bookingDetails.sessionCost}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Includes all taxes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stripePromise && clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <BookingCheckoutForm bookingDetails={bookingDetails} />
                  </Elements>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <div className="text-6xl">🚧</div>
                    <h3 className="text-xl font-semibold text-gray-700">Payment System Under Maintenance</h3>
                    <p className="text-gray-600">
                      Our payment system is currently being configured. 
                      Please contact our support team to book your session.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
                      <h4 className="font-semibold text-blue-800 mb-2">Alternative Booking Options:</h4>
                      <div className="space-y-2 text-sm text-blue-700">
                        <p>📧 Email: support@codeconnect.com</p>
                        <p>📱 WhatsApp: +91 98765 43210</p>
                        <p>🕐 Support Hours: 9 AM - 6 PM (Mon-Fri)</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => window.location.href = '/mentors'}
                      className="mt-4"
                      data-testid="button-back-mentors"
                    >
                      Back to Mentors
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}