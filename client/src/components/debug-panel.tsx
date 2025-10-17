import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  XCircle,
  FileText,
  Filter,
  Search,
  Trash2,
  Download,
  Activity
} from 'lucide-react';
import { debugLogger } from '@/utils/debug';

interface DebugInfo {
  userInfo: any;
  systemStatus: any;
  apiCalls: any[];
  errors: any[];
  performance: any;
  logs: any[];
  memory: any;
  storage: any;
}

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    userInfo: null,
    systemStatus: null,
    apiCalls: [],
    errors: [],
    performance: null,
    logs: [],
    memory: null,
    storage: null
  });

  // Auto-refresh every 5 seconds when enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && isOpen) {
      interval = setInterval(collectDebugInfo, 5000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, isOpen]);

  const collectDebugInfo = async () => {
    try {
      // Always collect client-side data first (never fails)
      // Get logs from DebugLogger
      const logs = debugLogger.getLogs();

      // Enhanced memory analysis (always available in supported browsers)
      const memory = (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024),
        percentage: Math.round(((performance as any).memory.usedJSHeapSize / (performance as any).memory.totalJSHeapSize) * 100)
      } : {
        used: 0,
        total: 0,
        limit: 0,
        percentage: 0,
        error: 'Memory API not available'
      };

      // Collect storage information (always available)
      const storage = {
        localStorage: {
          available: typeof localStorage !== 'undefined',
          itemCount: typeof localStorage !== 'undefined' ? localStorage.length : 0,
          estimatedSize: typeof localStorage !== 'undefined' ? 
            JSON.stringify(localStorage).length : 0
        },
        sessionStorage: {
          available: typeof sessionStorage !== 'undefined',
          itemCount: typeof sessionStorage !== 'undefined' ? sessionStorage.length : 0,
          estimatedSize: typeof sessionStorage !== 'undefined' ? 
            JSON.stringify(sessionStorage).length : 0
        }
      };

      // Collect system status (client-side only)
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

      // Performance metrics (client-side)
      const performance_info = {
        timing: performance.timing ? {
          domLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
          pageLoaded: performance.timing.loadEventEnd - performance.timing.navigationStart,
          networkLatency: performance.timing.responseEnd - performance.timing.fetchStart
        } : null,
        navigation: performance.navigation ? {
          type: performance.navigation.type,
          redirectCount: performance.navigation.redirectCount
        } : null,
        resourceTiming: performance.getEntriesByType ? 
          performance.getEntriesByType('navigation').length : 0
      };

      // Try to collect user info (may fail)
      let userInfo = null;
      try {
        const userResponse = await fetch('/api/auth/user');
        if (userResponse.ok) {
          const contentType = userResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            userInfo = await userResponse.json();
          }
        }
      } catch (error) {
        console.warn('Failed to fetch user info:', error);
      }

      // Check API endpoints with better error handling
      const apiEndpoints = [
        '/api/mentors',
        '/api/courses',
        '/api/bookings'
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
              status: 'NETWORK_ERROR',
              ok: false,
              time: Math.round(end - start),
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            };
          }
        })
      );

      // Set debug info with graceful fallbacks
      setDebugInfo({
        userInfo,
        systemStatus,
        apiCalls: apiCalls.map(result => result.status === 'fulfilled' ? result.value : result.reason),
        errors: logs.filter(log => log.level === 'error'),
        performance: performance_info,
        logs,
        memory,
        storage
      });
    } catch (error) {
      console.error('Debug info collection failed:', error);
      // Set minimal debug info even on failure
      setDebugInfo(prev => ({
        ...prev,
        errors: [...(prev.errors || []), {
          level: 'error',
          message: `Debug collection failed: ${error}`,
          timestamp: new Date(),
          category: 'DEBUG_SYSTEM'
        }]
      }));
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
      <div className="fixed bottom-4 left-4 md:left-auto md:right-4 z-50">
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

  // Filter logs based on search and level
  const filteredLogs = debugInfo.logs.filter(log => {
    const matchesSearch = logSearch === '' || 
      log.message.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.category.toLowerCase().includes(logSearch.toLowerCase());
    const matchesFilter = logFilter === 'all' || log.level === logFilter;
    return matchesSearch && matchesFilter;
  });

  const clearLogs = () => {
    debugLogger.clearLogs();
    collectDebugInfo();
  };

  return (
    <div className="fixed bottom-4 left-4 md:left-auto md:right-4 z-50 w-[90vw] md:w-[500px] max-h-[600px] overflow-hidden">
      <Card className="shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bug className="w-4 h-4" />
              Enhanced Debug Panel
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                data-testid="button-auto-refresh"
              >
                <Activity className="w-3 h-3 mr-1" />
                Auto
              </Button>
              <Button
                onClick={exportDebugInfo}
                variant="outline"
                size="sm"
                data-testid="button-export-debug"
              >
                <Download className="w-3 h-3 mr-1" />
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
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
              <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>
              <TabsTrigger value="storage" className="text-xs">Storage</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="p-4 space-y-4 text-xs max-h-96 overflow-y-auto">
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
                    <p>Language: {debugInfo.systemStatus.language}</p>
                  </div>
                )}
              </div>

              {/* API Status */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Network className="w-3 h-3" />
                  <span className="font-medium">API Status</span>
                </div>
                <div className="space-y-1">
                  {debugInfo.apiCalls.map((call, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="truncate text-xs">{call.endpoint}</span>
                      <div className="flex items-center gap-1">
                        {call.ok ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                        <Badge variant={call.ok ? "default" : "destructive"} className="text-xs">
                          {call.status} ({call.time}ms)
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <Button
                  onClick={collectDebugInfo}
                  variant="outline"
                  size="sm"
                  className="w-full"
                  data-testid="button-refresh-debug"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  Refresh Data
                </Button>
              </div>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="p-4 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3 h-3 absolute left-2 top-2 text-gray-400" />
                  <Input
                    placeholder="Search logs..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="pl-7 text-xs h-7"
                  />
                </div>
                <Select value={logFilter} onValueChange={setLogFilter}>
                  <SelectTrigger className="w-20 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warn</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={clearLogs} size="sm" variant="outline" className="h-7">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="max-h-80 overflow-y-auto space-y-1">
                {filteredLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No logs match your criteria</p>
                ) : (
                  filteredLogs.slice(-50).reverse().map((log, index) => (
                    <div key={index} className={`p-2 rounded text-xs border-l-2 ${
                      log.level === 'error' ? 'bg-red-50 border-red-400' :
                      log.level === 'warn' ? 'bg-yellow-50 border-yellow-400' :
                      log.level === 'info' ? 'bg-blue-50 border-blue-400' :
                      'bg-gray-50 border-gray-400'
                    }`}>
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="outline" className="text-xs">
                          {log.category}
                        </Badge>
                        <span className="text-gray-500">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="font-mono text-xs">{log.message}</p>
                      {log.data && (
                        <pre className="mt-1 text-xs text-gray-600 overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="p-4 space-y-4 text-xs max-h-96 overflow-y-auto">
              {debugInfo.memory && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-3 h-3" />
                    <span className="font-medium">Memory Usage</span>
                  </div>
                  <div className="bg-purple-50 p-3 rounded space-y-2">
                    <p>Used: {debugInfo.memory.used}MB ({debugInfo.memory.percentage}%)</p>
                    <p>Total: {debugInfo.memory.total}MB</p>
                    <p>Limit: {debugInfo.memory.limit}MB</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${debugInfo.memory.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {debugInfo.performance?.timing && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-3 h-3" />
                    <span className="font-medium">Page Performance</span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded space-y-1">
                    <p>DOM Loaded: {debugInfo.performance.timing.domLoaded}ms</p>
                    <p>Page Loaded: {debugInfo.performance.timing.pageLoaded}ms</p>
                    <p>Network Latency: {debugInfo.performance.timing.networkLatency}ms</p>
                  </div>
                </div>
              )}

              {debugInfo.performance?.navigation && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="w-3 h-3" />
                    <span className="font-medium">Navigation</span>
                  </div>
                  <div className="bg-green-50 p-3 rounded space-y-1">
                    <p>Type: {debugInfo.performance.navigation.type === 0 ? 'Navigate' : 
                              debugInfo.performance.navigation.type === 1 ? 'Reload' : 
                              debugInfo.performance.navigation.type === 2 ? 'Back/Forward' : 'Unknown'}</p>
                    <p>Redirects: {debugInfo.performance.navigation.redirectCount}</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Storage Tab */}
            <TabsContent value="storage" className="p-4 space-y-4 text-xs max-h-96 overflow-y-auto">
              {debugInfo.storage && (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-3 h-3" />
                      <span className="font-medium">Local Storage</span>
                    </div>
                    <div className="bg-orange-50 p-3 rounded space-y-1">
                      <p>Available: {debugInfo.storage.localStorage.available ? '✓' : '✗'}</p>
                      <p>Items: {debugInfo.storage.localStorage.itemCount}</p>
                      <p>Size: ~{Math.round(debugInfo.storage.localStorage.estimatedSize / 1024)}KB</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-3 h-3" />
                      <span className="font-medium">Session Storage</span>
                    </div>
                    <div className="bg-orange-50 p-3 rounded space-y-1">
                      <p>Available: {debugInfo.storage.sessionStorage.available ? '✓' : '✗'}</p>
                      <p>Items: {debugInfo.storage.sessionStorage.itemCount}</p>
                      <p>Size: ~{Math.round(debugInfo.storage.sessionStorage.estimatedSize / 1024)}KB</p>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}