import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { Qualification, Specialization, Subject } from "@shared/schema";

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    // Mentor qualification fields
    qualifications: [
      { qualification: "", specialization: "", score: "" },
      { qualification: "", specialization: "", score: "" },
      { qualification: "", specialization: "", score: "" }
    ],
    subjects: [
      { subject: "", experience: "" },
      { subject: "", experience: "" },
      { subject: "", experience: "" },
      { subject: "", experience: "" },
      { subject: "", experience: "" }
    ]
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch educational dropdown data
  const { data: qualifications = [], isLoading: qualificationsLoading, isError: qualificationsError } = useQuery<Qualification[]>({
    queryKey: ['/api/qualifications'],
    enabled: formData.role === "mentor" || formData.role === "both"
  });

  const { data: specializations = [], isLoading: specializationsLoading, isError: specializationsError } = useQuery<Specialization[]>({
    queryKey: ['/api/specializations'],
    enabled: formData.role === "mentor" || formData.role === "both"
  });

  const { data: subjects = [], isLoading: subjectsLoading, isError: subjectsError } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
    enabled: formData.role === "mentor" || formData.role === "both"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQualificationChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.map((qual, i) => 
        i === index ? { ...qual, [field]: value } : qual
      )
    }));
  };

  const handleSubjectChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map((subj, i) => 
        i === index ? { ...subj, [field]: value } : subj
      )
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Comprehensive validation
    // Name validation
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(formData.firstName)) {
      toast({
        title: "Invalid First Name",
        description: "First name can only contain letters, spaces, hyphens, and apostrophes.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!nameRegex.test(formData.lastName)) {
      toast({
        title: "Invalid Last Name",
        description: "Last name can only contain letters, spaces, hyphens, and apostrophes.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Role validation
    if (!formData.role) {
      toast({
        title: "Role Required",
        description: "Please select your role (student, mentor, or both).",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Password validation
    if (formData.password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      toast({
        title: "Weak Password",
        description: "Password must contain at least one uppercase letter.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!/[a-z]/.test(formData.password)) {
      toast({
        title: "Weak Password",
        description: "Password must contain at least one lowercase letter.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      toast({
        title: "Weak Password",
        description: "Password must contain at least one number.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Mentor data validation
    if (formData.role === "mentor" || formData.role === "both") {
      const validQualifications = formData.qualifications.filter(q => q.qualification.trim() !== "");
      const validSubjects = formData.subjects.filter(s => s.subject.trim() !== "");

      if (validQualifications.length === 0) {
        toast({
          title: "Qualifications Required",
          description: "Mentors must provide at least one educational qualification.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (validSubjects.length === 0) {
        toast({
          title: "Subjects Required",
          description: "Mentors must specify at least one teaching subject.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate that qualifications have required fields
      for (const qual of validQualifications) {
        if (!qual.specialization) {
          toast({
            title: "Incomplete Qualification",
            description: "Each qualification must include a specialization.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Validate that subjects have experience
      for (const subj of validSubjects) {
        if (!subj.experience.trim()) {
          toast({
            title: "Experience Required",
            description: "Please specify teaching experience for each subject.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }
    }

    try {
      // Call the signup API
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          // Include mentor data if role is mentor or both
          mentorData: (formData.role === "mentor" || formData.role === "both") ? {
            qualifications: formData.qualifications.filter(q => q.qualification.trim() !== ""),
            subjects: formData.subjects.filter(s => s.subject.trim() !== "")
          } : null
        })
      });

      if (!response.ok) {
        throw new Error("Signup failed");
      }
      
      toast({
        title: "Account Created!",
        description: "Welcome to CodeConnect! Please sign in to continue.",
        variant: "default",
      });
      
      // Redirect to login page after successful signup
      window.location.href = "/login";
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: "There was an error creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Code className="text-primary mr-2" size={32} />
            <span className="text-2xl font-bold">CodeConnect</span>
          </div>
          <CardTitle className="text-xl" data-testid="title-signup">Create Your Account</CardTitle>
          <p className="text-muted-foreground">
            Join thousands of students and mentors in our coding community!
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="pl-10"
                    required
                    data-testid="input-first-name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  required
                  data-testid="input-last-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10"
                  required
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">I want to</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue placeholder="Choose your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Learn coding (Student)</SelectItem>
                  <SelectItem value="mentor">Teach coding (Mentor)</SelectItem>
                  <SelectItem value="both">Both learn and teach</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mentor/Both Qualification Fields */}
            {(formData.role === "mentor" || formData.role === "both") && (
              <div className="space-y-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">Mentor Qualifications</h3>
                
                {/* Qualifications */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Educational Qualifications (Top 3)</Label>
                  {formData.qualifications.map((qual, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3">
                      <div className="col-span-5 space-y-1">
                        <Label className="text-sm font-medium">{index === 0 ? "Highest" : index === 1 ? "Second" : "Third"} Qualification</Label>
                        <Select 
                          value={qual.qualification} 
                          onValueChange={(value) => handleQualificationChange(index, "qualification", value)}
                          disabled={qualificationsLoading}
                        >
                          <SelectTrigger data-testid={`select-qualification-${index}`}>
                            <SelectValue placeholder={qualificationsLoading ? "Loading..." : qualificationsError ? "Error loading qualifications" : "Select qualification"} />
                          </SelectTrigger>
                          <SelectContent>
                            {qualifications.map((qualification) => (
                              <SelectItem key={qualification.id} value={qualification.name}>
                                {qualification.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4 space-y-1">
                        <Label className="text-sm font-medium">Specialization</Label>
                        <Select 
                          value={qual.specialization} 
                          onValueChange={(value) => handleQualificationChange(index, "specialization", value)}
                          disabled={specializationsLoading}
                        >
                          <SelectTrigger data-testid={`select-specialization-${index}`}>
                            <SelectValue placeholder={specializationsLoading ? "Loading..." : specializationsError ? "Error loading specializations" : "Select specialization"} />
                          </SelectTrigger>
                          <SelectContent>
                            {specializations.map((specialization) => (
                              <SelectItem key={specialization.id} value={specialization.name}>
                                {specialization.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-sm font-medium">Score/Grade</Label>
                        <Input
                          placeholder="e.g., 3.8 GPA"
                          value={qual.score}
                          onChange={(e) => handleQualificationChange(index, "score", e.target.value)}
                          data-testid={`input-score-${index}`}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subjects */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Teaching Subjects & Experience</Label>
                  {formData.subjects.map((subj, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3">
                      <div className="col-span-7 space-y-1">
                        <Label className="text-sm font-medium">Subject {index + 1}</Label>
                        <Select 
                          value={subj.subject} 
                          onValueChange={(value) => handleSubjectChange(index, "subject", value)}
                          disabled={subjectsLoading}
                        >
                          <SelectTrigger data-testid={`select-subject-${index}`}>
                            <SelectValue placeholder={subjectsLoading ? "Loading..." : subjectsError ? "Error loading subjects" : "Select subject"} />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.name}>
                                {subject.name} ({subject.board})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-5 space-y-1">
                        <Label className="text-sm font-medium">Teaching Experience</Label>
                        <Input
                          placeholder="e.g., 5 years, Advanced level"
                          value={subj.experience}
                          onChange={(e) => handleSubjectChange(index, "experience", e.target.value)}
                          data-testid={`input-experience-${index}`}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className="pl-10 pr-10"
                  required
                  data-testid="input-confirm-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  data-testid="button-toggle-confirm-password"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                className="rounded border-gray-300"
                required
                data-testid="checkbox-terms"
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="button-create-account"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium" data-testid="link-login">
                Sign in here
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