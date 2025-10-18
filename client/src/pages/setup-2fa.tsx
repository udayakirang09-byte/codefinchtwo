import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Setup2FA() {
  const [, setLocation] = useLocation();
  const { toast} = useToast();
  const [email, setEmail] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    // Get email and setup token from localStorage
    const storedEmail = localStorage.getItem('setup2fa_email');
    const storedToken = localStorage.getItem('setup2fa_token');
    
    if (!storedEmail || !storedToken) {
      toast({
        title: "Invalid Access",
        description: "Please complete signup first.",
        variant: "destructive",
      });
      setLocation("/signup");
      return;
    }

    setEmail(storedEmail);
    setSetupToken(storedToken);
    generateQRCode(storedEmail, storedToken);
  }, [setLocation, toast]);

  const generateQRCode = async (userEmail: string, token: string) => {
    try {
      setGenerating(true);
      const response = await fetch("/api/auth/2fa/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: userEmail,
          setupToken: token
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate 2FA setup");
      }

      const data = await response.json();
      setSecret(data.secret);
      setQrCode(data.qrCode);
    } catch (error: any) {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to generate 2FA setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code from Microsoft Authenticator.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token: verificationCode,
          setupToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Verification failed");
      }

      // Clear stored email
      localStorage.removeItem('setup2fa_email');

      toast({
        title: "2FA Enabled Successfully!",
        description: "Your account is now secured with two-factor authentication.",
        variant: "default",
      });

      // Redirect to login
      setTimeout(() => {
        setLocation("/login");
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-xl" data-testid="card-2fa-setup">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 rounded-2xl shadow-lg">
              <Shield className="text-white" size={32} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="title-2fa-setup">
            Set Up Two-Factor Authentication
          </CardTitle>
          <CardDescription data-testid="description-2fa-setup">
            Secure your teacher account with Microsoft Authenticator
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {generating ? (
            <div className="text-center py-8" data-testid="status-generating">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Generating QR code...</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Step 1: Download Microsoft Authenticator</h3>
                  <p className="text-sm text-blue-700">
                    If you haven't already, download Microsoft Authenticator from your app store.
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-3">Step 2: Scan QR Code</h3>
                  <div className="flex justify-center my-4">
                    {qrCode && (
                      <img 
                        src={qrCode} 
                        alt="2FA QR Code" 
                        className="w-48 h-48 border-4 border-white shadow-lg rounded-lg"
                        data-testid="img-qr-code"
                      />
                    )}
                  </div>
                  <p className="text-sm text-purple-700 text-center">
                    Open Microsoft Authenticator and scan this code
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3">Step 3: Enter Verification Code</h3>
                    <Label htmlFor="verificationCode" className="text-green-700">
                      6-digit code from Microsoft Authenticator
                    </Label>
                    <Input
                      id="verificationCode"
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="mt-2 text-center text-2xl tracking-widest"
                      data-testid="input-verification-code"
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    data-testid="button-verify-2fa"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2" size={18} />
                        Enable 2FA
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 text-center">
                    <strong>Important:</strong> Two-factor authentication is mandatory for all teacher accounts to ensure platform security.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
