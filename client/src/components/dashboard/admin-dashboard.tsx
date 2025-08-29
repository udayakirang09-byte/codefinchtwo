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
        alert("Payment configuration saved successfully!");
      } else {
        alert("Failed to save payment configuration");
      }
    } catch (error) {
      console.error("Error saving payment config:", error);
      alert("Error saving payment configuration");
    }
  };

  return (
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
                    fetch("/api/admin/contact-settings", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(newSettings)
                    });
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
                    fetch("/api/admin/contact-settings", {
                      method: "PATCH", 
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(newSettings)
                    });
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
                    fetch("/api/admin/contact-settings", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(newSettings)
                    });
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
                onClick={() => alert('System Reports:\n\n📊 User Growth: +15% this month\n📈 Revenue: ₹2.5M (+8%)\n⭐ Platform Rating: 4.8/5\n🎯 Course Completion: 92%\n\nDetailed reports coming soon!')}
              >
                <BarChart3 className="h-6 w-6 mb-2" />
                <span>System Reports</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col" 
                data-testid="button-platform-settings"
                onClick={() => alert('Platform Settings:\n\n⚙️ System Status: Online\n🔒 Security Level: High\n📱 Mobile App: v2.1.0\n🌐 Web Platform: v3.4.2\n\nSettings panel coming soon!')}
              >
                <Settings className="h-6 w-6 mb-2" />
                <span>Platform Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}