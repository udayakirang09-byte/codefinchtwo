import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Code2, 
  Database, 
  Globe,
  Server,
  FileCode,
  Search,
  Filter,
  Home
} from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';

export default function CodeMapping() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Application component mapping data
  const mappingData = [
    {
      id: 1,
      functionName: "User Authentication",
      htmlPage: "login.tsx",
      jsFilename: "auth.ts",
      jsFunction: "handleLogin()",
      apiName: "/api/auth/login",
      dbTable: "users",
      category: "Authentication"
    },
    {
      id: 2,
      functionName: "Mentor Registration",
      htmlPage: "signup.tsx",
      jsFilename: "signup.tsx",
      jsFunction: "handleSignup()",
      apiName: "/api/auth/register",
      dbTable: "users, mentors, teacher_qualifications, teacher_subjects",
      category: "Registration"
    },
    {
      id: 3,
      functionName: "Mentor Discovery",
      htmlPage: "home.tsx",
      jsFilename: "mentor-card.tsx",
      jsFunction: "MentorCard()",
      apiName: "/api/mentors",
      dbTable: "mentors, users, reviews",
      category: "Discovery"
    },
    {
      id: 4,
      functionName: "Booking System",
      htmlPage: "booking.tsx",
      jsFilename: "booking.tsx", 
      jsFunction: "createBooking()",
      apiName: "/api/bookings",
      dbTable: "bookings, students, mentors",
      category: "Booking"
    },
    {
      id: 5,
      functionName: "Payment Processing",
      htmlPage: "payment.tsx",
      jsFilename: "payment.tsx",
      jsFunction: "processPayment()",
      apiName: "/api/payments/create-intent",
      dbTable: "bookings, payments",
      category: "Payment"
    },
    {
      id: 6,
      functionName: "Video Chat Session",
      htmlPage: "video-chat.tsx",
      jsFilename: "video-chat.tsx",
      jsFunction: "initializeVideoCall()",
      apiName: "/api/video/create-room",
      dbTable: "video_sessions, bookings",
      category: "Communication"
    },
    {
      id: 7,
      functionName: "Text Chat System",
      htmlPage: "chat.tsx",
      jsFilename: "chat.tsx",
      jsFunction: "sendMessage()",
      apiName: "/api/chat/messages",
      dbTable: "chat_sessions, chat_messages",
      category: "Communication"
    },
    {
      id: 8,
      functionName: "Review System",
      htmlPage: "mentor-profile.tsx",
      jsFilename: "review-form.tsx",
      jsFunction: "submitReview()",
      apiName: "/api/reviews",
      dbTable: "reviews, students, mentors",
      category: "Review"
    },
    {
      id: 9,
      functionName: "Achievement Badges",
      htmlPage: "achievement-badges.tsx",
      jsFilename: "achievement-badges.tsx",
      jsFunction: "earnAchievement()",
      apiName: "/api/achievements",
      dbTable: "achievements, students",
      category: "Gamification"
    },
    {
      id: 10,
      functionName: "Admin User Management",
      htmlPage: "user-management.tsx",
      jsFilename: "user-management.tsx",
      jsFunction: "manageUsers()",
      apiName: "/api/admin/users",
      dbTable: "users, mentors, students",
      category: "Admin"
    },
    {
      id: 11,
      functionName: "AI Analytics Engine",
      htmlPage: "analytics.tsx",
      jsFilename: "ai-analytics.ts",
      jsFunction: "generateInsights()",
      apiName: "/api/admin/ai-insights",
      dbTable: "analytics_events, user_behavior_patterns, business_metrics",
      category: "Analytics"
    },
    {
      id: 12,
      functionName: "Cloud Deployment",
      htmlPage: "cloud-deployments.tsx",
      jsFilename: "cloud-deployments.tsx",
      jsFunction: "deployToCloud()",
      apiName: "/api/admin/deploy/{provider}",
      dbTable: "cloud_deployments",
      category: "Infrastructure"
    },
    {
      id: 13,
      functionName: "Course Creation",
      htmlPage: "create-course.tsx",
      jsFilename: "create-course.tsx",
      jsFunction: "createCourse()",
      apiName: "/api/courses",
      dbTable: "courses, mentors",
      category: "Education"
    },
    {
      id: 14,
      functionName: "Schedule Management",
      htmlPage: "manage-schedule.tsx",
      jsFilename: "schedule-calendar.tsx",
      jsFunction: "updateAvailability()",
      apiName: "/api/mentors/schedule",
      dbTable: "mentors, available_slots",
      category: "Scheduling"
    },
    {
      id: 15,
      functionName: "Notification System",
      htmlPage: "notifications.tsx",
      jsFilename: "notification-service.ts",
      jsFunction: "sendNotification()",
      apiName: "/api/notifications",
      dbTable: "notifications, users",
      category: "Communication"
    },
    {
      id: 16,
      functionName: "Password Reset",
      htmlPage: "forgot-password.tsx",
      jsFilename: "auth.ts",
      jsFunction: "resetPassword()",
      apiName: "/api/auth/forgot-password",
      dbTable: "users, password_resets",
      category: "Authentication"
    },
    {
      id: 17,
      functionName: "Chat Analytics",
      htmlPage: "analytics.tsx",
      jsFilename: "chat-analytics.tsx",
      jsFunction: "analyzeChatSentiment()",
      apiName: "/api/admin/chat-analytics",
      dbTable: "chat_analytics, chat_messages",
      category: "Analytics"
    },
    {
      id: 18,
      functionName: "Compliance Monitoring",
      htmlPage: "analytics.tsx",
      jsFilename: "compliance.ts",
      jsFunction: "checkCompliance()",
      apiName: "/api/admin/compliance-monitoring",
      dbTable: "compliance_monitoring, users",
      category: "Compliance"
    },
    {
      id: 19,
      functionName: "Technology Stack Monitor",
      htmlPage: "analytics.tsx",
      jsFilename: "tech-monitor.ts",
      jsFunction: "monitorTechStack()",
      apiName: "/api/admin/technology-stack",
      dbTable: "technology_stack",
      category: "Infrastructure"
    },
    {
      id: 20,
      functionName: "Quantum Computing Tasks",
      htmlPage: "analytics.tsx",
      jsFilename: "quantum-computing.ts",
      jsFunction: "processQuantumTasks()",
      apiName: "/api/admin/quantum-tasks",
      dbTable: "quantum_tasks",
      category: "Advanced"
    }
  ];

  const categories = ['all', ...Array.from(new Set(mappingData.map(item => item.category)))];
  
  const filteredData = mappingData.filter(item => {
    const matchesSearch = searchTerm === '' || 
      Object.values(item).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Authentication': 'bg-red-100 text-red-800',
      'Registration': 'bg-blue-100 text-blue-800',
      'Discovery': 'bg-green-100 text-green-800',
      'Booking': 'bg-purple-100 text-purple-800',
      'Payment': 'bg-yellow-100 text-yellow-800',
      'Communication': 'bg-indigo-100 text-indigo-800',
      'Review': 'bg-pink-100 text-pink-800',
      'Gamification': 'bg-orange-100 text-orange-800',
      'Admin': 'bg-gray-100 text-gray-800',
      'Analytics': 'bg-teal-100 text-teal-800',
      'Infrastructure': 'bg-cyan-100 text-cyan-800',
      'Education': 'bg-lime-100 text-lime-800',
      'Scheduling': 'bg-violet-100 text-violet-800',
      'Compliance': 'bg-rose-100 text-rose-800',
      'Advanced': 'bg-emerald-100 text-emerald-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Code2 className="h-8 w-8 text-blue-600" />
              Application Code Mapping
            </h1>
            <p className="text-gray-600 mt-2">Comprehensive mapping of application components, functions, and database relationships</p>
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
              placeholder="Search by function name, file, API, or table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border rounded-md px-3 py-2 bg-white"
              data-testid="select-category-filter"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Functions</CardTitle>
              <Code2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-functions">{mappingData.length}</div>
              <p className="text-xs text-muted-foreground">Application features</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Endpoints</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-apis">{new Set(mappingData.map(item => item.apiName)).size}</div>
              <p className="text-xs text-muted-foreground">Unique endpoints</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Tables</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-tables">
                {new Set(mappingData.flatMap(item => item.dbTable.split(', '))).size}
              </div>
              <p className="text-xs text-muted-foreground">Data entities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-categories">{categories.length - 1}</div>
              <p className="text-xs text-muted-foreground">Feature groups</p>
            </CardContent>
          </Card>
        </div>

        {/* Mapping Table */}
        <Card>
          <CardHeader>
            <CardTitle>Application Component Mapping</CardTitle>
            <CardDescription>
              Detailed mapping showing the relationship between UI pages, JavaScript functions, API endpoints, and database tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold">Function Name</th>
                    <th className="text-left p-3 font-semibold">HTML Page</th>
                    <th className="text-left p-3 font-semibold">JavaScript File</th>
                    <th className="text-left p-3 font-semibold">JS Function</th>
                    <th className="text-left p-3 font-semibold">API Endpoint</th>
                    <th className="text-left p-3 font-semibold">Database Tables</th>
                    <th className="text-left p-3 font-semibold">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50" data-testid={`mapping-row-${index}`}>
                      <td className="p-3 font-medium" data-testid={`function-name-${index}`}>
                        {item.functionName}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Globe className="h-4 w-4 text-blue-500" />
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded" data-testid={`html-page-${index}`}>
                            {item.htmlPage}
                          </code>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <FileCode className="h-4 w-4 text-green-500" />
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded" data-testid={`js-filename-${index}`}>
                            {item.jsFilename}
                          </code>
                        </div>
                      </td>
                      <td className="p-3">
                        <code className="text-sm bg-yellow-100 px-2 py-1 rounded" data-testid={`js-function-${index}`}>
                          {item.jsFunction}
                        </code>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Server className="h-4 w-4 text-purple-500" />
                          <code className="text-sm bg-purple-100 px-2 py-1 rounded" data-testid={`api-name-${index}`}>
                            {item.apiName}
                          </code>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {item.dbTable.split(', ').map((table, tableIndex) => (
                            <div key={tableIndex} className="flex items-center gap-1">
                              <Database className="h-3 w-3 text-indigo-500" />
                              <code className="text-xs bg-indigo-100 px-1 py-0.5 rounded" data-testid={`db-table-${index}-${tableIndex}`}>
                                {table.trim()}
                              </code>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={getCategoryColor(item.category)} data-testid={`category-${index}`}>
                          {item.category}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredData.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">No matching components found</p>
                <p className="text-sm text-gray-400">Try adjusting your search terms or category filter</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}