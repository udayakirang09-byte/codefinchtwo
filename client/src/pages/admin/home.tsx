import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

// TypeScript interfaces
interface AdminStats {
  totalUsers: number;
  activeTeachers: number;
  totalRevenue: number;
  systemUptime: number;
  pendingApprovals: number;
  securityAlerts: number;
}

interface SystemAlert {
  id: number;
  type: string;
  message: string;
  time: string;
  status: string;
}

interface RecentActivity {
  id: number;
  type: string;
  message: string;
  time: string;
  icon: React.ReactNode;
}

interface HomeSectionControl {
  id: string;
  sectionType: string;
  sectionName: string;
  isEnabled: boolean;
  displayOrder: number;
  description?: string;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Shield,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  TrendingUp,
  Settings,
  Bell,
  Brain,
  Cloud,
  Database,
  Lock,
  CheckCircle,
  XCircle,
  TestTube,
  Cog,
  Map,
  Zap
} from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { apiRequest } from '@/lib/queryClient';

export default function AdminHome() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real admin adminStats from API
  const { data: adminStats = {
    totalUsers: 0,
    activeTeachers: 0,
    totalRevenue: 0,
    systemUptime: 0,
    pendingApprovals: 0,
    securityAlerts: 0
  }, isLoading: adminStatsLoading } = useQuery({
    queryKey: ['admin-adminStats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/adminStats');
      if (!response.ok) throw new Error('Failed to fetch admin adminStats');
      return response.json() as Promise<AdminStats>;
    }
  });

  // Fetch system alerts from API
  const { data: systemAlerts = [] as SystemAlert[], isLoading: alertsLoading } = useQuery<SystemAlert[]>({
    queryKey: ['admin-alerts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    }
  });

  // Fetch home section controls from API
  const { data: homeSectionControls = [] as HomeSectionControl[], isLoading: controlsLoading } = useQuery<HomeSectionControl[]>({
    queryKey: ['admin-home-sections'],
    queryFn: async () => {
      const response = await fetch('/api/admin/home-sections');
      if (!response.ok) throw new Error('Failed to fetch home section controls');
      return response.json();
    }
  });

  // Mutation to update home section controls
  const updateSectionControlMutation = useMutation({
    mutationFn: async ({ sectionType, sectionName, isEnabled }: { sectionType: string; sectionName: string; isEnabled: boolean }) => {
      const response = await fetch('/api/admin/home-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionType, sectionName, isEnabled })
      });
      if (!response.ok) throw new Error('Failed to update section control');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-home-sections'] });
    }
  });

  // Helper function to get appropriate icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <Users className="h-4 w-4" />;
      case 'security_event':
        return <Lock className="h-4 w-4" />;
      case 'system_update':
        return <Database className="h-4 w-4" />;
      case 'payment_processed':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Fetch recent activities from API
  const { data: recentActivityData = [] as any[], isLoading: activitiesLoading } = useQuery<any[]>({
    queryKey: ['admin-activities'],
    queryFn: async () => {
      const response = await fetch('/api/admin/activities');
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    }
  });

  // Transform activities to add icons
  const recentActivity: RecentActivity[] = recentActivityData.map((activity: any) => ({
    ...activity,
    icon: getActivityIcon(activity.type)
  }));

  const quickStats = [
    { label: "Active Sessions", value: "156", change: "+12%", color: "text-green-600" },
    { label: "Server Load", value: "67%", change: "-5%", color: "text-blue-600" },
    { label: "Error Rate", value: "0.12%", change: "-23%", color: "text-green-600" },
    { label: "Response Time", value: "89ms", change: "+3%", color: "text-yellow-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} • System Status: All Systems Operational
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" data-testid="button-system-health">
                <Activity className="w-4 h-4 mr-2" />
                System Health
              </Button>
              <Link href="/admin/analytics">
                <Button data-testid="button-analytics-dashboard">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Analytics
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Link href="/admin/user-management">
                <div className="text-2xl font-bold" data-testid="total-users">{adminStats.totalUsers.toLocaleString()}</div>
                <p className="text-xs opacity-90">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +8% from last month
                </p>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white cursor-pointer hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Link href="/admin/analytics">
                <div className="text-2xl font-bold" data-testid="total-revenue">${adminStats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs opacity-90">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +24% from last month
                </p>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white cursor-pointer hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Activity className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Link href="/admin/cloud-deployments">
                <div className="text-2xl font-bold" data-testid="system-uptime">{adminStats.systemUptime}%</div>
                <p className="text-xs opacity-90">Last 30 days</p>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white cursor-pointer hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertTriangle className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Link href="/admin/mentor-approval">
                <div className="text-2xl font-bold" data-testid="pending-approvals">{adminStats.pendingApprovals}</div>
                <p className="text-xs opacity-90">Teacher applications</p>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* System Overview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Overview
                </CardTitle>
                <CardDescription>Real-time system metrics and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {quickStats.map((stat, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-lg" data-testid={`quick-stat-${index}`}>
                      <div className="text-lg font-bold" data-testid={`stat-value-${index}`}>{stat.value}</div>
                      <div className="text-sm text-gray-600" data-testid={`stat-label-${index}`}>{stat.label}</div>
                      <div className={`text-xs ${stat.color}`} data-testid={`stat-change-${index}`}>{stat.change}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">System Alerts</h3>
                  {systemAlerts.map((alert, index) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`alert-${index}`}>
                      <div className="flex items-center gap-3">
                        {alert.type === 'error' ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : alert.type === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium" data-testid={`alert-message-${index}`}>{alert.message}</p>
                          <p className="text-xs text-gray-500" data-testid={`alert-time-${index}`}>{alert.time}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={alert.status === 'resolved' ? 'default' : 'secondary'}
                        data-testid={`alert-status-${index}`}
                      >
                        {alert.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Actions & Activity Feed */}
          <div className="space-y-6">
            {/* Admin Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/user-management">
                  <Button className="w-full" data-testid="button-user-management">
                    <Users className="w-4 h-4 mr-2" />
                    User Management
                  </Button>
                </Link>
                <Link href="/admin/mentor-approval">
                  <Button variant="outline" className="w-full" data-testid="button-mentor-approval">
                    <Shield className="w-4 h-4 mr-2" />
                    Mentor Approval
                  </Button>
                </Link>
                <Link href="/admin/payment-config">
                  <Button variant="outline" className="w-full" data-testid="button-payment-config">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Payment Configuration
                  </Button>
                </Link>
                <Link href="/admin/analytics">
                  <Button variant="outline" className="w-full" data-testid="button-ai-analytics">
                    <Brain className="w-4 h-4 mr-2" />
                    AI Analytics
                  </Button>
                </Link>
                <Link href="/admin/cloud-deployments">
                  <Button variant="outline" className="w-full" data-testid="button-cloud-deployments">
                    <Cloud className="w-4 h-4 mr-2" />
                    Cloud Deployments
                  </Button>
                </Link>
                <Link href="/admin/code-mapping">
                  <Button variant="outline" className="w-full" data-testid="button-code-mapping">
                    <Map className="w-4 h-4 mr-2" />
                    Code Mapping
                  </Button>
                </Link>
                <Link href="/admin/test-management">
                  <Button variant="outline" className="w-full" data-testid="button-test-management">
                    <TestTube className="w-4 h-4 mr-2" />
                    Unit & System Tests
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" data-testid="button-load-testing">
                  <Zap className="w-4 h-4 mr-2" />
                  Load Testing
                </Button>
              </CardContent>
            </Card>

            {/* Navigation Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Navigation Links
                </CardTitle>
                <CardDescription>
                  Direct access to system pages and utilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/analytics">
                  <Button variant="outline" className="w-full" data-testid="button-nav-ai-analytics">
                    <Brain className="w-4 h-4 mr-2" />
                    🤖 AI Analytics
                  </Button>
                </Link>
                <Link href="/admin/payment-config">
                  <Button variant="outline" className="w-full" data-testid="button-nav-payment-config">
                    <DollarSign className="w-4 h-4 mr-2" />
                    💰 Payment Config
                  </Button>
                </Link>
                <Link href="/admin/ui-config">
                  <Button variant="outline" className="w-full" data-testid="button-nav-ui-config">
                    <Settings className="w-4 h-4 mr-2" />
                    🎨 UI Configuration
                  </Button>
                </Link>
                <Link href="/admin/finance-dashboard">
                  <Button variant="outline" className="w-full" data-testid="button-nav-finance-analytics">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    📊 Finance Analytics
                  </Button>
                </Link>
                <Link href="/admin/cloud-deployments">
                  <Button variant="outline" className="w-full" data-testid="button-nav-cloud-deploy">
                    <Cloud className="w-4 h-4 mr-2" />
                    ☁️ Cloud Deploy
                  </Button>
                </Link>
                <Link href="/simple-test">
                  <Button variant="outline" className="w-full" data-testid="button-nav-simple-test">
                    <TestTube className="w-4 h-4 mr-2" />
                    🔧 Simple Test
                  </Button>
                </Link>
                <Link href="/system-test">
                  <Button variant="outline" className="w-full" data-testid="button-nav-full-tests">
                    <Cog className="w-4 h-4 mr-2" />
                    🧪 Full Tests
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Home Section Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Dashboard Section Controls
                </CardTitle>
                <CardDescription>
                  Control which sections appear on teacher and student dashboards
                </CardDescription>
              </CardHeader>
              <CardContent>
                {controlsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
                    <span className="ml-2 text-sm text-gray-600">Loading controls...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Teacher Sections */}
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-3" data-testid="heading-teacher-sections">
                        Teacher Dashboard Sections
                      </h4>
                      <div className="space-y-3">
                        {homeSectionControls
                          .filter(control => control.sectionType === 'teacher')
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((control) => (
                            <div key={control.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                              <div>
                                <label className="text-sm font-medium cursor-pointer" data-testid={`label-${control.sectionType}-${control.sectionName}`}>
                                  {control.sectionName.charAt(0).toUpperCase() + control.sectionName.slice(1).replace(/([A-Z])/g, ' $1')}
                                </label>
                                {control.description && (
                                  <p className="text-xs text-gray-500 mt-1">{control.description}</p>
                                )}
                              </div>
                              <Switch
                                checked={control.isEnabled}
                                onCheckedChange={(checked) => {
                                  updateSectionControlMutation.mutate({
                                    sectionType: control.sectionType,
                                    sectionName: control.sectionName,
                                    isEnabled: checked
                                  });
                                }}
                                disabled={updateSectionControlMutation.isPending}
                                data-testid={`switch-${control.sectionType}-${control.sectionName}`}
                              />
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Student Sections */}
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-3" data-testid="heading-student-sections">
                        Student Dashboard Sections
                      </h4>
                      <div className="space-y-3">
                        {homeSectionControls
                          .filter(control => control.sectionType === 'student')
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((control) => (
                            <div key={control.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                              <div>
                                <label className="text-sm font-medium cursor-pointer" data-testid={`label-${control.sectionType}-${control.sectionName}`}>
                                  {control.sectionName.charAt(0).toUpperCase() + control.sectionName.slice(1).replace(/([A-Z])/g, ' $1')}
                                </label>
                                {control.description && (
                                  <p className="text-xs text-gray-500 mt-1">{control.description}</p>
                                )}
                              </div>
                              <Switch
                                checked={control.isEnabled}
                                onCheckedChange={(checked) => {
                                  updateSectionControlMutation.mutate({
                                    sectionType: control.sectionType,
                                    sectionName: control.sectionName,
                                    isEnabled: checked
                                  });
                                }}
                                disabled={updateSectionControlMutation.isPending}
                                data-testid={`switch-${control.sectionType}-${control.sectionName}`}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={activity.id} className="flex items-start gap-3" data-testid={`activity-${index}`}>
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm" data-testid={`activity-message-${index}`}>{activity.message}</p>
                        <p className="text-xs text-gray-500" data-testid={`activity-time-${index}`}>{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Security Score</span>
                    <span className="text-green-600 font-medium" data-testid="security-score">94/100</span>
                  </div>
                  <Progress value={94} className="h-2 mt-1" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Data Encryption</span>
                    <span className="text-green-600 font-medium" data-testid="encryption-status">Active</span>
                  </div>
                  <Progress value={100} className="h-2 mt-1" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Threat Detection</span>
                    <span className="text-blue-600 font-medium" data-testid="threat-detection">Monitoring</span>
                  </div>
                  <Progress value={88} className="h-2 mt-1" />
                </div>

                <div className="pt-2 border-t">
                  <Button size="sm" variant="outline" className="w-full" data-testid="button-security-report">
                    View Security Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}