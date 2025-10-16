import { runAuthLoadTest } from './auth-load-test';
import { runMentorDiscoveryLoadTest } from './mentor-discovery-test';
import { runBookingPaymentLoadTest } from './booking-payment-test';
import { runRecordingAccessLoadTest } from './recording-access-test';

interface LoadTestSummary {
  testName: string;
  totalRequests: number;
  throughput: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  errors: number;
  timeouts: number;
  successRate: number;
}

async function runComprehensiveLoadTests() {
  const baseUrl = process.env.REPL_URL || 'http://localhost:5000';
  
  // First, get session token for authenticated tests
  console.log('🔐 Obtaining session token for authenticated tests...\n');
  const loginResponse = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'teststudent@apptest.com',
      password: 'test123',
      role: 'student'
    })
  });
  
  const loginData = await loginResponse.json();
  const sessionToken = loginData.sessionToken || '';
  
  if (!sessionToken) {
    console.error('❌ Failed to obtain session token. Exiting.');
    process.exit(1);
  }
  
  console.log('✅ Session token obtained\n');
  console.log('='.repeat(80));
  console.log('🚀 CODECONNECT COMPREHENSIVE LOAD TEST');
  console.log('='.repeat(80));
  console.log(`Target: 3000 concurrent users`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Test Duration: 30 seconds per scenario\n`);
  
  const results: LoadTestSummary[] = [];
  
  // Phase 1: Authentication Load Test (3000 concurrent connections)
  console.log('\n📍 PHASE 1: Authentication Flow');
  console.log('-'.repeat(80));
  const authResult = await runAuthLoadTest({
    url: baseUrl,
    connections: 3000,
    duration: 30,
    pipelining: 1
  });
  
  results.push({
    testName: 'Authentication Flow',
    totalRequests: authResult.requests.total,
    throughput: authResult.throughput.mean,
    latencyP50: authResult.latency.p50,
    latencyP95: authResult.latency.p97_5,
    latencyP99: authResult.latency.p99,
    errors: authResult.errors,
    timeouts: authResult.timeouts,
    successRate: ((authResult.requests.total - authResult.errors) / authResult.requests.total) * 100
  });
  
  // Phase 2: Mentor Discovery (3000 concurrent connections)
  console.log('\n📍 PHASE 2: Mentor Discovery & Search');
  console.log('-'.repeat(80));
  const mentorResult = await runMentorDiscoveryLoadTest({
    url: baseUrl,
    connections: 3000,
    duration: 30,
    pipelining: 1
  });
  
  results.push({
    testName: 'Mentor Discovery',
    totalRequests: mentorResult.requests.total,
    throughput: mentorResult.throughput.mean,
    latencyP50: mentorResult.latency.p50,
    latencyP95: mentorResult.latency.p97_5,
    latencyP99: mentorResult.latency.p99,
    errors: mentorResult.errors,
    timeouts: mentorResult.timeouts,
    successRate: ((mentorResult.requests.total - mentorResult.errors) / mentorResult.requests.total) * 100
  });
  
  // Phase 3: Booking & Payment Flow (3000 concurrent connections)
  console.log('\n📍 PHASE 3: Booking & Payment Processing');
  console.log('-'.repeat(80));
  const bookingResult = await runBookingPaymentLoadTest({
    url: baseUrl,
    connections: 3000,
    duration: 30,
    pipelining: 1,
    sessionToken
  });
  
  results.push({
    testName: 'Booking & Payment',
    totalRequests: bookingResult.requests.total,
    throughput: bookingResult.throughput.mean,
    latencyP50: bookingResult.latency.p50,
    latencyP95: bookingResult.latency.p97_5,
    latencyP99: bookingResult.latency.p99,
    errors: bookingResult.errors,
    timeouts: bookingResult.timeouts,
    successRate: ((bookingResult.requests.total - bookingResult.errors) / bookingResult.requests.total) * 100
  });
  
  // Phase 4: Recording Access (3000 concurrent connections)
  console.log('\n📍 PHASE 4: Recording Access & Playback');
  console.log('-'.repeat(80));
  const recordingResult = await runRecordingAccessLoadTest({
    url: baseUrl,
    connections: 3000,
    duration: 30,
    pipelining: 1,
    sessionToken
  });
  
  results.push({
    testName: 'Recording Access',
    totalRequests: recordingResult.requests.total,
    throughput: recordingResult.throughput.mean,
    latencyP50: recordingResult.latency.p50,
    latencyP95: recordingResult.latency.p97_5,
    latencyP99: recordingResult.latency.p99,
    errors: recordingResult.errors,
    timeouts: recordingResult.timeouts,
    successRate: ((recordingResult.requests.total - recordingResult.errors) / recordingResult.requests.total) * 100
  });
  
  // Print Summary Report
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE LOAD TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('\n');
  
  results.forEach(result => {
    console.log(`\n🔹 ${result.testName}`);
    console.log(`   Total Requests: ${result.totalRequests.toLocaleString()}`);
    console.log(`   Throughput: ${(result.throughput / 1024 / 1024).toFixed(2)} MB/sec`);
    console.log(`   Latency (p50/p95/p99): ${result.latencyP50}ms / ${result.latencyP95}ms / ${result.latencyP99}ms`);
    console.log(`   Errors: ${result.errors}`);
    console.log(`   Timeouts: ${result.timeouts}`);
    console.log(`   Success Rate: ${result.successRate.toFixed(2)}%`);
  });
  
  // Overall Statistics
  const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  const avgLatencyP95 = results.reduce((sum, r) => sum + r.latencyP95, 0) / results.length;
  const overallSuccessRate = ((totalRequests - totalErrors) / totalRequests) * 100;
  
  console.log('\n\n' + '='.repeat(80));
  console.log('📈 OVERALL PERFORMANCE');
  console.log('='.repeat(80));
  console.log(`\n   Total Requests Processed: ${totalRequests.toLocaleString()}`);
  console.log(`   Total Errors: ${totalErrors}`);
  console.log(`   Average P95 Latency: ${avgLatencyP95.toFixed(2)}ms`);
  console.log(`   Overall Success Rate: ${overallSuccessRate.toFixed(2)}%`);
  
  // Performance Assessment
  console.log('\n\n' + '='.repeat(80));
  console.log('✅ PERFORMANCE ASSESSMENT');
  console.log('='.repeat(80));
  
  const performanceIssues: string[] = [];
  
  if (avgLatencyP95 > 1000) {
    performanceIssues.push(`⚠️  High P95 latency (${avgLatencyP95.toFixed(2)}ms > 1000ms threshold)`);
  }
  
  if (overallSuccessRate < 99) {
    performanceIssues.push(`⚠️  Low success rate (${overallSuccessRate.toFixed(2)}% < 99% SLO)`);
  }
  
  results.forEach(result => {
    if (result.latencyP95 > 1000) {
      performanceIssues.push(`⚠️  ${result.testName}: High P95 latency (${result.latencyP95}ms)`);
    }
    if (result.successRate < 99) {
      performanceIssues.push(`⚠️  ${result.testName}: Low success rate (${result.successRate.toFixed(2)}%)`);
    }
  });
  
  if (performanceIssues.length === 0) {
    console.log('\n✅ All tests passed performance criteria!');
    console.log('   - P95 latency < 1000ms ✓');
    console.log('   - Success rate > 99% ✓');
  } else {
    console.log('\n⚠️  Performance issues detected:\n');
    performanceIssues.forEach(issue => console.log(`   ${issue}`));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 RECOMMENDATIONS');
  console.log('='.repeat(80));
  console.log(`
   1. Database Optimization:
      - Ensure PostgreSQL has max_connections >= 5000
      - Implement connection pooling with PgBouncer
      - Add read replicas for analytics queries
      
   2. Application Scaling:
      - Scale Express.js horizontally (4+ instances)
      - Enable Azure App Service autoscaling
      - Implement sticky sessions for WebSocket connections
      
   3. Caching Strategy:
      - Add Redis cache for frequently accessed data
      - Implement CDN for static assets
      - Cache mentor discovery results
      
   4. Monitoring & Alerting:
      - Set up Grafana dashboards for real-time metrics
      - Configure alerts for P95 latency > 1000ms
      - Monitor database connection pool saturation
  `);
  
  console.log('\n' + '='.repeat(80) + '\n');
}

// Run the comprehensive load tests
runComprehensiveLoadTests().catch(console.error);
