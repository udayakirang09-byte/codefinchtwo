import axios from 'axios';

export interface AzureMetric {
  id: string;
  name: string;
  category: 'General' | 'Concurrent';
  severity: 0 | 1 | 2 | 3 | 4; // 0=Critical, 1=High, 2=Medium, 3=Low, 4=Info
  value: number;
  unit: string;
  threshold?: number;
  description: string;
  hasFix: boolean;
  fixSolution?: string;
  timestamp: Date;
}

export interface AppInsightsConfig {
  appInsightsName: string;
  appId: string;
  apiKey: string;
}

export class AzureAppInsightsService {
  private config: AppInsightsConfig | null = null;

  constructor(config?: AppInsightsConfig) {
    this.config = config || null;
  }

  setConfig(config: AppInsightsConfig) {
    this.config = config;
  }

  private getApiUrl(metricName: string, timespan: string = 'PT1H'): string {
    if (!this.config) throw new Error('Azure App Insights config not set');
    return `https://api.applicationinsights.io/v1/apps/${this.config.appId}/metrics/${metricName}?timespan=${timespan}`;
  }

  private getHeaders() {
    if (!this.config) throw new Error('Azure App Insights config not set');
    return {
      'x-api-key': this.config.apiKey
    };
  }

  private generateMetricId(name: string, category: string): string {
    return `${category.toLowerCase()}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }

  async getMetric(metricName: string, timespan: string = 'PT1H'): Promise<any> {
    try {
      const url = this.getApiUrl(metricName, timespan);
      const response = await axios.get(url, { headers: this.getHeaders() });
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching metric ${metricName}:`, error.message);
      throw error;
    }
  }

  async getAllMetrics(): Promise<AzureMetric[]> {
    if (!this.config) {
      console.warn('Azure App Insights config not set, returning sample metrics');
      return this.getSampleMetrics();
    }

    try {
      const metrics: AzureMetric[] = [];

      // General Metrics
      const generalMetrics = [
        { name: 'requests/count', display: 'Request Count', category: 'General' as const, unit: 'count', threshold: 10000 },
        { name: 'requests/duration', display: 'Average Response Time', category: 'General' as const, unit: 'ms', threshold: 1000 },
        { name: 'exceptions/count', display: 'Exception Count', category: 'General' as const, unit: 'count', threshold: 100 },
        { name: 'requests/failed', display: 'Failed Requests', category: 'General' as const, unit: 'count', threshold: 500 },
        { name: 'availabilityResults/availabilityPercentage', display: 'Availability', category: 'General' as const, unit: '%', threshold: 99 },
        { name: 'performanceCounters/processCpuPercentage', display: 'CPU Usage', category: 'General' as const, unit: '%', threshold: 80 },
        { name: 'performanceCounters/processPrivateBytes', display: 'Memory Usage', category: 'General' as const, unit: 'MB', threshold: 2048 },
      ];

      // Concurrent Metrics  
      const concurrentMetrics = [
        { name: 'performanceCounters/requestsPerSecond', display: 'Requests/Second', category: 'Concurrent' as const, unit: 'req/s', threshold: 1000 },
        { name: 'dependencies/count', display: 'Dependency Calls', category: 'Concurrent' as const, unit: 'count', threshold: 5000 },
        { name: 'dependencies/duration', display: 'Dependency Response Time', category: 'Concurrent' as const, unit: 'ms', threshold: 2000 },
        { name: 'dependencies/failed', display: 'Dependency Failures', category: 'Concurrent' as const, unit: 'count', threshold: 200 },
        { name: 'customEvents/count', display: 'Custom Events', category: 'Concurrent' as const, unit: 'count', threshold: 10000 },
      ];

      const allMetricDefinitions = [...generalMetrics, ...concurrentMetrics];

      for (const metricDef of allMetricDefinitions) {
        try {
          const data = await this.getMetric(metricDef.name);
          const value = data?.value?.sum || data?.value?.avg || data?.value?.count || 0;
          
          const metric: AzureMetric = {
            id: this.generateMetricId(metricDef.display, metricDef.category),
            name: metricDef.display,
            category: metricDef.category,
            severity: this.calculateSeverity(value, metricDef.threshold),
            value: Number(value),
            unit: metricDef.unit,
            threshold: metricDef.threshold,
            description: this.getDescription(metricDef.display),
            hasFix: this.hasAutomatedFix(metricDef.display),
            fixSolution: this.getFixSolution(metricDef.display),
            timestamp: new Date()
          };

          metrics.push(metric);
        } catch (error) {
          console.error(`Failed to fetch ${metricDef.name}:`, error);
        }
      }

      return metrics;
    } catch (error) {
      console.error('Error fetching Azure metrics:', error);
      return this.getSampleMetrics();
    }
  }

  private calculateSeverity(value: number, threshold?: number): 0 | 1 | 2 | 3 | 4 {
    if (!threshold) return 4; // Info

    const ratio = value / threshold;
    
    if (ratio >= 1.5) return 0; // Critical - 150% of threshold
    if (ratio >= 1.2) return 1; // High - 120% of threshold
    if (ratio >= 1.0) return 2; // Medium - at threshold
    if (ratio >= 0.7) return 3; // Low - 70% of threshold
    return 4; // Info - below 70%
  }

  private getDescription(metricName: string): string {
    const descriptions: Record<string, string> = {
      'Request Count': 'Total number of HTTP requests received by the application',
      'Average Response Time': 'Average time taken to respond to requests',
      'Exception Count': 'Number of unhandled exceptions thrown',
      'Failed Requests': 'Number of requests that resulted in errors',
      'Availability': 'Percentage of successful availability test results',
      'CPU Usage': 'Percentage of CPU resources being consumed',
      'Memory Usage': 'Amount of memory being used by the process',
      'Requests/Second': 'Rate of incoming requests per second',
      'Dependency Calls': 'Number of calls to external dependencies',
      'Dependency Response Time': 'Average response time for dependency calls',
      'Dependency Failures': 'Number of failed dependency calls',
      'Custom Events': 'Count of custom telemetry events',
    };
    return descriptions[metricName] || 'Metric description not available';
  }

  private hasAutomatedFix(metricName: string): boolean {
    const fixableMetrics = [
      'Average Response Time',
      'CPU Usage',
      'Memory Usage',
      'Failed Requests',
      'Exception Count'
    ];
    return fixableMetrics.includes(metricName);
  }

  private getFixSolution(metricName: string): string | undefined {
    const solutions: Record<string, string> = {
      'Average Response Time': 'Scale up App Service plan to higher tier (P2V2 or P3V3) for better performance. Enable Application Insights auto-collection for detailed performance profiling.',
      'CPU Usage': 'Scale out by adding more instances. Check for CPU-intensive operations and optimize code. Consider upgrading to Premium tier with more CPU cores.',
      'Memory Usage': 'Increase memory by upgrading App Service plan. Check for memory leaks in application code. Implement proper disposal of resources.',
      'Failed Requests': 'Review error logs to identify failure patterns. Implement retry logic with exponential backoff. Add circuit breaker pattern for external dependencies.',
      'Exception Count': 'Enable Application Insights exception tracking. Add try-catch blocks around critical operations. Implement global exception handlers.'
    };
    return solutions[metricName];
  }

  // Sample metrics for when API is not configured
  private getSampleMetrics(): AzureMetric[] {
    return [
      // General - SEV 0 (Critical)
      {
        id: this.generateMetricId('Exception Count', 'General'),
        name: 'Exception Count',
        category: 'General',
        severity: 0,
        value: 1250,
        unit: 'count',
        threshold: 100,
        description: 'Number of unhandled exceptions thrown',
        hasFix: true,
        fixSolution: 'Enable Application Insights exception tracking. Add try-catch blocks around critical operations. Implement global exception handlers.',
        timestamp: new Date()
      },
      {
        id: this.generateMetricId('Failed Requests', 'General'),
        name: 'Failed Requests',
        category: 'General',
        severity: 0,
        value: 875,
        unit: 'count',
        threshold: 500,
        description: 'Number of requests that resulted in errors',
        hasFix: true,
        fixSolution: 'Review error logs to identify failure patterns. Implement retry logic with exponential backoff. Add circuit breaker pattern for external dependencies.',
        timestamp: new Date()
      },
      
      // General - SEV 1 (High)
      {
        id: this.generateMetricId('Average Response Time', 'General'),
        name: 'Average Response Time',
        category: 'General',
        severity: 1,
        value: 1350,
        unit: 'ms',
        threshold: 1000,
        description: 'Average time taken to respond to requests',
        hasFix: true,
        fixSolution: 'Scale up App Service plan to higher tier (P2V2 or P3V3) for better performance. Enable Application Insights auto-collection for detailed performance profiling.',
        timestamp: new Date()
      },
      {
        id: this.generateMetricId('CPU Usage', 'General'),
        name: 'CPU Usage',
        category: 'General',
        severity: 1,
        value: 92,
        unit: '%',
        threshold: 80,
        description: 'Percentage of CPU resources being consumed',
        hasFix: true,
        fixSolution: 'Scale out by adding more instances. Check for CPU-intensive operations and optimize code. Consider upgrading to Premium tier with more CPU cores.',
        timestamp: new Date()
      },

      // General - SEV 2 (Medium)
      {
        id: this.generateMetricId('Request Count', 'General'),
        name: 'Request Count',
        category: 'General',
        severity: 2,
        value: 11500,
        unit: 'count',
        threshold: 10000,
        description: 'Total number of HTTP requests received by the application',
        hasFix: false,
        timestamp: new Date()
      },
      {
        id: this.generateMetricId('Memory Usage', 'General'),
        name: 'Memory Usage',
        category: 'General',
        severity: 2,
        value: 2100,
        unit: 'MB',
        threshold: 2048,
        description: 'Amount of memory being used by the process',
        hasFix: true,
        fixSolution: 'Increase memory by upgrading App Service plan. Check for memory leaks in application code. Implement proper disposal of resources.',
        timestamp: new Date()
      },

      // General - SEV 3 (Low)
      {
        id: this.generateMetricId('Availability', 'General'),
        name: 'Availability',
        category: 'General',
        severity: 3,
        value: 98.5,
        unit: '%',
        threshold: 99,
        description: 'Percentage of successful availability test results',
        hasFix: false,
        timestamp: new Date()
      },

      // Concurrent - SEV 0 (Critical)
      {
        id: this.generateMetricId('Dependency Failures', 'Concurrent'),
        name: 'Dependency Failures',
        category: 'Concurrent',
        severity: 0,
        value: 325,
        unit: 'count',
        threshold: 200,
        description: 'Number of failed dependency calls',
        hasFix: false,
        timestamp: new Date()
      },

      // Concurrent - SEV 1 (High)
      {
        id: this.generateMetricId('Requests/Second', 'Concurrent'),
        name: 'Requests/Second',
        category: 'Concurrent',
        severity: 1,
        value: 1250,
        unit: 'req/s',
        threshold: 1000,
        description: 'Rate of incoming requests per second',
        hasFix: false,
        timestamp: new Date()
      },
      {
        id: this.generateMetricId('Dependency Response Time', 'Concurrent'),
        name: 'Dependency Response Time',
        category: 'Concurrent',
        severity: 1,
        value: 2400,
        unit: 'ms',
        threshold: 2000,
        description: 'Average response time for dependency calls',
        hasFix: false,
        timestamp: new Date()
      },

      // Concurrent - SEV 2 (Medium)
      {
        id: this.generateMetricId('Dependency Calls', 'Concurrent'),
        name: 'Dependency Calls',
        category: 'Concurrent',
        severity: 2,
        value: 5500,
        unit: 'count',
        threshold: 5000,
        description: 'Number of calls to external dependencies',
        hasFix: false,
        timestamp: new Date()
      },

      // Concurrent - SEV 4 (Info)
      {
        id: this.generateMetricId('Custom Events', 'Concurrent'),
        name: 'Custom Events',
        category: 'Concurrent',
        severity: 4,
        value: 3500,
        unit: 'count',
        threshold: 10000,
        description: 'Count of custom telemetry events',
        hasFix: false,
        timestamp: new Date()
      },
    ];
  }
}

export const azureAppInsights = new AzureAppInsightsService();
