#!/usr/bin/env tsx
import autocannon from 'autocannon';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function runQuickLoginTest() {
  console.log('🔐 Starting Quick Login Performance Test');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Concurrent Users: 500`);
  console.log(`Duration: 15 seconds`);
  console.log('='.repeat(60));

  const result = await autocannon({
    url: BASE_URL,
    connections: 500,
    duration: 15,
    pipelining: 1,
    requests: [
      {
        method: 'POST',
        path: '/api/login',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          email: 'teststudent@apptest.com',
          password: 'test123',
          role: 'student'
        })
      }
    ]
  });

  console.log('\n📊 Login Performance Results:');
  console.log('─'.repeat(60));
  console.log(`Total Requests:      ${result.requests.total.toLocaleString()}`);
  console.log(`Successful:          ${(result.requests.total - result.errors).toLocaleString()}`);
  console.log(`Failed:              ${result.errors}`);
  console.log(`Success Rate:        ${(((result.requests.total - result.errors) / result.requests.total) * 100).toFixed(2)}%`);
  console.log(`Throughput:          ${(result.throughput.mean / 1024).toFixed(2)} KB/sec`);
  console.log(`Latency p50:         ${result.latency.p50}ms`);
  console.log(`Latency p97.5:       ${result.latency.p97_5}ms`);
  console.log(`Latency p99:         ${result.latency.p99}ms`);
  console.log(`Timeouts:            ${result.timeouts}`);
  
  const successRate = ((result.requests.total - result.errors) / result.requests.total) * 100;
  
  console.log('\n🎯 Performance Assessment:');
  console.log('─'.repeat(60));
  
  if (successRate >= 99) {
    console.log('✅ Excellent: Success rate ≥99%');
  } else if (successRate >= 95) {
    console.log('⚠️  Good: Success rate ≥95% but <99%');
  } else {
    console.log(`❌ Poor: Success rate ${successRate.toFixed(2)}% (target: ≥99%)`);
  }
  
  if (result.latency.p97_5 < 500) {
    console.log('✅ Excellent: p97.5 latency <500ms');
  } else if (result.latency.p97_5 < 1000) {
    console.log('⚠️  Acceptable: p97.5 latency <1000ms');
  } else {
    console.log(`❌ Poor: p97.5 latency ${result.latency.p97_5}ms (target: <1000ms)`);
  }
  
  console.log('\n' + '='.repeat(60));
}

runQuickLoginTest().catch(console.error);
