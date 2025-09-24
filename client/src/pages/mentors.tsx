import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Users, BookOpen, Clock } from "lucide-react";

export default function Mentors() {
  const { data: mentors, isLoading } = useQuery({
    queryKey: ["/api/mentors"]
  });

  const handleBookMentor = (mentorId: string) => {
    console.log(`📅 Booking session with mentor ${mentorId}`);
    window.location.href = `/booking/${mentorId}`;
  };

  const handleViewProfile = (mentorId: string) => {
    console.log(`👤 Viewing profile for mentor ${mentorId}`);
    window.location.href = `/mentors/${mentorId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Perfect Coding Mentor 🎓</h1>
          <p className="text-xl text-gray-600">Connect with experienced developers and accelerate your learning journey</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(mentors) ? mentors.map((mentor: any) => (
              <Card key={mentor.id} className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {mentor.title?.charAt(0) || 'M'}
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1" />
                      {mentor.rating || '4.8'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800" data-testid={`text-mentor-name-${mentor.id}`}>
                    {mentor.user ? `${mentor.user.firstName} ${mentor.user.lastName}` : 'Expert Coding Mentor'}
                  </CardTitle>
                  <p className="text-sm font-medium text-blue-600 mb-2" data-testid={`text-mentor-title-${mentor.id}`}>
                    {mentor.title || 'Expert Coding Mentor'}
                  </p>
                  <p className="text-gray-600 line-clamp-2">
                    {mentor.description || 'Experienced developer ready to help you master programming skills'}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {mentor.totalStudents || 25}+ students
                    </span>
                    <span className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {mentor.experience || 5}+ years
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(mentor.specialties || ['JavaScript', 'Python']).slice(0, 3).map((specialty: string) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                    {mentor.hourlyRate && (
                      <p className="text-lg font-bold text-green-600">
                        ${mentor.hourlyRate}/hour
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleViewProfile(mentor.id)}
                      className="flex-1"
                      data-testid={`button-view-profile-${mentor.id}`}
                    >
                      View Profile
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleBookMentor(mentor.id)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      data-testid={`button-book-mentor-${mentor.id}`}
                    >
                      Book Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No mentors available at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}