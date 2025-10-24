import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Smartphone, Shield, User, Clock, Calendar, Building2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

// Razorpay TypeScript declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Stripe will be loaded dynamically after fetching config from admin settings

// Separate component for card payments that uses Stripe hooks
const StripeCardPaymentForm = ({ bookingDetails, onSuccess, paymentIntentId }: { bookingDetails: any, onSuccess: (paymentIntentId: string) => void, paymentIntentId: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleCardPayment = async () => {
    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Payment system not initialized. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
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
        setProcessing(false);
      } else if (paymentIntent) {
        // Payment confirmed - verify booking creation via webhook
        console.log('💳 Payment confirmed, verifying booking creation...');
        await onSuccess(paymentIntent.id);
      }
    } catch (err) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment processing.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {stripe && elements ? (
        <PaymentElement 
          options={{
            layout: "tabs"
          }}
        />
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p>Loading payment form...</p>
        </div>
      )}
      <Button 
        type="button" 
        disabled={!stripe || processing}
        onClick={handleCardPayment}
        className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
        data-testid="button-complete-card-payment"
      >
        {processing ? (
          <>
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
            Processing Payment...
          </>
        ) : (
          `Pay ₹${bookingDetails.isBulkPackage ? bookingDetails.totalAmount : bookingDetails.sessionCost} with Card`
        )}
      </Button>
    </div>
  );
};

