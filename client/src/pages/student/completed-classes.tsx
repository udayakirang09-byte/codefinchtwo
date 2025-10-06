import { useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle, Calendar, Clock, User, Home } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { addMinutes } from "date-fns";

interface CompletedClass {
  id: string;
  mentorName: string;
  subject: string;
  scheduledAt: Date;
  duration: number;
  hasSubmittedFeedback: boolean;
}

export default function CompletedClasses() {
  const { user, isAuthenticated } = useAuth();
  
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

  const { data: completedClassesData, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/students', studentId, 'completed-bookings'],
    queryFn: async () => {
      if (!studentId) throw new Error('No student ID available');
      const response = await fetch(`/api/students/${studentId}/bookings`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const bookings = await response.json();
      
      // Filter for completed classes
      const now = new Date();
      return bookings
        .filter((booking: any) => {
          const scheduledTime = new Date(booking.scheduledAt);
          const classEndTime = addMinutes(scheduledTime, booking.duration + 2);
          
          // Include both completed bookings AND scheduled bookings past their end time
          return (
            booking.status === 'completed' ||
            (booking.status === 'scheduled' && now >= classEndTime)
          );
        })
        .map((booking: any) => ({
          id: booking.id,
          mentorName: `${booking.mentor.user.firstName} ${booking.mentor.user.lastName}`,
          subject: booking.subject || booking.notes || 'Programming Session',
          scheduledAt: new Date(booking.scheduledAt),
          duration: booking.duration,
          hasSubmittedFeedback: false, // TODO: Check feedback table
        }))
        .sort((a: any, b: any) => b.scheduledAt.getTime() - a.scheduledAt.getTime());
    },
    enabled: !!studentId,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view completed classes</h2>
              <p className="text-gray-600">You need to be logged in as a student to access this page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = studentLoading || classesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            <span className="ml-3">Loading completed classes...</span>
          </div>
        </div>
      </div>
    );
  }

  const completedClasses = completedClassesData || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-home">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <CheckCircle className="h-10 w-10 text-green-600" />
            Completed Classes ✨
          </h1>
          <p className="text-xl text-gray-600">Review your past learning sessions</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{completedClasses.length}</div>
              <div className="text-green-100">Total Completed</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">
                {Math.round(completedClasses.reduce((sum: number, cls: CompletedClass) => sum + cls.duration, 0) / 60)}
              </div>
              <div className="text-blue-100">Hours Learned</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">
                {completedClasses.filter((cls: CompletedClass) => cls.hasSubmittedFeedback).length}
              </div>
              <div className="text-yellow-100">Feedback Submitted</div>
            </CardContent>
          </Card>
        </div>

        {/* Completed Classes List */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
            <CardTitle>All Completed Classes</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {completedClasses.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-600 mb-2">No completed classes yet</p>
                <p className="text-gray-500">Your completed classes will appear here after you finish your sessions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedClasses.map((cls: CompletedClass) => (
                  <Card key={cls.id} className="border-2 hover:border-green-300 transition-colors duration-200" data-testid={`card-completed-class-${cls.id}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <h3 className="text-xl font-bold text-gray-900">{cls.subject}</h3>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              Completed
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{cls.mentorName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{cls.scheduledAt.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{cls.duration} minutes</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          {cls.hasSubmittedFeedback ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              <Star className="h-3 w-3 mr-1" />
                              Feedback Given
                            </Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                              onClick={() => window.location.href = `/feedback/${cls.id}`}
                              data-testid={`button-give-feedback-${cls.id}`}
                            >
                              <Star className="h-4 w-4 mr-1" />
                              Give Feedback
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
