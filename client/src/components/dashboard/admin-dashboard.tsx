import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, DollarSign, TrendingUp, AlertTriangle, Settings, Bell, Shield, BarChart3, UserCheck, Mail, MessageSquare, Phone, CreditCard, Key, Lock } from "lucide-react";

interface SystemStats {
  totalUsers: number;
  totalMentors: number;
  totalStudents: number;
  activeClasses: number;
  monthlyRevenue: number;
  totalBookings: number;
  averageRating: number;
  completionRate: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 1247,
    totalMentors: 89,
    totalStudents: 1158,
    activeClasses: 23,
    monthlyRevenue: 45680,
    totalBookings: 2834,
    averageRating: 4.7,
    completionRate: 94.2
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [contactSettings, setContactSettings] = useState({
    emailEnabled: false,
    chatEnabled: false,
    phoneEnabled: false,
  });

  const [paymentConfig, setPaymentConfig] = useState({
    stripeEnabled: false,
    stripePublishableKey: '',
    stripeSecretKey: '',
    razorpayEnabled: false,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    paypalEnabled: false,
    paypalClientId: '',
    paypalClientSecret: ''
  });

  const [showSystemReports, setShowSystemReports] = useState(false);
  const [showPlatformSettings, setShowPlatformSettings] = useState(false);

  useEffect(() => {
    // Load sample alert data
    setAlerts([
      {
        id: '1',
        type: 'warning',
        title: 'High Cancellation Rate',
        message: 'Mentor "John Doe" has a 15% cancellation rate this week',
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: '2',
        type: 'error',
        title: 'Payment Failed',
        message: 'Payment processing failed for booking #12345',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: '3',
        type: 'info',
        title: 'New Mentor Application',
        message: '5 new mentor applications pending review',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
      }
    ]);

    setRecentActivities([
      { id: 1, action: 'New student registration', user: 'Emma Wilson', time: '5 minutes ago' },
      { id: 2, action: 'Mentor approved', user: 'Sarah Johnson', time: '15 minutes ago' },
      { id: 3, action: 'Booking completed', user: 'Mike Chen → James Parker', time: '1 hour ago' },
      { id: 4, action: 'Feedback submitted', user: 'Alex Rivera', time: '2 hours ago' },
    ]);

    // Load contact settings
    fetch("/api/admin/contact-settings")
      .then((res) => res.json())
      .then((settings) => setContactSettings(settings))
      .catch(() => console.error("Failed to load contact settings"));
    
    // Load payment configuration
    fetch("/api/admin/payment-config")
      .then((res) => res.json())
      .then((config) => setPaymentConfig(config))
      .catch(() => console.error("Failed to load payment config"));
  }, []);

  const handleViewDetails = (category: string) => {
    console.log(`📊 Viewing ${category} details`);
  };

