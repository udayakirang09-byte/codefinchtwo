import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Shield, Database, Eye, Lock, UserCheck } from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
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
                <Shield className="h-5 w-5" />
                Our Commitment to Privacy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                At CodeConnect, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Personal Information:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Name, email address, and phone number</li>
                  <li>Profile picture and bio information</li>
                  <li>Payment information (processed securely)</li>
                  <li>Educational background and interests</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Usage Information:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Session attendance and duration</li>
                  <li>Learning progress and achievements</li>
                  <li>Communication records within the platform</li>
                  <li>Device information and IP addresses</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 mb-4">We use your information to:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Provide and improve our educational services</li>
                <li>Match students with appropriate mentors</li>
                <li>Process payments and manage billing</li>
                <li>Send important notifications and updates</li>
                <li>Analyze platform usage to enhance user experience</li>
                <li>Ensure platform security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Data Security and Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Security Measures:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>End-to-end encryption for sensitive data</li>
                  <li>Secure payment processing via trusted providers</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Access controls and authentication protocols</li>
                  <li>Data backup and disaster recovery procedures</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Retention:</h4>
                <p className="text-gray-700">
                  We retain your personal information only as long as necessary to provide our services and comply with legal obligations. 
                  You may request deletion of your account and associated data at any time.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Your Rights and Choices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Access and review your personal information</li>
                <li>Correct or update inaccurate data</li>
                <li>Delete your account and personal data</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of marketing communications</li>
                <li>Restrict certain data processing activities</li>
                <li>File complaints with data protection authorities</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Information Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties except:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>With your explicit consent</li>
                <li>To trusted service providers who assist in platform operations</li>
                <li>When required by law or legal process</li>
                <li>To protect the rights, property, or safety of CodeConnect or others</li>
                <li>In connection with business transfers or acquisitions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to enhance your experience on our platform:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Essential cookies for platform functionality</li>
                <li>Analytics cookies to understand usage patterns</li>
                <li>Preference cookies to remember your settings</li>
                <li>Marketing cookies for relevant advertisements (with consent)</li>
              </ul>
              <p className="text-gray-700 mt-4">
                You can control cookie preferences through your browser settings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                CodeConnect is designed for educational purposes and serves students of various ages. 
                For users under 13, we require parental consent and implement additional privacy protections 
                in compliance with applicable children's privacy laws.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                For privacy-related questions or to exercise your rights, contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p>📧 Privacy Officer: privacy@codeconnect.com</p>
                <p>📞 Phone: +91-9876543210</p>
                <p>🏢 Address: Tech Park, Bangalore, Karnataka, India</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4 pt-6">
            <Link href="/terms">
              <Button variant="outline" data-testid="button-terms-of-service">
                View Terms of Service
              </Button>
            </Link>
            <Button 
              onClick={() => alert('Cookie preferences panel will open here. This feature manages your privacy settings and cookie choices.')}
              data-testid="button-cookie-preferences"
            >
              Cookie Preferences
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}