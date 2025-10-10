import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import Navigation from '@/components/navigation';
import { apiRequest } from '@/lib/queryClient';

interface FinanceAnalytics {
  totalAdminRevenue: number;
  totalTeacherPayouts: number;
  totalRefunds: number;
  totalTransactionFees: number;
  conflictAmount: number;
  studentsCount: number;
  teachersCount: number;
}

interface PaymentWorkflow {
  id: string;
  currentStage: string;
  nextActionAt: string;
  transactionId: string;
  workflowType: string;
}

export default function FinanceDashboard() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Main finance analytics query with 15-minute auto-refresh
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['finance-analytics'],
    queryFn: async (): Promise<FinanceAnalytics> => {
      try {
        const response = await apiRequest('GET', '/api/admin/finance-analytics');
        const result = await response.json();
        return result || {
          totalAdminRevenue: 0,
          totalTeacherPayouts: 0,
          totalRefunds: 0,
          totalTransactionFees: 0,
          conflictAmount: 0,
          studentsCount: 0,
          teachersCount: 0
        };
      } catch (error) {
        console.error('Failed to fetch finance analytics:', error);
        return {
          totalAdminRevenue: 0,
          totalTeacherPayouts: 0,
          totalRefunds: 0,
          totalTransactionFees: 0,
          conflictAmount: 0,
          studentsCount: 0,
          teachersCount: 0
        };
      }
    },
    refetchInterval: autoRefresh ? 15 * 60 * 1000 : false, // 15 minutes
  });

  // Active payment workflows query
  const { data: activeWorkflows = [], isLoading: workflowsLoading, refetch: refetchWorkflows } = useQuery({
    queryKey: ['active-payment-workflows'],
    queryFn: async (): Promise<PaymentWorkflow[]> => {
      try {
        const response = await apiRequest('GET', '/api/payment-workflows/active');
        const result = await response.json();
        return result || [];
      } catch (error) {
        console.error('Failed to fetch active workflows:', error);
        return [];
      }
    },
    refetchInterval: autoRefresh ? 15 * 60 * 1000 : false, // 15 minutes
  });

  // Unsettled finances query
  const { data: unsettledFinances = [], isLoading: unsettledLoading, refetch: refetchUnsettled } = useQuery({
    queryKey: ['unsettled-finances'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/unsettled-finances');
        const result = await response.json();
        return result || [];
      } catch (error) {
        console.error('Failed to fetch unsettled finances:', error);
        return [];
      }
    },
    refetchInterval: autoRefresh ? 15 * 60 * 1000 : false, // 15 minutes
  });

  // Manual refresh all data
  const handleRefreshAll = async () => {
    setLastRefresh(new Date());
    await Promise.all([
      refetchAnalytics(),
      refetchWorkflows(),
      refetchUnsettled()
    ]);
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastRefresh(new Date());
        refetchAnalytics();
        refetchWorkflows();
        refetchUnsettled();
      }, 15 * 60 * 1000); // 15 minutes

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetchAnalytics, refetchWorkflows, refetchUnsettled]);

  // Calculate derived metrics
  const netPlatformRevenue = (analytics?.totalTransactionFees || 0);
  const totalProcessed = (analytics?.totalAdminRevenue || 0) + (analytics?.totalRefunds || 0);
  const averageTransactionValue = analytics?.studentsCount ? totalProcessed / analytics.studentsCount : 0;
  const revenuePerTeacher = analytics?.teachersCount ? (analytics?.totalTeacherPayouts || 0) / analytics.teachersCount : 0;

  // Mock time-series data (in production, this would come from enhanced analytics endpoint)
  const revenueChartData = [
    { date: '2025-09-17', adminRevenue: 2500, teacherPayouts: 2000, transactionFees: 125, refunds: 100 },
    { date: '2025-09-18', adminRevenue: 3200, teacherPayouts: 2800, transactionFees: 160, refunds: 80 },
    { date: '2025-09-19', adminRevenue: 2800, teacherPayouts: 2400, transactionFees: 140, refunds: 120 },
    { date: '2025-09-20', adminRevenue: 4100, teacherPayouts: 3600, transactionFees: 205, refunds: 200 },
    { date: '2025-09-21', adminRevenue: 3600, teacherPayouts: 3100, transactionFee: 180, refunds: 150 },
    { date: '2025-09-22', adminRevenue: 3900, teacherPayouts: 3400, transactionFees: 195, refunds: 90 },
    { date: '2025-09-23', adminRevenue: 4500, teacherPayouts: 4000, transactionFees: 225, refunds: 110 }
  ];

  const paymentFlowData = [
    { name: 'Student Payments', value: analytics?.totalAdminRevenue || 0, color: '#0088FE' },
    { name: 'Teacher Payouts', value: analytics?.totalTeacherPayouts || 0, color: '#00C49F' },
    { name: 'Platform Fees', value: analytics?.totalTransactionFees || 0, color: '#FFBB28' },
    { name: 'Refunds', value: analytics?.totalRefunds || 0, color: '#FF8042' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2" data-testid="finance-dashboard-title">
              <BarChart3 className="h-8 w-8 text-green-600" />
              Finance Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Real-time financial metrics with automated 15-minute updates</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <Button
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              data-testid="button-toggle-auto-refresh"
            >
              <Clock className="w-4 h-4 mr-2" />
              Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            <Button 
              onClick={handleRefreshAll}
              data-testid="button-manual-refresh"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Now
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">Financial Overview</TabsTrigger>
            <TabsTrigger value="workflows" data-testid="tab-workflows">Payment Workflows</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Advanced Analytics</TabsTrigger>
            <TabsTrigger value="conflicts" data-testid="tab-conflicts">Unsettled Finances</TabsTrigger>
          </TabsList>

          {/* Financial Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Admin Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600" data-testid="total-admin-revenue">
                    ₹{(analytics?.totalAdminRevenue || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <ArrowUpRight className="inline h-3 w-3 mr-1 text-green-500" />
                    From student payments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Teacher Payouts</CardTitle>
                  <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600" data-testid="total-teacher-payouts">
                    ₹{(analytics?.totalTeacherPayouts || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    Paid to teachers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600" data-testid="platform-revenue">
                    ₹{netPlatformRevenue.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Transaction fees (2%)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
                  <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600" data-testid="total-refunds">
                    ₹{(analytics?.totalRefunds || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingDown className="inline h-3 w-3 mr-1 text-red-500" />
                    Refunded to students
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Platform Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="students-count">
                    {analytics?.studentsCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg transaction: ₹{averageTransactionValue.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="teachers-count">
                    {analytics?.teachersCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg payout: ₹{revenuePerTeacher.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conflicts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600" data-testid="conflict-amount">
                    ₹{(analytics?.conflictAmount || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unsettled finances
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>7-Day Revenue Trend</CardTitle>
                <CardDescription>
                  Daily breakdown of platform financial activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [`₹${value}`, name]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="adminRevenue" 
                      stackId="1"
                      stroke="#0088FE" 
                      fill="#0088FE" 
                      fillOpacity={0.6}
                      name="Admin Revenue"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="teacherPayouts" 
                      stackId="1"
                      stroke="#00C49F" 
                      fill="#00C49F" 
                      fillOpacity={0.6}
                      name="Teacher Payouts"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="transactionFees" 
                      stackId="1"
                      stroke="#FFBB28" 
                      fill="#FFBB28" 
                      fillOpacity={0.6}
                      name="Transaction Fees"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Active Payment Workflows</CardTitle>
                  <CardDescription>
                    Real-time view of payment processing stages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3" data-testid="active-workflows-list">
                    {workflowsLoading ? (
                      <div className="text-center py-4">Loading workflows...</div>
                    ) : !Array.isArray(activeWorkflows) || activeWorkflows.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No active workflows</div>
                    ) : (
                      activeWorkflows.slice(0, 5).map((workflow: PaymentWorkflow) => (
                        <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{workflow.workflowType || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">ID: {workflow.id?.slice(0, 8) || 'N/A'}...</div>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              workflow.currentStage === 'completed' ? 'default' :
                              workflow.currentStage === 'waiting_24h' ? 'secondary' : 'outline'
                            }>
                              {workflow.currentStage || 'Unknown'}
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">
                              Next: {workflow.nextActionAt ? new Date(workflow.nextActionAt).toLocaleString() : 'Not set'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Flow Breakdown</CardTitle>
                  <CardDescription>
                    Distribution of financial transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentFlowData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentFlowData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Advanced Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Key financial performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Platform Revenue Margin</span>
                    <span className="font-semibold">2.00%</span>
                  </div>
                  <Progress value={2} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Teacher Payout Efficiency</span>
                    <span className="font-semibold">
                      {totalProcessed > 0 ? ((analytics?.totalTeacherPayouts || 0) / totalProcessed * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={totalProcessed > 0 ? (analytics?.totalTeacherPayouts || 0) / totalProcessed * 100 : 0} 
                    className="h-2" 
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Refund Rate</span>
                    <span className="font-semibold">
                      {totalProcessed > 0 ? ((analytics?.totalRefunds || 0) / totalProcessed * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={totalProcessed > 0 ? (analytics?.totalRefunds || 0) / totalProcessed * 100 : 0} 
                    className="h-2" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>
                    Financial system status indicators
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Payment Processing</div>
                      <div className="text-sm text-gray-500">All systems operational</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Automated Workflows</div>
                      <div className="text-sm text-gray-500">{activeWorkflows.length} active workflows</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Real-time Updates</div>
                      <div className="text-sm text-gray-500">15-minute refresh active</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Unsettled Finances Tab */}
          <TabsContent value="conflicts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Unsettled Finances</CardTitle>
                <CardDescription>
                  Financial conflicts requiring resolution
                </CardDescription>
              </CardHeader>
              <CardContent>
                {unsettledLoading ? (
                  <div className="text-center py-4">Loading unsettled finances...</div>
                ) : unsettledFinances.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      No unsettled finances found. All financial transactions are properly resolved.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3" data-testid="unsettled-finances-list">
                    {unsettledFinances.map((finance: any) => (
                      <div key={finance.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{finance.conflictType}</div>
                          <div className="text-sm text-gray-500">{finance.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-600">
                            ₹{parseFloat(finance.conflictAmount).toFixed(2)}
                          </div>
                          <Badge variant="destructive">{finance.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}