import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Character limits (aligned with database schema and best practices)
const CHAR_LIMITS = {
  email: 255,
  password: 128,
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [totpToken, setTotpToken] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const { toast} = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Comprehensive validation
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Email validation
    if (!trimmedEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Password validation
    if (!trimmedPassword) {
      toast({
        title: "Password Required",
        description: "Please enter your password.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (trimmedPassword.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // Security: Never log credentials
      console.log('🔐 Login attempt:', { email: trimmedEmail, has2FA: !!totpToken });
      
      // Call backend login API
      const requestBody: any = { 
        email: trimmedEmail, 
        password: trimmedPassword 
      };
      
      // Include 2FA tokens if provided (either one can be used)
      if (totpToken) {
        requestBody.totpToken = totpToken.trim();
      }
      if (emailOtp) {
        requestBody.emailOtp = emailOtp.trim();
      }
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        toast({
          title: "Login Failed",
          description: (totpToken || emailOtp) ? "Invalid 2FA code. Please try again." : "Invalid email or password. Please check your credentials and try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const userData = await response.json();
      
      // Check if 2FA is required
      if (userData.require2FA) {
        setRequire2FA(true);
        setLoading(false);
        toast({
          title: "2FA Required",
          description: "Please enter either the code from Microsoft Authenticator or the code sent to your email.",
          variant: "default",
        });
        return;
      }
      
      // Store authentication state and session token
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('sessionToken', userData.sessionToken);
      localStorage.setItem('userEmail', userData.user.email);
      localStorage.setItem('userRole', userData.user.role);
      localStorage.setItem('userId', userData.user.id);
      localStorage.setItem('userName', `${userData.user.firstName} ${userData.user.lastName}`);
      
      console.log('✅ Authentication stored:', userData.user);
      
      toast({
        title: "Login Successful",
        description: `Welcome back to TechLearnOrbit, ${userData.user.firstName}!`,
        variant: "default",
      });
      
      // Redirect to home page
      setTimeout(() => {
        console.log('🏠 Redirecting to home page now...');
        window.location.href = "/";
      }, 500);
      
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "There was an error logging in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl floating-animation" style={{animationDelay: '3s'}}></div>
      </div>
      
      <Card className="w-full max-w-md glassmorphism shadow-2xl border-0 backdrop-blur-xl relative z-10 hover-lift">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="TechLearnOrbit Logo" 
              className="h-24 w-24 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold mb-2" data-testid="title-login">
            <span className="text-gradient">Welcome Back to TechLearnOrbit</span>
          </CardTitle>
          <p className="text-gray-600">
            Sign in to continue your coding journey
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  maxLength={CHAR_LIMITS.email}
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  maxLength={CHAR_LIMITS.password}
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {require2FA && (
              <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center mb-3">
                  <Label className="text-blue-900 font-semibold text-lg">
                    Enter 2FA code or OTP
                  </Label>
                  <p className="text-sm text-blue-700 mt-1">
                    Enter either code - first valid one wins
                  </p>
                </div>

                {/* Two input boxes side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Authenticator App Code Box */}
                  <div className="space-y-2 bg-white rounded-lg p-3 border border-blue-300">
                    <Label htmlFor="totpToken" className="text-blue-900 font-medium text-sm flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                      Authenticator App code
                    </Label>
                    <Input
                      id="totpToken"
                      type="text"
                      maxLength={6}
                      value={totpToken}
                      onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="text-center text-xl tracking-widest font-mono"
                      data-testid="input-authenticator-code"
                      autoFocus
                    />
                  </div>

                  {/* Email OTP Box */}
                  <div className="space-y-2 bg-white rounded-lg p-3 border border-blue-300">
                    <Label htmlFor="emailOtp" className="text-blue-900 font-medium text-sm flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                      Email OTP (if received)
                    </Label>
                    <Input
                      id="emailOtp"
                      type="text"
                      maxLength={6}
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="text-center text-xl tracking-widest font-mono"
                      data-testid="input-email-otp"
                    />
                  </div>
                </div>
              </div>
            )}

            {!require2FA && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="rounded border-gray-300"
                    data-testid="checkbox-remember"
                  />
                  <Label htmlFor="remember" className="text-sm">
                    Remember me
                  </Label>
                </div>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
                  Forgot password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="button-sign-in"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline font-medium" data-testid="link-signup">
                Sign up for free
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:underline" data-testid="link-home">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}