import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, BookOpen, Users, Calendar } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function PaymentSuccess() {
  const [location] = useLocation();
  const [courseData, setCourseData] = useState<any>(null);
  
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const courseId = urlParams.get('course') || '1';

  useEffect(() => {
    // Course data (in real app, fetch from API)
    const courses = [
      {
        id: '1',
        title: "Python for Kids",
        price: 2999,
        duration: "8 weeks",
        nextClass: "Tomorrow at 4:00 PM"
      },
      {
        id: '2', 
        title: "Web Development Basics",
        price: 3999,
        duration: "10 weeks",
        nextClass: "Monday at 6:00 PM"
      },
      {
        id: '3',
        title: "Scratch Programming", 
        price: 2499,
        duration: "6 weeks",
        nextClass: "Wednesday at 5:00 PM"
      }
    ];

    const course = courses.find(c => c.id === courseId) || courses[0];
    setCourseData(course);
  }, [courseId]);

  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-800 mb-2">
            Payment Successful! 🎉
          </CardTitle>
          <p className="text-green-600 text-lg">
            Welcome to {courseData.title}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-green-200">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Enrollment Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Course:</span>
                <span className="font-semibold">{courseData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold">{courseData.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-green-600">₹{courseData.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Class:</span>
                <span className="font-semibold text-blue-600">{courseData.nextClass}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <h3 className="font-bold text-lg mb-4 text-blue-800">What happens next?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <p className="text-blue-700">Check your email for course access details and joining instructions</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <p className="text-blue-700">Join our student community and meet your fellow learners</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <p className="text-blue-700">Get ready for your first class - we'll send reminders!</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              asChild
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              data-testid="button-dashboard"
            >
              <Link href="/">
                <BookOpen className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
            <Button 
              variant="outline" 
              asChild
              className="flex-1 h-12 border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
              data-testid="button-community"
            >
              <Link href="/#community">
                <Users className="h-4 w-4 mr-2" />
                Join Community
              </Link>
            </Button>
            <Button 
              variant="outline" 
              asChild
              className="flex-1 h-12 border-2 border-green-600 text-green-600 hover:bg-green-50"
              data-testid="button-more-courses"
            >
              <Link href="/courses">
                <Calendar className="h-4 w-4 mr-2" />
                More Courses
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}