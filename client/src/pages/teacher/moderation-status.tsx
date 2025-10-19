import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, XCircle, Shield, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

type ModerationStatus = {
  id: string;
  accountRestriction: 'none' | 'warned' | 'suspended' | 'banned';
  moderationViolations: number;
  lastViolationAt: string | null;
  restrictionReason: string | null;
  isActive: boolean;
  recentViolations: Array<{
    id: string;
    modality: string;
    aiVerdict: string;
    detectedContent: string | null;
    confidence: number;
    sessionId: string | null;
    createdAt: string;
  }>;
};

function getTeacherUserId(): string {
  return localStorage.getItem('userId') || '';
}

export default function TeacherModerationStatus() {
  const userId = getTeacherUserId();

  // First get mentor data to retrieve mentorId
  const { data: mentorData } = useQuery({
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

  const { data: moderationStatus, isLoading } = useQuery<ModerationStatus>({
    queryKey: [`/api/teachers/${mentorData?.id}/moderation-status`],
    enabled: !!mentorData?.id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!moderationStatus) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unable to Load Status</AlertTitle>
          <AlertDescription>
            We couldn't load your moderation status. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusInfo = (restriction: string) => {
    switch (restriction) {
      case 'none':
        return {
          icon: CheckCircle2,
          color: 'bg-green-500',
          textColor: 'text-green-700 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          label: 'Good Standing',
          message: 'Your account is in good standing with no restrictions.'
        };
      case 'warned':
        return {
          icon: AlertTriangle,
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          label: 'Warning Issued',
          message: 'Your account has received a warning. Please review our content guidelines.'
        };
      case 'suspended':
        return {
          icon: XCircle,
          color: 'bg-orange-500',
          textColor: 'text-orange-700 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          label: 'Account Suspended',
          message: 'Your account is currently suspended. You cannot start new sessions.'
        };
      case 'banned':
        return {
          icon: Shield,
          color: 'bg-red-500',
          textColor: 'text-red-700 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          label: 'Account Banned',
          message: 'Your account has been permanently banned from the platform.'
        };
      default:
        return {
          icon: Shield,
          color: 'bg-gray-500',
          textColor: 'text-gray-700 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          label: 'Unknown Status',
          message: 'Status information is unavailable.'
        };
    }
  };

  const statusInfo = getStatusInfo(moderationStatus.accountRestriction || 'none');
  const StatusIcon = statusInfo.icon;

  const thresholds = {
    warning: 3,
    suspension: 5,
    ban: 10
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl" data-testid="page-teacher-moderation-status">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Account Moderation Status
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View your account standing and moderation history
          </p>
        </div>

        {/* Status Overview Card */}
        <Card className={statusInfo.bgColor}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${statusInfo.color}`}>
                <StatusIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className={statusInfo.textColor}>
                  {statusInfo.label}
                </CardTitle>
                <CardDescription className="mt-1">
                  {statusInfo.message}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {moderationStatus.moderationViolations || 0} Violations
              </Badge>
            </div>
          </CardHeader>
          {moderationStatus.restrictionReason && (
            <CardContent>
              <div className="pt-4 border-t">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Restriction Reason:
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {moderationStatus.restrictionReason}
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Violation Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle>Violation Thresholds</CardTitle>
            <CardDescription>
              Understand the consequences of moderation violations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium">Warning</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {thresholds.warning} violations
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-medium">Suspension</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {thresholds.suspension} violations
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">Permanent Ban</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {thresholds.ban} violations
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Current: {moderationStatus.moderationViolations || 0}</span>
                <span>Next Threshold: {
                  (moderationStatus.moderationViolations || 0) < thresholds.warning ? thresholds.warning :
                  (moderationStatus.moderationViolations || 0) < thresholds.suspension ? thresholds.suspension :
                  (moderationStatus.moderationViolations || 0) < thresholds.ban ? thresholds.ban :
                  'Maximum Reached'
                }</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${
                    (moderationStatus.moderationViolations || 0) >= thresholds.ban ? 'bg-red-500' :
                    (moderationStatus.moderationViolations || 0) >= thresholds.suspension ? 'bg-orange-500' :
                    (moderationStatus.moderationViolations || 0) >= thresholds.warning ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((moderationStatus.moderationViolations || 0) / thresholds.ban * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>90-Day Rolling Window</AlertTitle>
              <AlertDescription>
                Violations are tracked over a 90-day period. Violations older than 90 days are automatically removed from your count.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Recent Violations Card */}
        {moderationStatus.recentViolations && moderationStatus.recentViolations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Violations (Last 90 Days)</CardTitle>
              <CardDescription>
                Your most recent moderation incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {moderationStatus.recentViolations.map((violation: any, index: number) => (
                  <div 
                    key={violation.id} 
                    className="flex items-start gap-4 p-4 border rounded-lg"
                    data-testid={`violation-item-${index}`}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {violation.modality} - {violation.aiVerdict}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(violation.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      {violation.detectedContent && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          Detected: {violation.detectedContent}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Confidence: {(violation.confidence * 100).toFixed(0)}%
                        </Badge>
                        {violation.sessionId && (
                          <Badge variant="outline" className="text-xs">
                            Session: {violation.sessionId.slice(0, 8)}...
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {moderationStatus.lastViolationAt && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last violation recorded on{' '}
                <span className="font-semibold">
                  {format(new Date(moderationStatus.lastViolationAt), 'MMMM dd, yyyy')}
                </span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
