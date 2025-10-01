import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("udayakirang09@gmail.com");
  const [password, setPassword] = useState("Hello111");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      console.log('🔐 Login attempt:', { email: trimmedEmail, password: trimmedPassword });
      
      // Call backend login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: trimmedEmail, 
          password: trimmedPassword 
        })
      });
      
      if (!response.ok) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Try: udayakirang09@gmail.com, teacher@codeconnect.com, or admin@codeconnect.com with password Hello111",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const userData = await response.json();
      
      // Store authentication state
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', userData.user.email);
      localStorage.setItem('userRole', userData.user.role);
      localStorage.setItem('userId', userData.user.id);
      localStorage.setItem('userName', `${userData.user.firstName} ${userData.user.lastName}`);
      
      console.log('✅ Authentication stored:', userData.user);
      
      toast({
        title: "Login Successful",
        description: `Welcome back to CodeConnect, ${userData.user.firstName}!`,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Code className="text-primary mr-2" size={32} />
            <span className="text-2xl font-bold">CodeConnect</span>
          </div>
          <CardTitle className="text-xl" data-testid="title-login">Sign In to Your Account</CardTitle>
          <p className="text-muted-foreground">
            Welcome back! Enter your details to access your account.
          </p>
          <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg mt-2 space-y-1">
            <strong>📚 Test Accounts:</strong><br />
            <div className="font-mono">
              <div>👨‍🎓 Student: udayakirang09@gmail.com</div>
              <div>👨‍🏫 Teacher: teacher@codeconnect.com</div>
              <div>👨‍💼 Admin: admin@codeconnect.com</div>
              <div className="mt-1">🔑 Password: <strong>Hello111</strong> (for all)</div>
            </div>
          </div>
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