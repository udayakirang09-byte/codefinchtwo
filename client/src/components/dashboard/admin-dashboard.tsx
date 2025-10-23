import { useState, useEffect } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, BookOpen, DollarSign, TrendingUp, AlertTriangle, Settings, Bell, Shield, BarChart3, UserCheck, Mail, MessageSquare, Phone, CreditCard, Key, Lock, X, Building, Activity, TestTube, Zap, Monitor, Map, Brain, Cloud, Calendar, Cog, FileImage, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useAdminAlerts } from "@/hooks/use-admin-alerts";

interface SystemStats {
  totalUsers: number;
  totalMentors: number;
  totalStudents: number;
  activeClasses: number;
  monthlyRevenue: number;
  totalBookings: number;
  completedBookings: number;
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

interface HomeSectionControl {
  id: string;
  sectionType: string;
  sectionName: string;
  isEnabled: boolean;
  displayOrder: number;
  description?: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { data: alerts = [], isLoading: alertsLoading } = useAdminAlerts();
  
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalMentors: 0,
    totalStudents: 0,
    activeClasses: 0,
    monthlyRevenue: 0,
    totalBookings: 0,
    completedBookings: 0,
    averageRating: 0,
    completionRate: 0
  });
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

  const [paymentMethods, setPaymentMethods] = useState({
    upiEnabled: true,
    cardsEnabled: false,
    netBankingEnabled: false,
    stripeEnabled: false
  });

  const [courseConfig, setCourseConfig] = useState({
    maxStudentsPerCourse: 8,
    maxClassesPerCourse: 8,
    transactionFeePercentage: 2
  });

  const [discoverSectionConfig, setDiscoverSectionConfig] = useState({
    isVisible: false,
    specialCode: ''
  });

  // Admin Payment Methods State
  const [adminPaymentMethods, setAdminPaymentMethods] = useState<any[]>([]);
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState('upi');
  const [adminUpiForm, setAdminUpiForm] = useState({
    upiId: '',
    upiProvider: 'phonepe',
    displayName: ''
  });
  const [adminCardForm, setAdminCardForm] = useState({
    cardNumber: '',
    cardType: 'visa',
    displayName: ''
  });
  const [adminStripeForm, setAdminStripeForm] = useState({
    stripeAccountId: '',
    displayName: ''
  });

  const [showSystemReports, setShowSystemReports] = useState(false);
  const [showPlatformSettings, setShowPlatformSettings] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCategory, setDetailCategory] = useState<string>('');
  const [detailData, setDetailData] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  
  // State for Quick Navigation sections visibility
  const [showFunctionMapping, setShowFunctionMapping] = useState(false);
  const [showUnitTests, setShowUnitTests] = useState(false);
  const [showSystemTests, setShowSystemTests] = useState(false);
  const [showLoadTesting, setShowLoadTesting] = useState(false);

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

  useEffect(() => {
    // Load system health data
    const fetchSystemHealth = async () => {
      try {
        const response = await fetch('/api/admin/system-health');
        if (response.ok) {
          const data = await response.json();
          setSystemHealth(data);
        }
      } catch (error) {
        console.error('Failed to fetch system health:', error);
      }
    };
    
    // Load real admin stats
    const fetchAdminStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      }
    };
    
    fetchSystemHealth();
    fetchAdminStats();
    
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
    
    // Load preferred payment method
    fetch("/api/admin/preferred-payment-method")
      .then((res) => res.json())
      .then((data) => setPreferredPaymentMethod(data.preferredMethod))
      .catch(() => console.error("Failed to load preferred payment method"));
    
    // Load payment methods
    fetch("/api/admin/payment-methods")
      .then((res) => res.json())
      .then((methods) => setPaymentMethods(methods))
      .catch(() => console.error("Failed to load payment methods"));
    
    // Load course configuration
    fetch("/api/admin/course-config")
      .then((res) => res.json())
      .then((config) => setCourseConfig(config))
      .catch(() => console.error("Failed to load course config"));
    
    // Load discover section configuration
    fetch("/api/admin/discover-section-config")
      .then((res) => res.json())
      .then((config) => setDiscoverSectionConfig({ isVisible: config.isVisible || false, specialCode: '' }))
      .catch(() => console.error("Failed to load discover section config"));
    
    // Load admin payment methods
    const adminUserId = localStorage.getItem('userId');
    if (adminUserId) {
      fetch(`/api/payment-methods/${adminUserId}`)
        .then((res) => res.json())
        .then((methods) => setAdminPaymentMethods(methods || []))
        .catch(() => console.error("Failed to load admin payment methods"));
    }
  }, []);

  const handleViewDetails = async (category: string) => {
    console.log(`📊 Viewing ${category} details`);
    setDetailCategory(category);
    
    try {
      let data = [];
      
      switch (category) {
        case 'users':
          const usersResponse = await fetch('/api/users');
          if (usersResponse.ok) {
            data = await usersResponse.json();
          } else {
            console.error('Failed to fetch users');
            data = [];
          }
          break;
          
        case 'classes':
          const classesResponse = await fetch('/api/bookings');
          if (classesResponse.ok) {
            data = await classesResponse.json();
          } else {
            console.error('Failed to fetch bookings');
            data = [];
          }
          break;
          
        case 'revenue':
          const revenueResponse = await fetch('/api/admin/revenue-history');
          if (revenueResponse.ok) {
            data = await revenueResponse.json();
          } else {
            console.error('Failed to fetch revenue data');
            data = [];
          }
          break;
          
        case 'performance':
          const performanceResponse = await fetch('/api/admin/performance-metrics');
          if (performanceResponse.ok) {
            data = await performanceResponse.json();
          } else {
            console.error('Failed to fetch performance metrics');
            data = [];
          }
          break;
          
        default:
          data = [];
      }
      
      setDetailData(data);
      setShowDetailModal(true);
    } catch (error) {
      console.error(`Error fetching ${category} details:`, error);
      // Show error message or fallback data
      setDetailData([]);
      setShowDetailModal(true);
    }
  };

  const handleResolveAlert = (alertId: string | number) => {
    console.log(`✅ Resolving alert ${alertId}`);
    toast({
      title: "Alert Acknowledged",
      description: "Alerts are managed by the system. Please address the underlying issue.",
    });
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
        toast({
          title: "Success",
          description: "Payment configuration saved successfully!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: `Failed to save payment configuration: ${error.error || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving payment config:", error);
      toast({
        title: "Error",
        description: "Error saving payment configuration. Please try again.",
        variant: "destructive",
      });
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
        toast({
          title: "Error",
          description: `Failed to save contact settings: ${error.error || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving contact settings:", error);
      // Revert the UI state on failure
      setContactSettings(contactSettings);
      toast({
        title: "Error",
        description: "Error saving contact settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const savePreferredPaymentMethod = async (method: string) => {
    try {
      const response = await fetch("/api/admin/preferred-payment-method", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredMethod: method })
      });
      
      if (response.ok) {
        setPreferredPaymentMethod(method);
        toast({
          title: "Success",
          description: "Preferred payment method updated successfully!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: `Failed to update preferred payment method: ${error.error || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving preferred payment method:", error);
      toast({
        title: "Error",
        description: "Error updating preferred payment method. Please try again.",
        variant: "destructive",
      });
    }
  };

  const savePaymentMethods = async (newMethods: typeof paymentMethods) => {
    try {
      const response = await fetch("/api/admin/payment-methods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMethods)
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to save payment methods:", error);
        setPaymentMethods(paymentMethods);
        toast({
          title: "Error",
          description: `Failed to save payment methods: ${error.error || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving payment methods:", error);
      setPaymentMethods(paymentMethods);
      toast({
        title: "Error",
        description: "Error saving payment methods. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveCourseConfig = async () => {
    try {
      const response = await fetch("/api/admin/course-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseConfig)
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Course configuration saved successfully!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: `Failed to save course configuration: ${error.error || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving course config:", error);
      toast({
        title: "Error",
        description: "Error saving course configuration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveDiscoverSectionConfig = async () => {
    try {
      const response = await fetch("/api/admin/discover-section-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discoverSectionConfig)
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Discover section visibility updated successfully!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || 'Failed to save discover section configuration',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving discover section config:", error);
      toast({
        title: "Error",
        description: "Error saving discover section configuration. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Admin Payment Methods Handlers
  const handleAddAdminUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    const adminUserId = localStorage.getItem('userId');
    if (!adminUserId || !adminUpiForm.upiId) return;

    try {
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adminUserId,
          type: 'upi',
          upiId: adminUpiForm.upiId,
          upiProvider: adminUpiForm.upiProvider,
          displayName: adminUpiForm.displayName || `${adminUpiForm.upiProvider} - ${adminUpiForm.upiId}`,
          isDefault: adminPaymentMethods.length === 0
        })
      });

      if (response.ok) {
        toast({ title: "Success", description: "Admin UPI added successfully!" });
        setAdminUpiForm({ upiId: '', upiProvider: 'phonepe', displayName: '' });
        // Refetch admin payment methods
        const methodsRes = await fetch(`/api/payment-methods/${adminUserId}`);
        const methods = await methodsRes.json();
        setAdminPaymentMethods(methods || []);
      } else {
        throw new Error('Failed to add UPI');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add UPI payment method", variant: "destructive" });
    }
  };

  const handleAddAdminCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const adminUserId = localStorage.getItem('userId');
    if (!adminUserId || !adminCardForm.cardNumber) return;

    try {
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adminUserId,
          type: 'card',
          cardNumber: adminCardForm.cardNumber,
          cardType: adminCardForm.cardType,
          displayName: adminCardForm.displayName || `${adminCardForm.cardType.toUpperCase()} - ****${adminCardForm.cardNumber.slice(-4)}`,
          isDefault: adminPaymentMethods.length === 0
        })
      });

      if (response.ok) {
        toast({ title: "Success", description: "Admin card added successfully!" });
        setAdminCardForm({ cardNumber: '', cardType: 'visa', displayName: '' });
        // Refetch admin payment methods
        const methodsRes = await fetch(`/api/payment-methods/${adminUserId}`);
        const methods = await methodsRes.json();
        setAdminPaymentMethods(methods || []);
      } else {
        throw new Error('Failed to add card');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add card payment method", variant: "destructive" });
    }
  };

  const handleAddAdminStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    const adminUserId = localStorage.getItem('userId');
    if (!adminUserId || !adminStripeForm.stripeAccountId) return;

    try {
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adminUserId,
          type: 'stripe',
          stripeAccountId: adminStripeForm.stripeAccountId,
          displayName: adminStripeForm.displayName || `Stripe - ${adminStripeForm.stripeAccountId}`,
          isDefault: adminPaymentMethods.length === 0
        })
      });

      if (response.ok) {
        toast({ title: "Success", description: "Admin Stripe account added successfully!" });
        setAdminStripeForm({ stripeAccountId: '', displayName: '' });
        // Refetch admin payment methods
        const methodsRes = await fetch(`/api/payment-methods/${adminUserId}`);
        const methods = await methodsRes.json();
        setAdminPaymentMethods(methods || []);
      } else {
        throw new Error('Failed to add Stripe');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add Stripe payment method", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* TURN Server Infrastructure Warning Banner */}
        {(!import.meta.env.VITE_TURN_SERVER_URL || 
          import.meta.env.VITE_TURN_SERVER_URL?.includes('expressturn') ||
          import.meta.env.VITE_TURN_SERVER_URL?.includes('cloudflare')) && (
          <div 
            className="relative overflow-hidden bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 p-6 rounded-2xl shadow-2xl border-4 border-red-700 animate-pulse" 
            data-testid="turn-server-warning"
          >
            <div className="absolute inset-0 bg-red-900 opacity-10"></div>
            <div className="relative z-10 flex items-start gap-6">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-16 w-16 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-black text-white uppercase tracking-wider">
                    ⚠️ CRITICAL: TEMPORARY TURN SERVER INFRASTRUCTURE
                  </h2>
                  <Badge className="bg-red-800 text-white text-lg px-4 py-1 font-bold">
                    ACTION REQUIRED
                  </Badge>
                </div>
                <p className="text-white text-xl font-semibold mb-2 leading-relaxed">
                  🔒 <span className="underline font-black">STUDENT DATA PRIVACY RISK</span>: Your TURN server is {!import.meta.env.VITE_TURN_SERVER_URL ? 'NOT CONFIGURED' : 'using third-party infrastructure that can see student/teacher IP addresses and session metadata'}.
                </p>
                <p className="text-white text-lg font-medium mb-4 leading-relaxed">
                  Educational platforms require <span className="font-bold">self-hosted infrastructure</span> for data sovereignty, GDPR/COPPA compliance, and 99.999% reliability.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-red-800/50 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30">
                    <h3 className="text-white font-bold text-lg mb-2">📊 Current Status:</h3>
                    <ul className="text-white text-sm space-y-1">
                      <li>✓ STUN: Google Public (OK)</li>
                      <li>❌ TURN: {!import.meta.env.VITE_TURN_SERVER_URL ? 'NOT CONFIGURED' : 'Free Tier (ExpressTURN/Cloudflare)'}</li>
                      <li>❌ SLA: None (Free tier)</li>
                      <li>❌ Multi-Region: No</li>
                      <li>❌ DDoS Protection: No</li>
                    </ul>
                  </div>
                  <div className="bg-amber-700/50 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30">
                    <h3 className="text-white font-bold text-lg mb-2">✅ Required Solution:</h3>
                    <ul className="text-white text-sm space-y-1">
                      <li>✓ TURN: Self-hosted Azure VM</li>
                      <li>✓ Privacy: Full data control</li>
                      <li>✓ Setup Time: 30 minutes (UI)</li>
                      <li>✓ GDPR/COPPA: Compliant</li>
                      <li>✓ Cost: ~$30-50/month (Single VM)</li>
                    </ul>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/admin/webrtc-infrastructure">
                    <Button 
                      size="lg" 
                      className="bg-white text-red-700 hover:bg-red-100 font-black text-lg px-8 py-6 shadow-xl"
                      data-testid="button-webrtc-infrastructure"
                    >
                      <Activity className="mr-2 h-6 w-6" />
                      View Infrastructure Metrics
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="bg-white/20 backdrop-blur-sm text-white border-2 border-white hover:bg-white/30 font-bold text-lg px-8 py-6"
                    onClick={() => window.open('/docs/azure-coturn-ui-setup-guide.md', '_blank')}
                    data-testid="button-azure-setup-guide"
                  >
                    🚀 Azure Setup Guide (UI)
                  </Button>
                  <div className="flex items-center gap-2 text-white font-bold text-lg ml-auto">
                    <Clock className="h-5 w-5" />
                    <span>Migrate by: TBD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Ultra Modern Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 p-8 rounded-3xl shadow-2xl border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Admin Dashboard 🛡️</h1>
                <p className="text-orange-100 text-xl font-medium">Monitor system performance, manage users, and oversee platform operations</p>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 text-center min-w-[120px]">
                  <div className="text-white text-3xl font-bold">
                    {stats?.totalUsers || 0}
                  </div>
                  <div className="text-orange-100 text-sm font-medium">Total Users</div>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 text-center min-w-[120px]">
                  <div className="text-white text-3xl font-bold">
                    {stats?.activeClasses || 0}
                  </div>
                  <div className="text-orange-100 text-sm font-medium">Active Classes</div>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 text-center min-w-[120px]">
                  <div className="text-white text-3xl font-bold">
                    ₹{stats?.monthlyRevenue || 0}
                  </div>
                  <div className="text-orange-100 text-sm font-medium">Monthly Revenue</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl"></div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all duration-300" onClick={() => handleViewDetails('users')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 rounded-2xl p-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalUsers?.toLocaleString() || '0'}</p>
                  <p className="text-xs text-blue-600 font-medium">
                    {stats.totalMentors} mentors, {stats.totalStudents} students
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-xl border-0 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all duration-300" onClick={() => handleViewDetails('classes')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-600 rounded-2xl p-4">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Classes</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.activeClasses}</p>
                  <p className="text-xs text-green-600 font-medium">
                    {stats.totalBookings?.toLocaleString() || '0'} total bookings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all duration-300" onClick={() => handleViewDetails('revenue')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-600 rounded-2xl p-4">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-gray-800">₹{stats.monthlyRevenue?.toLocaleString() || '0'}</p>
                  <p className="text-xs text-green-600 font-medium">+12% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-xl border-0 bg-gradient-to-br from-orange-50 to-red-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all duration-300" onClick={() => handleViewDetails('performance')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-orange-600 rounded-2xl p-4">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.completionRate}%</p>
                  <p className="text-xs text-orange-600 font-medium">
                    Avg rating: {stats.averageRating}⭐
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Issues */}
        {alerts.length > 0 && (
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-600 to-pink-700 text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <AlertTriangle className="h-6 w-6" />
                System Alerts
                <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                  {alerts.length} active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-6 rounded-2xl border-l-4 shadow-lg hover:shadow-xl transition-all duration-300 ${
                      alert.type === 'error' ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-400' :
                      alert.type === 'warning' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400' :
                      'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-800 mb-2">{alert.title}</h4>
                        <p className="text-gray-700 leading-relaxed mb-3">{alert.message}</p>
                        <div className="bg-white/70 px-3 py-2 rounded-lg w-fit">
                          <p className="text-xs font-medium text-gray-600">
                            {alert.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="lg" 
                        variant="outline"
                        onClick={() => handleResolveAlert(alert.id)}
                        className="ml-4 hover:bg-green-50 hover:border-green-300 hover:text-green-700 rounded-xl"
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
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Settings className="h-6 w-6" />
              Admin Configuration
            </CardTitle>
          </CardHeader>
        <CardContent>
          <Tabs defaultValue="contact" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="contact">Contact Settings</TabsTrigger>
              <TabsTrigger value="payment">Payment Configuration</TabsTrigger>
              <TabsTrigger value="course">Course Configuration</TabsTrigger>
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
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
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
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
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
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
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
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
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
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
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

            <TabsContent value="course" className="space-y-6">
              <div className="border rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                    Course Default Settings
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure default limits for all courses on the platform. Teachers can use these defaults when creating courses.
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <Label htmlFor="max-students" className="text-sm font-medium mb-2 block">
                        Maximum Students Per Course
                      </Label>
                      <p className="text-xs text-gray-600 mb-3">
                        Default maximum number of students allowed to enroll in a course
                      </p>
                      <Input
                        id="max-students"
                        type="number"
                        min="1"
                        max="100"
                        value={courseConfig.maxStudentsPerCourse}
                        onChange={(e) => setCourseConfig(prev => ({ 
                          ...prev, 
                          maxStudentsPerCourse: parseInt(e.target.value) || 8 
                        }))}
                        className="max-w-xs"
                        data-testid="input-max-students"
                      />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <Label htmlFor="max-classes" className="text-sm font-medium mb-2 block">
                        Maximum Classes Per Course
                      </Label>
                      <p className="text-xs text-gray-600 mb-3">
                        Default maximum number of classes in a course
                      </p>
                      <Input
                        id="max-classes"
                        type="number"
                        min="1"
                        max="50"
                        value={courseConfig.maxClassesPerCourse}
                        onChange={(e) => setCourseConfig(prev => ({ 
                          ...prev, 
                          maxClassesPerCourse: parseInt(e.target.value) || 8 
                        }))}
                        className="max-w-xs"
                        data-testid="input-max-classes"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={saveCourseConfig} data-testid="button-save-course-config">
                    <Lock className="h-4 w-4 mr-2" />
                    Save Course Configuration
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Bell className="h-6 w-6" />
                Recent Activities
                <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                  {recentActivities.length} recent
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-800 mb-1">{activity.action}</p>
                        <p className="text-sm text-teal-600 font-medium">{activity.user}</p>
                      </div>
                      <div className="bg-white/70 px-3 py-1 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Settings className="h-6 w-6" />
                Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-user-management"
                  onClick={() => window.location.href = '/admin/user-management'}
                >
                  <UserCheck className="h-8 w-8 mb-2 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold">User Management</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-mentor-approval"
                  onClick={() => window.location.href = '/admin/mentor-approval'}
                >
                  <Shield className="h-8 w-8 mb-2 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold">Mentor Approval</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-cyan-50 hover:border-cyan-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-azure-metrics"
                  onClick={() => window.location.href = '/admin/azure-metrics'}
                >
                  <Activity className="h-8 w-8 mb-2 text-cyan-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold">Azure Metrics</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-green-50 hover:border-green-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-system-reports"
                  onClick={() => setShowSystemReports(!showSystemReports)}
                >
                  <BarChart3 className="h-8 w-8 mb-2 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold">System Reports</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-platform-settings"
                  onClick={() => setShowPlatformSettings(!showPlatformSettings)}
                >
                  <Settings className="h-8 w-8 mb-2 text-orange-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold">Platform Settings</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group bg-blue-50/50" 
                  data-testid="button-teacher-media-approval"
                  onClick={() => window.location.href = '/admin/teacher-media-approval'}
                >
                  <FileImage className="h-8 w-8 mb-2 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold text-sm">Teacher Media Approval</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group bg-orange-50/50" 
                  data-testid="button-ai-moderation-review"
                  onClick={() => window.location.href = '/admin/moderation-review'}
                >
                  <AlertTriangle className="h-8 w-8 mb-2 text-orange-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold text-sm">AI Moderation Review</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-green-50 hover:border-green-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group bg-green-50/50" 
                  data-testid="button-whitelist-management"
                  onClick={() => window.location.href = '/admin/whitelist-management'}
                >
                  <CheckCircle className="h-8 w-8 mb-2 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold text-sm">Whitelist Management</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-payment-config"
                  onClick={() => window.location.href = '/admin/payment-config'}
                >
                  <DollarSign className="h-8 w-8 mb-2 text-indigo-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold text-sm">Payment Config</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-ai-analytics"
                  onClick={() => window.location.href = '/admin/analytics'}
                >
                  <Brain className="h-8 w-8 mb-2 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold text-sm">AI Analytics</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-sky-50 hover:border-sky-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-cloud-deployments"
                  onClick={() => window.location.href = '/admin/cloud-deployments'}
                >
                  <Cloud className="h-8 w-8 mb-2 text-sky-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold text-sm">Cloud Deployments</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-teal-50 hover:border-teal-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-code-mapping"
                  onClick={() => window.location.href = '/admin/code-mapping'}
                >
                  <Map className="h-8 w-8 mb-2 text-teal-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold text-sm">Code Mapping</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-amber-50 hover:border-amber-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-test-management"
                  onClick={() => window.location.href = '/admin/test-management'}
                >
                  <TestTube className="h-8 w-8 mb-2 text-amber-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold text-sm">Unit & System Tests</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-finance-dashboard"
                  onClick={() => window.location.href = '/admin/finance-dashboard'}
                >
                  <TrendingUp className="h-8 w-8 mb-2 text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold text-sm">Finance Dashboard</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-storage-config"
                  onClick={() => window.location.href = '/admin/storage-config'}
                >
                  <Building className="h-8 w-8 mb-2 text-slate-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold text-sm">Storage Config</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-red-50 hover:border-red-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-abusive-incidents"
                  onClick={() => window.location.href = '/admin/abusive-incidents'}
                >
                  <AlertTriangle className="h-8 w-8 mb-2 text-red-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold text-sm">Abusive Incidents</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-violet-50 hover:border-violet-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-review-appeals"
                  onClick={() => window.location.href = '/admin/review-appeals'}
                >
                  <Shield className="h-8 w-8 mb-2 text-violet-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold text-sm">Review Appeals</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-pink-50 hover:border-pink-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-ui-config"
                  onClick={() => window.location.href = '/admin/ui-config'}
                >
                  <Settings className="h-8 w-8 mb-2 text-pink-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold text-sm">UI Configuration</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 p-4 flex-col hover:bg-lime-50 hover:border-lime-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 rounded-2xl group" 
                  data-testid="button-booking-limits"
                  onClick={() => window.location.href = '/admin/booking-limits-config'}
                >
                  <Calendar className="h-8 w-8 mb-2 text-lime-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-bold text-sm">Booking Limits</span>
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
                <h4 className="font-medium text-blue-900 mb-2">👥 Total Users</h4>
                <p className="text-2xl font-bold text-blue-700">{stats.totalUsers?.toLocaleString() || '0'}</p>
                <p className="text-sm text-blue-600">{stats.totalMentors || 0} mentors, {stats.totalStudents || 0} students</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">💵 Monthly Revenue</h4>
                <p className="text-2xl font-bold text-green-700">₹{stats.monthlyRevenue?.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-green-600">Current month earnings</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">📚 Total Bookings</h4>
                <p className="text-2xl font-bold text-purple-700">{stats.totalBookings?.toLocaleString() || '0'}</p>
                <p className="text-sm text-purple-600">{stats.completedBookings || 0} completed</p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-900 mb-2">✅ Completion Rate</h4>
                <p className="text-2xl font-bold text-orange-700">{stats.completionRate?.toFixed(1) || '0'}%</p>
                <p className="text-sm text-orange-600">Of all bookings</p>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">📊 Platform Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Mentors</span>
                    <span className="font-medium">{stats.totalMentors || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Students</span>
                    <span className="font-medium">{stats.totalStudents || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed Sessions</span>
                    <span className="font-medium">{stats.completedBookings || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Classes</span>
                    <span className="font-medium">{stats.activeClasses || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">🎯 Performance Overview</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="font-medium">{stats.totalUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Bookings</span>
                    <span className="font-medium">{stats.totalBookings || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Sessions</span>
                    <span className="font-medium">{stats.activeClasses || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="font-medium">{stats.completionRate?.toFixed(1) || '0'}%</span>
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

                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Show "Discover Mentors" Section</span>
                    <Switch 
                      checked={discoverSectionConfig.isVisible}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setDiscoverSectionConfig({ ...discoverSectionConfig, isVisible: checked });
                        } else {
                          setDiscoverSectionConfig({ isVisible: false, specialCode: '' });
                          saveDiscoverSectionConfig();
                        }
                      }}
                      data-testid="switch-discover-section" 
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Controls visibility of the "Discover Amazing Mentors" section on the landing page</p>
                  
                  {discoverSectionConfig.isVisible && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <Label htmlFor="special-code" className="text-sm font-medium">Special Code (Required)</Label>
                      <div className="flex gap-2 mt-2">
                        <Input 
                          id="special-code"
                          type="text"
                          placeholder="Enter CODE2025"
                          value={discoverSectionConfig.specialCode}
                          onChange={(e) => setDiscoverSectionConfig({ ...discoverSectionConfig, specialCode: e.target.value })}
                          className="flex-1"
                          data-testid="input-special-code"
                        />
                        <Button 
                          onClick={saveDiscoverSectionConfig}
                          size="sm"
                          data-testid="button-save-discover-config"
                        >
                          Apply
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Enter the special code to enable this section</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-lg">📊 Platform Statistics</h4>
                
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium mb-2">User Statistics</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Users</span>
                      <span className="font-medium">{stats.totalUsers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Mentors</span>
                      <span className="font-medium">{stats.totalMentors || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Students</span>
                      <span className="font-medium">{stats.totalStudents || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium mb-2">Booking Statistics</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Bookings</span>
                      <span className="font-medium">{stats.totalBookings || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Completed Bookings</span>
                      <span className="font-medium">{stats.completedBookings || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Classes</span>
                      <span className="font-medium">{stats.activeClasses || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Completion Rate</span>
                      <span className="font-medium">{stats.completionRate?.toFixed(1) || '0'}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium mb-2">Revenue Statistics</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Revenue</span>
                      <span className="font-medium">₹{stats.monthlyRevenue?.toFixed(2) || '0.00'}</span>
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

      {/* Quick Navigation / Admin Actions Section */}
      <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-700 text-white">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Settings className="h-6 w-6" />
            Quick Navigation & System Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="w-full h-auto py-4 hover:bg-emerald-50 hover:border-emerald-400 transition-all" 
              data-testid="button-nav-system-health"
              onClick={() => {
                // Scroll to System Health Monitoring section
                document.getElementById('system-health-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <div className="flex items-center gap-3 w-full">
                <Activity className="h-5 w-5 text-emerald-600" />
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900">System Health Monitoring</div>
                  <div className="text-xs text-gray-600">Monitor real-time system metrics</div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full h-auto py-4 hover:bg-blue-50 hover:border-blue-400 transition-all" 
              data-testid="button-nav-function-mapping"
              onClick={() => {
                setShowFunctionMapping(!showFunctionMapping);
                setShowUnitTests(false);
                setShowSystemTests(false);
                setShowLoadTesting(false);
              }}
            >
              <div className="flex items-center gap-3 w-full">
                <Map className="h-5 w-5 text-blue-600" />
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900">Application Function Mapping</div>
                  <div className="text-xs text-gray-600">View code & API mappings</div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full h-auto py-4 hover:bg-purple-50 hover:border-purple-400 transition-all" 
              data-testid="button-nav-unit-tests"
              onClick={() => {
                setShowUnitTests(!showUnitTests);
                setShowFunctionMapping(false);
                setShowSystemTests(false);
                setShowLoadTesting(false);
              }}
            >
              <div className="flex items-center gap-3 w-full">
                <TestTube className="h-5 w-5 text-purple-600" />
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900">Unit Test Cases</div>
                  <div className="text-xs text-gray-600">Review & run unit tests</div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full h-auto py-4 hover:bg-indigo-50 hover:border-indigo-400 transition-all" 
              data-testid="button-nav-system-tests"
              onClick={() => {
                setShowSystemTests(!showSystemTests);
                setShowFunctionMapping(false);
                setShowUnitTests(false);
                setShowLoadTesting(false);
              }}
            >
              <div className="flex items-center gap-3 w-full">
                <Shield className="h-5 w-5 text-indigo-600" />
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900">System Test Cases</div>
                  <div className="text-xs text-gray-600">End-to-end system tests</div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full h-auto py-4 hover:bg-orange-50 hover:border-orange-400 transition-all" 
              data-testid="button-nav-load-testing"
              onClick={() => {
                setShowLoadTesting(!showLoadTesting);
                setShowFunctionMapping(false);
                setShowUnitTests(false);
                setShowSystemTests(false);
              }}
            >
              <div className="flex items-center gap-3 w-full">
                <Zap className="h-5 w-5 text-orange-600" />
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900">Load Testing Strategy</div>
                  <div className="text-xs text-gray-600">Performance & load analysis</div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full h-auto py-4 hover:bg-cyan-50 hover:border-cyan-400 transition-all" 
              data-testid="button-nav-system-monitoring"
              onClick={() => {
                // Scroll to System Testing & Monitoring section
                document.getElementById('system-testing-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <div className="flex items-center gap-3 w-full">
                <Monitor className="h-5 w-5 text-cyan-600" />
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900">System Testing & Monitoring</div>
                  <div className="text-xs text-gray-600">Comprehensive monitoring dashboard</div>
                </div>
              </div>
            </Button>

            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full h-auto py-4 hover:bg-violet-50 hover:border-violet-400 transition-all" data-testid="button-nav-ai-analytics">
                <div className="flex items-center gap-3 w-full">
                  <Brain className="h-5 w-5 text-violet-600" />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900">AI Analytics</div>
                    <div className="text-xs text-gray-600">Advanced AI-powered insights</div>
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/admin/cloud-deployments">
              <Button variant="outline" className="w-full h-auto py-4 hover:bg-sky-50 hover:border-sky-400 transition-all" data-testid="button-nav-cloud-deployments">
                <div className="flex items-center gap-3 w-full">
                  <Cloud className="h-5 w-5 text-sky-600" />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900">Cloud Deployment</div>
                    <div className="text-xs text-gray-600">Multi-cloud deployment management</div>
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/admin/finance-dashboard">
              <Button variant="outline" className="w-full h-auto py-4 hover:bg-green-50 hover:border-green-400 transition-all" data-testid="button-nav-finance-dashboard">
                <div className="flex items-center gap-3 w-full">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900">Finance Dashboard</div>
                    <div className="text-xs text-gray-600">Financial analytics & reports</div>
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/admin/payment-config">
              <Button variant="outline" className="w-full h-auto py-4 hover:bg-amber-50 hover:border-amber-400 transition-all" data-testid="button-nav-payment-config">
                <div className="flex items-center gap-3 w-full">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900">Payment Configuration</div>
                    <div className="text-xs text-gray-600">Configure payment gateways & methods</div>
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Links */}
      <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Settings className="h-6 w-6" />
            Navigation Links
          </CardTitle>
          <CardDescription className="text-white/90">
            Direct access to system pages and utilities
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
            <Link href="/admin/booking-limits-config">
              <Button variant="outline" className="w-full" data-testid="button-nav-booking-limits">
                <Calendar className="w-4 h-4 mr-2" />
                📅 Booking Limits
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
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Section Controls */}
      <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-violet-600 to-fuchsia-700 text-white">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Settings className="h-6 w-6" />
            Dashboard Section Controls
          </CardTitle>
          <CardDescription className="text-white/90">
            Control which sections appear on teacher and student dashboards
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {controlsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
              <span className="ml-2 text-sm text-gray-600">Loading controls...</span>
            </div>
          ) : (
            <div className="space-y-6">
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

      {/* System Health */}
      <Card id="system-health-section" className="modern-card modern-card-green overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <CardTitle className="flex items-center gap-3 text-xl">
            <TrendingUp className="h-6 w-6" />
            System Health Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {systemHealth.map((health: any) => {
              const bgColor = health.status === 'operational' ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 
                             health.status === 'optimal' ? 'bg-gradient-to-br from-blue-50 to-cyan-50' :
                             'bg-gradient-to-br from-yellow-50 to-amber-50';
              const borderColor = health.status === 'operational' ? 'border-green-300 shadow-green-100' : 
                                 health.status === 'optimal' ? 'border-blue-300 shadow-blue-100' :
                                 'border-yellow-300 shadow-amber-100';
              const dotColor = health.status === 'operational' ? 'bg-green-500' : 
                              health.status === 'optimal' ? 'bg-blue-500' :
                              'bg-yellow-500';
              
              return (
                <div key={health.service} className={`p-6 ${bgColor} rounded-xl border-2 ${borderColor} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-4 h-4 ${dotColor} rounded-full animate-pulse`}></div>
                    <span className="font-semibold text-gray-800">{health.service}</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium mb-1">{health.description}</p>
                  <p className="text-xs text-gray-600">{health.metric}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Application Mapping Table */}
      {showFunctionMapping && (
      <Card className="modern-card modern-card-purple overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Settings className="h-6 w-6" />
            Application Function Mapping
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                  <th className="px-6 py-4 text-left font-semibold text-blue-900 border-r border-blue-200">Function Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-blue-900 border-r border-blue-200">HTML Page</th>
                  <th className="px-6 py-4 text-left font-semibold text-blue-900 border-r border-blue-200">JavaScript Filename</th>
                  <th className="px-6 py-4 text-left font-semibold text-blue-900 border-r border-blue-200">JavaScript Function</th>
                  <th className="px-6 py-4 text-left font-semibold text-blue-900 border-r border-blue-200">API Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-blue-900">Database Table</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-blue-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">User Authentication</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">login.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">login.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200 font-mono text-sm">handleLogin()</td>
                  <td className="px-6 py-4 text-blue-600 border-r border-gray-200 font-mono text-sm">/api/auth/login</td>
                  <td className="px-6 py-4 text-green-600 font-mono text-sm">users</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors duration-200 bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">User Registration</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">signup.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">signup.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200 font-mono text-sm">handleSignup()</td>
                  <td className="px-6 py-4 text-blue-600 border-r border-gray-200 font-mono text-sm">/api/auth/signup</td>
                  <td className="px-6 py-4 text-green-600 font-mono text-sm">users, teacher_profiles</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Password Reset</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">forgot-password.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">forgot-password.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200 font-mono text-sm">handleSendCode()</td>
                  <td className="px-6 py-4 text-blue-600 border-r border-gray-200 font-mono text-sm">/api/auth/forgot-password</td>
                  <td className="px-6 py-4 text-green-600 font-mono text-sm">users</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors duration-200 bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Mentor Booking</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">mentor-profile.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">mentor-profile.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200 font-mono text-sm">handleBookSession()</td>
                  <td className="px-6 py-4 text-blue-600 border-r border-gray-200 font-mono text-sm">/api/bookings</td>
                  <td className="px-6 py-4 text-green-600 font-mono text-sm">bookings, mentors, students</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Course Creation</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">create-course.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">create-course.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200 font-mono text-sm">handleCreateCourse()</td>
                  <td className="px-6 py-4 text-blue-600 border-r border-gray-200 font-mono text-sm">/api/courses</td>
                  <td className="px-6 py-4 text-green-600 font-mono text-sm">courses, mentors</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors duration-200 bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Student Progress</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">student-dashboard.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">student-dashboard.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200 font-mono text-sm">fetchProgress()</td>
                  <td className="px-6 py-4 text-blue-600 border-r border-gray-200 font-mono text-sm">/api/students/progress</td>
                  <td className="px-6 py-4 text-green-600 font-mono text-sm">students, achievements</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Video Sessions</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">video-session.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">video-session.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200 font-mono text-sm">startVideoCall()</td>
                  <td className="px-6 py-4 text-blue-600 border-r border-gray-200 font-mono text-sm">/api/video-sessions</td>
                  <td className="px-6 py-4 text-green-600 font-mono text-sm">video_sessions, bookings</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors duration-200 bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Payment Processing</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">payment.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">payment.tsx</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200 font-mono text-sm">processPayment()</td>
                  <td className="px-6 py-4 text-blue-600 border-r border-gray-200 font-mono text-sm">/api/payments</td>
                  <td className="px-6 py-4 text-green-600 font-mono text-sm">payments, bookings</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Unit Test Cases Table */}
      {showUnitTests && (
      <Card className="modern-card modern-card-blue backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Shield className="h-6 w-6" />
            Unit Test Cases
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                  <th className="px-6 py-4 text-left font-semibold text-green-900 border-r border-green-200">UI Page</th>
                  <th className="px-6 py-4 text-left font-semibold text-green-900 border-r border-green-200">Button/Link Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-green-900 border-r border-green-200">Unit Test Case</th>
                  <th className="px-6 py-4 text-left font-semibold text-green-900">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-green-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Login Page</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Sign In Button</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Should authenticate valid credentials</td>
                  <td className="px-6 py-4"><Badge className="bg-green-100 text-green-800 font-semibold">Pass</Badge></td>
                </tr>
                <tr className="hover:bg-green-50 transition-colors duration-200 bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Login Page</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Sign In Button</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Should reject invalid credentials</td>
                  <td className="px-6 py-4"><Badge className="bg-green-100 text-green-800 font-semibold">Pass</Badge></td>
                </tr>
                <tr className="hover:bg-green-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Signup Page</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Create Account Button</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Should create new user account</td>
                  <td className="px-6 py-4"><Badge className="bg-green-100 text-green-800 font-semibold">Pass</Badge></td>
                </tr>
                <tr className="hover:bg-green-50 transition-colors duration-200 bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Teacher Dashboard</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Teacher Profile Button</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Should display qualification details</td>
                  <td className="px-6 py-4"><Badge className="bg-green-100 text-green-800 font-semibold">Pass</Badge></td>
                </tr>
                <tr className="hover:bg-green-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Student Dashboard</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Run All Tests Button</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Should execute with student credentials</td>
                  <td className="px-6 py-4"><Badge className="bg-green-100 text-green-800 font-semibold">Pass</Badge></td>
                </tr>
                <tr className="hover:bg-green-50 transition-colors duration-200 bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Admin Dashboard</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Contact Settings Toggle</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Should save configuration changes</td>
                  <td className="px-6 py-4"><Badge className="bg-yellow-100 text-yellow-800 font-semibold">Pending</Badge></td>
                </tr>
                <tr className="hover:bg-green-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Forgot Password</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Send Reset Code Button</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Should send email with reset code</td>
                  <td className="px-6 py-4"><Badge className="bg-green-100 text-green-800 font-semibold">Pass</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* System Test Cases Table */}
      {showSystemTests && (
      <Card className="modern-card modern-card-blue backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-700 text-white">
          <CardTitle className="flex items-center gap-3 text-xl">
            <BarChart3 className="h-6 w-6" />
            System Test Cases
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-violet-50 border-b-2 border-purple-200">
                  <th className="px-6 py-4 text-left font-semibold text-purple-900 border-r border-purple-200">UI Page</th>
                  <th className="px-6 py-4 text-left font-semibold text-purple-900 border-r border-purple-200">Button/Link Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-purple-900 border-r border-purple-200">System Test Case</th>
                  <th className="px-6 py-4 text-left font-semibold text-purple-900">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-purple-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Login Page</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Sign In Button</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">End-to-end authentication flow with database</td>
                  <td className="px-6 py-4"><Badge className="bg-green-100 text-green-800 font-semibold">Pass</Badge></td>
                </tr>
                <tr className="hover:bg-purple-50 transition-colors duration-200 bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Mentor Booking</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Book Session Button</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Complete booking workflow with payment integration</td>
                  <td className="px-6 py-4"><Badge className="bg-red-100 text-red-800 font-semibold">Fail</Badge></td>
                </tr>
                <tr className="hover:bg-purple-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Video Session</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Start Video Call</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Video call initialization and connection</td>
                  <td className="px-6 py-4"><Badge className="bg-yellow-100 text-yellow-800 font-semibold">Pending</Badge></td>
                </tr>
                <tr className="hover:bg-purple-50 transition-colors duration-200 bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Teacher Dashboard</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Create Course Button</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Course creation with teacher profile validation</td>
                  <td className="px-6 py-4"><Badge className="bg-green-100 text-green-800 font-semibold">Pass</Badge></td>
                </tr>
                <tr className="hover:bg-purple-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Student Dashboard</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Progress View</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Student progress tracking across multiple sessions</td>
                  <td className="px-6 py-4"><Badge className="bg-green-100 text-green-800 font-semibold">Pass</Badge></td>
                </tr>
                <tr className="hover:bg-purple-50 transition-colors duration-200 bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Admin Dashboard</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">System Monitoring</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Real-time system health and performance monitoring</td>
                  <td className="px-6 py-4"><Badge className="bg-yellow-100 text-yellow-800 font-semibold">Pending</Badge></td>
                </tr>
                <tr className="hover:bg-purple-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-gray-800 border-r border-gray-200 font-medium">Chat System</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Send Message</td>
                  <td className="px-6 py-4 text-gray-600 border-r border-gray-200">Real-time chat messaging between mentor and student</td>
                  <td className="px-6 py-4"><Badge className="bg-yellow-100 text-yellow-800 font-semibold">Pending</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Load Testing Strategy Documentation */}
      {showLoadTesting && (
      <Card className="modern-card modern-card-blue backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-600 to-red-700 text-white">
          <CardTitle className="flex items-center gap-3 text-xl">
            <TrendingUp className="h-6 w-6" />
            Load Testing Strategy - 3K Concurrent Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
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
      )}

      {/* System Testing */}
      <Card id="system-testing-section" className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-700 text-white">
            <CardTitle className="flex items-center gap-3 text-xl">
              <BarChart3 className="h-6 w-6" />
              System Testing & Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 mb-6">
              <p className="text-gray-700 font-medium mb-4">Run comprehensive system tests with admin privileges to ensure all platform features work properly</p>
              <Button 
                onClick={async () => {
                  setIsRunningTests(true);
                  setTestResults(null);
                  
                  try {
                    const response = await fetch('/api/test/run-all', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ 
                        testType: 'system', 
                        userRole: 'admin' 
                      }),
                    });
                    
                    if (response.ok) {
                      const results = await response.json();
                      setTestResults(results);
                      console.log('🧪 Test results:', results);
                    }
                  } catch (error) {
                    console.error('Failed to run tests:', error);
                  } finally {
                    setIsRunningTests(false);
                  }
                }}
                disabled={isRunningTests}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-xl disabled:opacity-50"
                data-testid="button-run-all-tests-admin"
              >
                {isRunningTests ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    <span>Running comprehensive tests...</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-6 w-6 mr-3" />
                    Run All Tests (Admin)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="capitalize">{detailCategory} Details</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDetailModal(false)}
                data-testid="button-close-detail-modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {detailCategory === 'users' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">All Users</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">ID</th>
                        <th className="border border-gray-300 p-2 text-left">Name</th>
                        <th className="border border-gray-300 p-2 text-left">Email</th>
                        <th className="border border-gray-300 p-2 text-left">Role</th>
                        <th className="border border-gray-300 p-2 text-left">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.map((user: any) => (
                        <tr key={user.id}>
                          <td className="border border-gray-300 p-2">{user.id}</td>
                          <td className="border border-gray-300 p-2">{user.firstName} {user.lastName}</td>
                          <td className="border border-gray-300 p-2">{user.email}</td>
                          <td className="border border-gray-300 p-2">
                            <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'mentor' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="border border-gray-300 p-2">{user.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {detailCategory === 'classes' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">All Classes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">ID</th>
                        <th className="border border-gray-300 p-2 text-left">Subject</th>
                        <th className="border border-gray-300 p-2 text-left">Mentor</th>
                        <th className="border border-gray-300 p-2 text-left">Student</th>
                        <th className="border border-gray-300 p-2 text-left">Scheduled</th>
                        <th className="border border-gray-300 p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.map((booking: any) => (
                        <tr key={booking.id}>
                          <td className="border border-gray-300 p-2">{booking.id}</td>
                          <td className="border border-gray-300 p-2">{booking.subject}</td>
                          <td className="border border-gray-300 p-2">{booking.mentor}</td>
                          <td className="border border-gray-300 p-2">{booking.student}</td>
                          <td className="border border-gray-300 p-2">{booking.scheduledAt}</td>
                          <td className="border border-gray-300 p-2">
                            <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                              {booking.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {detailCategory === 'revenue' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Revenue Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {detailData.map((item: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{item.period}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Revenue</span>
                            <span className="font-semibold">₹{item.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Transactions</span>
                            <span className="font-semibold">{item.transactions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Avg Per Session</span>
                            <span className="font-semibold">₹{item.avgPerSession}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {detailCategory === 'performance' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {detailData.map((metric: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{metric.metric}</h4>
                          <div className="text-2xl font-bold text-green-600">{metric.value}</div>
                          <div className="text-sm text-gray-600">{metric.trend}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {detailData.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No data available for {detailCategory}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}