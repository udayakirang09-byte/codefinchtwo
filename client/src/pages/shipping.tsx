import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Package } from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';

export default function Shipping() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shipping Policy</h1>
            <p className="text-gray-600 mt-2">Last updated: January 2025</p>
          </div>
          <Link href="/">
            <Button variant="outline" data-testid="button-home">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Digital Service - No Physical Shipping
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              TechLearnOrbit is a digital educational platform that provides online mentorship and learning sessions. 
              As all our services are delivered electronically through our web platform, we do not ship any physical products.
            </p>
            <p className="text-gray-700">
              All course materials, session recordings, and educational content are accessible immediately through your 
              account dashboard upon enrollment or class completion.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4 pt-6">
          <Link href="/terms">
            <Button variant="outline" data-testid="button-terms">
              View Terms of Service
            </Button>
          </Link>
          <Link href="/cancellation-policy">
            <Button variant="outline" data-testid="button-cancellation">
              Cancellation & Refund Policy
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
