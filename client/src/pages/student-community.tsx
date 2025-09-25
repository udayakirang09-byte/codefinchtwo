import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, Trophy, Calendar } from "lucide-react";
import { Link } from "wouter";

export default function StudentCommunity() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="text-community-title">
            Student <span className="text-gradient">Community</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-community-description">
            Connect with fellow young coders, share projects, and learn together in our supportive community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow" data-testid="card-discussion">
            <CardHeader>
              <MessageSquare className="mx-auto text-blue-600 mb-4" size={48} />
              <CardTitle>Discussion Forums</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Ask questions, share tips, and help each other learn
              </p>
              <Badge variant="secondary" className="mb-4">1,245 active students</Badge>
              <Button className="w-full" asChild data-testid="button-join-forums">
                <Link href="/forums">Join Forums</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow" data-testid="card-projects">
            <CardHeader>
              <Trophy className="mx-auto text-purple-600 mb-4" size={48} />
              <CardTitle>Project Showcase</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Show off your coding projects and get feedback
              </p>
              <Badge variant="secondary" className="mb-4">892 projects shared</Badge>
              <Button className="w-full" asChild data-testid="button-share-project">
                <Link href="/projects">Share Project</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow" data-testid="card-events">
            <CardHeader>
              <Calendar className="mx-auto text-green-600 mb-4" size={48} />
              <CardTitle>Community Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Join coding challenges, workshops, and meetups
              </p>
              <Badge variant="secondary" className="mb-4">Next event: Tomorrow</Badge>
              <Button className="w-full" asChild data-testid="button-view-events">
                <Link href="/events">View Events</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to join our community?</h2>
          <p className="text-muted-foreground mb-6">
            Connect with thousands of young coders and accelerate your learning journey.
          </p>
          <Button size="lg" data-testid="button-join-community">
            <Users className="mr-2 h-5 w-5" />
            Join Community Now
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}