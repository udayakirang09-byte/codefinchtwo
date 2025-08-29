import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Users,
  MessageSquare,
  Video,
  Server,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Home,
  Code,
  Play
} from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';

export default function LoadTestingGuide() {
  const performanceTargets = [
    {
      metric: "Concurrent Users",
      target: "3,000 users",
      description: "Simultaneous active users browsing and booking",
      status: "pending"
    },
    {
      metric: "Chat Sessions",
      target: "3,000 sessions",
      description: "Real-time messaging between students and mentors",
      status: "pending"
    },
    {
      metric: "Video Calls",
      target: "3,000 calls",
      description: "WebRTC video sessions for mentoring",
      status: "pending"
    },
    {
      metric: "Response Time",
      target: "< 200ms",
      description: "API response time under load",
      status: "testing"
    },
    {
      metric: "Uptime",
      target: "99.9%",
      description: "System availability during peak load",
      status: "achieved"
    }
  ];

  const testingTools = [
    {
      name: "Artillery.io",
      category: "HTTP Load Testing",
      description: "For testing API endpoints and HTTP traffic",
      command: "npm install -g artillery",
      config: `config:
  target: 'https://your-app.replit.dev'
  phases:
    - duration: 300
      arrivalRate: 10
scenarios:
  - name: "User Journey"
    flow:
      - get:
          url: "/api/mentors"
      - post:
          url: "/api/bookings"
          json:
            mentorId: "test-mentor"
            duration: 60`
    },
    {
      name: "Socket.io Load Tester",
      category: "WebSocket Testing", 
      description: "For testing real-time chat functionality",
      command: "npm install socketio-load-tester",
      config: `const io = require('socket.io-client');
const clients = [];

for(let i = 0; i < 3000; i++) {
  const client = io('https://your-app.replit.dev');
  client.on('connect', () => {
    client.emit('join-chat', { roomId: 'test-room' });
    setInterval(() => {
      client.emit('message', { text: 'Test message' });
    }, 1000);
  });
  clients.push(client);
}`
    },
    {
      name: "WebRTC Load Test",
      category: "Video Call Testing",
      description: "For testing video session capacity",
      command: "Custom WebRTC testing script",
      config: `// WebRTC stress test
const numConnections = 3000;
const connections = [];

for(let i = 0; i < numConnections; i++) {
  const pc = new RTCPeerConnection();
  // Mock video stream
  const stream = createMockVideoStream();
  stream.getTracks().forEach(track => {
    pc.addTrack(track, stream);
  });
  connections.push(pc);
}`
    },
    {
      name: "K6",
      category: "Performance Testing",
      description: "Developer-centric load testing tool",
      command: "brew install k6",
      config: `import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 1000 },
    { duration: '10m', target: 3000 },
    { duration: '5m', target: 0 },
  ],
};

export default function() {
  let response = http.get('https://your-app.replit.dev/api/mentors');
  check(response, { 'status is 200': (r) => r.status === 200 });
}`
    }
  ];

  const infrastructureRecommendations = [
    {
      component: "Database",
      recommendation: "PostgreSQL with connection pooling (100+ connections)",
      implementation: "Use pgBouncer or built-in Neon connection pooling",
      cost: "$50-200/month"
    },
    {
      component: "CDN",
      recommendation: "Cloudflare or AWS CloudFront for static assets",
      implementation: "Cache images, CSS, JS files globally",
      cost: "$20-50/month"
    },
    {
      component: "Load Balancer",
      recommendation: "Multiple Replit deployments with load balancing",
      implementation: "Deploy 2-3 instances behind a load balancer",
      cost: "$100-300/month"
    },
    {
      component: "Redis Cache",
      recommendation: "Redis for session storage and caching",
      implementation: "Cache frequently accessed data and user sessions",
      cost: "$30-100/month"
    },
    {
      component: "Monitoring",
      recommendation: "Application Performance Monitoring (APM)",
      implementation: "Use DataDog, New Relic, or Sentry for monitoring",
      cost: "$50-200/month"
    }
  ];

  const testScenarios = [
    {
      scenario: "User Registration Burst",
      description: "1000 users signing up simultaneously",
      steps: [
        "Navigate to signup page",
        "Fill registration form", 
        "Submit with mentor qualifications",
        "Verify account creation"
      ]
    },
    {
      scenario: "Mentor Discovery Load",
      description: "3000 users browsing mentors simultaneously",
      steps: [
        "Load mentor listing page",
        "Apply filters and search",
        "View mentor profiles",
        "Check availability slots"
      ]
    },
    {
      scenario: "Booking Storm",
      description: "500 simultaneous booking attempts",
      steps: [
        "Select mentor and time slot",
        "Process payment with Stripe",
        "Create booking record",
        "Send confirmation emails"
      ]
    },
    {
      scenario: "Video Session Peak",
      description: "3000 concurrent video calls",
      steps: [
        "Initialize WebRTC connection",
        "Establish peer-to-peer connection",
        "Stream audio/video data",
        "Handle connection drops gracefully"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-8 w-8 text-yellow-600" />
              Load Testing Guide
            </h1>
            <p className="text-gray-600 mt-2">Comprehensive guide to load test CodeConnect for 3k concurrent users</p>
          </div>
          <Link href="/">
            <Button variant="outline" data-testid="button-home">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        {/* Performance Targets */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Performance Targets
            </CardTitle>
            <CardDescription>Key metrics to achieve for 3k concurrent users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {performanceTargets.map((target, index) => (
                <div key={index} className="border rounded-lg p-4" data-testid={`target-${index}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold" data-testid={`target-metric-${index}`}>{target.metric}</h3>
                    <Badge variant={target.status === 'achieved' ? 'default' : 'secondary'} data-testid={`target-status-${index}`}>
                      {target.status}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-1" data-testid={`target-value-${index}`}>
                    {target.target}
                  </div>
                  <p className="text-sm text-gray-600" data-testid={`target-description-${index}`}>
                    {target.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="tools" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tools">Testing Tools</TabsTrigger>
            <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
            <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
            <TabsTrigger value="implementation">Implementation</TabsTrigger>
          </TabsList>

          {/* Testing Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testingTools.map((tool, index) => (
                <Card key={index} data-testid={`tool-${index}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      {tool.name}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mr-2">{tool.category}</Badge>
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Installation:</h4>
                        <code className="block bg-gray-100 p-2 rounded text-sm" data-testid={`tool-command-${index}`}>
                          {tool.command}
                        </code>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Configuration:</h4>
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto" data-testid={`tool-config-${index}`}>
                          {tool.config}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Test Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testScenarios.map((scenario, index) => (
                <Card key={index} data-testid={`scenario-${index}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      {scenario.scenario}
                    </CardTitle>
                    <CardDescription data-testid={`scenario-description-${index}`}>
                      {scenario.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium">Test Steps:</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        {scenario.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="text-sm" data-testid={`scenario-step-${index}-${stepIndex}`}>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Infrastructure Tab */}
          <TabsContent value="infrastructure" className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                To handle 3k concurrent users, your infrastructure needs to be scaled appropriately.
                Consider these recommendations for optimal performance.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {infrastructureRecommendations.map((rec, index) => (
                <Card key={index} data-testid={`infra-${index}`}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <h3 className="font-semibold" data-testid={`infra-component-${index}`}>{rec.component}</h3>
                        <Badge variant="outline" className="mt-1" data-testid={`infra-cost-${index}`}>{rec.cost}</Badge>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium mb-1" data-testid={`infra-recommendation-${index}`}>
                          {rec.recommendation}
                        </p>
                        <p className="text-xs text-gray-600" data-testid={`infra-implementation-${index}`}>
                          {rec.implementation}
                        </p>
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" data-testid={`infra-configure-${index}`}>
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Estimated Monthly Infrastructure Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2" data-testid="total-infrastructure-cost">
                  $250 - $850/month
                </div>
                <p className="text-sm text-gray-600">
                  Based on 3k concurrent users with high availability setup
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Implementation Tab */}
          <TabsContent value="implementation" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Step 1: Baseline Testing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Actions:</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li data-testid="baseline-action-1">Test current performance with 100 users</li>
                      <li data-testid="baseline-action-2">Identify bottlenecks and slow endpoints</li>
                      <li data-testid="baseline-action-3">Measure response times and error rates</li>
                      <li data-testid="baseline-action-4">Document current infrastructure limits</li>
                    </ul>
                  </div>
                  <Button className="w-full" data-testid="button-run-baseline">
                    <Play className="w-4 h-4 mr-2" />
                    Run Baseline Test
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Infrastructure Scaling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Actions:</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li data-testid="scaling-action-1">Deploy multiple Replit instances</li>
                      <li data-testid="scaling-action-2">Set up database connection pooling</li>
                      <li data-testid="scaling-action-3">Configure CDN for static assets</li>
                      <li data-testid="scaling-action-4">Implement Redis caching layer</li>
                    </ul>
                  </div>
                  <Button className="w-full" variant="outline" data-testid="button-scale-infrastructure">
                    <Server className="w-4 h-4 mr-2" />
                    Scale Infrastructure
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step 3: Gradual Load Testing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Actions:</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li data-testid="gradual-action-1">Test with 500 users</li>
                      <li data-testid="gradual-action-2">Test with 1500 users</li>
                      <li data-testid="gradual-action-3">Test with 3000 users</li>
                      <li data-testid="gradual-action-4">Monitor and optimize at each stage</li>
                    </ul>
                  </div>
                  <Button className="w-full" variant="outline" data-testid="button-gradual-test">
                    <Users className="w-4 h-4 mr-2" />
                    Start Gradual Testing
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step 4: Monitoring & Optimization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Actions:</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li data-testid="monitoring-action-1">Set up real-time monitoring dashboards</li>
                      <li data-testid="monitoring-action-2">Configure alerts for performance issues</li>
                      <li data-testid="monitoring-action-3">Implement automatic scaling policies</li>
                      <li data-testid="monitoring-action-4">Create runbooks for incident response</li>
                    </ul>
                  </div>
                  <Button className="w-full" variant="outline" data-testid="button-setup-monitoring">
                    <Monitor className="w-4 h-4 mr-2" />
                    Setup Monitoring
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Pro Tip:</strong> Always test in a staging environment that mirrors production.
                Start with smaller loads and gradually increase to identify the breaking point.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}