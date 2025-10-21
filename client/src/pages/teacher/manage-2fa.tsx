import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Key, RefreshCw, ArrowLeft, AlertCircle, Copy, CheckCircle, Smartphone } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import QRCode from "qrcode";

export default function Manage2FA() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // 2FA verification state (required before any changes)
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [totpToken, setTotpToken] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  
  // Reset 2FA state
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [newTotpSecret, setNewTotpSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  
  // Backup codes state
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Fetch current 2FA status
  const { data: twoFAStatus, isLoading } = useQuery<any>({
    queryKey: [`/api/auth/2fa-status/${user?.id}`],
    enabled: !!user?.id,
  });

  const handleVerify2FA = async () => {
    if (!totpToken && !emailOtp) {
      toast({
        title: "Verification Required",
        description: "Please enter either your Authenticator code or Email OTP",
        variant: "destructive",
      });
      return;
    }

    setVerifying2FA(true);

    try {
      // Verify 2FA codes
      const verifyResponse: any = await apiRequest('POST', '/api/auth/verify-2fa-for-edit', {
        userId: user?.id,
        totpToken: totpToken.trim(),
        emailOtp: emailOtp.trim(),
      });

      if (verifyResponse?.verified) {
        setIs2FAVerified(true);
        setShow2FADialog(false);
        toast({
          title: "Verified!",
          description: "You can now manage your 2FA settings",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "Invalid 2FA code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify 2FA code",
        variant: "destructive",
      });
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleReset2FA = async () => {
    if (!is2FAVerified) {
      // Send Email OTP first
      try {
        await apiRequest('POST', '/api/auth/send-email-otp', { email: user?.email });
        toast({
          title: "Verification Required",
          description: "Please verify your identity first to reset 2FA",
        });
      } catch (error) {
        console.error("Failed to send Email OTP:", error);
      }
      setShow2FADialog(true);
      return;
    }

    try {
      const response: any = await apiRequest('POST', '/api/auth/reset-2fa', {
        userId: user?.id,
      });

      if (response?.qrCode && response?.secret) {
        setQrCodeUrl(response.qrCode);
        setNewTotpSecret(response.secret);
        setShowResetDialog(true);
        toast({
          title: "2FA Reset Initiated",
          description: "Scan the QR code with your authenticator app",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset 2FA",
        variant: "destructive",
      });
    }
  };

  const handleVerifyReset = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code from your authenticator app",
        variant: "destructive",
      });
      return;
    }

    try {
      const response: any = await apiRequest('POST', '/api/auth/confirm-2fa-reset', {
        userId: user?.id,
        token: verificationCode,
        secret: newTotpSecret,
      });

      if (response?.success) {
        setShowResetDialog(false);
        setVerificationCode("");
        queryClient.invalidateQueries({ queryKey: [`/api/auth/2fa-status/${user?.id}`] });
        toast({
          title: "Success!",
          description: "Your 2FA has been reset successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateBackupCodes = async () => {
    if (!is2FAVerified) {
      // Send Email OTP first
      try {
        await apiRequest('POST', '/api/auth/send-email-otp', { email: user?.email });
        toast({
          title: "Verification Required",
          description: "Please verify your identity first to generate backup codes",
        });
      } catch (error) {
        console.error("Failed to send Email OTP:", error);
      }
      setShow2FADialog(true);
      return;
    }

    try {
      const response: any = await apiRequest('POST', '/api/auth/generate-backup-codes', {
        userId: user?.id,
      });

      if (response?.codes) {
        setBackupCodes(response.codes);
        setShowBackupCodes(true);
        toast({
          title: "Backup Codes Generated",
          description: "Save these codes in a secure location",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate backup codes",
        variant: "destructive",
      });
    }
  };

  const copyBackupCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadBackupCodes = () => {
    const text = `TechLearnOrbit 2FA Backup Codes
Generated: ${new Date().toLocaleDateString()}
User: ${user?.email}

IMPORTANT: Keep these codes in a secure location.
Each code can only be used once.

${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'techlearnorbit-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => window.location.href = '/'}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-700 text-white">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Shield className="h-6 w-6" />
              Manage Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {!is2FAVerified && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong>Security Verification Required:</strong> Please verify your identity before managing 2FA settings.
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Current Status */}
              <Card className="border-2">
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Current Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Microsoft Authenticator</p>
                      <p className="text-sm text-gray-600">
                        {twoFAStatus?.totpEnabled ? "✅ Enabled" : "❌ Not Enabled"}
                      </p>
                    </div>
                    {twoFAStatus?.totpEnabled && (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Reset 2FA */}
              <Card className="border-2 border-rose-200">
                <CardHeader className="bg-rose-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-rose-600" />
                    Reset Authenticator
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <p className="text-sm text-gray-600">
                    Re-enroll your authenticator app if you've lost access or changed devices.
                  </p>
                  <Button
                    onClick={handleReset2FA}
                    disabled={!is2FAVerified && !twoFAStatus?.totpEnabled}
                    className="w-full bg-gradient-to-r from-rose-600 to-pink-700 hover:from-rose-700 hover:to-pink-800"
                    data-testid="button-reset-2fa"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset 2FA
                  </Button>
                </CardContent>
              </Card>

              {/* Backup Codes */}
              <Card className="border-2 border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-5 w-5 text-blue-600" />
                    Emergency Backup Codes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <p className="text-sm text-gray-600">
                    Generate 3 one-time backup codes for emergency access if you lose your authenticator.
                  </p>
                  <Button
                    onClick={handleGenerateBackupCodes}
                    disabled={!is2FAVerified}
                    variant="outline"
                    className="w-full border-blue-300 hover:bg-blue-50"
                    data-testid="button-generate-backup"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Generate Backup Codes
                  </Button>
                </CardContent>
              </Card>

              {/* Verify Button */}
              {!is2FAVerified && (
                <Button
                  onClick={() => {
                    // Send Email OTP
                    apiRequest('POST', '/api/auth/send-email-otp', { email: user?.email })
                      .then(() => {
                        toast({
                          title: "OTP Sent",
                          description: "Check your email for the verification code",
                        });
                      })
                      .catch(() => {});
                    setShow2FADialog(true);
                  }}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800"
                  data-testid="button-verify-identity"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Verify My Identity
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2FA Verification Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-6 w-6 text-amber-600" />
              2FA Verification Required
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-sm text-gray-600">
              Please verify your identity using either your Authenticator app or the code sent to your email.
            </div>

            <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center mb-3">
                <Label className="text-blue-900 font-semibold text-lg">
                  Enter 2FA code or OTP
                </Label>
                <p className="text-sm text-blue-700 mt-1">
                  Enter either code - first valid one wins
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Authenticator App Code */}
                <div className="space-y-2 bg-white rounded-lg p-3 border border-blue-300">
                  <Label htmlFor="totp" className="text-blue-900 font-medium text-sm flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                    Authenticator App code
                  </Label>
                  <Input
                    id="totp"
                    type="text"
                    maxLength={6}
                    value={totpToken}
                    onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="text-center text-xl tracking-widest font-mono"
                    data-testid="input-totp-verify"
                  />
                </div>

                {/* Email OTP */}
                <div className="space-y-2 bg-white rounded-lg p-3 border border-blue-300">
                  <Label htmlFor="otp" className="text-blue-900 font-medium text-sm flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                    Email OTP (if received)
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="text-center text-xl tracking-widest font-mono"
                    data-testid="input-email-otp-verify"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleVerify2FA}
              disabled={verifying2FA || (!totpToken && !emailOtp)}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800"
              data-testid="button-verify-2fa"
            >
              {verifying2FA ? "Verifying..." : "Verify Identity"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset 2FA Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <RefreshCw className="h-6 w-6 text-rose-600" />
              Reset Two-Factor Authentication
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-sm text-gray-600">
              Scan this QR code with your authenticator app (Microsoft Authenticator, Google Authenticator, etc.)
            </div>

            {qrCodeUrl && (
              <div className="flex justify-center p-4 bg-white border rounded-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="verification">Enter the 6-digit code from your app</Label>
              <Input
                id="verification"
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="text-center text-xl tracking-widest font-mono"
                data-testid="input-reset-verification"
              />
            </div>

            <Button
              onClick={handleVerifyReset}
              disabled={verificationCode.length !== 6}
              className="w-full bg-gradient-to-r from-rose-600 to-pink-700 hover:from-rose-700 hover:to-pink-800"
              data-testid="button-confirm-reset"
            >
              Confirm Reset
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Key className="h-6 w-6 text-blue-600" />
              Your Backup Codes
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>Important:</strong> Save these codes in a secure location. Each code can only be used once.
            </div>

            <div className="space-y-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <span className="font-mono font-semibold">{code}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyBackupCode(code, index)}
                    data-testid={`button-copy-code-${index}`}
                  >
                    {copiedIndex === index ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>

            <Button
              onClick={downloadBackupCodes}
              variant="outline"
              className="w-full"
              data-testid="button-download-codes"
            >
              Download as Text File
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
