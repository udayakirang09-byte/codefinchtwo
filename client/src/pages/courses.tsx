import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star } from "lucide-react";

export default function Courses() {
  const courses = [
    {
      id: 1,
      title: "Python for Kids",
      description: "Learn Python programming through fun games and projects",
      duration: "8 weeks",
      students: 245,
      rating: 4.8,
      difficulty: "Beginner",
      price: 2999,
      image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?ixlib=rb-4.0.3&w=400&h=300&fit=crop"
    },
    {
      id: 2,
      title: "Web Development Basics",
      description: "Build your first website with HTML, CSS, and JavaScript",
      duration: "10 weeks",
      students: 189,
      rating: 4.9,
      difficulty: "Beginner",
      price: 3999,
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&w=400&h=300&fit=crop"
    },
    {
      id: 3,
      title: "Scratch Programming",
      description: "Create animations and games with block-based coding",
      duration: "6 weeks",
      students: 367,
      rating: 4.7,
      difficulty: "Beginner",
      price: 2499,
      image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&w=400&h=300&fit=crop"
    }
  ];

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
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
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center" data-testid={`course-duration-${course.id}`}>
                      <Clock size={16} className="mr-1" />
                      {course.duration}
                    </div>
                    <div className="flex items-center" data-testid={`course-students-${course.id}`}>
                      <Users size={16} className="mr-1" />
                      {course.students} students
                    </div>
                    <div className="flex items-center" data-testid={`course-rating-${course.id}`}>
                      <Star size={16} className="mr-1 text-accent" />
                      {course.rating}
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
                    window.location.href = `/checkout?courseId=${course.id}`;
                  }}
                >
                  Enroll Now - ₹{course.price}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

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