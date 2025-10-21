import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { BookOpen, Users, Award, MessageCircle, Calendar, DollarSign } from "lucide-react";

export default function TeacherResources() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="title-teacher-resources">
            Teacher Resources
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to become a successful coding mentor on TechLearnOrbit
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Teaching Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Access our comprehensive library of coding exercises, project templates, and lesson plans.
              </p>
              <Button data-testid="button-teaching-materials">Browse Materials</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>Student Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Tools to track student progress, manage schedules, and communicate effectively.
              </p>
              <Button data-testid="button-student-management">Learn More</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Award className="w-12 h-12 text-purple-600 mb-4" />
              <CardTitle>Mentor Certification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Get certified as a TechLearnOrbit mentor with our training program.
              </p>
              <Button data-testid="button-certification">Get Certified</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageCircle className="w-12 h-12 text-orange-600 mb-4" />
              <CardTitle>Communication Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Best practices for teaching young students and maintaining engagement.
              </p>
              <Button data-testid="button-communication-tips">Read Tips</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Calendar className="w-12 h-12 text-teal-600 mb-4" />
              <CardTitle>Schedule Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Optimize your teaching schedule and maximize your earning potential.
              </p>
              <Button data-testid="button-schedule-management">Manage Schedule</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <DollarSign className="w-12 h-12 text-red-600 mb-4" />
              <CardTitle>Earnings Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Learn how to increase your earnings and build a successful teaching practice.
              </p>
              <Button data-testid="button-earnings-guide">View Guide</Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Quick Start Guide</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Complete Your Profile</h3>
                <p className="text-gray-600">Set up your mentor profile with your skills, experience, and availability.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Set Your Schedule</h3>
                <p className="text-gray-600">Define when you're available to teach and set your hourly rates.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">Start Teaching</h3>
                <p className="text-gray-600">Accept booking requests and begin your mentoring journey!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}