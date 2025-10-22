import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, FileText, Shield, Users, Scale } from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
            <p className="text-gray-600 mt-2">Last updated: January 2025</p>
          </div>
          <Link href="/">
            <Button variant="outline" data-testid="button-home">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                1. Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                By accessing and using TechLearnOrbit's platform, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
              <p className="text-gray-700">
                TechLearnOrbit is a platform that connects students with mentors for personalized learning experiences.
                We facilitate educational relationships and provide tools for effective learning.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                2. User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">For Students:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Attend scheduled sessions punctually</li>
                  <li>Respect mentors and maintain professional communication</li>
                  <li>Complete assigned homework and practice exercises</li>
                  <li>Provide honest feedback about learning experiences</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">For Mentors:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Deliver quality education and mentorship</li>
                  <li>Maintain professional behavior at all times</li>
                  <li>Honor scheduled sessions and cancellation policies</li>
                  <li>Protect student privacy and confidential information</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                3. Payment and Refund Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Payment Terms:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>All payments must be made in advance for sessions</li>
                  <li>We accept UPI, credit/debit cards, and net banking</li>
                  <li>Prices are clearly displayed before booking confirmation</li>
                  <li>Payment processing is secure and encrypted</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Refund Policy:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Full refund if session is cancelled by mentor</li>
                  <li>50% refund if cancelled 24+ hours in advance by student</li>
                  <li>No refund for no-shows or cancellations within 24 hours</li>
                  <li>Refunds processed within 5-7 business days</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                4. Platform Usage and Conduct
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Users must not engage in any activity that:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Violates any laws or regulations</li>
                <li>Infringes on intellectual property rights</li>
                <li>Contains harmful, offensive, or inappropriate content</li>
                <li>Attempts to circumvent our payment systems</li>
                <li>Harasses, threatens, or discriminates against others</li>
                <li>Shares login credentials or account access</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                All content on the TechLearnOrbit platform, including text, graphics, logos, and software, 
                is owned by TechLearnOrbit or its content suppliers and is protected by copyright and other intellectual property laws.
              </p>
              <p className="text-gray-700">
                Course materials created by mentors remain the intellectual property of the respective mentor, 
                but mentors grant TechLearnOrbit a license to use such materials on the platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                TechLearnOrbit serves as a platform connecting students and mentors. We are not responsible for:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>The quality of education provided by mentors</li>
                <li>Technical issues during video sessions</li>
                <li>Disputes between students and mentors</li>
                <li>Loss of data or interruption of service</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p>📧 Email: support@techlearnorbit.com</p>
                <p>📞 Phone: +91-9876543210</p>
                <p>🏢 Address: Tech Park, Bangalore, Karnataka, India</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-6">
            <Link href="/privacy">
              <Button variant="outline" data-testid="button-privacy-policy">
                View Privacy Policy
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}