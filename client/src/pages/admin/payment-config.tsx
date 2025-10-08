import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard,
  Smartphone,
  DollarSign,
  Settings,
  Save,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Percent,
  Home,
  RefreshCw,
  Calendar,
  BarChart3
} from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethod {
  id: string;
  type: string;
  displayName: string;
  upiId?: string;
  upiProvider?: string;
  isDefault: boolean;
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
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'dummy' | 'realtime'>('dummy');
  const [razorpayMode, setRazorpayMode] = useState<'upi' | 'api_keys'>('upi');
  const [enableRazorpay, setEnableRazorpay] = useState(false);

  const [upiForm, setUpiForm] = useState({
    upiId: '',
    upiProvider: 'phonepe',
    displayName: ''
  });

  const [feeForm, setFeeForm] = useState({
    feePercentage: '2.00',
    minimumFee: '0.50',
    maximumFee: '',
    teacherPayoutWaitHours: 24,
    description: 'Standard transaction processing fee'
  });

  // Get admin user ID (you would get this from auth context in a real app)
  const getAdminUserId = () => {
    // In a real app, this would come from authentication context
    // For now, we'll use a placeholder admin user
    return 'admin-user-001';
  };

  // Fetch current payment mode configuration
  const { data: paymentModeConfig, isLoading: paymentModeLoading } = useQuery({
    queryKey: ['admin-payment-mode-config'],
    queryFn: async () => {
      try {
        const result = await apiRequest('GET', '/api/admin/payment-config');
        return result as unknown as { 
          paymentMode: 'dummy' | 'realtime';
          razorpayMode?: 'upi' | 'api_keys';
          enableRazorpay?: boolean;
        };
      } catch (error) {
        console.error('Failed to fetch payment mode:', error);
        return { 
          paymentMode: 'dummy' as const,
          razorpayMode: 'upi' as const,
          enableRazorpay: false
        };
      }
    },
  });

  // Fetch admin payment methods
  const { data: paymentMethods = [], isLoading: methodsLoading, refetch: refetchMethods } = useQuery({
    queryKey: ['admin-payment-methods'],
    queryFn: async () => {
      try {
        const result = await apiRequest('GET', `/api/payment-methods/${getAdminUserId()}`);
        return (result as unknown as PaymentMethod[]) || [];
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
        return [] as PaymentMethod[];
      }
    },
  });

  // Fetch current transaction fee config
  const { data: currentFeeConfig, isLoading: feeConfigLoading, refetch: refetchFeeConfig } = useQuery({
    queryKey: ['transaction-fee-config'],
    queryFn: async () => {
      try {
        const result = await apiRequest('GET', '/api/admin/transaction-fee-config');
        return result as unknown as TransactionFeeConfig;
      } catch (error) {
        console.error('Failed to fetch fee config:', error);
        return null;
      }
    },
  });

  // Fetch finance analytics with auto-refresh every 15 minutes
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['finance-analytics'],
    queryFn: async (): Promise<FinanceAnalytics> => {
      try {
        const result = await apiRequest('GET', '/api/admin/finance-analytics');
        return (result as unknown as FinanceAnalytics) || {
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
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes
  });

  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      refetchAnalytics();
    }, 15 * 60 * 1000); // Every 15 minutes

    return () => clearInterval(interval);
  }, [refetchAnalytics]);

  // Sync payment mode state when config loads
  useEffect(() => {
    if (paymentModeConfig) {
      setSelectedPaymentMode(paymentModeConfig.paymentMode);
      setRazorpayMode(paymentModeConfig.razorpayMode || 'upi');
      setEnableRazorpay(paymentModeConfig.enableRazorpay || false);
    }
  }, [paymentModeConfig]);

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

  // Add UPI payment method mutation
  const addUpiMutation = useMutation({
    mutationFn: async (upiData: typeof upiForm) => {
      try {
        const response = await apiRequest('POST', '/api/payment-methods', {
          userId: getAdminUserId(),
          type: 'upi',
          upiId: upiData.upiId,
          upiProvider: upiData.upiProvider,
          displayName: upiData.displayName || `${upiData.upiProvider} - ${upiData.upiId}`,
          isDefault: paymentMethods.length === 0, // Set as default if it's the first payment method
        });
        
        // Check if response has error indication
        if (response && typeof response === 'object' && 'error' in response) {
          const errorMsg = (response as any).message || 'Payment method creation failed';
          throw new Error(errorMsg);
        }
        
        return response;
      } catch (error: any) {
        // Re-throw with better error message
        const errorMessage = error?.message || error?.error || 'Failed to add UPI payment method';
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "UPI Added",
        description: "Admin UPI payment method has been added successfully!",
      });
      refetchMethods();
      setUpiForm({ upiId: '', upiProvider: 'phonepe', displayName: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add UPI",
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
        updatedBy: getAdminUserId(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Fee Configuration Updated",
        description: "Transaction fee and payout settings have been updated successfully!",
      });
      refetchFeeConfig();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Fee Config",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Update payment mode mutation
  const updatePaymentModeMutation = useMutation({
    mutationFn: async (data: { 
      paymentMode: 'dummy' | 'realtime';
      razorpayMode?: 'upi' | 'api_keys';
      enableRazorpay?: boolean;
    }) => {
      return apiRequest('PUT', '/api/admin/payment-config', data);
    },
    onSuccess: () => {
      toast({
        title: "Payment Configuration Updated",
        description: "Payment configuration has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-mode-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Configuration",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Set as default payment method mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      return apiRequest('POST', `/api/payment-methods/${paymentMethodId}/set-default`, {
        userId: getAdminUserId(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Default Payment Method Updated",
        description: "Default admin payment method has been updated!",
      });
      refetchMethods();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Default",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleUpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation
    // UPI ID validation
    const trimmedUpiId = upiForm.upiId.trim();
    if (!trimmedUpiId) {
      toast({
        title: "UPI ID Required",
        description: "Please enter a UPI ID.",
        variant: "destructive",
      });
      return;
    }

    // Check for whitespace in UPI ID
    if (/\s/.test(trimmedUpiId)) {
      toast({
        title: "Invalid UPI ID",
        description: "UPI ID cannot contain spaces.",
        variant: "destructive",
      });
      return;
    }

    // Basic UPI ID format validation (should contain @ symbol)
    if (!trimmedUpiId.includes('@')) {
      toast({
        title: "Invalid UPI ID Format",
        description: "UPI ID must be in the format username@provider (e.g., admin@phonepe).",
        variant: "destructive",
      });
      return;
    }

    // Validate UPI ID length
    if (trimmedUpiId.length < 5 || trimmedUpiId.length > 50) {
      toast({
        title: "Invalid UPI ID Length",
        description: "UPI ID must be between 5 and 50 characters.",
        variant: "destructive",
      });
      return;
    }

    // UPI Provider validation
    if (!upiForm.upiProvider) {
      toast({
        title: "UPI Provider Required",
        description: "Please select a UPI provider.",
        variant: "destructive",
      });
      return;
    }

    // Display name validation (optional but must be valid if provided)
    if (upiForm.displayName && upiForm.displayName.trim()) {
      const trimmedDisplayName = upiForm.displayName.trim();
      if (trimmedDisplayName.length > 100) {
        toast({
          title: "Display Name Too Long",
          description: "Display name must be less than 100 characters.",
          variant: "destructive",
        });
        return;
      }
    }

    addUpiMutation.mutate(upiForm);
  };

  const handleFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation
    // Fee percentage validation
    const trimmedFeePercentage = feeForm.feePercentage.trim();
    if (!trimmedFeePercentage) {
      toast({
        title: "Fee Percentage Required",
        description: "Please enter a fee percentage.",
        variant: "destructive",
      });
      return;
    }

    const feePercentageValue = parseFloat(trimmedFeePercentage);
    if (isNaN(feePercentageValue)) {
      toast({
        title: "Invalid Fee Percentage",
        description: "Please enter a valid numeric value for fee percentage.",
        variant: "destructive",
      });
      return;
    }

    if (feePercentageValue < 0) {
      toast({
        title: "Invalid Fee Percentage",
        description: "Fee percentage cannot be negative.",
        variant: "destructive",
      });
      return;
    }

    if (feePercentageValue > 100) {
      toast({
        title: "Invalid Fee Percentage",
        description: "Fee percentage cannot exceed 100%.",
        variant: "destructive",
      });
      return;
    }

    // Check for valid decimal places (max 2)
    const feeDecimalPart = trimmedFeePercentage.split('.')[1];
    if (feeDecimalPart && feeDecimalPart.length > 2) {
      toast({
        title: "Invalid Fee Percentage Format",
        description: "Fee percentage can have at most 2 decimal places.",
        variant: "destructive",
      });
      return;
    }

    // Minimum fee validation
    const trimmedMinimumFee = feeForm.minimumFee.trim();
    if (!trimmedMinimumFee) {
      toast({
        title: "Minimum Fee Required",
        description: "Please enter a minimum fee amount.",
        variant: "destructive",
      });
      return;
    }

    const minimumFeeValue = parseFloat(trimmedMinimumFee);
    if (isNaN(minimumFeeValue)) {
      toast({
        title: "Invalid Minimum Fee",
        description: "Please enter a valid numeric value for minimum fee.",
        variant: "destructive",
      });
      return;
    }

    if (minimumFeeValue < 0) {
      toast({
        title: "Invalid Minimum Fee",
        description: "Minimum fee cannot be negative.",
        variant: "destructive",
      });
      return;
    }

    if (minimumFeeValue > 10000) {
      toast({
        title: "Minimum Fee Too High",
        description: "Minimum fee must be less than ₹10,000.",
        variant: "destructive",
      });
      return;
    }

    // Check for valid decimal places (max 2)
    const minFeeDecimalPart = trimmedMinimumFee.split('.')[1];
    if (minFeeDecimalPart && minFeeDecimalPart.length > 2) {
      toast({
        title: "Invalid Minimum Fee Format",
        description: "Minimum fee can have at most 2 decimal places.",
        variant: "destructive",
      });
      return;
    }

    // Maximum fee validation (optional but must be valid if provided)
    if (feeForm.maximumFee && feeForm.maximumFee.trim()) {
      const trimmedMaximumFee = feeForm.maximumFee.trim();
      const maximumFeeValue = parseFloat(trimmedMaximumFee);
      
      if (isNaN(maximumFeeValue)) {
        toast({
          title: "Invalid Maximum Fee",
          description: "Please enter a valid numeric value for maximum fee.",
          variant: "destructive",
        });
        return;
      }

      if (maximumFeeValue < 0) {
        toast({
          title: "Invalid Maximum Fee",
          description: "Maximum fee cannot be negative.",
          variant: "destructive",
        });
        return;
      }

      if (maximumFeeValue > 100000) {
        toast({
          title: "Maximum Fee Too High",
          description: "Maximum fee must be less than ₹100,000.",
          variant: "destructive",
        });
        return;
      }

      // Check if maximum fee is less than minimum fee
      if (maximumFeeValue < minimumFeeValue) {
        toast({
          title: "Invalid Fee Range",
          description: "Maximum fee must be greater than or equal to minimum fee.",
          variant: "destructive",
        });
        return;
      }

      // Check for valid decimal places (max 2)
      const maxFeeDecimalPart = trimmedMaximumFee.split('.')[1];
      if (maxFeeDecimalPart && maxFeeDecimalPart.length > 2) {
        toast({
          title: "Invalid Maximum Fee Format",
          description: "Maximum fee can have at most 2 decimal places.",
          variant: "destructive",
        });
        return;
      }
    }

    // Description validation (optional but must be valid if provided)
    if (feeForm.description && feeForm.description.trim()) {
      const trimmedDescription = feeForm.description.trim();
      if (trimmedDescription.length > 500) {
        toast({
          title: "Description Too Long",
          description: "Description must be less than 500 characters.",
          variant: "destructive",
        });
        return;
      }
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
            <p className="text-muted-foreground">Manage payment methods, transaction fees, and finance analytics</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>

        <Tabs defaultValue="payment-mode" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="payment-mode" data-testid="tab-payment-mode">Payment Mode</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Finance Analytics</TabsTrigger>
            <TabsTrigger value="payment-methods" data-testid="tab-payment-methods">Admin UPI Setup</TabsTrigger>
            <TabsTrigger value="transaction-fees" data-testid="tab-transaction-fees">Transaction Fees</TabsTrigger>
          </TabsList>

          {/* Payment Mode Tab */}
          <TabsContent value="payment-mode" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Global Payment Mode Configuration
                </CardTitle>
                <CardDescription>
                  Choose between dummy (test mode) and realtime (production) payment processing for the entire platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {paymentModeLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Select Payment Mode</Label>
                      <div className="space-y-3">
                        <div 
                          className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedPaymentMode === 'dummy' 
                              ? 'border-primary bg-primary/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedPaymentMode('dummy')}
                          data-testid="radio-payment-mode-dummy"
                        >
                          <div className="flex items-center h-5">
                            <input
                              type="radio"
                              name="paymentMode"
                              value="dummy"
                              checked={selectedPaymentMode === 'dummy'}
                              onChange={() => setSelectedPaymentMode('dummy')}
                              className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                              data-testid="input-payment-mode-dummy"
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center gap-2">
                              <Label className="text-base font-medium cursor-pointer">Dummy Mode (Test)</Label>
                              <Badge variant="secondary">Recommended for Development</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Payments are simulated without real transactions. Perfect for testing and development.
                              No actual money is charged.
                            </p>
                          </div>
                        </div>

                        <div 
                          className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedPaymentMode === 'realtime' 
                              ? 'border-primary bg-primary/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedPaymentMode('realtime')}
                          data-testid="radio-payment-mode-realtime"
                        >
                          <div className="flex items-center h-5">
                            <input
                              type="radio"
                              name="paymentMode"
                              value="realtime"
                              checked={selectedPaymentMode === 'realtime'}
                              onChange={() => setSelectedPaymentMode('realtime')}
                              className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                              data-testid="input-payment-mode-realtime"
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center gap-2">
                              <Label className="text-base font-medium cursor-pointer">Realtime Mode (Production)</Label>
                              <Badge variant="destructive">⚠️ Live Payments</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Real payment processing with actual transactions. Use only in production with proper
                              payment gateway configuration. Money will be charged.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Razorpay Configuration */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold">Razorpay Payment Gateway</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Enable Razorpay for India-based transactions (student and teacher must both be in India)
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="enableRazorpay"
                            checked={enableRazorpay}
                            onChange={(e) => setEnableRazorpay(e.target.checked)}
                            className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                            data-testid="checkbox-enable-razorpay"
                          />
                          <Label htmlFor="enableRazorpay" className="cursor-pointer">
                            {enableRazorpay ? 'Enabled' : 'Disabled'}
                          </Label>
                        </div>
                      </div>

                      {enableRazorpay && (
                        <div className="pl-4 border-l-2 border-primary space-y-3">
                          <Label className="text-sm font-semibold">Razorpay Mode</Label>
                          <div className="space-y-2">
                            <div 
                              className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                razorpayMode === 'upi' 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setRazorpayMode('upi')}
                              data-testid="radio-razorpay-mode-upi"
                            >
                              <div className="flex items-center h-5">
                                <input
                                  type="radio"
                                  name="razorpayMode"
                                  value="upi"
                                  checked={razorpayMode === 'upi'}
                                  onChange={() => setRazorpayMode('upi')}
                                  className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                                  data-testid="input-razorpay-mode-upi"
                                />
                              </div>
                              <div className="ml-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm font-medium cursor-pointer">UPI ID Mode</Label>
                                  <Badge variant="secondary">Direct Transfer</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Use admin UPI ID to collect and distribute payments (manual UPI-to-UPI transfers)
                                </p>
                              </div>
                            </div>

                            <div 
                              className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                razorpayMode === 'api_keys' 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setRazorpayMode('api_keys')}
                              data-testid="radio-razorpay-mode-api"
                            >
                              <div className="flex items-center h-5">
                                <input
                                  type="radio"
                                  name="razorpayMode"
                                  value="api_keys"
                                  checked={razorpayMode === 'api_keys'}
                                  onChange={() => setRazorpayMode('api_keys')}
                                  className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                                  data-testid="input-razorpay-mode-api"
                                />
                              </div>
                              <div className="ml-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm font-medium cursor-pointer">API Keys Mode</Label>
                                  <Badge variant="secondary">Automated</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Use Razorpay API keys for automated payment processing and payouts
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Current Mode: <span className="font-semibold text-foreground">
                            {paymentModeConfig?.paymentMode === 'realtime' ? 'Realtime (Production)' : 'Dummy (Test)'}
                          </span>
                          {paymentModeConfig?.enableRazorpay && (
                            <span className="ml-2 text-xs">
                              | Razorpay: {paymentModeConfig.razorpayMode === 'upi' ? 'UPI Mode' : 'API Keys'}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This setting applies to all payment sections across the application
                        </p>
                      </div>
                      <Button
                        onClick={() => updatePaymentModeMutation.mutate({
                          paymentMode: selectedPaymentMode,
                          razorpayMode,
                          enableRazorpay
                        })}
                        disabled={updatePaymentModeMutation.isPending}
                        data-testid="button-save-payment-mode"
                      >
                        {updatePaymentModeMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Configuration
                          </>
                        )}
                      </Button>
                    </div>

                    {selectedPaymentMode === 'realtime' && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Warning:</strong> Enabling realtime mode will process actual payments. Ensure your
                          payment gateway credentials are properly configured and you have tested thoroughly in dummy mode first.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Finance Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Admin Revenue */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Admin Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-admin-revenue">₹{analytics?.totalAdminRevenue?.toLocaleString() || '0'}</div>
                  <p className="text-xs text-muted-foreground">From student payments</p>
                </CardContent>
              </Card>

              {/* Total Teacher Payouts */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Teacher Payouts</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-teacher-payouts">₹{analytics?.totalTeacherPayouts?.toLocaleString() || '0'}</div>
                  <p className="text-xs text-muted-foreground">Released to teachers</p>
                </CardContent>
              </Card>

              {/* Transaction Fees */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transaction Fees</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-transaction-fees">₹{analytics?.totalTransactionFees?.toLocaleString() || '0'}</div>
                  <p className="text-xs text-muted-foreground">Platform fees collected</p>
                </CardContent>
              </Card>

              {/* Student Refunds */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Student Refunds</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-refunds">₹{analytics?.totalRefunds?.toLocaleString() || '0'}</div>
                  <p className="text-xs text-muted-foreground">Due to cancellations</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* User Counts */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-students-count">{analytics?.studentsCount || 0}</div>
                  <p className="text-xs text-muted-foreground">Students who made payments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-teachers-count">{analytics?.teachersCount || 0}</div>
                  <p className="text-xs text-muted-foreground">Teachers receiving payouts</p>
                </CardContent>
              </Card>

              {/* Conflict Amount */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conflict Amount</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600" data-testid="text-conflict-amount">₹{analytics?.conflictAmount?.toLocaleString() || '0'}</div>
                  <p className="text-xs text-muted-foreground">Requires resolution</p>
                </CardContent>
              </Card>
            </div>

            {analytics?.conflictAmount && analytics.conflictAmount > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  There are unsettled financial conflicts totaling ₹{analytics.conflictAmount.toLocaleString()} that require immediate attention.
                  Please review the unsettled finances section to resolve these conflicts.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Admin UPI Setup Tab */}
          <TabsContent value="payment-methods" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span>Admin UPI Configuration</span>
                </CardTitle>
                <CardDescription>
                  Set up UPI payment method for receiving student payments and managing transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing Payment Methods */}
                {paymentMethods.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Current Payment Methods</h3>
                    <div className="grid gap-4">
                      {paymentMethods.map((method) => (
                        <Card key={method.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Smartphone className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium" data-testid={`text-payment-method-${method.id}`}>{method.displayName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {method.type.toUpperCase()} • {method.upiProvider} • {method.upiId}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {method.isDefault ? (
                                <Badge variant="default">Default</Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDefaultMutation.mutate(method.id)}
                                  disabled={setDefaultMutation.isPending}
                                  data-testid={`button-set-default-${method.id}`}
                                >
                                  Set Default
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    <Separator />
                  </div>
                )}

                {/* Add New UPI Method Form */}
                <form onSubmit={handleUpiSubmit} className="space-y-4">
                  <h3 className="text-lg font-semibold">Add New UPI Method</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="upiId">UPI ID *</Label>
                      <Input
                        id="upiId"
                        type="text"
                        placeholder="admin@phonepe"
                        value={upiForm.upiId}
                        onChange={(e) => setUpiForm(prev => ({ ...prev, upiId: e.target.value }))}
                        data-testid="input-upi-id"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="upiProvider">UPI Provider *</Label>
                      <Select 
                        value={upiForm.upiProvider} 
                        onValueChange={(value) => setUpiForm(prev => ({ ...prev, upiProvider: value }))}
                      >
                        <SelectTrigger data-testid="select-upi-provider">
                          <SelectValue placeholder="Select UPI Provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phonepe">PhonePe</SelectItem>
                          <SelectItem value="gpay">Google Pay</SelectItem>
                          <SelectItem value="paytm">Paytm</SelectItem>
                          <SelectItem value="bharatpe">BharatPe</SelectItem>
                          <SelectItem value="cred">CRED</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name (Optional)</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Admin Primary UPI"
                      value={upiForm.displayName}
                      onChange={(e) => setUpiForm(prev => ({ ...prev, displayName: e.target.value }))}
                      data-testid="input-display-name"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={addUpiMutation.isPending}
                    className="w-full"
                    data-testid="button-add-upi"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {addUpiMutation.isPending ? 'Adding UPI...' : 'Add UPI Payment Method'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transaction Fees Tab */}
          <TabsContent value="transaction-fees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Percent className="h-5 w-5" />
                  <span>Transaction Fee Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure platform transaction fees for all bookings and courses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Fee Configuration */}
                {currentFeeConfig && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Current Configuration</h3>
                    <Card className="p-4 bg-muted/50">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Fee Percentage</p>
                          <p className="text-xl font-bold" data-testid="text-current-fee-percentage">{currentFeeConfig.feePercentage}%</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Minimum Fee</p>
                          <p className="text-xl font-bold" data-testid="text-current-min-fee">₹{currentFeeConfig.minimumFee}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Maximum Fee</p>
                          <p className="text-xl font-bold" data-testid="text-current-max-fee">
                            {currentFeeConfig.maximumFee ? `₹${currentFeeConfig.maximumFee}` : 'No Limit'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Teacher Payout Wait</p>
                          <p className="text-xl font-bold" data-testid="text-current-payout-wait-hours">
                            {currentFeeConfig.teacherPayoutWaitHours || 24} hours
                          </p>
                        </div>
                      </div>
                      {currentFeeConfig.description && (
                        <p className="text-sm text-muted-foreground mt-2">{currentFeeConfig.description}</p>
                      )}
                    </Card>
                    <Separator />
                  </div>
                )}

                {/* Update Fee Configuration Form */}
                <form onSubmit={handleFeeSubmit} className="space-y-4">
                  <h3 className="text-lg font-semibold">Update Fee Configuration</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="feePercentage">Fee Percentage *</Label>
                      <div className="relative">
                        <Input
                          id="feePercentage"
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          placeholder="2.00"
                          value={feeForm.feePercentage}
                          onChange={(e) => setFeeForm(prev => ({ ...prev, feePercentage: e.target.value }))}
                          data-testid="input-fee-percentage"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minimumFee">Minimum Fee *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          id="minimumFee"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.50"
                          className="pl-8"
                          value={feeForm.minimumFee}
                          onChange={(e) => setFeeForm(prev => ({ ...prev, minimumFee: e.target.value }))}
                          data-testid="input-minimum-fee"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maximumFee">Maximum Fee (Optional)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          id="maximumFee"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="No limit"
                          className="pl-8"
                          value={feeForm.maximumFee}
                          onChange={(e) => setFeeForm(prev => ({ ...prev, maximumFee: e.target.value }))}
                          data-testid="input-maximum-fee"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teacherPayoutWaitHours">Teacher Payout Wait Period (Hours) *</Label>
                    <div className="relative">
                      <Input
                        id="teacherPayoutWaitHours"
                        type="number"
                        step="1"
                        min="1"
                        max="168"
                        placeholder="24"
                        value={feeForm.teacherPayoutWaitHours}
                        onChange={(e) => setFeeForm(prev => ({ ...prev, teacherPayoutWaitHours: parseInt(e.target.value) || 24 }))}
                        data-testid="input-teacher-payout-wait-hours"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">hours</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Number of hours to wait after class completion before releasing payment to teacher (1-168 hours, default 24).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe this fee configuration..."
                      value={feeForm.description}
                      onChange={(e) => setFeeForm(prev => ({ ...prev, description: e.target.value }))}
                      data-testid="textarea-fee-description"
                    />
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> Transaction fees are non-refundable, even if classes are cancelled. 
                      This fee will be applied to every booking and course purchase on the platform.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="submit" 
                    disabled={updateFeeMutation.isPending}
                    className="w-full"
                    data-testid="button-update-fees"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateFeeMutation.isPending ? 'Updating Fee Configuration...' : 'Update Fee Configuration'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}