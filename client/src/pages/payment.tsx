import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Payment() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // SECURITY: Automatically redirect to secure Stripe checkout
  // This prevents PCI compliance violations by not collecting raw payment data
  useEffect(() => {
    toast({
      title: "Redirecting to Secure Checkout",
      description: "For your security, payments are processed through our secure payment system.",
    });
    
    // Preserve ALL URL parameters for checkout
    const currentUrl = new URL(window.location.href);
    const searchParams = currentUrl.searchParams.toString();
    const redirectUrl = searchParams ? `/checkout?${searchParams}` : '/checkout';
    
    console.log('Payment redirect:', { currentUrl: currentUrl.href, searchParams, redirectUrl });
    
    // Redirect after a brief delay to show the security message
    setTimeout(() => {
      setLocation(redirectUrl);
    }, 2000);
  }, [location, setLocation, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-800">
            Secure Payment Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            For your security and privacy, we're redirecting you to our secure payment system.
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-blue-600">
            <span className="text-sm font-medium">Redirecting to secure checkout</span>
            <ArrowRight className="h-4 w-4" />
          </div>
          
          <div className="flex justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                🔒 PCI DSS Compliant • SSL Encrypted • Secure Processing
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}