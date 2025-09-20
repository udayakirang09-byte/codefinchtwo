import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TestTube, 
  CheckCircle, 
  XCircle,
  Clock,
  Play,
  Search,
  Filter,
  Home,
  Bug
} from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';

export default function TestManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Unit Test Cases Data
  const unitTests = [
    {
      id: 1,
      uiPage: "login.tsx",
      buttonOrLink: "Sign In Button",
      testCase: "should authenticate user with valid credentials",
      status: "passed",
      lastRun: "2025-08-29 18:30:00"
    },
    {
      id: 2,
      uiPage: "login.tsx",
      buttonOrLink: "Forgot Password Link",
      testCase: "should redirect to password reset page",
      status: "passed",
      lastRun: "2025-08-29 18:30:00"
    },
    {
      id: 3,
      uiPage: "signup.tsx",
      buttonOrLink: "Create Account Button",
      testCase: "should create new user account",
      status: "failed",
      lastRun: "2025-08-29 18:30:00"
    },
    {
      id: 4,
      uiPage: "signup.tsx",
      buttonOrLink: "Role Selector",
      testCase: "should show mentor qualification fields",
      status: "passed",
      lastRun: "2025-08-29 18:30:00"
    },
    {
      id: 5,
      uiPage: "home.tsx",
      buttonOrLink: "Search Button",
      testCase: "should filter mentors by search term",
      status: "passed",
      lastRun: "2025-08-29 18:30:00"
    },
    {
      id: 6,
      uiPage: "mentor-card.tsx",
      buttonOrLink: "Book Session Button",
      testCase: "should navigate to booking page",
      status: "passed",
      lastRun: "2025-08-29 18:30:00"
    },
    {
      id: 7,
      uiPage: "booking.tsx",
      buttonOrLink: "Confirm Booking Button",
      testCase: "should create booking with valid data",
      status: "failed",
      lastRun: "2025-08-29 18:30:00"
    },
    {
      id: 8,
      uiPage: "payment.tsx",
      buttonOrLink: "Pay Now Button",
      testCase: "should process payment successfully",
      status: "passed",
      lastRun: "2025-08-29 18:30:00"
    },
    {
      id: 9,
      uiPage: "video-chat.tsx",
      buttonOrLink: "Start Video Button",
      testCase: "should initialize video call",
      status: "pending",
      lastRun: "2025-08-29 18:30:00"
    },
    {
      id: 10,
      uiPage: "chat.tsx",
      buttonOrLink: "Send Message Button",
      testCase: "should send chat message",
      status: "passed",
      lastRun: "2025-08-29 18:30:00"
    },
    {
      id: 11,
      uiPage: "mentor-profile.tsx",
      buttonOrLink: "Submit Review Button",
      testCase: "should submit mentor review",
      status: "passed",
      lastRun: "2025-08-29 18:30:00"
    },
    {
      id: 12,
      uiPage: "analytics.tsx",
      buttonOrLink: "Run AI Analysis Button",
      testCase: "should generate AI insights",
      status: "failed",
      lastRun: "2025-08-29 18:30:00"
    },
    {
      id: 13,
      uiPage: "cloud-deployments.tsx",
      buttonOrLink: "Deploy to Cloud Button",
      testCase: "should deploy to selected provider",
      status: "pending",
      lastRun: "2025-08-29 18:30:00"
    },
    {
      id: 14,
      uiPage: "user-management.tsx",
      buttonOrLink: "Delete User Button",
      testCase: "should delete user account",
      status: "passed",
      lastRun: "2025-08-29 18:30:00"
    },
    {
      id: 15,
      uiPage: "achievement-badges.tsx",
      buttonOrLink: "Earn Badge Button",
      testCase: "should award achievement badge",
      status: "passed",
      lastRun: "2025-08-29 18:30:00"
    }
  ];

  // System Test Cases Data
  const systemTests = [
    {
      id: 1,
      uiPage: "Complete User Flow",
      buttonOrLink: "End-to-End Registration",
      testCase: "should complete full user registration to first session",
      status: "passed",
      lastRun: "2025-08-29 17:45:00"
    },
    {
      id: 2,
      uiPage: "Booking Flow",
      buttonOrLink: "Book and Pay Workflow",
      testCase: "should complete booking with payment",
      status: "failed",
      lastRun: "2025-08-29 17:45:00"
    },
    {
      id: 3,
      uiPage: "Session Flow",
      buttonOrLink: "Video Call Integration",
      testCase: "should conduct complete video session",
      status: "passed",
      lastRun: "2025-08-29 17:45:00"
    },
    {
      id: 4,
      uiPage: "Chat System",
      buttonOrLink: "Real-time Messaging",
      testCase: "should send and receive messages in real-time",
      status: "passed",
      lastRun: "2025-08-29 17:45:00"
    },
    {
      id: 5,
      uiPage: "Payment Integration",
      buttonOrLink: "Stripe Integration",
      testCase: "should process payments through Stripe",
      status: "failed",
      lastRun: "2025-08-29 17:45:00"
    },
    {
      id: 6,
      uiPage: "Admin Dashboard",
      buttonOrLink: "Analytics Dashboard",
      testCase: "should display AI analytics correctly",
      status: "passed",
      lastRun: "2025-08-29 17:45:00"
    },
    {
      id: 7,
      uiPage: "Cloud Deployment",
      buttonOrLink: "Multi-cloud Deploy",
      testCase: "should deploy to AWS, Azure, GCP",
      status: "pending",
      lastRun: "2025-08-29 17:45:00"
    },
    {
      id: 8,
      uiPage: "Performance Testing",
      buttonOrLink: "Load Testing",
      testCase: "should handle 3k concurrent users",
      status: "pending",
      lastRun: "2025-08-29 17:45:00"
    },
    {
      id: 9,
      uiPage: "Security Testing",
      buttonOrLink: "Authentication Security",
      testCase: "should prevent unauthorized access",
      status: "passed",
      lastRun: "2025-08-29 17:45:00"
    },
    {
      id: 10,
      uiPage: "Data Migration",
      buttonOrLink: "Database Operations",
      testCase: "should migrate data without loss",
      status: "passed",
      lastRun: "2025-08-29 17:45:00"
    },
    {
      id: 11,
      uiPage: "Email System",
      buttonOrLink: "Password Reset Email",
      testCase: "should send password reset emails",
      status: "failed",
      lastRun: "2025-08-29 17:45:00"
    },
    {
      id: 12,
      uiPage: "Notification System",
      buttonOrLink: "Push Notifications",
      testCase: "should send notifications correctly",
      status: "passed",
      lastRun: "2025-08-29 17:45:00"
    }
  ];

  const filterTests = (tests: any[]) => {
    return tests.filter(test => {
      const matchesSearch = searchTerm === '' || 
        Object.values(test).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesStatus = statusFilter === 'all' || test.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string): "outline" | "default" | "destructive" | "secondary" => {
    const variants: Record<string, "outline" | "default" | "destructive" | "secondary"> = {
      passed: 'default',
      failed: 'destructive', 
      pending: 'secondary'
    };
    return variants[status] || 'outline';
  };

  const getTestStats = (tests: any[]) => {
    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status === 'failed').length;
    const pending = tests.filter(t => t.status === 'pending').length;
    const total = tests.length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    return { passed, failed, pending, total, passRate };
  };

  const unitStats = getTestStats(unitTests);
  const systemStats = getTestStats(systemTests);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <TestTube className="h-8 w-8 text-green-600" />
              Test Case Management
            </h1>
            <p className="text-gray-600 mt-2">Monitor and manage unit tests and system tests across the application</p>
          </div>
          <Link href="/">
            <Button variant="outline" data-testid="button-home">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by page, button, or test case..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 bg-white"
              data-testid="select-status-filter"
            >
              <option value="all">All Status</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <Button data-testid="button-run-all-tests">
            <Play className="w-4 h-4 mr-2" />
            Run All Tests
          </Button>
        </div>

        <Tabs defaultValue="unit-tests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unit-tests">Unit Tests</TabsTrigger>
            <TabsTrigger value="system-tests">System Tests</TabsTrigger>
          </TabsList>

          {/* Unit Tests Tab */}
          <TabsContent value="unit-tests" className="space-y-6">
            {/* Unit Test Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                  <TestTube className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="unit-total-tests">{unitStats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Passed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600" data-testid="unit-passed-tests">{unitStats.passed}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600" data-testid="unit-failed-tests">{unitStats.failed}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600" data-testid="unit-pending-tests">{unitStats.pending}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                  <Bug className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="unit-pass-rate">{unitStats.passRate}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Unit Tests Table */}
            <Card>
              <CardHeader>
                <CardTitle>Unit Test Cases</CardTitle>
                <CardDescription>Individual component and function tests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold">UI Page</th>
                        <th className="text-left p-3 font-semibold">Button/Link</th>
                        <th className="text-left p-3 font-semibold">Unit Test Case</th>
                        <th className="text-left p-3 font-semibold">Status</th>
                        <th className="text-left p-3 font-semibold">Last Run</th>
                        <th className="text-left p-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterTests(unitTests).map((test, index) => (
                        <tr key={test.id} className="border-b hover:bg-gray-50" data-testid={`unit-test-${index}`}>
                          <td className="p-3 font-medium" data-testid={`unit-page-${index}`}>
                            {test.uiPage}
                          </td>
                          <td className="p-3" data-testid={`unit-button-${index}`}>
                            {test.buttonOrLink}
                          </td>
                          <td className="p-3" data-testid={`unit-case-${index}`}>
                            {test.testCase}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(test.status)}
                              <Badge variant={getStatusBadge(test.status)} data-testid={`unit-status-${index}`}>
                                {test.status}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-gray-600" data-testid={`unit-last-run-${index}`}>
                            {test.lastRun}
                          </td>
                          <td className="p-3">
                            <Button size="sm" variant="outline" data-testid={`unit-run-${index}`}>
                              <Play className="w-3 h-3 mr-1" />
                              Run
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tests Tab */}
          <TabsContent value="system-tests" className="space-y-6">
            {/* System Test Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                  <TestTube className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="system-total-tests">{systemStats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Passed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600" data-testid="system-passed-tests">{systemStats.passed}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600" data-testid="system-failed-tests">{systemStats.failed}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600" data-testid="system-pending-tests">{systemStats.pending}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                  <Bug className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="system-pass-rate">{systemStats.passRate}%</div>
                </CardContent>
              </Card>
            </div>

            {/* System Tests Table */}
            <Card>
              <CardHeader>
                <CardTitle>System Test Cases</CardTitle>
                <CardDescription>End-to-end integration and workflow tests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold">UI Page</th>
                        <th className="text-left p-3 font-semibold">Button/Link</th>
                        <th className="text-left p-3 font-semibold">System Test Case</th>
                        <th className="text-left p-3 font-semibold">Status</th>
                        <th className="text-left p-3 font-semibold">Last Run</th>
                        <th className="text-left p-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterTests(systemTests).map((test, index) => (
                        <tr key={test.id} className="border-b hover:bg-gray-50" data-testid={`system-test-${index}`}>
                          <td className="p-3 font-medium" data-testid={`system-page-${index}`}>
                            {test.uiPage}
                          </td>
                          <td className="p-3" data-testid={`system-button-${index}`}>
                            {test.buttonOrLink}
                          </td>
                          <td className="p-3" data-testid={`system-case-${index}`}>
                            {test.testCase}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(test.status)}
                              <Badge variant={getStatusBadge(test.status)} data-testid={`system-status-${index}`}>
                                {test.status}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-gray-600" data-testid={`system-last-run-${index}`}>
                            {test.lastRun}
                          </td>
                          <td className="p-3">
                            <Button size="sm" variant="outline" data-testid={`system-run-${index}`}>
                              <Play className="w-3 h-3 mr-1" />
                              Run
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}