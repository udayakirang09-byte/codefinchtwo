import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Smartphone, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";

// Load Stripe (optional - disable if not configured)
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const CheckoutForm = ({ courseData }: { courseData: any }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?course=${courseData.id}`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful!",
        description: `Welcome to ${courseData.title}! Check your email for course access.`,
      });
    }

    setProcessing(false);
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
          `Complete Payment - ₹${courseData.price}`
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        🔒 Secured by Stripe • Your payment information is encrypted and secure
      </p>
    </form>
  );
};

export default function Checkout() {
  const [location] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [courseData, setCourseData] = useState<any>(null);
  const { toast } = useToast();

  // Extract course ID from URL params  
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const courseId = urlParams.get('courseId') || '1';

  useEffect(() => {
    // Course data (in real app, fetch from API)
    const courses = [
      {
        id: '1',
        title: "Python for Kids",
        price: 2999,
        duration: "8 weeks",
        image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?ixlib=rb-4.0.3&w=400&h=300&fit=crop"
      },
      {
        id: '2', 
        title: "Web Development Basics",
        price: 3999,
        duration: "10 weeks",
        image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&w=400&h=300&fit=crop"
      },
      {
        id: '3',
        title: "Scratch Programming", 
        price: 2499,
        duration: "6 weeks",
        image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&w=400&h=300&fit=crop"
      }
    ];

    const course = courses.find(c => c.id === courseId) || courses[0];
    setCourseData(course);

    // Create PaymentIntent
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        amount: course.price,
        courseId: course.id,
        courseName: course.title 
      }),
    })
      .then((res) => res.json())
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
  }, [courseId]);

  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Setting up your payment...</h2>
            <p className="text-gray-600">Please wait while we prepare your secure checkout</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/courses" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4" data-testid="link-back-courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Enrollment</h1>
          <p className="text-gray-600 mt-2">Secure checkout powered by Stripe</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Course Summary */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="text-2xl">📚</span>
                Course Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <img 
                  src={courseData.image} 
                  alt={courseData.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-bold text-xl mb-2">{courseData.title}</h3>
                  <p className="text-gray-600 mb-4">Duration: {courseData.duration}</p>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">What's included:</h4>
                    <ul className="space-y-1 text-sm text-green-700">
                      <li>✓ Live interactive lessons</li>
                      <li>✓ 1-on-1 mentor support</li>
                      <li>✓ Hands-on coding projects</li>
                      <li>✓ Course completion certificate</li>
                      <li>✓ Lifetime access to materials</li>
                    </ul>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">₹{courseData.price}</span>
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
                <span className="text-2xl">💳</span>
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stripePromise && clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm courseData={courseData} />
                </Elements>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="text-6xl">🚧</div>
                  <h3 className="text-xl font-semibold text-gray-700">Payment System Under Maintenance</h3>
                  <p className="text-gray-600">
                    Our payment system is currently being configured. 
                    Please contact our support team to enroll in this course.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
                    <h4 className="font-semibold text-blue-800 mb-2">Alternative Enrollment Options:</h4>
                    <div className="space-y-2 text-sm text-blue-700">
                      <p>📧 Email: support@codeconnect.com</p>
                      <p>📱 WhatsApp: +91 98765 43210</p>
                      <p>🕐 Support Hours: 9 AM - 6 PM (Mon-Fri)</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/courses'}
                    className="mt-4"
                    data-testid="button-back-courses"
                  >
                    Back to Courses
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}