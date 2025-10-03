import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { CreditCard, IndianRupee, Settings, Wallet, CheckCircle, Plus, Trash2, Star } from 'lucide-react';
import Navigation from '@/components/navigation';

// Types for payment methods
type PaymentMethod = {
  id: string;
  userId: string;
  type: 'upi' | 'card' | 'stripe';
  upiId?: string;
  upiProvider?: string;
  cardNumber?: string;
  cardType?: string;
  stripeAccountId?: string;
  displayName: string;
  isDefault: boolean;
  createdAt: string;
};

// Get current teacher user ID (UUID) from localStorage (authenticated user)
function getTeacherUserId(): string {
  return localStorage.getItem('userId') || '';
}

export default function TeacherPaymentConfig() {
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // UPI Form State
  const [upiForm, setUpiForm] = useState({
    upiId: '',
    upiProvider: 'phonepe',
    displayName: ''
  });

  // Card Form State
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardType: 'visa',
    displayName: ''
  });

  // Stripe Form State
  const [stripeForm, setStripeForm] = useState({
    stripeAccountId: '',
    displayName: ''
  });

  // Fetch teacher's payment methods
  const { data: paymentMethods = [], isLoading: methodsLoading, refetch: refetchMethods } = useQuery({
    queryKey: ['teacher-payment-methods'],
    queryFn: async () => {
      try {
        const result = await apiRequest('GET', `/api/payment-methods/${getTeacherUserId()}`);
        return (result as unknown as PaymentMethod[]) || [];
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
        return [] as PaymentMethod[];
      }
    },
  });

  // Add UPI payment method mutation
  const addUpiMutation = useMutation({
    mutationFn: async (upiData: typeof upiForm) => {
      try {
        const response = await apiRequest('POST', '/api/payment-methods', {
          userId: getTeacherUserId(),
          type: 'upi',
          upiId: upiData.upiId,
          upiProvider: upiData.upiProvider,
          displayName: upiData.displayName || `${upiData.upiProvider} - ${upiData.upiId}`,
          isDefault: !Array.isArray(paymentMethods) || paymentMethods.length === 0, // Set as default if it's the first payment method
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

  // Add Card payment method mutation
  const addCardMutation = useMutation({
    mutationFn: async (cardData: typeof cardForm) => {
      try {
        const response = await apiRequest('POST', '/api/payment-methods', {
          userId: getTeacherUserId(),
          type: 'card',
          cardNumber: cardData.cardNumber,
          cardType: cardData.cardType,
          displayName: cardData.displayName || `${cardData.cardType.toUpperCase()} - ****${cardData.cardNumber.slice(-4)}`,
          isDefault: !Array.isArray(paymentMethods) || paymentMethods.length === 0,
        });
        
        // Check if response has error indication
        if (response && typeof response === 'object' && 'error' in response) {
          const errorMsg = (response as any).message || 'Payment method creation failed';
          throw new Error(errorMsg);
        }
        
        return response;
      } catch (error: any) {
        const errorMessage = error?.message || error?.error || 'Failed to add card payment method';
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Card Added",
        description: "Your card payment method has been added successfully!",
      });
      refetchMethods();
      setCardForm({ cardNumber: '', cardType: 'visa', displayName: '' });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Card",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Add Stripe payment method mutation
  const addStripeMutation = useMutation({
    mutationFn: async (stripeData: typeof stripeForm) => {
      try {
        const response = await apiRequest('POST', '/api/payment-methods', {
          userId: getTeacherUserId(),
          type: 'stripe',
          stripeAccountId: stripeData.stripeAccountId,
          displayName: stripeData.displayName || `Stripe - ${stripeData.stripeAccountId}`,
          isDefault: !Array.isArray(paymentMethods) || paymentMethods.length === 0,
        });
        
        // Check if response has error indication
        if (response && typeof response === 'object' && 'error' in response) {
          const errorMsg = (response as any).message || 'Payment method creation failed';
          throw new Error(errorMsg);
        }
        
        return response;
      } catch (error: any) {
        const errorMessage = error?.message || error?.error || 'Failed to add Stripe payment method';
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Stripe Added",
        description: "Your Stripe payment method has been added successfully!",
      });
      refetchMethods();
      setStripeForm({ stripeAccountId: '', displayName: '' });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Stripe",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Set default payment method mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      return apiRequest('POST', `/api/payment-methods/${paymentMethodId}/set-default`, {
        userId: getTeacherUserId(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Default Updated",
        description: "Default payment method has been updated successfully!",
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

  // Submit handlers
  const handleUpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiForm.upiId.trim()) {
      toast({
        title: "UPI ID Required",
        description: "Please enter a valid UPI ID",
        variant: "destructive",
      });
      return;
    }
    addUpiMutation.mutate(upiForm);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm.cardNumber.trim() || cardForm.cardNumber.length < 16) {
      toast({
        title: "Card Number Required",
        description: "Please enter a valid 16-digit card number",
        variant: "destructive",
      });
      return;
    }
    addCardMutation.mutate(cardForm);
  };

  const handleStripeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeForm.stripeAccountId.trim()) {
      toast({
        title: "Stripe Account ID Required",
        description: "Please enter your Stripe Connected Account ID",
        variant: "destructive",
      });
      return;
    }
    addStripeMutation.mutate(stripeForm);
  };

  // Auto-refresh timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
              <span>Teacher</span>
              <span>/</span>
              <span>Payment Configuration</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Configuration</h1>
            <p className="text-muted-foreground">Manage your payment methods for receiving student payments</p>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="payment-methods" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="payment-methods" className="flex items-center space-x-2">
              <Wallet className="h-4 w-4" />
              <span>Payment Methods</span>
            </TabsTrigger>
            <TabsTrigger value="upi-setup" className="flex items-center space-x-2">
              <IndianRupee className="h-4 w-4" />
              <span>UPI Setup</span>
            </TabsTrigger>
            <TabsTrigger value="card-setup" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Card Setup</span>
            </TabsTrigger>
            <TabsTrigger value="stripe-setup" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Stripe Setup</span>
            </TabsTrigger>
          </TabsList>

          {/* Current Payment Methods Tab */}
          <TabsContent value="payment-methods" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5" />
                  <span>Your Payment Methods</span>
                </CardTitle>
                <CardDescription>
                  Manage your payment methods for receiving student payments. Set your preferred default method.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {methodsLoading ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">Loading payment methods...</div>
                  </div>
                ) : !Array.isArray(paymentMethods) || paymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-4">No payment methods configured yet</div>
                    <p className="text-sm text-muted-foreground">
                      Add your UPI or card details using the tabs above to receive payments from students.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.isArray(paymentMethods) && paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {method.type === 'upi' ? (
                            <IndianRupee className="h-5 w-5 text-green-600" />
                          ) : method.type === 'stripe' ? (
                            <CreditCard className="h-5 w-5 text-purple-600" />
                          ) : (
                            <CreditCard className="h-5 w-5 text-blue-600" />
                          )}
                          <div>
                            <div className="font-medium">{method.displayName}</div>
                            <div className="text-sm text-muted-foreground">
                              {method.type === 'upi' ? method.upiId : method.type === 'stripe' ? method.stripeAccountId : `****${method.cardNumber?.slice(-4)}`}
                            </div>
                          </div>
                          {method.isDefault && (
                            <Badge variant="default" className="ml-2">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* UPI Setup Tab */}
          <TabsContent value="upi-setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <IndianRupee className="h-5 w-5" />
                  <span>UPI Configuration</span>
                </CardTitle>
                <CardDescription>
                  Set up your UPI payment method to receive payments from students instantly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleUpiSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="upi-id">UPI ID *</Label>
                      <Input
                        id="upi-id"
                        type="text"
                        placeholder="yourname@upi"
                        value={upiForm.upiId}
                        onChange={(e) => setUpiForm({ ...upiForm, upiId: e.target.value })}
                        data-testid="input-teacher-upi-id"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="upi-provider">UPI Provider *</Label>
                      <Select value={upiForm.upiProvider} onValueChange={(value) => setUpiForm({ ...upiForm, upiProvider: value })}>
                        <SelectTrigger data-testid="select-teacher-upi-provider">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phonepe">PhonePe</SelectItem>
                          <SelectItem value="googlepay">Google Pay</SelectItem>
                          <SelectItem value="paytm">Paytm</SelectItem>
                          <SelectItem value="bhim">BHIM</SelectItem>
                          <SelectItem value="amazonpay">Amazon Pay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upi-display-name">Display Name (Optional)</Label>
                    <Input
                      id="upi-display-name"
                      type="text"
                      placeholder="My Primary UPI"
                      value={upiForm.displayName}
                      onChange={(e) => setUpiForm({ ...upiForm, displayName: e.target.value })}
                      data-testid="input-teacher-upi-display-name"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={addUpiMutation.isPending}
                    data-testid="button-add-teacher-upi"
                  >
                    {addUpiMutation.isPending ? (
                      <>Adding UPI...</>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add UPI Payment Method
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Card Setup Tab */}
          <TabsContent value="card-setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Card Configuration</span>
                </CardTitle>
                <CardDescription>
                  Set up your card details to receive payments from students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleCardSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-number">Card Number *</Label>
                      <Input
                        id="card-number"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        value={cardForm.cardNumber}
                        onChange={(e) => {
                          // Format card number with spaces
                          const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                          const formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                          setCardForm({ ...cardForm, cardNumber: value });
                        }}
                        data-testid="input-teacher-card-number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-type">Card Type *</Label>
                      <Select value={cardForm.cardType} onValueChange={(value) => setCardForm({ ...cardForm, cardType: value })}>
                        <SelectTrigger data-testid="select-teacher-card-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visa">Visa</SelectItem>
                          <SelectItem value="mastercard">Mastercard</SelectItem>
                          <SelectItem value="rupay">RuPay</SelectItem>
                          <SelectItem value="amex">American Express</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-display-name">Display Name (Optional)</Label>
                    <Input
                      id="card-display-name"
                      type="text"
                      placeholder="My Primary Card"
                      value={cardForm.displayName}
                      onChange={(e) => setCardForm({ ...cardForm, displayName: e.target.value })}
                      data-testid="input-teacher-card-display-name"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={addCardMutation.isPending}
                    data-testid="button-add-teacher-card"
                  >
                    {addCardMutation.isPending ? (
                      <>Adding Card...</>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Card Payment Method
                      </>
                    )}
                  </Button>
                </form>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-1 rounded">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Secure Payment Processing</p>
                      <p>Your card details are encrypted and stored securely. We use industry-standard security measures to protect your financial information.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stripe Setup Tab */}
          <TabsContent value="stripe-setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Stripe Configuration</span>
                </CardTitle>
                <CardDescription>
                  Connect your Stripe account to receive payments from students globally
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleStripeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripe-account-id">Stripe Connected Account ID *</Label>
                    <Input
                      id="stripe-account-id"
                      type="text"
                      placeholder="acct_xxxxxxxxxxxxx"
                      value={stripeForm.stripeAccountId}
                      onChange={(e) => setStripeForm({ ...stripeForm, stripeAccountId: e.target.value })}
                      data-testid="input-teacher-stripe-account-id"
                    />
                    <p className="text-sm text-muted-foreground">
                      Your Stripe Connected Account ID (starts with "acct_")
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripe-display-name">Display Name (Optional)</Label>
                    <Input
                      id="stripe-display-name"
                      type="text"
                      placeholder="My Stripe Account"
                      value={stripeForm.displayName}
                      onChange={(e) => setStripeForm({ ...stripeForm, displayName: e.target.value })}
                      data-testid="input-teacher-stripe-display-name"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={addStripeMutation.isPending}
                    data-testid="button-add-teacher-stripe"
                  >
                    {addStripeMutation.isPending ? (
                      <>Adding Stripe...</>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Stripe Payment Method
                      </>
                    )}
                  </Button>
                </form>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-100 p-1 rounded">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-sm text-purple-800">
                      <p className="font-medium mb-1">Global Payment Processing</p>
                      <p>Connect your Stripe account to accept payments from students worldwide. Stripe handles currency conversion and provides detailed analytics.</p>
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