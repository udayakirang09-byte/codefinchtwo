import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Courses() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/courses"]
  });

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="text-courses-title">
            Browse <span className="text-gradient">Coding Courses</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-courses-description">
            Structured learning paths designed specifically for young coders. Learn at your own pace with expert guidance.
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.isArray(courses) ? courses.map((course: any) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`course-card-${course.id}`}>
              <div className="relative">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <Badge className="absolute top-4 left-4" variant="secondary">
                  {course.difficulty}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl" data-testid={`course-title-${course.id}`}>
                  {course.title}
                </CardTitle>
                <p className="text-muted-foreground" data-testid={`course-description-${course.id}`}>
                  {course.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <div className="flex items-center" data-testid={`course-duration-${course.id}`}>
                      <Clock size={16} className="mr-1" />
                      {course.duration}
                    </div>
                    <div className="flex items-center" data-testid={`course-mentor-${course.id}`}>
                      <User size={16} className="mr-1" />
                      {course.mentor?.user?.firstName} {course.mentor?.user?.lastName}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center" data-testid={`course-category-${course.id}`}>
                      <Badge variant="outline" className="text-xs">
                        {course.category}
                      </Badge>
                    </div>
                    <div className="flex items-center" data-testid={`course-mentor-title-${course.id}`}>
                      <span className="text-blue-600 font-medium">
                        {course.mentor?.title}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600">₹{course.price}</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Best Value
                    </Badge>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-11 text-base font-semibold shadow-lg" 
                  data-testid={`button-enroll-${course.id}`}
                  onClick={() => {
                    console.log(`🛒 Enrolling in course ${course.id}: ${course.title}`);
                    window.location.href = `/booking/${course.mentorId}?courseId=${course.id}`;
                  }}
                >
                  Enroll Now - ₹{course.price}
                </Button>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No courses available at the moment.</p>
            </div>
          )}
          </div>
        )}

        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">Can't find what you're looking for?</h2>
          <p className="text-muted-foreground mb-6">
            Work with one of our mentors to create a custom learning path just for you.
          </p>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => {
              console.log('Find a Mentor button clicked');
              window.location.href = '/#discover';
            }}
            data-testid="button-find-mentor"
          >
            Find a Mentor
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}