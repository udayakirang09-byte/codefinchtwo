import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';

export default function CancellationPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cancellation & Refund Policy</h1>
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
                <RefreshCw className="h-5 w-5" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                At TechLearnOrbit, we understand that plans can change. This policy outlines our cancellation and refund procedures 
                for both students and teachers to ensure fairness and transparency for all parties involved.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Cancellation Windows
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">For Students:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>
                    <strong>More than 24 hours before class:</strong> Full refund (100%) processed within 5-7 business days
                  </li>
                  <li>
                    <strong>12-24 hours before class:</strong> 50% refund processed within 5-7 business days
                  </li>
                  <li>
                    <strong>Less than 12 hours before class:</strong> No refund available
                  </li>
                  <li>
                    <strong>Demo classes:</strong> Can be rescheduled once at no additional cost
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">For Teachers:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>
                    <strong>More than 48 hours before class:</strong> Cancellation allowed with no penalty
                  </li>
                  <li>
                    <strong>24-48 hours before class:</strong> Warning issued, student receives full refund
                  </li>
                  <li>
                    <strong>Less than 24 hours before class:</strong> Account review may be initiated, student receives full refund
                  </li>
                  <li>
                    <strong>Repeated cancellations:</strong> May result in account suspension or termination
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Automatic Cancellation Scenarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 mb-3">
                TechLearnOrbit's AI-powered monitoring system may automatically cancel classes in the following situations:
              </p>
              <div className="space-y-3">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Teacher No-Show
                  </h4>
                  <p className="text-red-800 text-sm">
                    If teacher doesn't join within 15 minutes of scheduled time, class is automatically cancelled 
                    and student receives full refund within 72 hours.
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Connectivity Issues
                  </h4>
                  <p className="text-yellow-800 text-sm">
                    Severe network problems affecting class quality may result in automatic cancellation 
                    with prorated refund based on class duration completed.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Low Presence Detection
                  </h4>
                  <p className="text-blue-800 text-sm">
                    If student appears inactive or disconnected for extended periods, system may cancel 
                    the session and issue appropriate refund.
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Short Session
                  </h4>
                  <p className="text-purple-800 text-sm">
                    Classes ending before 50% of scheduled duration may be flagged for review and potential 
                    partial refund.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Refund Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Timeline:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Automatic cancellations: Refund initiated within 72 hours</li>
                  <li>Student-initiated cancellations: 5-7 business days</li>
                  <li>Teacher-initiated cancellations: Immediate refund processing</li>
                  <li>Disputed cancellations: Up to 14 business days for review and resolution</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Refund Method:</h4>
                <p className="text-gray-700">
                  Refunds are processed back to the original payment method used during booking. 
                  For UPI and other instant payment methods, refunds typically appear within 3-5 business days. 
                  For credit/debit cards, it may take 7-10 business days depending on your bank.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Course Cancellations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                For multi-class course enrollments, cancellation policies are slightly different:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  <strong>Before course starts:</strong> Full refund minus processing fee (5%)
                </li>
                <li>
                  <strong>Within first week:</strong> Prorated refund for remaining classes
                </li>
                <li>
                  <strong>After 25% completion:</strong> No refund for remaining classes
                </li>
                <li>
                  <strong>Teacher cancels course:</strong> Full refund for all remaining classes
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Rescheduling Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Students:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Can reschedule up to 24 hours before class at no charge</li>
                  <li>Demo classes can be rescheduled once for free</li>
                  <li>Multiple rescheduling requests may incur a small fee</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Teachers:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Must reschedule at least 48 hours in advance when possible</li>
                  <li>Emergency rescheduling requires admin approval</li>
                  <li>Students must approve new time slot</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you have questions about our cancellation and refund policy, or need assistance with a specific case:
              </p>
              <Link href="/help">
                <Button data-testid="button-contact-support">
                  Contact Support
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4 pt-6">
            <Link href="/terms">
              <Button variant="outline" data-testid="button-terms">
                View Terms of Service
              </Button>
            </Link>
            <Link href="/privacy">
              <Button variant="outline" data-testid="button-privacy">
                View Privacy Policy
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
