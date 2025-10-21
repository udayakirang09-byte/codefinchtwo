import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, ArrowLeft } from "lucide-react";

interface BulkPackage {
  id: string;
  studentId: string;
  mentorId: string;
  totalClasses: number;
  usedClasses: number;
  remainingClasses: number;
  pricePerClass: string;
  totalAmount: string;
  subject: string;
  sessionDuration: number;
  status: "active" | "depleted" | "expired";
  expiryDate?: string;
  createdAt: string;
}

interface Mentor {
  id: string;
  name: string;
  username: string;
  profilePhotoUrl?: string;
}

export default function SchedulePackage() {
  const params = useParams<{ packageId: string }>();
  const packageId = params.packageId;
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Get student ID from the user's email
  const { data: studentData } = useQuery({
    queryKey: ['/api/users', user?.email, 'student'],
    queryFn: async () => {
      if (!user?.email) throw new Error('No user email');
      const response = await fetch(`/api/users/${encodeURIComponent(user.email)}/student`);
      if (!response.ok) throw new Error('Failed to fetch student data');
      return response.json();
    },
    enabled: !!user?.email && isAuthenticated,
  });

  const studentId = studentData?.id;

  // Fetch all packages for this student
  const { data: packages, isLoading } = useQuery<BulkPackage[]>({
    queryKey: ["/api/bulk-packages/student", studentId],
    enabled: !!studentId,
  });

  // Find the specific package
  const packageData = packages?.find(pkg => pkg.id === packageId);

  // Fetch mentor details
  const { data: mentorData } = useQuery<Mentor>({
    queryKey: ["/api/mentors", packageData?.mentorId],
    enabled: !!packageData?.mentorId,
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">Loading package details...</div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-xl font-semibold mb-2">Package Not Found</p>
            <p className="text-muted-foreground mb-6">
              This package doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => setLocation("/student/my-packages")}>
              Back to My Packages
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => setLocation("/student/my-packages")}
        className="mb-6"
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to My Packages
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Schedule Your Classes</CardTitle>
          <CardDescription>
            Package: {packageData.totalClasses} Class Package - {packageData.subject}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Package Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Remaining Classes</p>
                <p className="text-2xl font-bold">{packageData.remainingClasses}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Session Duration</p>
                <p className="text-2xl font-bold">{packageData.sessionDuration}min</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Mentor</p>
                <p className="text-lg font-semibold">{mentorData?.name || 'Loading...'}</p>
              </div>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div className="text-center py-12 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold">Scheduling Interface Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The ability to schedule individual classes from your bulk package is being built. 
              You'll soon be able to pick dates and times for each of your {packageData.remainingClasses} remaining classes.
            </p>
            <div className="pt-4">
              <Button onClick={() => setLocation("/student/my-packages")}>
                Back to My Packages
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
