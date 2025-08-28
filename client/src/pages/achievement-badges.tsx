import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Trophy, Zap, Target, BookOpen } from "lucide-react";

export default function AchievementBadges() {
  const badges = [
    {
      id: 1,
      name: "First Steps",
      description: "Complete your first coding lesson",
      icon: <BookOpen className="h-12 w-12" />,
      earned: true,
      color: "text-green-600"
    },
    {
      id: 2,
      name: "Code Warrior",
      description: "Complete 10 coding challenges",
      icon: <Target className="h-12 w-12" />,
      earned: true,
      color: "text-blue-600"
    },
    {
      id: 3,
      name: "Speed Demon",
      description: "Solve a problem in under 5 minutes",
      icon: <Zap className="h-12 w-12" />,
      earned: false,
      color: "text-yellow-600"
    },
    {
      id: 4,
      name: "Master Coder",
      description: "Complete an advanced course",
      icon: <Trophy className="h-12 w-12" />,
      earned: false,
      color: "text-purple-600"
    },
    {
      id: 5,
      name: "Helper",
      description: "Help 5 fellow students in the community",
      icon: <Star className="h-12 w-12" />,
      earned: true,
      color: "text-orange-600"
    },
    {
      id: 6,
      name: "Project Pioneer",
      description: "Share your first project in the showcase",
      icon: <Award className="h-12 w-12" />,
      earned: false,
      color: "text-red-600"
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="text-badges-title">
            Achievement <span className="text-gradient">Badges</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-badges-description">
            Track your coding journey and celebrate your milestones with our achievement system.
          </p>
        </div>

        <div className="mb-12">
          <div className="flex justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600">{badges.filter(b => b.earned).length}</div>
              <div className="text-muted-foreground">Badges Earned</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">{badges.length}</div>
              <div className="text-muted-foreground">Total Badges</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {Math.round((badges.filter(b => b.earned).length / badges.length) * 100)}%
              </div>
              <div className="text-muted-foreground">Completion</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {badges.map((badge) => (
            <Card 
              key={badge.id} 
              className={`text-center hover:shadow-lg transition-all duration-300 ${
                badge.earned 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg scale-105' 
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
              data-testid={`badge-${badge.id}`}
            >
              <CardHeader>
                <div className={`mx-auto mb-4 ${badge.color} ${badge.earned ? '' : 'opacity-50'}`}>
                  {badge.icon}
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  {badge.name}
                  {badge.earned && <Badge variant="secondary" className="bg-green-100 text-green-800">Earned!</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{badge.description}</p>
                {badge.earned ? (
                  <Button 
                    variant="outline" 
                    className="w-full border-green-500 text-green-700 hover:bg-green-50"
                    data-testid={`button-view-${badge.id}`}
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled
                    data-testid={`button-locked-${badge.id}`}
                  >
                    🔒 Locked
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">Keep coding to unlock more badges!</h2>
          <p className="text-muted-foreground mb-6">
            Complete lessons, help others, and share projects to earn achievement badges.
          </p>
          <Button size="lg" data-testid="button-continue-learning">
            Continue Learning
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}