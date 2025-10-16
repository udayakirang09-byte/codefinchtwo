import { runLoginConcurrencyTest } from './login-concurrency-test';
import { runWebSocketLoadTest } from './websocket-load-test';
import { runDatabaseConnectionPoolTest } from './db-connection-pool-test';
import { runAuthLoadTest } from './auth-load-test';
import { runMentorDiscoveryLoadTest } from './mentor-discovery-test';
import { runRecordingAccessLoadTest } from './recording-access-test';

async function runComprehensiveLoadTest() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const wsUrl = process.env.WS_URL || 'ws://localhost:5000';
  const concurrentUsers = parseInt(process.env.CONCURRENT_USERS || '3000');
  
  console.log('='.repeat(100));
  console.log('🚀 CODECONNECT ENHANCED COMPREHENSIVE LOAD TEST');
  console.log('='.repeat(100));
  console.log(`\nTest Configuration:`);
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  WebSocket URL: ${wsUrl}`);
  console.log(`  Concurrent Users: ${concurrentUsers.toLocaleString()}`);
  console.log(`  Test Duration: 30 seconds per scenario\n`);
  console.log('='.repeat(100));
  
  const results: any[] = [];
  
  // Phase 1: Login Concurrency Stress Test
  console.log('\n\n📍 PHASE 1: LOGIN CONCURRENCY STRESS TEST');
  console.log('-'.repeat(100));
  try {
    const loginResult = await runLoginConcurrencyTest({
      url: baseUrl,
      connections: concurrentUsers,
      duration: 30,
      pipelining: 1
    });
    results.push({ phase: 'Login Concurrency', ...loginResult });
  } catch (error) {
    console.error('❌ Login Concurrency Test Failed:', error);
    results.push({ phase: 'Login Concurrency', error: String(error) });
  }
  
  // Phase 2: Database Connection Pool Test
  console.log('\n\n📍 PHASE 2: DATABASE CONNECTION POOL STRESS TEST');
  console.log('-'.repeat(100));
  try {
    const dbResult = await runDatabaseConnectionPoolTest({
      url: baseUrl,
      connections: concurrentUsers,
      duration: 30
    });
    results.push({ phase: 'Database Connection Pool', ...dbResult });
  } catch (error) {
    console.error('❌ Database Connection Pool Test Failed:', error);
    results.push({ phase: 'Database Connection Pool', error: String(error) });
  }
  
  // Phase 3: Authentication Flow
  console.log('\n\n📍 PHASE 3: AUTHENTICATION FLOW');
  console.log('-'.repeat(100));
  try {
    const authResult = await runAuthLoadTest({
      url: baseUrl,
      connections: concurrentUsers,
      duration: 30,
      pipelining: 1
    });
    results.push({ phase: 'Authentication', authResult });
  } catch (error) {
    console.error('❌ Authentication Test Failed:', error);
    results.push({ phase: 'Authentication', error: String(error) });
  }
  
  // Phase 4: Mentor Discovery
  console.log('\n\n📍 PHASE 4: MENTOR DISCOVERY & SEARCH');
  console.log('-'.repeat(100));
  try {
    const mentorResult = await runMentorDiscoveryLoadTest({
      url: baseUrl,
      connections: concurrentUsers,
      duration: 30,
      pipelining: 1
    });
    results.push({ phase: 'Mentor Discovery', mentorResult });
  } catch (error) {
    console.error('❌ Mentor Discovery Test Failed:', error);
    results.push({ phase: 'Mentor Discovery', error: String(error) });
  }
  
  // Phase 5: WebSocket Concurrent Connections (if WebSocket server is available)
  console.log('\n\n📍 PHASE 5: WEBSOCKET CONCURRENT CONNECTIONS');
  console.log('-'.repeat(100));
  try {
    const wsResult = await runWebSocketLoadTest({
      url: wsUrl,
      concurrentConnections: Math.min(concurrentUsers, 1000), // Limit to 1000 for WebSocket
      messagesPerConnection: 10,
      duration: 30
    });
    results.push({ phase: 'WebSocket', wsResult });
  } catch (error) {
    console.error('⚠️  WebSocket Test Skipped (server may not be running):', error);
    results.push({ phase: 'WebSocket', error: 'WebSocket server unavailable' });
  }
  
  // Final Summary
  console.log('\n\n' + '='.repeat(100));
  console.log('📊 COMPREHENSIVE LOAD TEST SUMMARY');
  console.log('='.repeat(100));
  
  console.log('\n🎯 Test Results Overview:\n');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.phase}:`);
    if (result.error) {
      console.log(`   ❌ ${result.error}`);
    } else if (result.successRate !== undefined) {
      console.log(`   ✅ Success Rate: ${result.successRate.toFixed(2)}%`);
    } else {
      console.log(`   ✅ Completed`);
    }
  });
  
  console.log('\n\n' + '='.repeat(100));
  console.log('🎯 OVERALL PERFORMANCE RECOMMENDATIONS');
  console.log('='.repeat(100));
  console.log(`
  📌 CRITICAL ACTIONS:
     1. Verify PostgreSQL max_connections >= 5000
     2. Implement PgBouncer for connection pooling
     3. Enable Azure App Service autoscaling (4+ instances)
     4. Configure sticky sessions for WebSocket connections
     
  📌 OPTIMIZATION PRIORITIES:
     1. Add Redis cache for frequently accessed data
     2. Implement CDN for static assets
     3. Add read replicas for analytics queries
     4. Optimize slow database queries
     5. Enable application-level caching
     
  📌 MONITORING & ALERTING:
     1. Set up Grafana dashboards for real-time metrics
     2. Configure alerts for P95 latency > 1000ms
     3. Monitor database connection pool saturation
     4. Track WebSocket connection counts
     5. Alert on error rates > 1%
  
  📌 CAPACITY PLANNING:
     Current Load: ${concurrentUsers.toLocaleString()} concurrent users
     Recommended Capacity: ${(concurrentUsers * 1.5).toLocaleString()} users (50% headroom)
     Scale Target: ${(concurrentUsers * 2).toLocaleString()} users
  `);
  
  console.log('\n' + '='.repeat(100));
  console.log('✅ COMPREHENSIVE LOAD TEST COMPLETED');
  console.log('='.repeat(100) + '\n');
}

// Run the comprehensive load test
runComprehensiveLoadTest().catch(console.error);
