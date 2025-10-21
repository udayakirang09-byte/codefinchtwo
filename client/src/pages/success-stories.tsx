import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Star, Quote } from "lucide-react";

export default function SuccessStories() {
  const stories = [
    {
      id: 1,
      student: "Alex Chen",
      mentor: "Sarah Johnson",
      title: "From Zero to Full-Stack Developer",
      story: "Started with no prior experience on this subject, now building web applications after 6 months of mentoring.",
      rating: 5,
      achievement: "Built first full-stack application",
      avatar: "/placeholder-avatar.jpg"
    },
    {
      id: 2,
      student: "Emma Williams",
      mentor: "David Martinez",
      title: "Competition Winner",
      story: "Won the regional learning competition after intensive Python tutoring sessions.",
      rating: 5,
      achievement: "1st place in state learning competition",
      avatar: "/placeholder-avatar.jpg"
    },
    {
      id: 3,
      student: "Ryan Kumar",
      mentor: "Lisa Thompson",
      title: "Scholarship Success",
      story: "Earned a computer science scholarship to MIT with help from my mentor.",
      rating: 5,
      achievement: "MIT Computer Science Scholarship",
      avatar: "/placeholder-avatar.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="title-success-stories">
            Success Stories
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Inspiring journeys of students who achieved their learning dreams with the help of our mentors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {stories.map((story) => (
            <Card key={story.id} className="hover:shadow-lg transition-shadow" data-testid={`story-card-${story.id}`}>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={story.avatar} alt={story.student} />
                    <AvatarFallback>{story.student.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{story.title}</CardTitle>
                    <p className="text-sm text-gray-600">Student: {story.student}</p>
                    <p className="text-sm text-gray-600">Mentor: {story.mentor}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-3">
                  {Array.from({ length: story.rating }, (_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                  ))}
                </div>
                
                <div className="relative mb-4">
                  <Quote className="absolute top-0 left-0 w-6 h-6 text-gray-300" />
                  <p className="italic text-gray-700 pl-8">{story.story}</p>
                </div>
                
                <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                  🏆 {story.achievement}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" data-testid="button-share-story">
            Share Your Success Story
          </Button>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}