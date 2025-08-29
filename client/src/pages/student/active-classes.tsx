import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, MessageCircle, Users, Home } from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { useAuth } from '@/hooks/use-auth';

interface ActiveClass {
  id: string;
  mentorName: string;
  subject: string;
  scheduledAt: Date;
  duration: string;
  status: string;
  nextSession?: Date;
}

export default function ActiveClasses() {
  const { user } = useAuth();

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['student-active-classes', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/student/active-classes?studentId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch active classes');
      return response.json();
    },
    enabled: !!user?.id
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Active Classes</h1>
            <p className="text-gray-600 mt-2">Manage your ongoing learning sessions</p>
          </div>
          <Link href="/">
            <Button variant="outline" data-testid="button-home">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-gray-600">Loading your active classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Classes</h3>
              <p className="text-gray-600 mb-6">You don't have any active classes at the moment.</p>
              <Link href="/mentors">
                <Button data-testid="button-find-mentor">Find a Mentor</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {classes.map((classItem: ActiveClass) => (
              <Card key={classItem.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold">{classItem.subject}</CardTitle>
                      <CardDescription className="text-base mt-1">
                        with {classItem.mentorName}
                      </CardDescription>
                    </div>
                    <Badge variant={classItem.status === 'ongoing' ? 'default' : 'secondary'}>
                      {classItem.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Started {new Date(classItem.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{classItem.duration} sessions</span>
                    </div>
                    {classItem.nextSession && (
                      <div className="flex items-center text-green-600 font-medium">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Next: {new Date(classItem.nextSession).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button size="sm" data-testid={`button-join-video-${classItem.id}`}>
                      <Video className="w-4 h-4 mr-2" />
                      Join Session
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-chat-${classItem.id}`}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-schedule-${classItem.id}`}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}