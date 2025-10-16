import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Wrench, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { AzureMetricsAlert } from '@shared/schema';

export default function AzureMetricsDetail() {
  const params = useParams<{ severity: string }>();
  const { toast } = useToast();
  const severityNum = parseInt(params.severity || '0');

  // Fetch all metrics
  const { data: allMetrics, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/azure-insights/metrics'],
  });

  // Filter metrics by severity
  const metrics = (allMetrics as any[])?.filter((m: any) => m.severity === severityNum) || [];

  // Separate by category
  const generalMetrics = metrics.filter((m: any) => m.category === 'General');
  const concurrentMetrics = metrics.filter((m: any) => m.category === 'Concurrent');

  const refreshMetrics = async () => {
    await refetch();
    toast({
      title: "Metrics refreshed",
      description: "Latest data has been loaded from Azure",
    });
  };

  const applyFix = useMutation({
    mutationFn: async (metricId: string) => {
      return apiRequest(`/api/admin/azure-insights/metrics/${metricId}/apply-fix`, 'POST', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/azure-insights/metrics'] });
      toast({
        title: "Fix applied",
        description: "The automated fix has been applied successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to apply fix. Please try again.",
        variant: "destructive"
      });
    }
  });

  const getSeverityLabel = (sev: number) => {
    switch (sev) {
      case 0: return 'Critical';
      case 1: return 'High';
      case 2: return 'Medium';
      case 3: return 'Low';
      case 4: return 'Info';
      default: return 'Unknown';
    }
  };

  const getSeverityColor = (sev: number) => {
    switch (sev) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-orange-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-blue-500';
      case 4: return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getMetricStatus = (value: number, threshold?: number) => {
    if (!threshold) return 'normal';
    const ratio = value / threshold;
    if (ratio >= 1.5) return 'critical';
    if (ratio >= 1.2) return 'high';
    if (ratio >= 1.0) return 'medium';
    if (ratio >= 0.7) return 'low';
    return 'normal';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'critical' || status === 'high' || status === 'medium') {
      return <TrendingUp className="h-5 w-5 text-red-500" />;
    }
    return <TrendingDown className="h-5 w-5 text-green-500" />;
  };

  const MetricCard = ({ metric }: { metric: any }) => {
    const status = getMetricStatus(metric.value, metric.threshold);
    
    return (
      <Card className="hover:shadow-lg transition-all" data-testid={`card-metric-${metric.name}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{metric.name}</CardTitle>
              <CardDescription className="mt-1">{metric.description}</CardDescription>
            </div>
            {getStatusIcon(status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{metric.value.toLocaleString()}</span>
              <span className="text-muted-foreground mb-1">{metric.unit}</span>
            </div>
            
            {metric.threshold && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Threshold:</span>
                <span className="font-medium">{metric.threshold.toLocaleString()} {metric.unit}</span>
              </div>
            )}

            {metric.hasFix && (
              <Button 
                size="sm" 
                className={metric.fixSolution ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"}
                onClick={() => applyFix.mutate(metric.id)}
                disabled={applyFix.isPending || !metric.fixSolution}
                data-testid={`button-fix-${metric.name}`}
              >
                <Wrench className="h-4 w-4 mr-2" />
                {metric.fixSolution ? 'Apply Fix' : 'Manual Fix Required'}
              </Button>
            )}

            {metric.fixSolution && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Automated Solution:</p>
                <p className="text-muted-foreground">{metric.fixSolution}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>Last updated: {new Date(metric.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/admin/azure-metrics">
          <Button variant="ghost" className="mb-4" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Overview
          </Button>
        </Link>
        
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold" data-testid="heading-metrics-detail">
                {getSeverityLabel(severityNum)} Priority Metrics
              </h1>
              <Badge className={getSeverityColor(severityNum)}>
                SEV {severityNum}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Showing {metrics.length} metrics at {getSeverityLabel(severityNum).toLowerCase()} severity level
            </p>
          </div>
          <Button onClick={refreshMetrics} variant="outline" data-testid="button-refresh">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {metrics.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No metrics found at this severity level
          </CardContent>
        </Card>
      ) : (
        <>
          {generalMetrics.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">General Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generalMetrics.map((metric: any, idx: number) => (
                  <MetricCard key={idx} metric={metric} />
                ))}
              </div>
            </div>
          )}

          {concurrentMetrics.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Concurrent Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {concurrentMetrics.map((metric: any, idx: number) => (
                  <MetricCard key={idx} metric={metric} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
