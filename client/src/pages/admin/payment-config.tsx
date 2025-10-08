import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  CreditCard,
  Smartphone,
  Settings,
  Save,
  CheckCircle,
  Home,
  RefreshCw,
  TrendingUp,
  Users,
  Percent,
  DollarSign
} from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PaymentConfig {
  paymentMode?: 'dummy' | 'realtime';
  razorpayMode?: 'upi' | 'api_keys';
  enableRazorpay?: boolean;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  adminUpiId?: string;
  stripeEnabled?: boolean;
  stripePublicKey?: string;
  stripeSecretKey?: string;
}

interface TransactionFeeConfig {
  id: string;
  feePercentage: string;
  minimumFee: string;
  maximumFee?: string;
  teacherPayoutWaitHours?: number;
  isActive: boolean;
  description?: string;
}

interface FinanceAnalytics {
  totalAdminRevenue: number;
  totalTeacherPayouts: number;
  totalRefunds: number;
  totalTransactionFees: number;
  conflictAmount: number;
  studentsCount: number;
  teachersCount: number;
}

export default function AdminPaymentConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Form states
  const [paymentMode, setPaymentMode] = useState<'upi' | 'razorpay'>('upi');
  const [adminUpiId, setAdminUpiId] = useState('');
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');

  const [feeForm, setFeeForm] = useState({
    feePercentage: '2.00',
    minimumFee: '0.50',
    maximumFee: '',
    teacherPayoutWaitHours: 24,
    description: 'Standard transaction processing fee'
  });

  // Fetch current payment configuration
  const { data: paymentConfig, isLoading: configLoading } = useQuery({
    queryKey: ['admin-payment-config'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/payment-config');
        const result = await response.json();
        return result as PaymentConfig;
      } catch (error) {
        console.error('Failed to fetch payment config:', error);
        return { 
          paymentMode: 'dummy' as const,
          razorpayMode: 'upi' as const,
          enableRazorpay: false
        };
      }
    },
  });

  // Fetch current transaction fee config
  const { data: currentFeeConfig, isLoading: feeConfigLoading } = useQuery({
    queryKey: ['transaction-fee-config'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/transaction-fee-config');
        const result = await response.json();
        return result as TransactionFeeConfig;
      } catch (error) {
        console.error('Failed to fetch fee config:', error);
        return null;
      }
    },
  });

  // Fetch finance analytics
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
    refetchInterval: 15 * 60 * 1000,
  });

  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      refetchAnalytics();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refetchAnalytics]);

  // Sync form state when config loads
  useEffect(() => {
    if (paymentConfig) {
      // Map backend values to frontend state
      // dummy mode = UPI, realtime mode = Razorpay
      const mappedMode = paymentConfig.paymentMode === 'dummy' ? 'upi' : 'razorpay';
      setPaymentMode(mappedMode);
      setAdminUpiId(paymentConfig.adminUpiId || '');
      setRazorpayKeyId(paymentConfig.razorpayKeyId || '');
      setRazorpayKeySecret(paymentConfig.razorpayKeySecret || '');
    }
  }, [paymentConfig]);

  // Populate fee form when config loads
  useEffect(() => {
    if (currentFeeConfig) {
      setFeeForm({
        feePercentage: currentFeeConfig.feePercentage || '2.00',
        minimumFee: currentFeeConfig.minimumFee || '0.50',
        maximumFee: currentFeeConfig.maximumFee || '',
        teacherPayoutWaitHours: currentFeeConfig.teacherPayoutWaitHours || 24,
        description: currentFeeConfig.description || 'Standard transaction processing fee'
      });
    }
  }, [currentFeeConfig]);

  // Update payment configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: Partial<PaymentConfig>) => {
      return apiRequest('PUT', '/api/admin/payment-config', data);
    },
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "Payment configuration has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Configuration",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Update transaction fee mutation
  const updateFeeMutation = useMutation({
    mutationFn: async (feeData: typeof feeForm) => {
      return apiRequest('POST', '/api/admin/transaction-fee-config', {
        feePercentage: feeData.feePercentage,
        minimumFee: feeData.minimumFee,
        maximumFee: feeData.maximumFee || null,
        teacherPayoutWaitHours: typeof feeData.teacherPayoutWaitHours === 'number' 
          ? feeData.teacherPayoutWaitHours 
          : parseInt(String(feeData.teacherPayoutWaitHours)) || 24,
        description: feeData.description,
        updatedBy: 'admin',
      });
    },
    onSuccess: () => {
      toast({
        title: "Fee Configuration Updated",
        description: "Transaction fee and payout settings have been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['transaction-fee-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Fee Config",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleSavePaymentConfig = () => {
    if (paymentMode === 'upi') {
      if (!adminUpiId || !adminUpiId.includes('@')) {
        toast({
          title: "Invalid UPI ID",
          description: "Please enter a valid UPI ID (e.g., admin@phonepe)",
          variant: "destructive",
        });
        return;
      }
      // UPI mode = dummy payment mode with UPI-based razorpay mode
      updateConfigMutation.mutate({
        paymentMode: 'dummy',
        razorpayMode: 'upi',
        enableRazorpay: false,
        adminUpiId: adminUpiId
      });
    } else {
      if (!razorpayKeyId || !razorpayKeySecret) {
        toast({
          title: "Missing Razorpay Credentials",
          description: "Please enter both Razorpay Key ID and Key Secret",
          variant: "destructive",
        });
        return;
      }
      // Razorpay mode = realtime payment mode with API keys
      updateConfigMutation.mutate({
        paymentMode: 'realtime',
        razorpayMode: 'api_keys',
        enableRazorpay: true,
        razorpayKeyId: razorpayKeyId,
        razorpayKeySecret: razorpayKeySecret
      });
    }
  };

  const handleFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const feePercentageValue = parseFloat(feeForm.feePercentage);
    if (isNaN(feePercentageValue) || feePercentageValue < 0 || feePercentageValue > 100) {
      toast({
        title: "Invalid Fee Percentage",
        description: "Fee percentage must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    const minimumFeeValue = parseFloat(feeForm.minimumFee);
    if (isNaN(minimumFeeValue) || minimumFeeValue < 0) {
      toast({
        title: "Invalid Minimum Fee",
        description: "Minimum fee must be a positive number",
        variant: "destructive",
      });
      return;
    }

    updateFeeMutation.mutate(feeForm);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 mt-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
              <Link href="/" data-testid="link-home">
                <Home className="h-4 w-4 hover:text-primary cursor-pointer" />
              </Link>
              <span>/</span>
              <Link href="/admin/home" data-testid="link-admin">Admin</Link>
              <span>/</span>
              <span>Payment Configuration</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">Payment Configuration</h1>
            <p className="text-muted-foreground">Configure payment mode, transaction fees, and view analytics</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>

        <Tabs defaultValue="payment-mode" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payment-mode" data-testid="tab-payment-mode">Payment Mode</TabsTrigger>
            <TabsTrigger value="transaction-fees" data-testid="tab-transaction-fees">Transaction Fees</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Finance Analytics</TabsTrigger>
          </TabsList>

          {/* Payment Mode Tab */}
          <TabsContent value="payment-mode" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Payment Mode Configuration
                </CardTitle>
                <CardDescription>
                  Choose between UPI ID mode (for testing) or Razorpay mode (for production)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {configLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Select Payment Mode</Label>
                      
                      {/* UPI ID Mode */}
                      <div 
                        className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMode === 'upi' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentMode('upi')}
                        data-testid="radio-payment-mode-upi"
                      >
                        <div className="flex items-center h-5">
                          <input
                            type="radio"
                            name="paymentMode"
                            value="upi"
                            checked={paymentMode === 'upi'}
                            onChange={() => setPaymentMode('upi')}
                            className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                            data-testid="input-payment-mode-upi"
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-base font-medium cursor-pointer flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              UPI ID Mode (Testing)
                            </Label>
                            <Badge variant="secondary">Recommended for Testing</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Direct UPI ID to UPI ID transfers. Admin UPI → Teacher UPI. Simple and fast for testing.
                          </p>
                        </div>
                      </div>

                      {/* Razorpay Mode */}
                      <div 
                        className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMode === 'razorpay' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentMode('razorpay')}
                        data-testid="radio-payment-mode-razorpay"
                      >
                        <div className="flex items-center h-5">
                          <input
                            type="radio"
                            name="paymentMode"
                            value="razorpay"
                            checked={paymentMode === 'razorpay'}
                            onChange={() => setPaymentMode('razorpay')}
                            className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                            data-testid="input-payment-mode-razorpay"
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-base font-medium cursor-pointer flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Razorpay Mode (Production)
                            </Label>
                            <Badge variant="default">Live Payments</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Real payments through Razorpay API. Supports UPI, Cards, Net Banking, Wallets. For production use.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* UPI ID Configuration */}
                    {paymentMode === 'upi' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">Admin UPI Configuration</h3>
                        </div>
                        <Alert>
                          <AlertDescription>
                            <strong>Testing Mode:</strong> Payments will be transferred directly from your UPI ID to teacher's UPI ID. 
                            Make sure to set up your UPI ID below.
                          </AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                          <Label htmlFor="adminUpiId">Admin UPI ID *</Label>
                          <Input
                            id="adminUpiId"
                            type="text"
                            placeholder="admin@phonepe"
                            value={adminUpiId}
                            onChange={(e) => setAdminUpiId(e.target.value)}
                            data-testid="input-admin-upi-id"
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter your UPI ID (e.g., username@phonepe, username@paytm, username@gpay)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Razorpay Configuration */}
                    {paymentMode === 'razorpay' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">Razorpay API Configuration</h3>
                        </div>
                        <Alert>
                          <AlertDescription>
                            <strong>Production Mode:</strong> Real payments through Razorpay. Get your API keys from{' '}
                            <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="underline">
                              Razorpay Dashboard
                            </a>
                          </AlertDescription>
                        </Alert>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="razorpayKeyId">Razorpay Key ID *</Label>
                            <Input
                              id="razorpayKeyId"
                              type="text"
                              placeholder="rzp_test_..."
                              value={razorpayKeyId}
                              onChange={(e) => setRazorpayKeyId(e.target.value)}
                              data-testid="input-razorpay-key-id"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="razorpayKeySecret">Razorpay Key Secret *</Label>
                            <Input
                              id="razorpayKeySecret"
                              type="password"
                              placeholder="Enter key secret"
                              value={razorpayKeySecret}
                              onChange={(e) => setRazorpayKeySecret(e.target.value)}
                              data-testid="input-razorpay-key-secret"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={handleSavePaymentConfig}
                      disabled={updateConfigMutation.isPending}
                      className="w-full"
                      data-testid="button-save-payment-config"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateConfigMutation.isPending ? 'Saving...' : 'Save Payment Configuration'}
                    </Button>

                    {paymentConfig && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-semibold">Current Configuration</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Mode: <Badge variant="outline">{paymentConfig.paymentMode === 'dummy' ? 'UPI ID Mode (Testing)' : 'Razorpay Mode (Production)'}</Badge>
                        </p>
                        {paymentConfig.paymentMode === 'dummy' && paymentConfig.adminUpiId && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Admin UPI: {paymentConfig.adminUpiId}
                          </p>
                        )}
                        {paymentConfig.paymentMode === 'realtime' && paymentConfig.razorpayKeyId && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Razorpay Key ID: {paymentConfig.razorpayKeyId}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transaction Fees Tab */}
          <TabsContent value="transaction-fees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Transaction Fee Configuration
                </CardTitle>
                <CardDescription>
                  Configure platform transaction fees and teacher payout settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFeeSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="feePercentage">Fee Percentage (%) *</Label>
                      <Input
                        id="feePercentage"
                        type="text"
                        placeholder="2.00"
                        value={feeForm.feePercentage}
                        onChange={(e) => setFeeForm({ ...feeForm, feePercentage: e.target.value })}
                        data-testid="input-fee-percentage"
                      />
                      <p className="text-xs text-muted-foreground">Platform commission percentage (e.g., 2.00 for 2%)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minimumFee">Minimum Fee (₹) *</Label>
                      <Input
                        id="minimumFee"
                        type="text"
                        placeholder="0.50"
                        value={feeForm.minimumFee}
                        onChange={(e) => setFeeForm({ ...feeForm, minimumFee: e.target.value })}
                        data-testid="input-minimum-fee"
                      />
                      <p className="text-xs text-muted-foreground">Minimum transaction fee amount</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maximumFee">Maximum Fee (₹)</Label>
                      <Input
                        id="maximumFee"
                        type="text"
                        placeholder="Optional"
                        value={feeForm.maximumFee}
                        onChange={(e) => setFeeForm({ ...feeForm, maximumFee: e.target.value })}
                        data-testid="input-maximum-fee"
                      />
                      <p className="text-xs text-muted-foreground">Optional maximum fee cap</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacherPayoutWaitHours">Payout Wait Time (hours) *</Label>
                      <Input
                        id="teacherPayoutWaitHours"
                        type="number"
                        placeholder="24"
                        value={feeForm.teacherPayoutWaitHours}
                        onChange={(e) => setFeeForm({ ...feeForm, teacherPayoutWaitHours: parseInt(e.target.value) || 24 })}
                        data-testid="input-payout-wait-hours"
                      />
                      <p className="text-xs text-muted-foreground">Hours to wait before releasing teacher payout</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      type="text"
                      placeholder="Standard transaction processing fee"
                      value={feeForm.description}
                      onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                      data-testid="input-fee-description"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updateFeeMutation.isPending}
                    className="w-full"
                    data-testid="button-save-fee-config"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateFeeMutation.isPending ? 'Saving...' : 'Save Fee Configuration'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Finance Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-total-revenue">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Admin Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{analytics?.totalAdminRevenue?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">Total platform earnings</p>
                </CardContent>
              </Card>

              <Card data-testid="card-teacher-payouts">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Teacher Payouts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{analytics?.totalTeacherPayouts?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">Total paid to teachers</p>
                </CardContent>
              </Card>

              <Card data-testid="card-transaction-fees">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transaction Fees</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{analytics?.totalTransactionFees?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">Total fees collected</p>
                </CardContent>
              </Card>

              <Card data-testid="card-refunds">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{analytics?.totalRefunds?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">Refunds processed</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Platform Statistics</CardTitle>
                <CardDescription>Overview of users and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{analytics?.studentsCount || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{analytics?.teachersCount || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Teachers</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
