import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, Calendar, Clock, Search, Filter, Shield, Lock, AlertTriangle, Video, Download, Home } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Student } from "@shared/schema";

interface MergedRecording {
  id: string;
  bookingId: string;
  blobPath: string;
  fileSizeBytes: number;
  durationSeconds: number | null;
  status: string;
  mergedAt: Date;
  expiresAt: Date;
  booking: {
    id: string;
    studentId: string;
    mentorId: string;
    scheduledAt: Date;
    duration: number;
    notes: string;
    student: {
      id: string;
      userId: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    };
    mentor: {
      id: string;
      userId: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
      };
    };
  };
}

export default function StudentRecordings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecording, setSelectedRecording] = useState<MergedRecording | null>(null);
  const [selectedRecordingSasUrl, setSelectedRecordingSasUrl] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Fetch student record for the logged-in user
  const { data: student } = useQuery<Student>({
    queryKey: [`/api/students/user/${user?.id}`],
    enabled: !!user?.id && isAuthenticated,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache
  });

  // Fetch merged recordings for student - Using default queryFn for automatic auth handling
  const { data: recordings, isLoading, error, refetch } = useQuery<MergedRecording[]>({
    queryKey: [`/api/recordings/merged/${student?.id}`],
    enabled: !!student?.id && isAuthenticated,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache (formerly cacheTime in v4)
  });

  const filteredRecordings = recordings?.filter(recording =>
    recording.booking.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${recording.booking.mentor.user.firstName} ${recording.booking.mentor.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleWatchRecording = async (recording: MergedRecording) => {
    try {
      // Generate SAS URL for playback
      const sessionToken = localStorage.getItem('sessionToken');
      const headers: Record<string, string> = {};
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }
      
      const response = await fetch(`/api/recordings/sas-url?blobPath=${encodeURIComponent(recording.blobPath)}&bookingId=${recording.bookingId}`, {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: "Access Denied",
            description: "You can only view your own class recordings.",
            variant: "destructive",
          });
        } else {
          throw new Error('Failed to access recording');
        }
        return;
      }

      const { sasUrl } = await response.json();
      setSelectedRecording(recording);
      setSelectedRecordingSasUrl(sasUrl);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error accessing recording:', error);
      toast({
        title: "Error",
        description: "Failed to access recording. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (durationSeconds: number | null | undefined) => {
    if (!durationSeconds || durationSeconds === 0) {
      return "Duration unavailable";
    }
    const minutes = Math.floor(durationSeconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Please log in to access your class recordings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const isAuthError = errorMessage.includes('AUTHENTICATION_REQUIRED');
    const isAccessDenied = errorMessage.includes('ACCESS_DENIED');
    const isServerError = errorMessage.includes('SERVER_ERROR');
    const isNotFound = errorMessage.includes('NOT_FOUND');
    
    // Extract the user-friendly message (after the error code)
    const displayMessage = errorMessage.split(': ').slice(1).join(': ') || errorMessage;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="button-home">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          
          <Alert className={`${isAuthError || isAccessDenied ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-3">
              <div className="font-medium">
                {isAuthError && 'Authentication Required'}
                {isAccessDenied && 'Access Denied'}
                {isServerError && 'Server Error'}
                {isNotFound && 'Not Found'}
                {!isAuthError && !isAccessDenied && !isServerError && !isNotFound && 'Error Loading Recordings'}
              </div>
              <div className="text-sm">{displayMessage}</div>
              <div className="flex gap-2 mt-2">
                {isAuthError && (
                  <Link href="/login">
                    <Button size="sm" data-testid="button-login">
                      Go to Login
                    </Button>
                  </Link>
                )}
                {(isServerError || (!isAuthError && !isAccessDenied && !isNotFound)) && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => refetch()}
                    data-testid="button-retry"
                  >
                    Try Again
                  </Button>
                )}
                {isNotFound && (
                  <Link href="/help">
                    <Button size="sm" variant="outline" data-testid="button-contact-support">
                      Contact Support
                    </Button>
                  </Link>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 rounded-3xl shadow-2xl border border-white/20">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight flex items-center gap-3">
                  <Video className="h-10 w-10" />
                  My Class Recordings
                </h1>
                <p className="text-purple-100 text-xl font-medium">
                  Access and review your completed class sessions
                </p>
              </div>
              <Link href="/">
                <Button variant="secondary" size="sm" data-testid="button-home">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> You can only access recordings of your own classes. 
            Teachers cannot view recordings for privacy reasons. All recordings are securely stored and protected.
          </AlertDescription>
        </Alert>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Recordings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by subject, mentor name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  data-testid="input-search-recordings"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recordings Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRecordings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Video className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Recordings Found</h3>
              <p className="text-gray-500">
                {recordings?.length === 0 
                  ? "You don't have any class recordings yet. Recordings will appear here after your completed sessions."
                  : "No recordings match your search criteria."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecordings.map((recording) => (
              <Card key={recording.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="truncate" data-testid={`text-recording-subject-${recording.id}`}>
                      {recording.booking.notes || "Programming Session"}
                    </span>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {recording.status}
                    </Badge>
                  </CardTitle>
                  <div className="text-sm text-gray-600">
                    <p className="flex items-center gap-2" data-testid={`text-mentor-name-${recording.id}`}>
                      <span className="font-medium">Mentor:</span>
                      {recording.booking.mentor.user.firstName} {recording.booking.mentor.user.lastName}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span data-testid={`text-recording-date-${recording.id}`}>
                        {format(new Date(recording.booking.scheduledAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span data-testid={`text-recording-duration-${recording.id}`}>
                        {formatDuration(recording.durationSeconds)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Recorded {formatDistanceToNow(new Date(recording.mergedAt), { addSuffix: true })}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleWatchRecording(recording)}
                    className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                    data-testid={`button-watch-recording-${recording.id}`}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch Recording
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recording Player Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                {selectedRecording?.booking.notes || "Class Recording"}
              </DialogTitle>
              <DialogDescription>
                Class with {selectedRecording?.booking.mentor.user.firstName} {selectedRecording?.booking.mentor.user.lastName}
                {" "}• {selectedRecording && format(new Date(selectedRecording.booking.scheduledAt), "MMM d, yyyy")}
              </DialogDescription>
            </DialogHeader>
            
            {selectedRecordingSasUrl && selectedRecording && (
              <div className="mt-4">
                <video
                  controls
                  className="w-full h-auto rounded-lg bg-black"
                  data-testid="video-recording-player"
                  src={selectedRecordingSasUrl}
                >
                  Your browser does not support the video tag.
                </video>
                
                <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                  <span>Duration: {formatDuration(selectedRecording.durationSeconds)}</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}