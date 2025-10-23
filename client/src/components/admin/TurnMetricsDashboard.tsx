import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Radio, TrendingUp, Wifi, Server, AlertCircle, CheckCircle, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TurnMetrics {
  totalSessions: number;
  turnRelayCount: number;
  p2pDirectCount: number;
  turnPercentage: string;
  p2pPercentage: string;
  avgHealthScore: string;
  avgDurationMinutes: string;
  successRate: string;
  failedSessions: number;
  totalICERestarts: number;
  totalQualityDowngrades: number;
  turnServerConfigured: boolean;
  turnServerUrl: string;
  avgVideoBitrate: string;
  avgAudioBitrate: string;
}

interface SuccessRateMetrics {
  sloTarget: number;
  total: {
    sessions: number;
    successful: number;
    failed: number;
    aborted: number;
    successRate: number;
    failureRate: number;
    sloCompliant: boolean;
  };
  currentMonth: {
    sessions: number;
    successful: number;
    failed: number;
    aborted: number;
    successRate: number;
    failureRate: number;
    sloCompliant: boolean;
    monthStart: string;
  };
  failureReasons: Array<{
    reason: string;
    count: number;
  }>;
}

export function TurnMetricsDashboard() {
  const { data: metrics, isLoading } = useQuery<TurnMetrics>({
    queryKey: ["/api/admin/turn-metrics"],
  });

  // R5.4: Session Success Rate & SLO Tracking
  const { data: successRateData, isLoading: isLoadingSuccessRate } = useQuery<SuccessRateMetrics>({
    queryKey: ["/api/admin/session-success-rate"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} data-testid={`skeleton-card-${i}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const healthScore = parseFloat(metrics.avgHealthScore);
  const healthColor = healthScore >= 80 ? "text-green-600" : healthScore >= 60 ? "text-blue-600" : healthScore >= 40 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-4">
      {/* TURN Server Status Alert */}
      {metrics.turnServerConfigured ? (
        <Alert className="bg-green-50 border-green-200" data-testid="alert-turn-configured">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>TURN Server Active:</strong> Self-hosted infrastructure at {metrics.turnServerUrl}
            <br />
            <span className="text-sm text-green-600">
              ✅ Student/teacher data stays in your Azure infrastructure (GDPR/COPPA compliant)
            </span>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-yellow-50 border-yellow-200" data-testid="alert-turn-not-configured">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>TURN Server Not Configured:</strong> Using public STUN servers only. Configure TURN server for better NAT traversal.
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Connection Type Distribution */}
        <Card data-testid="card-connection-distribution">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Types</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">P2P Direct</span>
                <span className="text-lg font-bold text-green-600" data-testid="text-p2p-percentage">
                  {metrics.p2pPercentage}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">TURN Relay</span>
                <span className="text-lg font-bold text-blue-600" data-testid="text-turn-percentage">
                  {metrics.turnPercentage}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Total: {metrics.totalSessions} sessions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Average Health Score */}
        <Card data-testid="card-health-score">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${healthColor}`} data-testid="text-health-score">
              {metrics.avgHealthScore || '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {healthScore >= 80 && "🟢 Excellent"}
              {healthScore >= 60 && healthScore < 80 && "🔵 Good"}
              {healthScore >= 40 && healthScore < 60 && "🟡 Fair"}
              {healthScore < 40 && "🔴 Poor"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              0-100 quality score
            </p>
          </CardContent>
        </Card>

        {/* R5.4: Success Rate & SLO Compliance */}
        <Card data-testid="card-success-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate (SLO)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSuccessRate || !successRateData ? (
              <div className="space-y-2">
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className={`text-2xl font-bold ${
                  successRateData.currentMonth.sloCompliant ? 'text-green-600' : 'text-red-600'
                }`} data-testid="text-success-rate">
                  {successRateData.currentMonth.successRate.toFixed(2)}%
                </div>
                <div className="flex items-center gap-1">
                  {successRateData.currentMonth.sloCompliant ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs ${
                    successRateData.currentMonth.sloCompliant ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {successRateData.currentMonth.sloCompliant ? 'SLO Met' : 'SLO Breach'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {successRateData.currentMonth.failed} failed this month
                </p>
                <p className="text-xs text-muted-foreground">
                  Target: ≥{successRateData.sloTarget}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Average Session Duration */}
        <Card data-testid="card-avg-duration">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600" data-testid="text-avg-duration">
              {metrics.avgDurationMinutes || '0.0'}m
            </div>
            <p className="text-xs text-muted-foreground">
              Average session length
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Across all sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* ICE Restarts */}
        <Card data-testid="card-ice-restarts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ICE Restarts</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ice-restarts">
              {metrics.totalICERestarts}
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-repair attempts
            </p>
          </CardContent>
        </Card>

        {/* Quality Downgrades */}
        <Card data-testid="card-quality-downgrades">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Downgrades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-quality-downgrades">
              {metrics.totalQualityDowngrades}
            </div>
            <p className="text-xs text-muted-foreground">
              720p→480p→360p transitions
            </p>
          </CardContent>
        </Card>
        
        {/* R2.6: Average Bitrate Statistics */}
        <Card data-testid="card-avg-bitrate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Bitrate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Video:</span>
                <span className={`text-lg font-bold ${
                  Number(metrics.avgVideoBitrate) >= 1200 && Number(metrics.avgVideoBitrate) <= 1500 ? 'text-green-600' :
                  Number(metrics.avgVideoBitrate) >= 800 ? 'text-blue-600' :
                  Number(metrics.avgVideoBitrate) >= 400 ? 'text-yellow-600' :
                  'text-orange-600'
                }`} data-testid="text-avg-video-bitrate">
                  {metrics.avgVideoBitrate || '0'} kbps
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Audio:</span>
                <span className="text-sm font-medium text-gray-600" data-testid="text-avg-audio-bitrate">
                  {metrics.avgAudioBitrate || '0'} kbps
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Target: 1.2-1.5 Mbps (video)
            </p>
          </CardContent>
        </Card>

        {/* TURN Relay Sessions */}
        <Card data-testid="card-turn-sessions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TURN Relay Sessions</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-turn-sessions">
              {metrics.turnRelayCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {metrics.totalSessions} total
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
