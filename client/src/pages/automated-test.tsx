import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  MousePointer,
  Eye,
  Zap,
  Home
} from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  page: string;
  element: string;
  type: 'button' | 'link' | 'form' | 'navigation';
  status: 'pending' | 'success' | 'failed' | 'skipped';
  responseTime: number;
  error?: string;
  timestamp: string;
}

interface TestSuite {
  name: string;
  tests: Array<{
    page: string;
    elements: Array<{
      selector: string;
      type: 'button' | 'link' | 'form';
      action: 'click' | 'submit' | 'hover';
      description: string;
    }>;
  }>;
}

export default function AutomatedTest() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const testSuites: TestSuite[] = [
    {
      name: "Navigation and Core Pages",
      tests: [
        {
          page: "/",
          elements: [
            { selector: "[data-testid='button-login']", type: 'button', action: 'click', description: 'Login button' },
            { selector: "[data-testid='link-find-mentor']", type: 'link', action: 'click', description: 'Find mentor link' },
            { selector: "[data-testid='link-courses']", type: 'link', action: 'click', description: 'Courses link' }
          ]
        },
        {
          page: "/mentors",
          elements: [
            { selector: "[data-testid='mentor-card-0']", type: 'button', action: 'click', description: 'First mentor card' },
            { selector: "[data-testid='button-filter']", type: 'button', action: 'click', description: 'Filter button' }
          ]
        },
        {
          page: "/payment",
          elements: [
            { selector: "[data-testid='tab-upi']", type: 'button', action: 'click', description: 'UPI payment tab' },
            { selector: "[data-testid='tab-card']", type: 'button', action: 'click', description: 'Card payment tab' },
            { selector: "[data-testid='tab-netbanking']", type: 'button', action: 'click', description: 'Net banking tab' }
          ]
        }
      ]
    },
    {
      name: "Authentication Flow",
      tests: [
        {
          page: "/login",
          elements: [
            { selector: "[data-testid='input-email']", type: 'form', action: 'click', description: 'Email input field' },
            { selector: "[data-testid='input-password']", type: 'form', action: 'click', description: 'Password input field' },
            { selector: "[data-testid='button-submit']", type: 'button', action: 'click', description: 'Submit button' }
          ]
        },
        {
          page: "/forgot-password",
          elements: [
            { selector: "[data-testid='input-email']", type: 'form', action: 'click', description: 'Reset email input' },
            { selector: "[data-testid='button-send-code']", type: 'button', action: 'click', description: 'Send code button' }
          ]
        }
      ]
    },
    {
      name: "Dashboard Features",
      tests: [
        {
          page: "/",
          elements: [
            { selector: "[data-testid='button-user-management']", type: 'button', action: 'click', description: 'User management (Admin)' },
            { selector: "[data-testid='button-mentor-approval']", type: 'button', action: 'click', description: 'Mentor approval (Admin)' },
            { selector: "[data-testid='button-system-reports']", type: 'button', action: 'click', description: 'System reports (Admin)' },
            { selector: "[data-testid='button-platform-settings']", type: 'button', action: 'click', description: 'Platform settings (Admin)' }
          ]
        }
      ]
    }
  ];

  const simulateUserInteraction = async (page: string, element: any): Promise<TestResult> => {
    const startTime = performance.now();
    
    try {
      // Navigate to page if not already there
      if (window.location.pathname !== page) {
        window.history.pushState({}, '', page);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for page load
      }

      // Find element
      const el = document.querySelector(element.selector);
      if (!el) {
        throw new Error(`Element not found: ${element.selector}`);
      }

      // Simulate action
      switch (element.action) {
        case 'click':
          // Highlight element briefly
          (el as HTMLElement).style.outline = '3px solid #ff6b6b';
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Simulate click without navigation
          const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          
          // Prevent actual navigation for testing
          el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
          }, { once: true });
          
          el.dispatchEvent(event);
          (el as HTMLElement).style.outline = '';
          break;
          
        case 'hover':
          const hoverEvent = new MouseEvent('mouseenter', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          el.dispatchEvent(hoverEvent);
          break;
      }

      const endTime = performance.now();
      
      return {
        page,
        element: element.description,
        type: element.type,
        status: 'success',
        responseTime: Math.round(endTime - startTime),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const endTime = performance.now();
      
      return {
        page,
        element: element.description,
        type: element.type,
        status: 'failed',
        responseTime: Math.round(endTime - startTime),
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    
    abortControllerRef.current = new AbortController();
    
    const allTests = testSuites.flatMap(suite => 
      suite.tests.flatMap(test => 
        test.elements.map(element => ({ ...element, page: test.page }))
      )
    );
    
    const totalTests = allTests.length;
    
    try {
      for (let i = 0; i < allTests.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        
        const test = allTests[i];
        setCurrentTest(`Testing ${test.description} on ${test.page}`);
        
        const result = await simulateUserInteraction(test.page, test);
        
        setResults(prev => [...prev, result]);
        setProgress(((i + 1) / totalTests) * 100);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      toast({
        title: "Test Suite Completed",
        description: `Completed ${allTests.length} tests. Check results below.`,
      });
    } catch (error) {
      toast({
        title: "Test Suite Failed",
        description: "An error occurred during testing.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      abortControllerRef.current = null;
    }
  };

  const stopTests = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsRunning(false);
      setCurrentTest('');
      toast({
        title: "Tests Stopped",
        description: "Test execution was halted by user.",
      });
    }
  };

  const exportResults = () => {
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passed: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      averageResponseTime: Math.round(
        results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
      ),
      results: results
    };
    
    const dataStr = JSON.stringify(summary, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const failureCount = results.filter(r => r.status === 'failed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Automated System Testing</h1>
            <p className="text-gray-600 mt-2">Comprehensive UI testing and validation</p>
          </div>
          <Link href="/">
            <Button variant="outline" data-testid="button-home">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        {/* Control Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Test Control Panel
            </CardTitle>
            <CardDescription>
              Start automated testing of all interactive elements across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {!isRunning ? (
                <Button 
                  onClick={runTests}
                  className="flex items-center gap-2"
                  data-testid="button-start-tests"
                >
                  <Play className="w-4 h-4" />
                  Start Tests
                </Button>
              ) : (
                <Button 
                  onClick={stopTests}
                  variant="destructive"
                  className="flex items-center gap-2"
                  data-testid="button-stop-tests"
                >
                  <Pause className="w-4 h-4" />
                  Stop Tests
                </Button>
              )}
              
              {results.length > 0 && (
                <Button 
                  onClick={exportResults}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-export-results"
                >
                  <Download className="w-4 h-4" />
                  Export Results
                </Button>
              )}
              
              <div className="flex items-center gap-4 ml-auto">
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {successCount} Passed
                </Badge>
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  {failureCount} Failed
                </Badge>
              </div>
            </div>
            
            {isRunning && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{currentTest}</span>
                  <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Suites */}
        <div className="grid gap-6 mb-6">
          {testSuites.map((suite, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{suite.name}</CardTitle>
                <CardDescription>
                  {suite.tests.reduce((sum, test) => sum + test.elements.length, 0)} test cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suite.tests.map((test, testIndex) => (
                    <div key={testIndex} className="border-l-2 border-blue-200 pl-4">
                      <h4 className="font-medium text-gray-800">{test.page}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                        {test.elements.map((element, elementIndex) => {
                          const result = results.find(r => 
                            r.page === test.page && r.element === element.description
                          );
                          
                          return (
                            <div 
                              key={elementIndex}
                              className={`p-2 rounded text-sm border ${
                                result?.status === 'success' ? 'bg-green-50 border-green-200' :
                                result?.status === 'failed' ? 'bg-red-50 border-red-200' :
                                'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">{element.description}</span>
                                {result && (
                                  <div className="flex items-center gap-1">
                                    {result.status === 'success' ? (
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                    ) : (
                                      <XCircle className="w-3 h-3 text-red-500" />
                                    )}
                                    <span className="text-xs">{result.responseTime}ms</span>
                                  </div>
                                )}
                              </div>
                              {result?.error && (
                                <p className="text-xs text-red-600 mt-1 truncate">{result.error}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Results Summary */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Test Results Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{results.length}</div>
                  <div className="text-sm text-blue-600">Total Tests</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{successCount}</div>
                  <div className="text-sm text-green-600">Passed</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{failureCount}</div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length)}ms
                  </div>
                  <div className="text-sm text-purple-600">Avg Response</div>
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2">Page</th>
                      <th className="text-left p-2">Element</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Time</th>
                      <th className="text-left p-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{result.page}</td>
                        <td className="p-2">{result.element}</td>
                        <td className="p-2">
                          <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                            {result.status}
                          </Badge>
                        </td>
                        <td className="p-2">{result.responseTime}ms</td>
                        <td className="p-2 text-red-600 text-xs truncate max-w-xs">
                          {result.error || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}