const BookingCheckoutForm = ({ bookingDetails, hasStripe, paymentIntentId }: { bookingDetails: any, hasStripe: boolean, paymentIntentId: string }) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [, navigate] = useLocation();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'netbanking' | 'cards'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState({
    upiEnabled: false,
    cardsEnabled: false,
    netBankingEnabled: false,
    stripeEnabled: false
  });

  useEffect(() => {
    // Fetch enabled payment methods from admin config
    fetch('/api/admin/payment-methods')
      .then(res => res.json())
      .then(data => {
        setEnabledPaymentMethods(data);
        
        // Set default payment method to the first enabled one
        // If currently on 'cards' but Stripe is not available, switch to an alternative
        if (selectedPaymentMethod === 'cards' && !hasStripe) {
          if (data.upiEnabled) setSelectedPaymentMethod('upi');
          else if (data.netBankingEnabled) setSelectedPaymentMethod('netbanking');
        } else if (selectedPaymentMethod === 'upi' && !data.upiEnabled) {
          // If current method becomes disabled, switch to first available
          if (data.cardsEnabled && hasStripe) setSelectedPaymentMethod('cards');
          else if (data.netBankingEnabled) setSelectedPaymentMethod('netbanking');
        } else if (selectedPaymentMethod === 'netbanking' && !data.netBankingEnabled) {
          if (data.upiEnabled) setSelectedPaymentMethod('upi');
          else if (data.cardsEnabled && hasStripe) setSelectedPaymentMethod('cards');
        } else if (!selectedPaymentMethod || selectedPaymentMethod === 'upi' && !data.upiEnabled) {
          // Initial load - set to first available method
          if (data.upiEnabled) setSelectedPaymentMethod('upi');
          else if (data.cardsEnabled && hasStripe) setSelectedPaymentMethod('cards');
          else if (data.netBankingEnabled) setSelectedPaymentMethod('netbanking');
        }
      })
      .catch(err => console.error('Failed to load payment methods:', err));
  }, [hasStripe, selectedPaymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Cards payment is handled separately by StripeCardPaymentForm
    if (selectedPaymentMethod === 'cards') {
      return;
    }
    
    setProcessing(true);

    try {
      if (selectedPaymentMethod === 'upi' || selectedPaymentMethod === 'netbanking') {
        // Create Razorpay order (amount calculated server-side from database pricing)
        const orderResponse = await fetch('/api/razorpay/create-booking-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mentorId: bookingDetails.mentorId,
            subject: bookingDetails.subject,
            duration: bookingDetails.duration,
            isBulkPackage: bookingDetails.isBulkPackage || false,
            totalClasses: bookingDetails.totalClasses || 1
          })
        });

        if (!orderResponse.ok) {
          const error = await orderResponse.json();
          
          // Don't show Razorpay error if we're in UPI testing mode - this is normal/expected
          // Only show error if admin selected Razorpay Mode (Production) but keys are missing
          const isRazorpayMode = localStorage.getItem('paymentConfig') 
            ? JSON.parse(localStorage.getItem('paymentConfig')!).razorpayMode === 'api_keys'
            : false;
          
          if ((error.error === 'RAZORPAY_NOT_ENABLED' || error.adminConfigRequired) && isRazorpayMode) {
            toast({
              title: "Payment System Unavailable",
              description: error.message || "Razorpay payment system is currently disabled. Please contact support or try again later.",
              variant: "destructive",
            });
            setProcessing(false);
            return;
          }
          
          // For UPI testing mode, this error is expected - create booking directly
          if (!isRazorpayMode && error.error === 'RAZORPAY_NOT_ENABLED') {
            console.log('ℹ️ UPI Testing Mode active - Creating booking directly without Razorpay');
            await createBooking();
            setProcessing(false);
            return;
          }
          
          throw new Error(error.message || 'Failed to create payment order');
        }

        const orderData = await orderResponse.json();

        // Open Razorpay checkout
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          order_id: orderData.orderId,
          name: 'TechLearnOrbit',
          description: bookingDetails.isBulkPackage 
            ? `Bulk Package: ${bookingDetails.totalClasses} classes` 
            : `Coding Session - ${bookingDetails.subject}`,
          prefill: {
            email: bookingDetails.userEmail,
            contact: ''
          },
          theme: {
            color: '#2563eb'
          },
          handler: async function (response: any) {
            // Payment successful - verify and create booking
            try {
              const verifyResponse = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });

              if (!verifyResponse.ok) {
                throw new Error('Payment verification failed');
              }

              const verifyData = await verifyResponse.json();
              
              if (verifyData.verified) {
                toast({
                  title: "Payment Successful!",
                  description: "Creating your booking...",
                });
                await createBooking();
              } else {
                throw new Error('Payment verification failed');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              toast({
                title: "Payment Verification Failed",
                description: "Please contact support with your payment details.",
                variant: "destructive",
              });
              setProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              toast({
                title: "Payment Cancelled",
                description: "You cancelled the payment process.",
                variant: "destructive",
              });
              setProcessing(false);
            }
          }
        };

        // @ts-ignore - Razorpay is loaded via script tag
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred during payment processing.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  const handleCardPaymentSuccess = async (paymentIntentId: string) => {
    // Poll for booking creation instead of creating it (webhook creates it)
    await pollPaymentStatus(paymentIntentId);
  };

  const createBooking = async () => {
    try {
      // Check if this is a bulk package purchase
      if (bookingDetails.isBulkPackage) {
        // Create bulk package purchase
        const bulkPackageData = {
          studentId: bookingDetails.userEmail, // Will be resolved to student ID by backend
          mentorId: bookingDetails.mentorId,
          totalClasses: bookingDetails.totalClasses,
          subject: bookingDetails.subject,
          pricePerClass: bookingDetails.pricePerClass,
          duration: bookingDetails.duration
        };

        await apiRequest("POST", "/api/bulk-packages", bulkPackageData);
        
        // Clear the stored bulk package details
        sessionStorage.removeItem('pendingBulkPackage');
        
        toast({
          title: "Bulk Package Purchased!",
          description: `Successfully purchased ${bookingDetails.totalClasses} classes with ${bookingDetails.mentorName}! Schedule them from your packages page.`,
        });

        // Redirect to My Packages page
        navigate(`/student/my-packages`);
      } else {
        // Create regular single booking
        const bookingData = {
          userEmail: bookingDetails.userEmail,
          mentorId: bookingDetails.mentorId,
          scheduledAt: new Date(bookingDetails.scheduledAt),
          duration: bookingDetails.duration,
          subject: bookingDetails.subject || 'General Programming', // Default for backward compatibility
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
      }
    } catch (error) {
      toast({
        title: "Booking Error",
        description: "Payment was successful but there was an error creating your booking. Please contact support.",
        variant: "destructive",
      });
    }
  };

  // Poll payment status to verify booking creation by webhook
  const pollPaymentStatus = async (paymentIntentId: string) => {
    const maxAttempts = 10; // Poll for up to 10 seconds
    let attempts = 0;
    
    const poll = async (): Promise<void> => {
      attempts++;
      
      try {
        const response = await fetch(`/api/payment-status/${paymentIntentId}`);
        const data = await response.json();
        
        console.log(`🔍 Payment status check (${attempts}/${maxAttempts}):`, data);
        
        if (data.processed && data.bookingId) {
          // Webhook has processed the payment and created the booking
          sessionStorage.removeItem('pendingBooking');
          
          toast({
            title: "Payment Received!",
            description: `Your session with ${bookingDetails.mentorName} has been confirmed.`,
          });
          
          navigate(`/booking-success?mentorId=${bookingDetails.mentorId}`);
          return;
        }
        
        // If not processed yet and we haven't exceeded max attempts, try again
        if (attempts < maxAttempts) {
          setTimeout(() => poll(), 1000); // Poll every second
        } else {
          // Timeout - show message to user
          toast({
            title: "Payment Processing",
            description: "Your payment is being processed. You'll receive a confirmation email shortly.",
          });
          
          // Still navigate to success page as payment was confirmed
          navigate(`/booking-success?mentorId=${bookingDetails.mentorId}`);
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
        
        if (attempts < maxAttempts) {
          setTimeout(() => poll(), 1000);
        } else {
          toast({
            title: "Payment Confirmed",
            description: "Your booking is being confirmed. Please check your email.",
          });
          navigate(`/booking-success?mentorId=${bookingDetails.mentorId}`);
        }
      }
    };
    
    // Start polling
    await poll();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={selectedPaymentMethod} onValueChange={(value) => setSelectedPaymentMethod(value as 'upi' | 'netbanking' | 'cards')} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          {enabledPaymentMethods.upiEnabled && (
            <TabsTrigger value="upi" className="flex items-center gap-2" data-testid="tab-upi">
              <Smartphone className="h-4 w-4" />
              UPI
            </TabsTrigger>
          )}
          {enabledPaymentMethods.netBankingEnabled && (
            <TabsTrigger value="netbanking" className="flex items-center gap-2" data-testid="tab-netbanking">
              <Building2 className="h-4 w-4" />
              Net Banking
            </TabsTrigger>
          )}
          {enabledPaymentMethods.cardsEnabled && hasStripe && (
            <TabsTrigger value="cards" className="flex items-center gap-2" data-testid="tab-cards">
              <CreditCard className="h-4 w-4" />
              Cards
            </TabsTrigger>
          )}
        </TabsList>

        {/* UPI Payment Tab */}
        <TabsContent value="upi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-purple-600" />
                Pay with UPI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  type="text"
                  placeholder="username@paytm / phone@ybl"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  data-testid="input-upi-id"
                  className="text-base"
                />
                <p className="text-xs text-gray-500">Enter your UPI ID (e.g., yourname@paytm, yourname@ybl)</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-900 font-medium mb-2">Supported UPI Apps:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-white px-2 py-1 rounded border">Google Pay</span>
                  <span className="text-xs bg-white px-2 py-1 rounded border">PhonePe</span>
                  <span className="text-xs bg-white px-2 py-1 rounded border">Paytm</span>
                  <span className="text-xs bg-white px-2 py-1 rounded border">Amazon Pay</span>
                  <span className="text-xs bg-white px-2 py-1 rounded border">BHIM</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Net Banking Tab */}
        <TabsContent value="netbanking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                Pay with Net Banking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  type="text"
                  placeholder="e.g., HDFC Bank, ICICI Bank, SBI"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  data-testid="input-bank-name"
                  className="text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number (Last 4 digits)</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="XXXX"
                  maxLength={4}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  data-testid="input-account-number"
                  className="text-base"
                />
                <p className="text-xs text-gray-500">You'll be redirected to your bank's secure login page</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-900">✓ Secure bank redirect</p>
                <p className="text-xs text-green-700 mt-1">Your credentials are entered directly on your bank's website</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cards (Stripe) Tab */}
        {enabledPaymentMethods.cardsEnabled && hasStripe && (
          <TabsContent value="cards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Pay with Card
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StripeCardPaymentForm 
                  bookingDetails={bookingDetails} 
                  onSuccess={handleCardPaymentSuccess}
                  paymentIntentId={paymentIntentId}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      
      {/* Submit button for UPI and Net Banking only */}
      {selectedPaymentMethod !== 'cards' && (
        <Button 
          type="submit" 
          disabled={processing}
          className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          data-testid="button-complete-payment"
        >
          {processing ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
              Processing Payment...
            </>
          ) : (
            `Complete Payment - ₹${bookingDetails.isBulkPackage ? bookingDetails.totalAmount : bookingDetails.sessionCost}`
          )}
        </Button>
      )}

      <p className="text-xs text-gray-500 text-center">
        🔒 Secure Payment • Your information is encrypted and safe
      </p>
    </form>
  );
};

export default function BookingCheckout() {
  const [location] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [paymentConfigLoaded, setPaymentConfigLoaded] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<any>(null);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const { toast } = useToast();

  // Extract parameters from URL
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const mentorId = urlParams.get('mentorId');
  const amount = parseFloat(urlParams.get('amount') || '0');

  // Fetch payment config and load Stripe
  useEffect(() => {
    fetch('/api/admin/payment-config')
      .then(res => res.json())
      .then(data => {
        console.log('💳 Payment config loaded:', data);
        setPaymentConfig(data); // Store the entire config
        if (data.stripeEnabled && data.stripePublishableKey && data.stripePublishableKey !== 'NA') {
          console.log('✅ Loading Stripe with key:', data.stripePublishableKey.substring(0, 20) + '...');
          setStripePromise(loadStripe(data.stripePublishableKey));
        } else {
          // Fallback to environment variables
          const envKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || import.meta.env.TESTING_VITE_STRIPE_PUBLIC_KEY;
          if (envKey && envKey !== 'NA') {
            console.log('✅ Loading Stripe with env key:', envKey.substring(0, 20) + '...');
            setStripePromise(loadStripe(envKey));
          } else {
            console.log('❌ No Stripe key configured');
          }
        }
        setPaymentConfigLoaded(true);
      })
      .catch(err => {
        console.error('Failed to load payment config:', err);
        setPaymentConfigLoaded(true);
      });
  }, []);

  useEffect(() => {
    // Get booking details from sessionStorage (check both single and bulk)
    const storedBooking = sessionStorage.getItem('pendingBooking');
    const storedBulkPackage = sessionStorage.getItem('pendingBulkPackage');
    
    if (!storedBooking && !storedBulkPackage) {
      toast({
        title: "Booking Error",
        description: "No booking details found. Please start the booking process again.",
        variant: "destructive",
      });
      return;
    }

    const booking = storedBulkPackage ? JSON.parse(storedBulkPackage) : JSON.parse(storedBooking!);
    const isBulkPackage = !!storedBulkPackage;
    
    // Add isBulkPackage flag to booking details for later use
    booking.isBulkPackage = isBulkPackage;
    setBookingDetails(booking);

    // Fetch payment account details for display
    fetch(`/api/payment-accounts/${booking.mentorId}`)
      .then(res => res.json())
      .then(data => {
        setPaymentAccounts(data);
      })
      .catch(err => console.error('Failed to load payment accounts:', err));

    // Create PaymentIntent only if Stripe is enabled AND not using UPI mode
    // When razorpayMode='upi', use native UPI flow instead of Stripe
    const shouldUseStripe = stripePromise && paymentConfig && paymentConfig.razorpayMode !== 'upi';
    
    if (shouldUseStripe) {
      console.log('💳 Creating Stripe PaymentIntent for card payment');
      const paymentAmount = isBulkPackage ? booking.totalAmount : booking.sessionCost;
      
      apiRequest("POST", "/api/create-payment-intent", { 
        amount: paymentAmount,
        mentorId: booking.mentorId,
        bookingDetails: isBulkPackage ? {
          totalClasses: booking.totalClasses,
          subject: booking.subject,
          studentName: booking.studentName,
          pricePerClass: booking.pricePerClass
        } : {
          scheduledAt: booking.scheduledAt,
          duration: booking.duration,
          studentName: booking.studentName
        }
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          }
          if (data.paymentIntentId) {
            setPaymentIntentId(data.paymentIntentId);
          }
        })
        .catch((error) => {
          console.error('Payment setup error (Stripe):', error);
          // Show validation errors (admin/teacher payment method missing)
          if (error.message && (
            error.message.includes('payment method') || 
            error.message.includes('Teacher not found') ||
            error.message.includes('Admin payment') ||
            error.message.includes('Teacher has not configured')
          )) {
            toast({
              title: "Payment Configuration Error",
              description: error.message,
              variant: "destructive",
            });
          }
          // Don't show error toast for other errors since UPI/Net Banking can still work
        });
    } else if (paymentConfig && paymentConfig.razorpayMode === 'upi') {
      console.log('💰 Using UPI payment flow - skipping Stripe PaymentIntent');
    }
  }, [stripePromise, paymentConfig]);

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

  if (!paymentConfigLoaded) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center min-h-[60vh] p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Loading payment options...</h2>
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
            <Link to={`/booking/${bookingDetails?.mentorId || mentorId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4" data-testid="link-back-booking">
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
                        <span>
                          {bookingDetails.scheduledAt && !isNaN(new Date(bookingDetails.scheduledAt).getTime())
                            ? new Date(bookingDetails.scheduledAt).toLocaleDateString('en-IN', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })
                            : 'Invalid Date'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>
                          {bookingDetails.scheduledAt && !isNaN(new Date(bookingDetails.scheduledAt).getTime())
                            ? `${new Date(bookingDetails.scheduledAt).toLocaleTimeString('en-IN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })} (${bookingDetails.duration} minutes)`
                            : `Invalid Date (${bookingDetails.duration} minutes)`}
                        </span>
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

                  {/* Payment Flow Information */}
                  {paymentAccounts && (
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Payment Flow
                      </h4>
                      <div className="space-y-3 text-sm">
                        {paymentAccounts.adminPaymentAccount && (
                          <div className="bg-white p-3 rounded-md border border-amber-200">
                            <p className="text-xs text-gray-500 mb-1">Platform Account (Admin)</p>
                            <p className="font-medium text-gray-900">{paymentAccounts.adminPaymentAccount.displayName}</p>
                            <p className="text-xs text-gray-600">{paymentAccounts.adminPaymentAccount.details}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-center">
                          <div className="text-gray-400">↓</div>
                        </div>
                        {paymentAccounts.teacherPaymentAccount && (
                          <div className="bg-white p-3 rounded-md border border-amber-200">
                            <p className="text-xs text-gray-500 mb-1">Teacher Account ({paymentAccounts.teacherName})</p>
                            <p className="font-medium text-gray-900">{paymentAccounts.teacherPaymentAccount.displayName}</p>
                            <p className="text-xs text-gray-600">{paymentAccounts.teacherPaymentAccount.details}</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-amber-700 mt-3">
                        Your payment will be processed through the platform and transferred to the teacher's account.
                      </p>
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span className="text-blue-600">₹{bookingDetails.isBulkPackage ? bookingDetails.totalAmount : bookingDetails.sessionCost}</span>
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
                    <BookingCheckoutForm bookingDetails={bookingDetails} hasStripe={true} paymentIntentId={paymentIntentId} />
                  </Elements>
                ) : (
                  <BookingCheckoutForm bookingDetails={bookingDetails} hasStripe={false} paymentIntentId={paymentIntentId} />
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