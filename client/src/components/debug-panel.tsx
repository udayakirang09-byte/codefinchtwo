import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  Database, 
  Monitor, 
  Network, 
  Settings, 
  User, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface DebugInfo {
  userInfo: any;
  systemStatus: any;
  apiCalls: any[];
  errors: any[];
  performance: any;
}

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    userInfo: null,
    systemStatus: null,
    apiCalls: [],
    errors: [],
    performance: null
  });

  const collectDebugInfo = async () => {
    try {
      // Collect current user info
      const userResponse = await fetch('/api/auth/user').catch(() => null);
      const userInfo = userResponse?.ok ? await userResponse.json() : null;

      // Collect system status
      const systemStatus = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        cookiesEnabled: navigator.cookieEnabled,
        language: navigator.language,
        platform: navigator.platform,
        localStorage: typeof Storage !== 'undefined',
        sessionStorage: typeof Storage !== 'undefined'
      };

      // Check API endpoints
      const apiEndpoints = [
        '/api/mentors',
        '/api/auth/user',
        '/api/admin/contact-settings'
      ];

      const apiCalls = await Promise.allSettled(
        apiEndpoints.map(async (endpoint) => {
          const start = performance.now();
          try {
            const response = await fetch(endpoint);
            const end = performance.now();
            return {
              endpoint,
              status: response.status,
              ok: response.ok,
              time: Math.round(end - start),
              timestamp: new Date().toISOString()
            };
          } catch (error) {
            const end = performance.now();
            return {
              endpoint,
              status: 'ERROR',
              ok: false,
              time: Math.round(end - start),
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            };
          }
        })
      );

      // Performance metrics
      const performance_info = {
        timing: performance.timing ? {
          domLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
          pageLoaded: performance.timing.loadEventEnd - performance.timing.navigationStart,
          networkLatency: performance.timing.responseEnd - performance.timing.fetchStart
        } : null,
        memory: (performance as any).memory ? {
          used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
        } : null
      };

      setDebugInfo({
        userInfo,
        systemStatus,
        apiCalls: apiCalls.map(result => result.status === 'fulfilled' ? result.value : result.reason),
        errors: [], // Would collect from error boundary in real app
        performance: performance_info
      });
    } catch (error) {
      console.error('Debug info collection failed:', error);
    }
  };

  const exportDebugInfo = () => {
    const dataStr = JSON.stringify(debugInfo, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-info-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => {
            setIsOpen(true);
            collectDebugInfo();
          }}
          variant="outline"
          size="sm"
          className="shadow-lg bg-orange-500 hover:bg-orange-600 text-white border-orange-600"
          data-testid="button-debug-panel"
        >
          <Bug className="w-4 h-4 mr-2" />
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <Card className="shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bug className="w-4 h-4" />
              Debug Panel
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={exportDebugInfo}
                variant="outline"
                size="sm"
                data-testid="button-export-debug"
              >
                Export
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                size="sm"
                data-testid="button-close-debug"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {/* User Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-3 h-3" />
              <span className="font-medium">User Status</span>
            </div>
            {debugInfo.userInfo ? (
              <div className="bg-green-50 p-2 rounded text-green-800">
                <p>✓ Authenticated: {debugInfo.userInfo.email}</p>
                <p>Role: {debugInfo.userInfo.role || 'N/A'}</p>
              </div>
            ) : (
              <div className="bg-gray-50 p-2 rounded text-gray-600">
                Not authenticated
              </div>
            )}
          </div>

          {/* System Status */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="w-3 h-3" />
              <span className="font-medium">System</span>
            </div>
            {debugInfo.systemStatus && (
              <div className="space-y-1 bg-blue-50 p-2 rounded">
                <p>Online: {debugInfo.systemStatus.online ? '✓' : '✗'}</p>
                <p>Storage: {debugInfo.systemStatus.localStorage ? '✓' : '✗'}</p>
                <p>Platform: {debugInfo.systemStatus.platform}</p>
              </div>
            )}
          </div>

          {/* API Status */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Network className="w-3 h-3" />
              <span className="font-medium">API Calls</span>
            </div>
            <div className="space-y-1">
              {debugInfo.apiCalls.map((call, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-1 rounded">
                  <span className="truncate">{call.endpoint}</span>
                  <div className="flex items-center gap-1">
                    {call.ok ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500" />
                    )}
                    <Badge variant={call.ok ? "default" : "destructive"} className="text-xs">
                      {call.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance */}
          {debugInfo.performance?.memory && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3 h-3" />
                <span className="font-medium">Performance</span>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <p>Memory: {debugInfo.performance.memory.used}MB / {debugInfo.performance.memory.total}MB</p>
                {debugInfo.performance.timing && (
                  <p>Load Time: {debugInfo.performance.timing.pageLoaded}ms</p>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <Button
              onClick={collectDebugInfo}
              variant="outline"
              size="sm"
              className="w-full"
              data-testid="button-refresh-debug"
            >
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}