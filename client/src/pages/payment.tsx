import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookOpen } from "lucide-react";
import { CreditCard, Smartphone, Building2, Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  price: number;
  duration: string;
  image: string;
}

export default function Payment() {
  const [location] = useLocation();
  const { toast } = useToast();
  
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    upiId: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    cardName: "",
    accountNumber: "",
    ifscCode: "",
    mobileNumber: "",
    pin: ""
  });

  // Extract course ID from URL
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const courseId = urlParams.get('courseId') || '1';

  const courses: Course[] = [
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

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    // Simulate payment processing
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create enrollment record
      const enrollmentData = {
        courseId: course.id,
        courseName: course.title,
        amount: course.price,
        paymentMethod: paymentMethod,
        transactionId: `TXN${Date.now()}`
      };

      // In real app, this would call actual payment gateway
      await fetch("/api/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrollmentData)
      });

      toast({
        title: "Payment Successful!",
        description: `You're now enrolled in ${course.title}`,
      });

      window.location.href = `/payment-success?course=${courseId}`;
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case "upi":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="upi-id">UPI ID</Label>
              <Input
                id="upi-id"
                placeholder="yourname@upi"
                value={formData.upiId}
                onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                data-testid="input-upi-id"
              />
            </div>
            <div>
              <Label htmlFor="upi-pin">UPI PIN</Label>
              <Input
                id="upi-pin"
                type="password"
                placeholder="Enter 4-6 digit PIN"
                value={formData.pin}
                onChange={(e) => setFormData({...formData, pin: e.target.value})}
                data-testid="input-upi-pin"
              />
            </div>
          </div>
        );
      
      case "card":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="card-name">Cardholder Name</Label>
              <Input
                id="card-name"
                placeholder="Full name as on card"
                value={formData.cardName}
                onChange={(e) => setFormData({...formData, cardName: e.target.value})}
                data-testid="input-card-name"
              />
            </div>
            <div>
              <Label htmlFor="card-number">Card Number</Label>
              <Input
                id="card-number"
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                data-testid="input-card-number"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="card-expiry">Expiry Date</Label>
                <Input
                  id="card-expiry"
                  placeholder="MM/YY"
                  value={formData.cardExpiry}
                  onChange={(e) => setFormData({...formData, cardExpiry: e.target.value})}
                  data-testid="input-card-expiry"
                />
              </div>
              <div>
                <Label htmlFor="card-cvv">CVV</Label>
                <Input
                  id="card-cvv"
                  type="password"
                  placeholder="123"
                  value={formData.cardCvv}
                  onChange={(e) => setFormData({...formData, cardCvv: e.target.value})}
                  data-testid="input-card-cvv"
                />
              </div>
            </div>
          </div>
        );

      case "netbanking":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                placeholder="Enter account number"
                value={formData.accountNumber}
                onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                data-testid="input-account-number"
              />
            </div>
            <div>
              <Label htmlFor="ifsc-code">IFSC Code</Label>
              <Input
                id="ifsc-code"
                placeholder="BANK0001234"
                value={formData.ifscCode}
                onChange={(e) => setFormData({...formData, ifscCode: e.target.value})}
                data-testid="input-ifsc-code"
              />
            </div>
          </div>
        );

      case "wallet":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="mobile-number">Mobile Number</Label>
              <Input
                id="mobile-number"
                placeholder="Enter mobile number"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                data-testid="input-mobile-number"
              />
            </div>
            <div>
              <Label htmlFor="wallet-pin">Wallet PIN</Label>
              <Input
                id="wallet-pin"
                type="password"
                placeholder="Enter PIN"
                value={formData.pin}
                onChange={(e) => setFormData({...formData, pin: e.target.value})}
                data-testid="input-wallet-pin"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Summary */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={course.image} 
                alt={course.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-bold mb-2">{course.title}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>📚 Duration: {course.duration}</p>
                <p>💰 Price: ₹{course.price.toLocaleString()}</p>
                <p>👨‍🏫 Expert mentors included</p>
                <p>📺 Live video sessions</p>
                <p>💬 Chat support</p>
              </div>
              
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">₹{course.price.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Choose Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-6">
                {/* Payment Method Selection */}
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="upi" id="upi" data-testid="radio-upi" />
                      <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer">
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        UPI
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="card" id="card" data-testid="radio-card" />
                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        Card
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="netbanking" id="netbanking" data-testid="radio-netbanking" />
                      <Label htmlFor="netbanking" className="flex items-center gap-2 cursor-pointer">
                        <Building2 className="h-4 w-4 text-green-600" />
                        Net Banking
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="wallet" id="wallet" data-testid="radio-wallet" />
                      <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer">
                        <Smartphone className="h-4 w-4 text-orange-600" />
                        Digital Wallet
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {/* Payment Form Fields */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  {renderPaymentForm()}
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>Your payment information is encrypted and secure</span>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={processing}
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
                  data-testid="button-pay-now"
                >
                  {processing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Pay ₹{course.price.toLocaleString()}
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}