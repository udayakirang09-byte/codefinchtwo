import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Save,
  Home,
  Calendar,
  CalendarDays,
  AlertCircle
} from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface BookingLimitsConfig {
  dailyLimit: number;
  weeklyLimit: number;
  weeklyLimitEnabled: boolean;
}

export default function AdminBookingLimitsConfig() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [dailyLimit, setDailyLimit] = useState(3);
  const [weeklyLimit, setWeeklyLimit] = useState(15);
  const [weeklyLimitEnabled, setWeeklyLimitEnabled] = useState(false);

  // Fetch current booking limits configuration
  const { data: config, isLoading, error } = useQuery<BookingLimitsConfig>({
    queryKey: ['/api/admin/booking-limits'],
    queryFn: async () => {
      const result = await apiRequest('GET', '/api/admin/booking-limits');
      return result as unknown as BookingLimitsConfig;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Sync state when config loads
  useEffect(() => {
    if (config) {
      setDailyLimit(config.dailyLimit);
      setWeeklyLimit(config.weeklyLimit);
      setWeeklyLimitEnabled(config.weeklyLimitEnabled);
      setHasChanges(false);
    }
  }, [config]);

  // Update booking limits config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (configData: BookingLimitsConfig) => {
      const response = await apiRequest('PUT', '/api/admin/booking-limits', configData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "Booking limits have been saved successfully!",
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/booking-limits'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Configuration",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleDailyLimitChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setDailyLimit(numValue);
      setHasChanges(true);
    }
  };

  const handleWeeklyLimitChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setWeeklyLimit(numValue);
      setHasChanges(true);
    }
  };

  const handleWeeklyLimitToggle = () => {
    setWeeklyLimitEnabled(prev => !prev);
    setHasChanges(true);
  };

  const handleSave = () => {
    updateConfigMutation.mutate({ dailyLimit, weeklyLimit, weeklyLimitEnabled });
  };

  const handleReset = () => {
    if (config) {
      setDailyLimit(config.dailyLimit);
      setWeeklyLimit(config.weeklyLimit);
      setWeeklyLimitEnabled(config.weeklyLimitEnabled);
      setHasChanges(false);
    }
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
              <span>Booking Limits</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
              Booking Limits Configuration
            </h1>
            <p className="text-muted-foreground">
              Configure daily and weekly booking limits for students
            </p>
          </div>
          {hasChanges && (
            <Alert className="w-auto">
              <AlertDescription className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                You have unsaved changes
              </AlertDescription>
            </Alert>
          )}
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load booking limits configuration. Please refresh the page or contact support if the issue persists.
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex items-center justify-center p-16">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Daily Booking Limit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Booking Limit
                </CardTitle>
                <CardDescription>
                  Maximum number of class bookings a student can make per day (across all mentors)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="daily-limit" className="min-w-[120px]">
                      Daily Limit:
                    </Label>
                    <Input
                      id="daily-limit"
                      type="number"
                      min="1"
                      max="100"
                      value={dailyLimit}
                      onChange={(e) => handleDailyLimitChange(e.target.value)}
                      className="w-32"
                      data-testid="input-daily-limit"
                    />
                    <span className="text-sm text-muted-foreground">bookings per day</span>
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Students will be prevented from booking more than {dailyLimit} classes in a single day. This helps prevent booking spam and ensures fair access for all students.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Booking Limit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Weekly Booking Limit
                </CardTitle>
                <CardDescription>
                  Maximum number of class bookings a student can make per week (Monday to Sunday)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Enable/Disable Weekly Limit */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex-1">
                      <Label htmlFor="weekly-enabled" className="cursor-pointer text-base font-medium">
                        Enable Weekly Limit
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        When enabled, students will be restricted to a maximum number of bookings per week
                      </p>
                    </div>
                    <Switch
                      id="weekly-enabled"
                      checked={weeklyLimitEnabled}
                      onCheckedChange={handleWeeklyLimitToggle}
                      data-testid="switch-weekly-limit-enabled"
                    />
                  </div>

                  {/* Weekly Limit Input */}
                  {weeklyLimitEnabled && (
                    <>
                      <div className="flex items-center gap-4">
                        <Label htmlFor="weekly-limit" className="min-w-[120px]">
                          Weekly Limit:
                        </Label>
                        <Input
                          id="weekly-limit"
                          type="number"
                          min="1"
                          max="500"
                          value={weeklyLimit}
                          onChange={(e) => handleWeeklyLimitChange(e.target.value)}
                          className="w-32"
                          data-testid="input-weekly-limit"
                        />
                        <span className="text-sm text-muted-foreground">bookings per week</span>
                      </div>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Students will be prevented from booking more than {weeklyLimit} classes in a single week (Monday to Sunday). This limit resets every Monday.
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges || updateConfigMutation.isPending}
                data-testid="button-reset"
              >
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateConfigMutation.isPending}
                data-testid="button-save"
              >
                {updateConfigMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
