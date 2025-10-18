import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Mail, Phone, Save, Shield, ArrowLeft, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { useEffect } from "react";

export default function EditPersonalInfo() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  
  // 2FA verification state
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [totpToken, setTotpToken] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>(null);
  
  // Fetch current user details
  const { data: userData, isLoading } = useQuery<any>({
    queryKey: [`/api/users/${user?.id}`],
    enabled: !!user?.id,
  });

  // Update form state when data loads
  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName || "");
      setLastName(userData.lastName || "");
      setEmail(userData.email || "");
      setPhone(userData.phone || "");
      setBio(userData.bio || "");
    }
  }, [userData]);

  // Mutation to save changes
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PATCH', `/api/users/${user?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your profile has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      setShow2FADialog(false);
      setTotpToken("");
      setEmailOtp("");
      setPendingChanges(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  });

  // Check if editing sensitive fields
  const isSensitiveChange = () => {
    return email !== (userData?.email || "") || phone !== (userData?.phone || "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const changes = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
    };

    // If editing sensitive fields (email, phone), require 2FA verification
    if (isSensitiveChange()) {
      // Send Email OTP first
      try {
        await apiRequest('POST', '/api/auth/send-email-otp', { email: user?.email });
        toast({
          title: "2FA Verification Required",
          description: "We've sent a verification code to your email. Please verify to continue.",
        });
      } catch (error) {
        console.error("Failed to send Email OTP:", error);
      }
      
      setPendingChanges(changes);
      setShow2FADialog(true);
    } else {
      // Non-sensitive changes, save directly
      updateProfileMutation.mutate(changes);
    }
  };

  const handle2FAVerification = async () => {
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
        // 2FA verified, proceed with update
        updateProfileMutation.mutate({
          ...pendingChanges,
          verified2FA: true,
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
          <CardHeader className="bg-gradient-to-r from-rose-600 to-pink-700 text-white">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <User className="h-6 w-6" />
              Edit Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Important:</strong> Changes to email or phone number require 2FA verification for your security.
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    required
                    data-testid="input-first-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    required
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                  {isSensitiveChange() && email !== userData?.email && (
                    <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                      Requires 2FA
                    </span>
                  )}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                  {isSensitiveChange() && phone !== userData?.phone && (
                    <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                      Requires 2FA
                    </span>
                  )}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  data-testid="input-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                  data-testid="input-bio"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-rose-600 to-pink-700 hover:from-rose-700 hover:to-pink-800"
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-changes"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
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
              You're editing sensitive information. Please verify your identity using either your Authenticator app or the code sent to your email.
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
              onClick={handle2FAVerification}
              disabled={verifying2FA || (!totpToken && !emailOtp)}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800"
              data-testid="button-verify-and-save"
            >
              {verifying2FA ? "Verifying..." : "Verify & Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