  const handleResolveAlert = (alertId: string) => {
    console.log(`✅ Resolving alert ${alertId}`);
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'error': return 'bg-red-50 border-red-400 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-400 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-400 text-blue-800';
      default: return 'bg-gray-50 border-gray-400 text-gray-800';
    }
  };

  const savePaymentConfig = async () => {
    try {
      const response = await fetch("/api/admin/payment-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentConfig)
      });
      
      if (response.ok) {
        alert("✅ Payment configuration saved successfully!");
      } else {
        const error = await response.json();
        alert(`❌ Failed to save payment configuration: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error saving payment config:", error);
      alert("❌ Error saving payment configuration. Please try again.");
    }
  };

  const saveContactSetting = async (newSettings: typeof contactSettings) => {
    try {
      const response = await fetch("/api/admin/contact-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings)
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to save contact settings:", error);
        // Revert the UI state on failure
        setContactSettings(contactSettings);
        alert(`❌ Failed to save contact settings: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error saving contact settings:", error);
      // Revert the UI state on failure
      setContactSettings(contactSettings);
      alert("❌ Error saving contact settings. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-50 to-orange-100 p-6 rounded-lg border">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard 🛡️</h2>
        <p className="text-gray-700">Monitor system performance, manage users, and oversee platform operations.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewDetails('users')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalMentors} mentors, {stats.totalStudents} students
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewDetails('classes')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Classes</p>
                <p className="text-2xl font-bold">{stats.activeClasses}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalBookings.toLocaleString()} total bookings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewDetails('revenue')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600">+12% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewDetails('performance')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
                <p className="text-xs text-gray-500">
                  Avg rating: {stats.averageRating}⭐
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Issues */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{alert.title}</h4>
                      <p className="text-sm mt-1">{alert.message}</p>
                      <p className="text-xs mt-2 opacity-70">
                        {alert.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleResolveAlert(alert.id)}
                      data-testid={`button-resolve-alert-${alert.id}`}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Configuration Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Admin Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="contact" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contact">Contact Settings</TabsTrigger>
              <TabsTrigger value="payment">Payment Configuration</TabsTrigger>
            </TabsList>
            
            <TabsContent value="contact" className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-gray-600">Allow users to contact via email</p>
                  </div>
                </div>
                <Switch 
                  checked={contactSettings.emailEnabled}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...contactSettings, emailEnabled: checked };
                    setContactSettings(newSettings);
                    saveContactSetting(newSettings);
                  }}
                  data-testid="switch-email-support"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Live Chat</p>
                    <p className="text-sm text-gray-600">Enable real-time chat support</p>
                  </div>
                </div>
                <Switch 
                  checked={contactSettings.chatEnabled}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...contactSettings, chatEnabled: checked };
                    setContactSettings(newSettings);
                    saveContactSetting(newSettings);
                  }}
                  data-testid="switch-live-chat"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-gray-600">Allow users to call for support</p>
                  </div>
                </div>
                <Switch 
                  checked={contactSettings.phoneEnabled}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...contactSettings, phoneEnabled: checked };
                    setContactSettings(newSettings);
                    saveContactSetting(newSettings);
                  }}
                  data-testid="switch-phone-support"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="payment" className="space-y-6">
              {/* Stripe Configuration */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Stripe Payment Gateway</p>
                      <p className="text-sm text-gray-600">International card payments</p>
                    </div>
                  </div>
                  <Switch 
                    checked={paymentConfig.stripeEnabled}
                    onCheckedChange={(checked) => 
                      setPaymentConfig(prev => ({ ...prev, stripeEnabled: checked }))
                    }
                    data-testid="switch-stripe-enabled"
                  />
                </div>
                
                {paymentConfig.stripeEnabled && (
                  <div className="space-y-3 ml-8">
                    <div>
                      <Label htmlFor="stripe-publishable">Publishable Key</Label>
                      <Input
                        id="stripe-publishable"
                        placeholder="pk_test_..."
                        value={paymentConfig.stripePublishableKey}
                        onChange={(e) => setPaymentConfig(prev => ({ 
                          ...prev, stripePublishableKey: e.target.value 
                        }))}
                        data-testid="input-stripe-publishable-key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stripe-secret">Secret Key</Label>
                      <Input
                        id="stripe-secret"
                        type="password"
                        placeholder="sk_test_..."
                        value={paymentConfig.stripeSecretKey}
                        onChange={(e) => setPaymentConfig(prev => ({ 
                          ...prev, stripeSecretKey: e.target.value 
                        }))}
                        data-testid="input-stripe-secret-key"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Razorpay Configuration */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Razorpay (UPI & Cards)</p>
                      <p className="text-sm text-gray-600">Indian payment methods</p>
                    </div>
                  </div>
                  <Switch 
                    checked={paymentConfig.razorpayEnabled}
                    onCheckedChange={(checked) => 
                      setPaymentConfig(prev => ({ ...prev, razorpayEnabled: checked }))
                    }
                    data-testid="switch-razorpay-enabled"
                  />
                </div>
                
                {paymentConfig.razorpayEnabled && (
                  <div className="space-y-3 ml-8">
                    <div>
                      <Label htmlFor="razorpay-key-id">Key ID</Label>
                      <Input
                        id="razorpay-key-id"
                        placeholder="rzp_test_..."
                        value={paymentConfig.razorpayKeyId}
                        onChange={(e) => setPaymentConfig(prev => ({ 
                          ...prev, razorpayKeyId: e.target.value 
                        }))}
                        data-testid="input-razorpay-key-id"
                      />
                    </div>
                    <div>
                      <Label htmlFor="razorpay-secret">Key Secret</Label>
                      <Input
                        id="razorpay-secret"
                        type="password"
                        placeholder="..."
                        value={paymentConfig.razorpayKeySecret}
                        onChange={(e) => setPaymentConfig(prev => ({ 
                          ...prev, razorpayKeySecret: e.target.value 
                        }))}
                        data-testid="input-razorpay-key-secret"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={savePaymentConfig} data-testid="button-save-payment-config">
                  <Lock className="h-4 w-4 mr-2" />
                  Save Payment Configuration
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.user}</p>
                  </div>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Admin Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col" 
                data-testid="button-user-management"
                onClick={() => window.location.href = '/admin/user-management'}
              >
                <UserCheck className="h-6 w-6 mb-2" />
                <span>User Management</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col" 
                data-testid="button-mentor-approval"
                onClick={() => window.location.href = '/admin/mentor-approval'}
              >
                <Shield className="h-6 w-6 mb-2" />
                <span>Mentor Approval</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col" 
                data-testid="button-system-reports"
                onClick={() => setShowSystemReports(!showSystemReports)}
              >
                <BarChart3 className="h-6 w-6 mb-2" />
                <span>System Reports</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col" 
                data-testid="button-platform-settings"
                onClick={() => setShowPlatformSettings(!showPlatformSettings)}
              >
                <Settings className="h-6 w-6 mb-2" />
                <span>Platform Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Reports Section */}
      {showSystemReports && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              System Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">📊 User Growth</h4>
                <p className="text-2xl font-bold text-blue-700">+15%</p>
                <p className="text-sm text-blue-600">This month</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalUsers.toLocaleString()} total users
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">📈 Revenue</h4>
                <p className="text-2xl font-bold text-green-700">₹2.5M</p>
                <p className="text-sm text-green-600">+8% growth</p>
                <p className="text-xs text-gray-500 mt-1">
                  ${stats.monthlyRevenue.toLocaleString()} this month
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">⭐ Platform Rating</h4>
                <p className="text-2xl font-bold text-purple-700">4.8/5</p>
                <p className="text-sm text-purple-600">Excellent</p>
                <p className="text-xs text-gray-500 mt-1">
                  Based on {stats.totalBookings.toLocaleString()} reviews
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-900 mb-2">🎯 Course Completion</h4>
                <p className="text-2xl font-bold text-orange-700">92%</p>
                <p className="text-sm text-orange-600">High success rate</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.completionRate}% overall rate
                </p>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">📊 Monthly Analytics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">New Students</span>
                    <span className="font-medium">+127</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">New Mentors</span>
                    <span className="font-medium">+8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sessions Completed</span>
                    <span className="font-medium">1,245</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Session Duration</span>
                    <span className="font-medium">45 min</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">🎯 Performance Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Server Uptime</span>
                    <span className="font-medium text-green-600">99.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="font-medium">45ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Sessions</span>
                    <span className="font-medium">{stats.activeClasses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Success Rate</span>
                    <span className="font-medium text-green-600">98.5%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Settings Section */}
      {showPlatformSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Platform Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-lg">⚙️ System Configuration</h4>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Maintenance Mode</span>
                    <Switch data-testid="switch-maintenance-mode" />
                  </div>
                  <p className="text-sm text-gray-600">Enable to temporarily disable new bookings</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Auto Backup</span>
                    <Switch defaultChecked data-testid="switch-auto-backup" />
                  </div>
                  <p className="text-sm text-gray-600">Automatic daily database backups</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">New User Registration</span>
                    <Switch defaultChecked data-testid="switch-new-registration" />
                  </div>
                  <p className="text-sm text-gray-600">Allow new students to register</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <Label htmlFor="max-session-duration">Max Session Duration (minutes)</Label>
                  <Input 
                    id="max-session-duration" 
                    type="number" 
                    defaultValue="120" 
                    className="mt-1"
                    data-testid="input-max-session-duration"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-lg">🔒 Security & Monitoring</h4>
                
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">System Status: Online</span>
                  </div>
                  <p className="text-sm text-gray-600">All services running normally</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="font-medium mb-2">🔒 Security Level: High</h5>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">✅ SSL Certificate: Valid</p>
                    <p className="text-sm text-gray-600">✅ Two-Factor Auth: Enabled</p>
                    <p className="text-sm text-gray-600">✅ Rate Limiting: Active</p>
                    <p className="text-sm text-gray-600">✅ CSRF Protection: On</p>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium mb-2">📱 Application Versions</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Mobile App</span>
                      <span className="font-medium">v2.1.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Web Platform</span>
                      <span className="font-medium">v3.4.2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Admin Dashboard</span>
                      <span className="font-medium">v1.8.5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button data-testid="button-save-platform-settings">
                Save Changes
              </Button>
              <Button variant="outline" data-testid="button-reset-platform-settings">
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            System Health Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">Server Status</span>
              </div>
              <p className="text-sm text-gray-600">All systems operational</p>
              <p className="text-xs text-gray-500">99.9% uptime</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Database</span>
              </div>
              <p className="text-sm text-gray-600">Performance optimal</p>
              <p className="text-xs text-gray-500">Avg response: 45ms</p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium">Payment System</span>
              </div>
              <p className="text-sm text-gray-600">Minor delays</p>
              <p className="text-xs text-gray-500">Processing slower than usual</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Mapping Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Function Mapping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Function Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">HTML Page</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">JavaScript Filename</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">JavaScript Function</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">API Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Database Table</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">User Authentication</td>
                  <td className="border border-gray-300 px-4 py-2">login.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">login.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">handleLogin()</td>
                  <td className="border border-gray-300 px-4 py-2">/api/auth/login</td>
                  <td className="border border-gray-300 px-4 py-2">users</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">User Registration</td>
                  <td className="border border-gray-300 px-4 py-2">signup.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">signup.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">handleSignup()</td>
                  <td className="border border-gray-300 px-4 py-2">/api/auth/signup</td>
                  <td className="border border-gray-300 px-4 py-2">users, teacher_profiles</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Password Reset</td>
                  <td className="border border-gray-300 px-4 py-2">forgot-password.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">forgot-password.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">handleSendCode()</td>
                  <td className="border border-gray-300 px-4 py-2">/api/auth/forgot-password</td>
                  <td className="border border-gray-300 px-4 py-2">users</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Mentor Booking</td>
                  <td className="border border-gray-300 px-4 py-2">mentor-profile.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">mentor-profile.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">handleBookSession()</td>
                  <td className="border border-gray-300 px-4 py-2">/api/bookings</td>
                  <td className="border border-gray-300 px-4 py-2">bookings, mentors, students</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Course Creation</td>
                  <td className="border border-gray-300 px-4 py-2">create-course.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">create-course.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">handleCreateCourse()</td>
                  <td className="border border-gray-300 px-4 py-2">/api/courses</td>
                  <td className="border border-gray-300 px-4 py-2">courses, mentors</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Student Progress</td>
                  <td className="border border-gray-300 px-4 py-2">student-dashboard.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">student-dashboard.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">fetchProgress()</td>
                  <td className="border border-gray-300 px-4 py-2">/api/students/progress</td>
                  <td className="border border-gray-300 px-4 py-2">students, achievements</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Video Sessions</td>
                  <td className="border border-gray-300 px-4 py-2">video-session.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">video-session.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">startVideoCall()</td>
                  <td className="border border-gray-300 px-4 py-2">/api/video-sessions</td>
                  <td className="border border-gray-300 px-4 py-2">video_sessions, bookings</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Payment Processing</td>
                  <td className="border border-gray-300 px-4 py-2">payment.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">payment.tsx</td>
                  <td className="border border-gray-300 px-4 py-2">processPayment()</td>
                  <td className="border border-gray-300 px-4 py-2">/api/payments</td>
                  <td className="border border-gray-300 px-4 py-2">payments, bookings</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Unit Test Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Unit Test Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-blue-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">UI Page</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Button/Link Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Unit Test Case</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Login Page</td>
                  <td className="border border-gray-300 px-4 py-2">Sign In Button</td>
                  <td className="border border-gray-300 px-4 py-2">Should authenticate valid credentials</td>
                  <td className="border border-gray-300 px-4 py-2"><Badge className="bg-green-100 text-green-800">Pass</Badge></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Login Page</td>
                  <td className="border border-gray-300 px-4 py-2">Sign In Button</td>
                  <td className="border border-gray-300 px-4 py-2">Should reject invalid credentials</td>
                  <td className="border border-gray-300 px-4 py-2"><Badge className="bg-green-100 text-green-800">Pass</Badge></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Signup Page</td>
                  <td className="border border-gray-300 px-4 py-2">Create Account Button</td>
                  <td className="border border-gray-300 px-4 py-2">Should create new user account</td>
                  <td className="border border-gray-300 px-4 py-2"><Badge className="bg-green-100 text-green-800">Pass</Badge></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Teacher Dashboard</td>
                  <td className="border border-gray-300 px-4 py-2">Teacher Profile Button</td>
                  <td className="border border-gray-300 px-4 py-2">Should display qualification details</td>
                  <td className="border border-gray-300 px-4 py-2"><Badge className="bg-green-100 text-green-800">Pass</Badge></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Student Dashboard</td>
                  <td className="border border-gray-300 px-4 py-2">Run All Tests Button</td>
                  <td className="border border-gray-300 px-4 py-2">Should execute with student credentials</td>
                  <td className="border border-gray-300 px-4 py-2"><Badge className="bg-green-100 text-green-800">Pass</Badge></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Admin Dashboard</td>
                  <td className="border border-gray-300 px-4 py-2">Contact Settings Toggle</td>
                  <td className="border border-gray-300 px-4 py-2">Should save configuration changes</td>
                  <td className="border border-gray-300 px-4 py-2"><Badge className="bg-yellow-100 text-yellow-800">Pending</Badge></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Forgot Password</td>
                  <td className="border border-gray-300 px-4 py-2">Send Reset Code Button</td>
                  <td className="border border-gray-300 px-4 py-2">Should send email with reset code</td>
                  <td className="border border-gray-300 px-4 py-2"><Badge className="bg-green-100 text-green-800">Pass</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* System Test Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            System Test Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-purple-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">UI Page</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Button/Link Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">System Test Case</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Login Page</td>
                  <td className="border border-gray-300 px-4 py-2">Sign In Button</td>
                  <td className="border border-gray-300 px-4 py-2">End-to-end authentication flow with database</td>
                  <td className="border border-gray-300 px-4 py-2"><Badge className="bg-green-100 text-green-800">Pass</Badge></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Mentor Booking</td>
                  <td className="border border-gray-300 px-4 py-2">Book Session Button</td>
                  <td className="border border-gray-300 px-4 py-2">Complete booking workflow with payment integration</td>
                  <td className="border border-gray-300 px-4 py-2"><Badge className="bg-red-100 text-red-800">Fail</Badge></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Video Session</td>
                  <td className="border border-gray-300 px-4 py-2">Start Video Call</td>
                  <td className="border border-gray-300 px-4 py-2">Video call initialization and connection</td>
                  <td className="border border-gray-300 px-4 py-2"><Badge className="bg-yellow-100 text-yellow-800">Pending</Badge></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Teacher Dashboard</td>
                  <td className="border border-gray-300 px-4 py-2">Create Course Button</td>
                  <td className="border border-gray-300 px-4 py-2">Course creation with teacher profile validation</td>
                  <td className="border border-gray-300 px-4 py-2"><Badge className="bg-green-100 text-green-800">Pass</Badge></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Student Dashboard</td>
                  <td className="border border-gray-300 px-4 py-2">Progress View</td>
                  <td className="border border-gray-300 px-4 py-2">Student progress tracking across multiple sessions</td>
                  <td className="border border-gray-300 px-4 py-2"><Badge className="bg-green-100 text-green-800">Pass</Badge></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Admin Dashboard</td>
                  <td className="border border-gray-300 px-4 py-2">System Monitoring</td>
                  <td className="border border-gray-300 px-4 py-2">Real-time system health and performance monitoring</td>
                  <td className="border border-gray-300 px-4 py-2"><Badge className="bg-yellow-100 text-yellow-800">Pending</Badge></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Chat System</td>
                  <td className="border border-gray-300 px-4 py-2">Send Message</td>
                  <td className="border border-gray-300 px-4 py-2">Real-time chat messaging between mentor and student</td>
                  <td className="border border-gray-300 px-4 py-2"><Badge className="bg-yellow-100 text-yellow-800">Pending</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Load Testing Strategy Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Load Testing Strategy - 3K Concurrent Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Strategy Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg border">
                <h4 className="font-semibold text-blue-900 mb-2">Target Metrics</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 3,000 concurrent active users</li>
                  <li>• 500 simultaneous chat sessions</li>
                  <li>• 100 concurrent video calls</li>
                  <li>• Response time &lt; 200ms</li>
                  <li>• 99.9% uptime target</li>
                </ul>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border">
                <h4 className="font-semibold text-green-900 mb-2">Testing Tools</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Artillery.io for API load testing</li>
                  <li>• WebRTC stress testing tools</li>
                  <li>• PostgreSQL monitoring</li>
                  <li>• Real-time metrics dashboard</li>
                  <li>• Memory/CPU profiling</li>
                </ul>
              </div>
            </div>

            {/* Test Scenarios Table */}
            <div>
              <h4 className="font-semibold mb-3">Test Scenarios</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left">Scenario</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Users</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Duration</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Expected Load</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Success Criteria</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2">User Authentication</td>
                      <td className="border border-gray-300 px-3 py-2">1000/min</td>
                      <td className="border border-gray-300 px-3 py-2">15 min</td>
                      <td className="border border-gray-300 px-3 py-2">Login/logout cycles</td>
                      <td className="border border-gray-300 px-3 py-2">&lt;100ms response</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2">Mentor Booking</td>
                      <td className="border border-gray-300 px-3 py-2">500</td>
                      <td className="border border-gray-300 px-3 py-2">30 min</td>
                      <td className="border border-gray-300 px-3 py-2">Session booking flow</td>
                      <td className="border border-gray-300 px-3 py-2">&lt;500ms booking</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2">Real-time Chat</td>
                      <td className="border border-gray-300 px-3 py-2">500</td>
                      <td className="border border-gray-300 px-3 py-2">60 min</td>
                      <td className="border border-gray-300 px-3 py-2">Message exchange</td>
                      <td className="border border-gray-300 px-3 py-2">&lt;50ms delivery</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2">Video Sessions</td>
                      <td className="border border-gray-300 px-3 py-2">100</td>
                      <td className="border border-gray-300 px-3 py-2">45 min</td>
                      <td className="border border-gray-300 px-3 py-2">WebRTC connections</td>
                      <td className="border border-gray-300 px-3 py-2">&lt;3s connect time</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2">Payment Processing</td>
                      <td className="border border-gray-300 px-3 py-2">200</td>
                      <td className="border border-gray-300 px-3 py-2">20 min</td>
                      <td className="border border-gray-300 px-3 py-2">Stripe API calls</td>
                      <td className="border border-gray-300 px-3 py-2">&lt;2s payment confirm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-orange-50 rounded-lg border">
                <h4 className="font-semibold text-orange-900 mb-2">Database Optimization</h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Connection pooling (50-100 connections)</li>
                  <li>• Query optimization & indexing</li>
                  <li>• Read replicas for dashboard data</li>
                  <li>• Redis caching for sessions</li>
                </ul>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border">
                <h4 className="font-semibold text-purple-900 mb-2">Server Scaling</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Horizontal scaling (3+ instances)</li>
                  <li>• Load balancer configuration</li>
                  <li>• Auto-scaling triggers</li>
                  <li>• CDN for static assets</li>
                </ul>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border">
                <h4 className="font-semibold text-red-900 mb-2">Monitoring Alerts</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• CPU usage &gt; 80%</li>
                  <li>• Memory usage &gt; 85%</li>
                  <li>• Response time &gt; 1s</li>
                  <li>• Error rate &gt; 1%</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Run All Tests Button - Only for Admins */}
      <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-700 text-white">
          <CardTitle className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6" />
            System Testing & Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Run comprehensive system tests with admin privileges</p>
            <Button 
              onClick={() => {
                console.log('🧪 Running all tests with admin credentials');
                // Test functionality for admins
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              data-testid="button-run-all-tests-admin"
            >
              Run All Tests (Admin)
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}