import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Smartphone, Building2, BookOpen, Clock, User } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CourseCheckout() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [enrollmentDetails, setEnrollmentDetails] = useState<any>(null);
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState({
    upiEnabled: false,
    netBankingEnabled: false,
  });

  // Extract parameters from URL
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const amount = parseFloat(urlParams.get('amount') || '0');

  // Fetch enabled payment methods
  useEffect(() => {
    fetch('/api/admin/payment-methods')
      .then(res => res.json())
      .then(data => {
        setEnabledPaymentMethods({
          upiEnabled: data.upiEnabled || false,
          netBankingEnabled: data.netBankingEnabled || false,
        });
        
        // Set default to first available
        if (data.upiEnabled) {
          setSelectedPaymentMethod('upi');
        } else if (data.netBankingEnabled) {
          setSelectedPaymentMethod('netbanking');
        }
      })
      .catch(err => console.error('Failed to load payment methods:', err));
  }, []);

  useEffect(() => {
    // Get enrollment details from sessionStorage
    const storedEnrollment = sessionStorage.getItem('pendingCourseEnrollment');
    if (!storedEnrollment) {
      toast({
        title: "Enrollment Error",
        description: "No enrollment details found. Please start the enrollment process again.",
        variant: "destructive",
      });
      navigate('/courses');
      return;
    }

    const enrollment = JSON.parse(storedEnrollment);
    setEnrollmentDetails(enrollment);
  }, [toast, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setProcessing(true);

    try {
      if (selectedPaymentMethod === 'upi') {
        // Validate UPI ID
        if (!upiId || !upiId.includes('@')) {
          toast({
            title: "Invalid UPI ID",
            description: "Please enter a valid UPI ID (e.g., username@paytm)",
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }

        // Check if Razorpay SDK is loaded
        if (!window.Razorpay) {
          toast({
            title: "Payment System Unavailable",
            description: "Payment system failed to load. Please refresh the page and try again.",
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }

        // Create Razorpay order (server validates course and amount)
        const orderResponse: any = await apiRequest("POST", "/api/razorpay/create-course-order", {
          amount: enrollmentDetails.courseFee,
          courseId: enrollmentDetails.courseId,
          courseName: enrollmentDetails.courseName,
          studentEmail: enrollmentDetails.studentEmail
        });

        // Validate response
        if (!orderResponse || !orderResponse.orderId || !orderResponse.keyId) {
          toast({
            title: "Payment Order Failed",
            description: "Failed to create payment order. Please try again.",
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }

        // Open Razorpay checkout
        const options = {
          key: orderResponse.keyId,
          amount: orderResponse.amount,
          currency: orderResponse.currency,
          name: "CodeConnect",
          description: `Enrollment for ${enrollmentDetails.courseName}`,
          order_id: orderResponse.orderId,
          prefill: {
            email: enrollmentDetails.studentEmail,
            contact: ""
          },
          theme: {
            color: "#6366f1"
          },
          method: {
            upi: true,
            netbanking: false,
            card: false,
            wallet: false
          },
          handler: async function (response: any) {
            try {
              // Verify payment
              await apiRequest("POST", "/api/razorpay/verify-payment", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              // Create enrollment after successful payment
              await createEnrollment();
            } catch (error) {
              toast({
                title: "Payment Verification Failed",
                description: "Payment verification failed. Please contact support.",
                variant: "destructive",
              });
              setProcessing(false);
            }
          },
          modal: {
            ondismiss: function() {
              setProcessing(false);
              toast({
                title: "Payment Cancelled",
                description: "You cancelled the payment process.",
                variant: "destructive",
              });
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();

      } else if (selectedPaymentMethod === 'netbanking') {
        // Validate Net Banking details
        if (!bankName || !accountNumber) {
          toast({
            title: "Invalid Details",
            description: "Please provide bank name and account number",
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }

        // Simulate Net Banking payment processing
        toast({
          title: "Net Banking Initiated",
          description: `Redirecting to ${bankName} for payment authorization...`,
        });

        await new Promise(resolve => setTimeout(resolve, 2000));
        await createEnrollment();
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred during payment processing.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  const createEnrollment = async () => {
    try {
      // Create the enrollment after successful payment
      const enrollmentData = {
        courseId: enrollmentDetails.courseId,
        studentEmail: enrollmentDetails.studentEmail,
        mentorId: enrollmentDetails.mentorId,
        schedule: enrollmentDetails.schedule,
        totalClasses: enrollmentDetails.totalClasses,
        courseFee: enrollmentDetails.courseFee
      };

      await apiRequest("POST", "/api/course-enrollments", enrollmentData);
      
      // Clear the stored enrollment details
      sessionStorage.removeItem('pendingCourseEnrollment');
      
      toast({
        title: "Enrollment Confirmed!",
        description: `You've been enrolled in ${enrollmentDetails.courseName}. Classes will be created based on your schedule.`,
      });

      // Redirect to home page
      navigate('/');
    } catch (error) {
      toast({
        title: "Enrollment Error",
        description: "Payment was successful but there was an error creating your enrollment. Please contact support.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  if (!enrollmentDetails) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
            <div className="h-96 bg-muted rounded-xl"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/course-enrollment/${enrollmentDetails.courseId}`)}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Enrollment
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2" data-testid="text-checkout-title">
            Complete Payment
          </h1>
          <p className="text-gray-600">Secure payment for your course enrollment</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Enrollment Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Enrollment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-500">Course</Label>
                  <p className="font-semibold" data-testid="text-course-name">{enrollmentDetails.courseName}</p>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-500">Instructor</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4" />
                    <span data-testid="text-instructor">{enrollmentDetails.mentorName}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-500">Schedule</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    <span data-testid="text-schedule">{enrollmentDetails.scheduledDays} day(s) per week</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-500">Total Classes</Label>
                  <p className="font-semibold" data-testid="text-total-classes">{enrollmentDetails.totalClasses} classes</p>
                </div>

                <div className="pt-4 border-t">
                  <Label className="text-sm text-gray-500">Total Amount</Label>
                  <p className="text-3xl font-bold text-green-600" data-testid="text-total-amount">
                    ₹{enrollmentDetails.courseFee}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs value={selectedPaymentMethod} onValueChange={(value) => setSelectedPaymentMethod(value as 'upi' | 'netbanking')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
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
                    </TabsList>

                    {/* UPI Tab */}
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
                              placeholder="Enter your UPI ID (e.g., user@paytm, user@phonepe)"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              data-testid="input-upi-id"
                              className="text-base"
                            />
                            <p className="text-xs text-gray-500">Enter your UPI ID to complete the payment</p>
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
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                  
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
                      `Complete Payment - ₹{enrollmentDetails.courseFee}`
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    🔒 Secure Payment • Your information is encrypted and safe
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
