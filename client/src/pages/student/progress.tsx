import { useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Calendar, BookOpen, Star, TrendingUp, Home } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function StudentProgress() {
  // Get authenticated user from auth context
  const { user, isAuthenticated } = useAuth();
  
  // Get the actual student ID from the database using the user's email
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
  
  // Define types for the progress data
  type ProgressData = {
    totalClasses: number;
    completedClasses: number;
    hoursLearned: number;
    achievements: Array<{
      id: number;
      title: string;
      description: string;
      earned: boolean;
      date?: string;
      progress?: number;
    }>;
    recentClasses: Array<{
      id: number;
      subject: string;
      mentor: string;
      rating: number;
      completedAt: string;
    }>;
    skillLevels: Array<{
      skill: string;
      level: number;
      classes: number;
    }>;
  };

  // Fetch real progress data from API
  const { data: progressData, isLoading: progressLoading } = useQuery<ProgressData>({
    queryKey: ['student-progress', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('No student ID available');
      const response = await fetch(`/api/students/${studentId}/progress`);
      if (!response.ok) throw new Error('Failed to fetch progress data');
      return response.json();
    },
    enabled: !!studentId,
    // Default fallback data when student has no progress yet
    placeholderData: {
      totalClasses: 0,
      completedClasses: 0,
      hoursLearned: 0,
      achievements: [],
      recentClasses: [],
      skillLevels: []
    }
  });

  const isLoading = studentLoading || progressLoading;
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your progress</h2>
              <p className="text-gray-600">You need to be logged in as a student to access your learning progress.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            <span className="ml-3">Loading your progress...</span>
          </div>
        </div>
      </div>
    );
  }

  // Provide safe defaults if progressData is undefined
  const safeProgressData = progressData || {
    totalClasses: 0,
    completedClasses: 0,
    hoursLearned: 0,
    achievements: [],
    recentClasses: [],
    skillLevels: []
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-between items-center mb-4">
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-home">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <div className="flex-1"></div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Learning Progress 📊</h1>
          <p className="text-xl text-gray-600">Track your coding journey and celebrate your achievements</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{safeProgressData.completedClasses}</div>
              <div className="text-blue-100">Classes Completed</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-teal-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{safeProgressData.hoursLearned}</div>
              <div className="text-green-100">Hours Learned</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{safeProgressData.achievements.filter(a => a.earned).length}</div>
              <div className="text-yellow-100">Achievements</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{safeProgressData.totalClasses > 0 ? Math.round((safeProgressData.completedClasses / safeProgressData.totalClasses) * 100) : 0}%</div>
              <div className="text-purple-100">Overall Progress</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Skill Progress */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Skill Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {safeProgressData.skillLevels.map((skill) => (
                  <div key={skill.skill} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">{skill.skill}</span>
                      <span className="text-sm text-gray-600">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level} className="h-3" />
                    <div className="text-xs text-gray-500">
                      {skill.classes} classes completed
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {safeProgressData.achievements.map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className={`p-4 rounded-lg border-2 ${
                      achievement.earned 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${achievement.earned ? 'text-yellow-800' : 'text-gray-600'}`}>
                          {achievement.earned ? '🏆' : '🎯'} {achievement.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {achievement.description}
                        </p>
                        {achievement.earned ? (
                          <p className="text-xs text-yellow-600 mt-2">
                            Earned on {achievement.date}
                          </p>
                        ) : (
                          <div className="mt-2">
                            <Progress value={(achievement.progress! / 7) * 100} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">
                              Progress: {achievement.progress}/7 days
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Classes */}
        <Card className="mt-8 shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recent Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {safeProgressData.recentClasses.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-green-50 rounded-lg border border-green-100">
                  <div>
                    <h3 className="font-semibold text-gray-800">{cls.subject}</h3>
                    <p className="text-sm text-gray-600">with {cls.mentor}</p>
                    <p className="text-xs text-gray-500">Completed on {cls.completedAt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < cls.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {cls.rating}/5
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}