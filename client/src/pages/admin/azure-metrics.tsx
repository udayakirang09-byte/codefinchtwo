import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Activity, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';
import type { AzureAppInsightsConfig } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function AzureMetrics() {
  const { toast } = useToast();
  const [configOpen, setConfigOpen] = useState(false);
  const [appInsightsName, setAppInsightsName] = useState('');
  const [appId, setAppId] = useState('');
  const [apiKey, setApiKey] = useState('');

  // Get metrics summary
  const { data: summary } = useQuery({
    queryKey: ['/api/admin/azure-insights/summary'],
  });

  // Get current config
  const { data: config } = useQuery<AzureAppInsightsConfig>({
    queryKey: ['/api/admin/azure-insights/config'],
  });

  const handleSaveConfig = async () => {
    try {
      await apiRequest('POST', '/api/admin/azure-insights/config', {
        appInsightsName,
        appId,
        apiKey
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/azure-insights/config'] });
      setConfigOpen(false);
      
      toast({
        title: "Configuration saved",
        description: "Azure App Insights configuration has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getSeverityIcon = (severity: number) => {
    switch (severity) {
      case 0:
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      case 1:
        return <AlertTriangle className="h-8 w-8 text-orange-500" />;
      case 2:
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case 3:
        return <Info className="h-8 w-8 text-blue-500" />;
      case 4:
        return <Info className="h-8 w-8 text-gray-500" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 0:
        return 'bg-red-500 hover:bg-red-600';
      case 1:
        return 'bg-orange-500 hover:bg-orange-600';
      case 2:
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 3:
        return 'bg-blue-500 hover:bg-blue-600';
      case 4:
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityLabel = (severity: number) => {
    switch (severity) {
      case 0:
        return 'Critical';
      case 1:
        return 'High';
      case 2:
        return 'Medium';
      case 3:
        return 'Low';
      case 4:
        return 'Info';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-azure-metrics">Azure Application Insights</h1>
          <p className="text-muted-foreground">
            Monitor and manage your application performance metrics
          </p>
        </div>
        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" data-testid="button-configure">
              <Settings className="mr-2 h-4 w-4" />
              Configure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Azure App Insights Configuration</DialogTitle>
              <DialogDescription>
                Enter your Azure Application Insights credentials to connect to the API
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="appInsightsName">Application Insights Name</Label>
                <Input
                  id="appInsightsName"
                  placeholder="e.g., connectazureappinghts"
                  value={appInsightsName}
                  onChange={(e) => setAppInsightsName(e.target.value)}
                  data-testid="input-app-insights-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="appId">Application ID</Label>
                <Input
                  id="appId"
                  placeholder="Enter Application ID"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  data-testid="input-app-id"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  data-testid="input-api-key"
                />
              </div>
              <Button onClick={handleSaveConfig} data-testid="button-save-config">
                Save Configuration
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {config && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Application: <span className="font-medium text-foreground">{config.appInsightsName}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Status: <Badge variant={config.isEnabled ? "default" : "secondary"}>
                {config.isEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[0, 1, 2, 3, 4].map((severity) => (
          <Link key={severity} href={`/admin/azure-metrics/${severity}`}>
            <Card className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
              severity === 0 ? 'border-red-200' :
              severity === 1 ? 'border-orange-200' :
              severity === 2 ? 'border-yellow-200' :
              severity === 3 ? 'border-blue-200' :
              'border-gray-200'
            }`} data-testid={`card-severity-${severity}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  {getSeverityIcon(severity)}
                  <Badge className={getSeverityColor(severity)}>
                    SEV {severity}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold mt-2">
                  {summary?.[`sev${severity}` as keyof typeof summary] || 0}
                </CardTitle>
                <CardDescription>
                  {getSeverityLabel(severity)} Priority
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About Azure Application Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Azure Application Insights provides comprehensive monitoring and analytics for your application. 
            Track performance metrics, exceptions, and user behavior in real-time.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Severity Levels</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge className="bg-red-500">SEV 0</Badge>
                  <span>Critical - Immediate action required</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge className="bg-orange-500">SEV 1</Badge>
                  <span>High - Urgent attention needed</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge className="bg-yellow-500">SEV 2</Badge>
                  <span>Medium - Should be addressed soon</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge className="bg-blue-500">SEV 3</Badge>
                  <span>Low - Monitor for changes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge className="bg-gray-500">SEV 4</Badge>
                  <span>Info - Normal operation</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Metric Categories</h3>
              <ul className="space-y-2 text-sm">
                <li><strong>General:</strong> Overall application health metrics</li>
                <li><strong>Concurrent:</strong> Real-time performance indicators</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
