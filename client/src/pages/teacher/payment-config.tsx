import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Smartphone, CheckCircle, Plus, Trash2, Star, Home, Users } from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';

type PaymentMethod = {
  id: string;
  userId: string;
  type: 'upi' | 'card' | 'stripe';
  isActive: boolean;
  upiId?: string;
  upiProvider?: string;
  displayName: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

function getTeacherUserId(): string {
  return localStorage.getItem('userId') || '';
}

export default function TeacherPaymentConfig() {
  const { toast } = useToast();
  
  const [upiForm, setUpiForm] = useState({
    upiId: '',
    upiProvider: 'phonepe',
    displayName: ''
  });

  const userId = getTeacherUserId();
  
  const { data: paymentMethods = [], isLoading: methodsLoading, refetch: refetchMethods } = useQuery({
    queryKey: ['teacher-payment-methods', userId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/payment-methods/${userId}`);
        return (response as unknown as PaymentMethod[]) || [];
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
        return [] as PaymentMethod[];
      }
    },
    enabled: !!userId,
  });

  // Fetch mentor record to get demoEnabled status
  const { data: mentorData, refetch: refetchMentor } = useQuery({
    queryKey: ['teacher-mentor-data', userId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/mentors/user/${userId}`);
        return response as any;
      } catch (error) {
        console.error('Failed to fetch mentor data:', error);
        return null;
      }
    },
    enabled: !!userId,
  });

  const toggleDemoMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!mentorData?.id) throw new Error('Mentor ID not found');
      return apiRequest('PATCH', `/api/mentors/${mentorData.id}/demo-toggle`, {
        demoEnabled: enabled
      });
    },
    onSuccess: (_, enabled) => {
      toast({
        title: "Demo Settings Updated",
        description: `Demo bookings ${enabled ? 'enabled' : 'disabled'} successfully!`,
      });
      refetchMentor();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const addUpiMutation = useMutation({
    mutationFn: async (upiData: typeof upiForm) => {
      try {
        const response = await apiRequest('POST', '/api/payment-methods', {
          userId: getTeacherUserId(),
          type: 'upi',
          upiId: upiData.upiId,
          upiProvider: upiData.upiProvider,
          displayName: upiData.displayName || `${upiData.upiProvider} - ${upiData.upiId}`,
          isDefault: !Array.isArray(paymentMethods) || paymentMethods.length === 0,
        });
        
        if (response && typeof response === 'object' && 'error' in response) {
          const errorMsg = (response as any).message || 'Payment method creation failed';
          throw new Error(errorMsg);
        }
        
        return response;
      } catch (error: any) {
        const errorMessage = error?.message || error?.error || 'Failed to add UPI payment method';
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "UPI Added",
        description: "Your UPI payment method has been added successfully!",
      });
      refetchMethods();
      setUpiForm({ upiId: '', upiProvider: 'phonepe', displayName: '' });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add UPI",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      return apiRequest('POST', `/api/payment-methods/${paymentMethodId}/set-default`, {
        userId: getTeacherUserId(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Default Updated",
        description: "Default payment method has been updated!",
      });
      refetchMethods();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Default",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      return apiRequest('DELETE', `/api/payment-methods/${paymentMethodId}`);
    },
    onSuccess: () => {
      toast({
        title: "Payment Method Deleted",
        description: "Payment method has been removed successfully!",
      });
      refetchMethods();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleUpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUpiId = upiForm.upiId.trim();
    if (!trimmedUpiId) {
      toast({
        title: "UPI ID Required",
        description: "Please enter a UPI ID.",
        variant: "destructive",
      });
      return;
    }

    if (/\s/.test(trimmedUpiId)) {
      toast({
        title: "Invalid UPI ID",
        description: "UPI ID cannot contain spaces.",
        variant: "destructive",
      });
      return;
    }

    if (!trimmedUpiId.includes('@')) {
      toast({
        title: "Invalid UPI ID Format",
        description: "UPI ID must be in the format username@provider (e.g., yourname@phonepe).",
        variant: "destructive",
      });
      return;
    }

    if (trimmedUpiId.length < 5 || trimmedUpiId.length > 50) {
      toast({
        title: "Invalid UPI ID Length",
        description: "UPI ID must be between 5 and 50 characters.",
        variant: "destructive",
      });
      return;
    }

    if (!upiForm.upiProvider) {
      toast({
        title: "UPI Provider Required",
        description: "Please select a UPI provider.",
        variant: "destructive",
      });
      return;
    }

    addUpiMutation.mutate(upiForm);
  };

  const upiMethods = paymentMethods.filter(method => method.type === 'upi');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
            <Link href="/" data-testid="link-home">
              <Home className="h-4 w-4 hover:text-primary cursor-pointer" />
            </Link>
            <span>/</span>
            <Link href="/teacher/home" data-testid="link-teacher">Teacher</Link>
            <span>/</span>
            <span>Payment Configuration</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">Payment Configuration</h1>
          <p className="text-muted-foreground">Set up your UPI ID to receive payouts</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Add UPI Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Add UPI Payment Method
              </CardTitle>
              <CardDescription>
                Add your UPI ID to receive payments from students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  Your UPI ID will be used to receive payouts after the platform's hold period (typically 24 hours).
                  Make sure the UPI ID is active and belongs to you.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleUpiSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="upiId">UPI ID *</Label>
                  <Input
                    id="upiId"
                    type="text"
                    placeholder="yourname@phonepe"
                    value={upiForm.upiId}
                    onChange={(e) => setUpiForm({ ...upiForm, upiId: e.target.value })}
                    data-testid="input-upi-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: username@provider (e.g., john@phonepe, jane@paytm)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upiProvider">UPI Provider *</Label>
                  <Select
                    value={upiForm.upiProvider}
                    onValueChange={(value) => setUpiForm({ ...upiForm, upiProvider: value })}
                  >
                    <SelectTrigger data-testid="select-upi-provider">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phonepe">PhonePe</SelectItem>
                      <SelectItem value="googlepay">Google Pay</SelectItem>
                      <SelectItem value="paytm">Paytm</SelectItem>
                      <SelectItem value="amazonpay">Amazon Pay</SelectItem>
                      <SelectItem value="bhim">BHIM</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name (Optional)</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="My Primary UPI"
                    value={upiForm.displayName}
                    onChange={(e) => setUpiForm({ ...upiForm, displayName: e.target.value })}
                    data-testid="input-display-name"
                  />
                  <p className="text-xs text-muted-foreground">
                    A friendly name to identify this payment method
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addUpiMutation.isPending}
                  data-testid="button-add-upi"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {addUpiMutation.isPending ? 'Adding...' : 'Add UPI Payment Method'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Your UPI Payment Methods
              </CardTitle>
              <CardDescription>
                Manage your saved UPI payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              {methodsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : upiMethods.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No UPI payment methods added yet.</p>
                  <p className="text-sm mt-2">Add your first UPI ID to receive payments.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upiMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Smartphone className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{method.displayName}</p>
                            {method.isDefault && (
                              <Badge variant="default" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {method.upiId} ({method.upiProvider})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.isDefault && (
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this payment method?')) {
                              deletePaymentMethodMutation.mutate(method.id);
                            }
                          }}
                          disabled={deletePaymentMethodMutation.isPending}
                          data-testid={`button-delete-${method.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* C2: Demo Booking Settings */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Demo Booking Settings
            </CardTitle>
            <CardDescription>
              Allow students to book free demo sessions with you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="demo-toggle" className="text-base font-medium">
                  Enable Demo Bookings
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, students can book a free demo session to try your teaching style
                </p>
              </div>
              <Switch
                id="demo-toggle"
                checked={mentorData?.demoEnabled || false}
                onCheckedChange={(checked) => toggleDemoMutation.mutate(checked)}
                disabled={toggleDemoMutation.isPending}
                data-testid="switch-demo-enabled"
              />
            </div>
            {mentorData?.demoEnabled && (
              <Alert className="mt-4">
                <AlertDescription className="text-sm">
                  <strong>Demo sessions are active!</strong> Students can now book free demo classes with you.
                  Demo sessions help attract new students by letting them experience your teaching style risk-free.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Information Alert */}
        <Alert className="mt-6">
          <AlertDescription>
            <strong>How Payouts Work:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Students pay through the platform's payment system</li>
              <li>Payments are held for a specified period (typically 24 hours) to handle any disputes</li>
              <li>After the hold period, funds are automatically transferred to your default UPI ID</li>
              <li>Platform fee (usually 2%) is deducted before payout</li>
              <li>You can track all your earnings in the Teacher Dashboard</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
