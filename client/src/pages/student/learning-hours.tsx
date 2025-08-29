import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, TrendingUp, Calendar, Home, Target, Award } from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function LearningHours() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState('week');

  const { data: hoursData = {
    totalHours: 47,
    weeklyHours: 12,
    monthlyHours: 47,
    dailyBreakdown: [
      { day: 'Mon', hours: 2 },
      { day: 'Tue', hours: 1.5 },
      { day: 'Wed', hours: 3 },
      { day: 'Thu', hours: 2.5 },
      { day: 'Fri', hours: 2 },
      { day: 'Sat', hours: 1 },
      { day: 'Sun', hours: 0 }
    ],
    weeklyGoal: 15,
    streak: 5
  }, isLoading } = useQuery({
    queryKey: ['student-learning-hours', user?.id, timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/student/learning-hours?studentId=${user?.id}&timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch learning hours');
      return response.json();
    },
    enabled: !!user?.id
  });

  const weeklyProgress = (hoursData.weeklyHours / hoursData.weeklyGoal) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Learning Hours</h1>
            <p className="text-gray-600 mt-2">Track your learning progress and goals</p>
          </div>
          <Link href="/">
            <Button variant="outline" data-testid="button-home">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{hoursData.totalHours}</div>
              <div className="text-sm text-gray-600">All time</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{hoursData.weeklyHours}</div>
              <div className="text-sm text-gray-600">
                {weeklyProgress.toFixed(1)}% of weekly goal
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Learning Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{hoursData.streak}</div>
              <div className="text-sm text-gray-600">days in a row</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Weekly Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{hoursData.weeklyGoal}</div>
              <div className="text-sm text-gray-600">hours target</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Progress</CardTitle>
              <CardDescription>Your learning hours this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{hoursData.weeklyHours} / {hoursData.weeklyGoal} hours</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-3">
                {hoursData.dailyBreakdown?.map((day: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium w-12">{day.day}</span>
                    <div className="flex-1 mx-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(day.hours / 4) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{day.hours}h</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Your learning milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <Award className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <div className="font-semibold text-green-800">First Week Complete!</div>
                    <div className="text-sm text-green-600">Completed your first 15 hours</div>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <Target className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <div className="font-semibold text-blue-800">Goal Achiever</div>
                    <div className="text-sm text-blue-600">Met weekly goals 3 times</div>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                  <Clock className="w-8 h-8 text-orange-600 mr-3" />
                  <div>
                    <div className="font-semibold text-orange-800">Streak Master</div>
                    <div className="text-sm text-orange-600">5-day learning streak</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}