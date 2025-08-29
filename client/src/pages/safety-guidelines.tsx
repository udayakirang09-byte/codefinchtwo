import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Shield, AlertTriangle, Eye, MessageCircle, Clock, Phone } from "lucide-react";

export default function SafetyGuidelines() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="title-safety-guidelines">
            Safety Guidelines
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our commitment to creating a safe learning environment for all students and mentors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="border-l-4 border-green-500">
            <CardHeader>
              <Shield className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>For Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">Never share personal information like home address or phone number</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">All sessions are monitored and recorded for safety</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">Report any inappropriate behavior immediately</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">Parents should supervise sessions for students under 13</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-blue-500">
            <CardHeader>
              <Eye className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>For Mentors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">Maintain professional boundaries at all times</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">Use only approved communication channels</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">Background checks required for all mentors</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">Report safety concerns to our moderation team</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <MessageCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <CardTitle>Safe Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                All messages are monitored for safety. Our AI systems detect and flag inappropriate content.
              </p>
              <Button data-testid="button-communication-guidelines">View Guidelines</Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Clock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <CardTitle>Session Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                All video and chat sessions are recorded and can be reviewed by our safety team.
              </p>
              <Button data-testid="button-monitoring-info">Learn More</Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Phone className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <CardTitle>24/7 Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Our safety team is available around the clock to handle reports and concerns.
              </p>
              <Button data-testid="button-contact-support">Contact Support</Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Emergency Reporting</h3>
              <p className="text-red-800 mb-4">
                If you experience or witness any inappropriate behavior, harassment, or safety concerns, 
                please report it immediately using one of these methods:
              </p>
              <div className="space-y-2">
                <Button variant="destructive" size="sm" data-testid="button-report-incident">
                  Report Incident Now
                </Button>
                <p className="text-sm text-red-700">
                  Emergency hotline: 1-800-SAFE-CODE (available 24/7)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}