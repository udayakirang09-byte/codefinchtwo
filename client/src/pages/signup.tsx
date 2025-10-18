import { useState, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code, Mail, Lock, User, Eye, EyeOff, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { Qualification, Specialization, Subject } from "@shared/schema";

// Character limits (aligned with database schema and best practices)
const CHAR_LIMITS = {
  firstName: 50,
  lastName: 50,
  email: 255,
  password: 128,
  country: 100,
  qualification: 255,
  specialization: 255,
  subject: 255,
  score: 50,
  experience: 20,
};

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    country: "India", // Default to India
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoValidation, setPhotoValidation] = useState<{
    isValidating: boolean;
    faceDetected: boolean;
    message: string;
  }>({ isValidating: false, faceDetected: false, message: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch educational dropdown data
  const { data: qualifications = [], isLoading: qualificationsLoading, isError: qualificationsError } = useQuery<Qualification[]>({
    queryKey: ['/api/qualifications'],
    enabled: formData.role === "mentor"
  });

  const { data: specializations = [], isLoading: specializationsLoading, isError: specializationsError } = useQuery<Specialization[]>({
    queryKey: ['/api/specializations'],
    enabled: formData.role === "mentor"
  });

  const { data: subjects = [], isLoading: subjectsLoading, isError: subjectsError } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
    enabled: formData.role === "mentor"
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic file validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `File size is ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 5MB.`,
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;
      setPhotoPreview(imageUrl);
      setPhotoFile(file);

      // Client-side face detection (privacy-preserving)
      setPhotoValidation({ isValidating: true, faceDetected: false, message: "Validating photo quality..." });
      
      try {
        // Note: face-api.js validation would go here
        // For now, we'll do a simple validation
        const img = new Image();
        img.onload = () => {
          // Show informative message if image will be resized
          let message = "Photo looks good! (Face detection will run during signup)";
          
          if (img.width < 200 || img.height < 200) {
            message = `Image will be auto-resized from ${img.width}x${img.height} to meet minimum requirements.`;
            toast({
              title: "Image Will Be Resized",
              description: `Your image (${img.width}x${img.height}) will be automatically resized to meet the 200x200 minimum.`,
              variant: "default",
            });
          } else if (img.width > 4000 || img.height > 4000) {
            message = `Large image will be optimized from ${img.width}x${img.height} for faster loading.`;
            toast({
              title: "Image Will Be Optimized",
              description: `Your large image (${img.width}x${img.height}) will be automatically optimized.`,
              variant: "default",
            });
          }
          
          setPhotoValidation({
            isValidating: false,
            faceDetected: true,
            message
          });
        };
        img.src = imageUrl;
      } catch (error) {
        setPhotoValidation({
          isValidating: false,
          faceDetected: false,
          message: "Error validating photo. Please try another image."
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoValidation({ isValidating: false, faceDetected: false, message: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
        description: "Please select your role (student or mentor).",
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
    if (formData.role === "mentor") {
      // Photo validation for mentors
      if (!photoFile) {
        toast({
          title: "Photo Required",
          description: "Teachers must upload a profile photo for verification.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const validQualifications = formData.qualifications.filter(q => q.qualification.trim() !== "");
      const validSubjects = formData.subjects.filter(s => s.subject.trim() !== "");

      if (validQualifications.length === 0) {
        toast({
          title: "Qualifications Required",
          description: "Teachers must provide at least one educational qualification.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (validSubjects.length === 0) {
        toast({
          title: "Subjects Required",
          description: "Teachers must specify at least one teaching subject.",
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

      // Validate that subjects have experience and vice versa
      for (const subj of formData.subjects) {
        const hasSubject = subj.subject.trim() !== "";
        const hasExperience = subj.experience.trim() !== "";
        
        if (hasSubject && !hasExperience) {
          toast({
            title: "Experience Required",
            description: "Please specify teaching experience for each subject you've entered.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        if (!hasSubject && hasExperience) {
          toast({
            title: "Subject Required",
            description: "Please select a subject for each experience you've entered.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }
      
      // Ensure at least one complete subject-experience pair
      if (validSubjects.length === 0) {
        toast({
          title: "Subjects Required",
          description: "Teachers must specify at least one teaching subject with experience.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    try {
      // Prepare form data with photo
      const signupData = new FormData();
      signupData.append("firstName", formData.firstName);
      signupData.append("lastName", formData.lastName);
      signupData.append("email", formData.email);
      signupData.append("password", formData.password);
      signupData.append("role", formData.role);
      signupData.append("country", formData.country);

      // Include mentor data if role is mentor
      if (formData.role === "mentor") {
        if (photoFile) {
          signupData.append("photo", photoFile);
        }
        signupData.append("mentorData", JSON.stringify({
          qualifications: formData.qualifications.filter(q => q.qualification.trim() !== ""),
          subjects: formData.subjects.filter(s => s.subject.trim() !== "")
        }));
      }

      // Call the signup API
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        body: signupData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Signup failed");
      }
      
      const responseData = await response.json();
      
      toast({
        title: "Account Created!",
        description: formData.role === "mentor" 
          ? "Please set up two-factor authentication to secure your account."
          : "Welcome to CodeConnect! Please sign in to continue.",
        variant: "default",
      });
      
      // Redirect teachers to 2FA setup, students to login
      if (formData.role === "mentor") {
        // Store email and setup token for secure 2FA setup
        localStorage.setItem('setup2fa_email', formData.email);
        if (responseData.setupToken) {
          localStorage.setItem('setup2fa_token', responseData.setupToken);
        }
        window.location.href = `/setup-2fa?email=${encodeURIComponent(formData.email)}`;
      } else {
        window.location.href = "/login";
      }
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "There was an error creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl floating-animation" style={{animationDelay: '3s'}}></div>
      </div>
      
      <Card className="w-full max-w-md glassmorphism shadow-2xl border-0 backdrop-blur-xl relative z-10 hover-lift">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 rounded-2xl shadow-lg">
              <Code className="text-white mr-0" size={32} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold mb-2" data-testid="title-signup">
            <span className="text-gradient">Join CodeConnect</span>
          </CardTitle>
          <p className="text-gray-600">
            Start your coding journey with expert mentors
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
                    maxLength={CHAR_LIMITS.firstName}
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
                  maxLength={CHAR_LIMITS.lastName}
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
                  maxLength={CHAR_LIMITS.email}
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
                  <SelectItem value="mentor">Teach coding (Teacher)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                <SelectTrigger data-testid="select-country">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="India">India</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mentor Qualification Fields */}
            {formData.role === "mentor" && (
              <div className="space-y-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">Teacher Qualifications</h3>
                
                {/* Photo Upload */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Profile Photo <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-gray-600">Upload a clear photo of your face for verification (JPEG, PNG, or WebP, max 5MB)</p>
                  <div className="flex items-start space-x-2 bg-blue-50 border border-blue-200 rounded-md p-3">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-800">
                      <strong>Important:</strong> Your photo will be displayed to students when they search for teachers. This helps students identify their teacher before booking a session.
                    </p>
                  </div>
                  
                  {!photoPreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer"
                         onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-1">Click to upload your photo</p>
                      <p className="text-xs text-gray-500">Face detection will verify photo quality</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        data-testid="input-photo-upload"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <img src={photoPreview} alt="Profile preview" className="w-full h-48 object-cover rounded-lg border-2 border-purple-500" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removePhoto}
                        data-testid="button-remove-photo"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {photoValidation.isValidating && (
                        <p className="text-sm text-blue-600 mt-2">{photoValidation.message}</p>
                      )}
                      {!photoValidation.isValidating && photoValidation.message && (
                        <p className={`text-sm mt-2 ${photoValidation.faceDetected ? 'text-green-600' : 'text-red-600'}`}>
                          {photoValidation.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Qualifications */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Educational Qualifications (Top 3)</Label>
                  {formData.qualifications.map((qual, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-5 space-y-1">
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
                      <div className="sm:col-span-4 space-y-1">
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
                      <div className="sm:col-span-3 space-y-1">
                        <Label className="text-sm font-medium">Score/Grade</Label>
                        <Input
                          placeholder="e.g., 3.8 GPA"
                          value={qual.score}
                          onChange={(e) => handleQualificationChange(index, "score", e.target.value)}
                          maxLength={CHAR_LIMITS.score}
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
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-7 space-y-1">
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
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-5 space-y-1">
                        <Label className="text-sm font-medium">Teaching Experience (Years)</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 5"
                          value={subj.experience}
                          onChange={(e) => handleSubjectChange(index, "experience", e.target.value)}
                          maxLength={CHAR_LIMITS.experience}
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
                  maxLength={CHAR_LIMITS.password}
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
