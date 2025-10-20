import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Package, Calendar, DollarSign, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";

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
  mentor?: {
    id: string;
    name: string;
    username: string;
    profilePhotoUrl?: string;
  };
}

export default function MyPackages() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Get student ID from the user's email
  const { data: studentData, isLoading: studentLoading } = useQuery({
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

  // Fetch student's packages
  const { data: packages, isLoading: packagesLoading } = useQuery<BulkPackage[]>({
    queryKey: ["/api/bulk-packages/student", studentId],
    enabled: !!studentId,
  });

  const isLoading = studentLoading || packagesLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "depleted":
        return "bg-gray-500";
      case "expired":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "depleted":
        return "Fully Used";
      case "expired":
        return "Expired";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Package className="h-8 w-8" />
            My Class Packages
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage your bulk class packages
          </p>
        </div>
        <Button 
          onClick={() => setLocation("/mentors")}
          data-testid="button-find-mentor"
        >
          Buy More Classes
        </Button>
      </div>

      {!packages || packages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold mb-2">No packages yet</p>
            <p className="text-muted-foreground mb-6">
              Purchase a bulk package to get started with learning
            </p>
            <Button onClick={() => setLocation("/mentors")} data-testid="button-browse-mentors">
              Browse Mentors
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const progress = (pkg.usedClasses / pkg.totalClasses) * 100;
            const isActive = pkg.status === "active" && pkg.remainingClasses > 0;

            return (
              <Card key={pkg.id} className="flex flex-col" data-testid={`card-package-${pkg.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">
                      {pkg.totalClasses} Class Package
                    </CardTitle>
                    <Badge className={getStatusColor(pkg.status)}>
                      {getStatusText(pkg.status)}
                    </Badge>
                  </div>
                  <CardDescription>{pkg.subject}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Mentor Info */}
                  {pkg.mentor && (
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={pkg.mentor.profilePhotoUrl} />
                        <AvatarFallback>
                          {pkg.mentor.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{pkg.mentor.name}</p>
                        <p className="text-xs text-muted-foreground">@{pkg.mentor.username}</p>
                      </div>
                    </div>
                  )}

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Classes Used</span>
                      <span className="font-medium" data-testid={`text-classes-used-${pkg.id}`}>
                        {pkg.usedClasses} / {pkg.totalClasses}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm font-medium text-primary" data-testid={`text-remaining-${pkg.id}`}>
                      {pkg.remainingClasses} classes remaining
                    </p>
                  </div>

                  {/* Package Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>₹{pkg.pricePerClass} per class</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{pkg.sessionDuration} minutes each</span>
                    </div>
                    {pkg.expiryDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Expires: {format(new Date(pkg.expiryDate), "MMM dd, yyyy")}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>
                        Purchased: {format(new Date(pkg.createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Total Package Value</p>
                    <p className="text-2xl font-bold">₹{pkg.totalAmount}</p>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    disabled={!isActive}
                    onClick={() => setLocation(`/schedule-package/${pkg.id}`)}
                    data-testid={`button-schedule-${pkg.id}`}
                  >
                    {isActive ? "Schedule Classes" : "No Classes Available"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
