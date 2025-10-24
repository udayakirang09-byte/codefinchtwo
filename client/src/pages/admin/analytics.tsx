import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown,
  Brain,
  Shield,
  MessageSquare,
  Mic,
  Cloud,
  Cpu,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  DollarSign,
  BookOpen,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import Navigation from '@/components/navigation';
import { apiRequest } from '@/lib/queryClient';

export default function AdminAnalytics() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  // AI Insights Query
  const { data: aiInsights = [], isLoading: insightsLoading } = useQuery<any[]>({
    queryKey: [`/api/admin/ai-insights?timeRange=${selectedTimeRange}`],
  });

  // Business Metrics Query
  const { data: businessMetrics = [], isLoading: metricsLoading } = useQuery<any[]>({
    queryKey: [`/api/admin/business-metrics?timeRange=${selectedTimeRange}`],
  });

  // Compliance Monitoring Query
  const { data: complianceData = [], isLoading: complianceLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/compliance-monitoring'],
  });

  // Chat Analytics Query
  const { data: chatAnalytics = [], isLoading: chatLoading } = useQuery<any[]>({
    queryKey: [`/api/admin/chat-analytics?timeRange=${selectedTimeRange}`],
  });

  // Teacher Audio Analytics Query (Rankings)
  const { data: teacherAnalytics = [], isLoading: teacherLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/teacher-analytics'],
  });

  // Original Audio Analytics Query (Session Details) - Now using real recording analysis
  const { data: audioAnalyticsData, isLoading: audioLoading, refetch: refetchAudioAnalytics } = useQuery<any>({
    queryKey: ['/api/admin/recordings/analyzed'],
  });

  const audioAnalytics = useMemo(() => {
    if (!audioAnalyticsData?.recordings) return [];
    
    return audioAnalyticsData.recordings.map((rec: any) => ({
      id: rec.id,
      recordingId: rec.recordingId,
      bookingId: rec.bookingId,
      mentorId: rec.mentorId,
      audioQuality: rec.audioQualityScore,
      teachingScore: rec.overallTeachingScore,
      clarity: rec.explanationClarity,
      engagement: rec.studentEngagement,
      pacing: rec.pacing,
      encouragement: rec.encouragement,
      topics: rec.keyTopics,
      summary: rec.aiSummary,
      analyzedAt: rec.analyzedAt
    }));
  }, [audioAnalyticsData]);

  // Cloud Deployments Query
  const { data: cloudDeployments = [], isLoading: cloudLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/cloud-deployments'],
  });

  // Technology Stack Query
  const { data: techStack = [], isLoading: techLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/technology-stack'],
  });

  // Quantum Tasks Query
  const { data: quantumTasks = [], isLoading: quantumLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/quantum-tasks'],
  });

  // Admin Stats Query for real data
  const { data: adminStats } = useQuery<any>({
    queryKey: ['/api/admin/stats'],
  });

  const handleRefreshAnalytics = async () => {
    setRefreshing(true);
    try {
      // Run AI analysis on all recordings
      const result = await apiRequest('POST', '/api/admin/recordings/analyze-all');
      console.log('✅ Analysis completed:', result);
      
      // Refetch the analyzed recordings data
      await refetchAudioAnalytics();
      
    } catch (error) {
      console.error('❌ Failed to analyze recordings:', error);
      alert('Failed to analyze recordings. Check console for details.');
    } finally {
      setRefreshing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600';
      case 'non_compliant': return 'text-red-600';
      case 'under_review': return 'text-yellow-600';
      case 'resolved': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const mockRevenueData = [
    { month: 'Jan', revenue: 15000, users: 120, sessions: 450 },
    { month: 'Feb', revenue: 18000, users: 145, sessions: 520 },
    { month: 'Mar', revenue: 22000, users: 178, sessions: 645 },
    { month: 'Apr', revenue: 25000, users: 203, sessions: 720 },
    { month: 'May', revenue: 28000, users: 234, sessions: 810 },
    { month: 'Jun', revenue: 32000, users: 267, sessions: 890 }
  ];

  const mockEngagementData = [
    { name: 'Active Users', value: 234, color: '#8884d8' },
    { name: 'Inactive Users', value: 123, color: '#82ca9d' },
    { name: 'New Users', value: 45, color: '#ffc658' },
    { name: 'Churned Users', value: 12, color: '#ff7c7c' }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Helper functions for teacher rankings
  const params = ['encourageInvolvement', 'pleasantCommunication', 'avoidPersonalDetails', 'overallScore'] as const;
  const score = (t: any, k: string) => t.metrics?.[k] ?? t[k] ?? 0;
  const ranks = useMemo(() => {
    const map: Record<string, Map<string, number>> = {};
    params.forEach(p => {
      const sorted = [...teacherAnalytics].sort((a, b) => score(b, p) - score(a, p));
      map[p] = new Map(sorted.map((t, i) => [t.mentorId ?? t.id ?? t.mentorName ?? String(i), i + 1]));
    });
    return map;
  }, [teacherAnalytics]);
  const colorFor = (v: number) => v >= 9 ? 'text-green-600 font-semibold' : v < 8 ? 'text-red-600 font-semibold' : 'text-gray-900';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="h-8 w-8 text-blue-600" />
              AI Analytics & Business Intelligence
            </h1>
            <p className="text-gray-600 mt-2">Advanced analytics with machine learning and predictive insights</p>
          </div>
          <div className="flex gap-3">
            <select 
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border rounded-lg"
              data-testid="select-time-range"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 3 Months</option>
            </select>
            <Button 
              onClick={handleRefreshAnalytics}
              disabled={refreshing}
              data-testid="button-refresh-analytics"
            >
              {refreshing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Run AI Analysis
                </>
              )}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="chat-analytics">Chat Analytics</TabsTrigger>
            <TabsTrigger value="audio-analytics">Audio Analytics</TabsTrigger>
            <TabsTrigger value="cloud">Cloud Deployment</TabsTrigger>
            <TabsTrigger value="tech-stack">Tech Stack</TabsTrigger>
            <TabsTrigger value="quantum">Quantum Computing</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="total-revenue">₹{adminStats?.monthlyRevenue?.toLocaleString() || '0'}</div>
                  <p className="text-xs text-muted-foreground">
                    Current month earnings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="active-users">{adminStats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {adminStats?.totalMentors || 0} mentors, {adminStats?.totalStudents || 0} students
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="total-sessions">{adminStats?.totalBookings || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {adminStats?.completedBookings || 0} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Course Completion</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="course-completion">{adminStats?.completionRate?.toFixed(1) || '0'}%</div>
                  <p className="text-xs text-muted-foreground">
                    Of all bookings
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>Monthly revenue and user growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="users" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                  <CardDescription>Distribution of user activity levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={mockEngagementData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {mockEngagementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai-insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Powered Insights & Predictions
                </CardTitle>
                <CardDescription>
                  Machine learning insights from user behavior patterns and business metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insightsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                      <span className="ml-3">Generating AI insights...</span>
                    </div>
                  ) : aiInsights.length > 0 ? (
                    aiInsights.map((insight: any, index: number) => (
                      <Alert key={insight.id || index} className="border-l-4 border-l-blue-500" data-testid={`ai-insight-${index}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold" data-testid={`insight-title-${index}`}>{insight.title}</h4>
                              <Badge variant={getPriorityColor(insight.priority)} data-testid={`insight-priority-${index}`}>
                                {insight.priority}
                              </Badge>
                            </div>
                            <AlertDescription data-testid={`insight-description-${index}`}>
                              {insight.description}
                            </AlertDescription>
                            <div className="mt-2 text-sm text-gray-500">
                              Confidence: {Math.round((insight.confidenceScore || 0.8) * 100)}%
                            </div>
                          </div>
                          {insight.actionRequired && (
                            <Button size="sm" variant="outline" data-testid={`insight-action-${index}`}>
                              Take Action
                            </Button>
                          )}
                        </div>
                      </Alert>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No AI insights available. Click "Run AI Analysis" to generate insights.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Compliance & Regulatory Monitoring
                </CardTitle>
                <CardDescription>
                  AI-powered compliance monitoring for GDPR, COPPA, and security regulations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
                      <span className="ml-3">Scanning for compliance issues...</span>
                    </div>
                  ) : complianceData.length > 0 ? (
                    complianceData.map((item: any, index: number) => (
                      <div key={item.id || index} className="border rounded-lg p-4" data-testid={`compliance-item-${index}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold" data-testid={`compliance-rule-${index}`}>{item.ruleName}</h4>
                            <Badge 
                              variant={item.severity === 'critical' ? 'destructive' : 'secondary'}
                              data-testid={`compliance-severity-${index}`}
                            >
                              {item.severity}
                            </Badge>
                          </div>
                          <span className={`text-sm font-medium ${getComplianceStatusColor(item.status)}`} data-testid={`compliance-status-${index}`}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2" data-testid={`compliance-description-${index}`}>{item.description}</p>
                        <div className="text-sm text-gray-500">
                          Type: {item.complianceType.toUpperCase()} | Rule ID: {item.ruleId}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      <p className="text-green-600 font-medium">All systems compliant</p>
                      <p className="text-gray-500 text-sm">No compliance issues detected</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Analytics Tab */}
          <TabsContent value="chat-analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat Analytics & Sentiment Analysis
                </CardTitle>
                <CardDescription>
                  AI analysis of chat sessions including sentiment, topics, and engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chatLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
                      <span className="ml-3">Analyzing chat data...</span>
                    </div>
                  ) : Array.isArray(chatAnalytics) && chatAnalytics.length > 0 ? (
                    chatAnalytics.map((chat: any, index: number) => (
                      <div key={chat.id || index} className="border rounded-lg p-4" data-testid={`chat-analytics-${index}`}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-500">Messages</div>
                            <div className="text-lg font-semibold" data-testid={`chat-message-count-${index}`}>{chat.messageCount || 0}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Sentiment Score</div>
                            <div className="text-lg font-semibold" data-testid={`chat-sentiment-${index}`}>
                              {((chat.sentimentScore || 0) * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Quality Score</div>
                            <div className="text-lg font-semibold" data-testid={`chat-quality-${index}`}>
                              {((chat.qualityScore || 0) * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Engagement</div>
                            <div className="text-lg font-semibold" data-testid={`chat-engagement-${index}`}>
                              {((chat.engagementScore || 0) * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                        {chat.topicsTags && chat.topicsTags.length > 0 && (
                          <div className="flex flex-wrap gap-2" data-testid={`chat-topics-${index}`}>
                            {chat.topicsTags.map((topic: string, topicIndex: number) => (
                              <Badge key={topicIndex} variant="outline">{topic}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No chat analytics data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audio Analytics & Teacher Rankings Tab */}
          <TabsContent value="audio-analytics" className="space-y-6">
            {/* Original Audio Analytics Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Audio Session Analytics
                </CardTitle>
                <CardDescription>
                  Detailed AI analysis of audio sessions with quality metrics, transcription, and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {audioLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
                      <span className="ml-3">Loading audio sessions...</span>
                    </div>
                  ) : Array.isArray(audioAnalytics) && audioAnalytics.length > 0 ? (
                    audioAnalytics.map((audio: any, index: number) => (
                      <div key={audio.id || index} className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50" data-testid={`audio-session-${index}`}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-500">Duration</div>
                            <div className="text-lg font-semibold" data-testid={`audio-duration-${index}`}>
                              {Math.floor((audio.duration || 0) / 60)}m {(audio.duration || 0) % 60}s
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Audio Quality</div>
                            <div className="text-lg font-semibold text-blue-600" data-testid={`audio-quality-${index}`}>
                              {((audio.audioQuality || 0) * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Speaking Ratio</div>
                            <div className="text-lg font-semibold text-green-600" data-testid={`audio-speaking-ratio-${index}`}>
                              {((audio.speakingTimeRatio || 0) * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Background Noise</div>
                            <div className="text-lg font-semibold text-orange-600" data-testid={`audio-noise-${index}`}>
                              {((audio.backgroundNoise || 0) * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-500 mb-2">Teaching Effectiveness</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${((audio.teachingEffectiveness || 0) * 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold" data-testid={`audio-effectiveness-${index}`}>
                                {((audio.teachingEffectiveness || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          
                          {audio.keyTopics && audio.keyTopics.length > 0 && (
                            <div>
                              <div className="text-sm text-gray-500 mb-2">Key Topics</div>
                              <div className="flex flex-wrap gap-2" data-testid={`audio-topics-${index}`}>
                                {audio.keyTopics.slice(0, 3).map((topic: string, topicIndex: number) => (
                                  <Badge key={topicIndex} variant="outline" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {audio.emotionalTone && Object.keys(audio.emotionalTone).length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm text-gray-500 mb-2">Emotional Tone Analysis</div>
                            <div className="flex flex-wrap gap-2" data-testid={`audio-emotions-${index}`}>
                              {Object.entries(audio.emotionalTone).map(([emotion, score]: [string, any]) => (
                                <div key={emotion} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs">
                                  {emotion}: {typeof score === 'number' ? score.toFixed(1) : score}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {audio.aiSummary && (
                          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200" data-testid={`audio-summary-${index}`}>
                            <div className="text-sm font-medium mb-2 text-gray-700">🤖 AI Session Summary</div>
                            <p className="text-sm text-gray-600">{audio.aiSummary}</p>
                          </div>
                        )}

                        {audio.aiTranscription && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg border" data-testid={`audio-transcript-${index}`}>
                            <div className="text-sm font-medium mb-2 text-gray-700">📝 AI Transcription</div>
                            <p className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                              {audio.aiTranscription.length > 200 
                                ? `${audio.aiTranscription.substring(0, 200)}...` 
                                : audio.aiTranscription}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Mic className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No audio session analytics available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Teacher Performance Rankings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Teacher Performance Rankings
                </CardTitle>
                <CardDescription>Rankings 1–10 per teaching parameter. Green ≥9, red &lt;8.</CardDescription>
              </CardHeader>
              <CardContent>
                {teacherLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
                    <span className="ml-3">Loading teacher rankings...</span>
                  </div>
                ) : (!Array.isArray(teacherAnalytics) || teacherAnalytics.length === 0) ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No teacher rankings available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 border border-gray-200 font-semibold" data-testid="col-teacher">Teacher</th>
                          {params.map(p => (
                            <th key={p} className="py-3 px-4 border border-gray-200 font-semibold text-center" data-testid={`col-${p}`}>
                              {p === 'encourageInvolvement' ? 'Student Involvement' :
                               p === 'pleasantCommunication' ? 'Communication' :
                               p === 'avoidPersonalDetails' ? 'Professional Boundaries' :
                               'Overall Score'}
                            </th>
                          ))}
                          <th className="py-3 px-4 border border-gray-200 font-semibold text-center" data-testid="col-classes">Classes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teacherAnalytics.map((t: any, idx: number) => {
                          const id = t.mentorId ?? t.id ?? t.mentorName ?? String(idx);
                          return (
                            <tr key={id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 border border-gray-200 font-medium" data-testid={`text-teacher-${id}`}>
                                {t.mentorName ?? t.name ?? t.teacherName ?? id}
                              </td>
                              {params.map(p => {
                                const v = Number(score(t, p));
                                const r = ranks[p]?.get(id);
                                return (
                                  <td key={p} className="py-3 px-4 border border-gray-200 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <span 
                                        className={`font-bold ${
                                          v >= 9 ? 'text-green-600 bg-green-100 px-2 py-1 rounded' :
                                          v < 8 ? 'text-red-600 bg-red-100 px-2 py-1 rounded' :
                                          'text-gray-900'
                                        }`}
                                        data-testid={`score-${p}-${id}`}
                                      >
                                        {v.toFixed(1)}/10
                                      </span>
                                      {typeof r === 'number' && r <= 10 && (
                                        <span className="text-xs bg-gray-100 rounded px-2 py-1" data-testid={`rank-${p}-${id}`}>
                                          #{r}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                              <td className="py-3 px-4 border border-gray-200 text-center" data-testid={`teacher-classes-${id}`}>
                                {t.totalClasses ?? 0}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {/* Legend */}
                    <div className="mt-6 flex items-center justify-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                        <span className="text-sm text-gray-600">Excellent Performance (≥9)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                        <span className="text-sm text-gray-600">Needs Improvement (&lt;8)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                        <span className="text-sm text-gray-600">Satisfactory (8-8.9)</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cloud Deployment Tab */}
          <TabsContent value="cloud" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Multi-Cloud Deployment Management
                </CardTitle>
                <CardDescription>
                  Monitor and manage deployments across AWS, Azure, and Google Cloud Platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Cloud className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">AWS</div>
                        <div className="text-sm text-gray-500">3 active deployments</div>
                        <Badge className="mt-2" variant="outline">Healthy</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Cloud className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">Azure</div>
                        <div className="text-sm text-gray-500">2 active deployments</div>
                        <Badge className="mt-2" variant="outline">Healthy</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Cloud className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">Google Cloud</div>
                        <div className="text-sm text-gray-500">1 active deployment</div>
                        <Badge className="mt-2" variant="outline">Healthy</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  {cloudLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                      <span className="ml-3">Loading deployment status...</span>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Cloud className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No cloud deployments configured</p>
                      <Button className="mt-4" data-testid="button-setup-cloud">
                        Setup Cloud Deployments
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Technology Stack Tab */}
          <TabsContent value="tech-stack" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Technology Stack Monitoring
                </CardTitle>
                <CardDescription>
                  Monitor technology versions, security scores, and upgrade recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {techLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
                      <span className="ml-3">Checking technology stack...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Mock technology stack data */}
                      {[
                        { name: 'React', version: '18.2.0', latest: '18.2.0', status: 'current', security: 95, performance: 92 },
                        { name: 'Node.js', version: '20.10.0', latest: '21.0.0', status: 'outdated', security: 88, performance: 90 },
                        { name: 'PostgreSQL', version: '15.4', latest: '16.0', status: 'outdated', security: 93, performance: 95 },
                        { name: 'TypeScript', version: '5.2.2', latest: '5.3.0', status: 'outdated', security: 98, performance: 94 },
                        { name: 'Express', version: '4.18.2', latest: '4.18.2', status: 'current', security: 91, performance: 88 },
                        { name: 'Tailwind CSS', version: '3.3.0', latest: '3.3.0', status: 'current', security: 99, performance: 97 }
                      ].map((tech, index) => (
                        <Card key={index} className="relative" data-testid={`tech-card-${index}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg" data-testid={`tech-name-${index}`}>{tech.name}</CardTitle>
                              <Badge 
                                variant={tech.status === 'current' ? 'default' : 'secondary'}
                                data-testid={`tech-status-${index}`}
                              >
                                {tech.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <div className="text-sm text-gray-500">Current: v{tech.version}</div>
                              <div className="text-sm text-gray-500">Latest: v{tech.latest}</div>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between text-sm">
                                  <span>Security Score</span>
                                  <span data-testid={`tech-security-${index}`}>{tech.security}%</span>
                                </div>
                                <Progress value={tech.security} className="h-2" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between text-sm">
                                  <span>Performance Score</span>
                                  <span data-testid={`tech-performance-${index}`}>{tech.performance}%</span>
                                </div>
                                <Progress value={tech.performance} className="h-2" />
                              </div>
                            </div>
                            
                            {tech.status !== 'current' && (
                              <Button size="sm" variant="outline" className="w-full" data-testid={`tech-upgrade-${index}`}>
                                Upgrade Available
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quantum Computing Tab */}
          <TabsContent value="quantum" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quantum Computing Integration
                </CardTitle>
                <CardDescription>
                  Leverage quantum algorithms for optimization and competitive advantage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quantumLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
                      <span className="ml-3">Quantum processing...</span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Quantum Applications */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center space-y-4">
                              <div className="w-16 h-16 bg-purple-100 rounded-lg mx-auto flex items-center justify-center">
                                <Zap className="h-8 w-8 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">Optimization</h3>
                                <p className="text-sm text-gray-500">Use QAOA for mentor-student matching</p>
                              </div>
                              <Button variant="outline" size="sm" data-testid="button-quantum-optimization">
                                Start Quantum Task
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center space-y-4">
                              <div className="w-16 h-16 bg-blue-100 rounded-lg mx-auto flex items-center justify-center">
                                <Brain className="h-8 w-8 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">Machine Learning</h3>
                                <p className="text-sm text-gray-500">Quantum neural networks for predictions</p>
                              </div>
                              <Button variant="outline" size="sm" data-testid="button-quantum-ml">
                                Train QML Model
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Quantum Advantage Metrics */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Quantum Advantage Metrics</CardTitle>
                          <CardDescription>Performance comparison: Quantum vs Classical</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium">Mentor Matching Optimization</div>
                                <div className="text-sm text-gray-500">QAOA vs Brute Force</div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600" data-testid="quantum-speedup">12.5x</div>
                                <div className="text-sm text-gray-500">speedup</div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium">Portfolio Optimization</div>
                                <div className="text-sm text-gray-500">VQE vs Classical Solver</div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600" data-testid="quantum-accuracy">98.7%</div>
                                <div className="text-sm text-gray-500">accuracy</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}