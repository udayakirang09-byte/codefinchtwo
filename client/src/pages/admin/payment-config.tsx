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
  const [upiForm, setUpiForm] = useState({
    upiId: '',
    upiProvider: 'phonepe',
    displayName: ''
  });

  const [feeForm, setFeeForm] = useState({
    feePercentage: '2.00',
    minimumFee: '0.50',
    maximumFee: '',
    description: 'Standard transaction processing fee'
  });

  // Get admin user ID (you would get this from auth context in a real app)
  const getAdminUserId = () => {
    // In a real app, this would come from authentication context
    // For now, we'll use a placeholder admin user
    return 'admin-user-001';
  };

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
        description: feeData.description,
        updatedBy: getAdminUserId(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Fee Configuration Updated",
        description: "Transaction fee settings have been updated successfully!",
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
    
    if (!upiForm.upiId || !upiForm.upiProvider) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    addUpiMutation.mutate(upiForm);
  };

  const handleFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feeForm.feePercentage || !feeForm.minimumFee) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
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
            <p className="text-muted-foreground">Manage payment methods, transaction fees, and finance analytics</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analytics" data-testid="tab-analytics">Finance Analytics</TabsTrigger>
            <TabsTrigger value="payment-methods" data-testid="tab-payment-methods">Admin UPI Setup</TabsTrigger>
            <TabsTrigger value="transaction-fees" data-testid="tab-transaction-fees">Transaction Fees</TabsTrigger>
          </TabsList>

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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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