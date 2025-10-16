import autocannon from 'autocannon';

interface DBLoadConfig {
  url: string;
  connections: number;
  duration: number;
}

export async function runDatabaseConnectionPoolTest(config: DBLoadConfig) {
  console.log('💾 Starting Database Connection Pool Stress Test...');
  console.log(`Concurrent Connections: ${config.connections}, Duration: ${config.duration}s\n`);

  // Test 1: Heavy read operations
  console.log('📖 Testing READ operations (Student stats queries)...');
  const readResult = await autocannon({
    url: config.url,
    connections: config.connections,
    duration: config.duration,
    pipelining: 1,
    requests: [
      {
        method: 'GET',
        path: '/api/students/b2e0f8cc-e66e-4058-871e-7971143e1395/stats',
        headers: {
          'content-type': 'application/json'
        }
      },
      {
        method: 'GET',
        path: '/api/students/b2e0f8cc-e66e-4058-871e-7971143e1395/bookings',
        headers: {
          'content-type': 'application/json'
        }
      },
      {
        method: 'GET',
        path: '/api/mentors',
        headers: {
          'content-type': 'application/json'
        }
      }
    ]
  });

  console.log('\n📊 READ Operations Results:');
  console.log(`Total Requests: ${readResult.requests.total.toLocaleString()}`);
  console.log(`Successful: ${(readResult.requests.total - readResult.errors).toLocaleString()}`);
  console.log(`Failed: ${readResult.errors}`);
  console.log(`Throughput: ${(readResult.throughput.mean / 1024 / 1024).toFixed(2)} MB/sec`);
  console.log(`Latency: p50=${readResult.latency.p50}ms, p97.5=${readResult.latency.p97_5}ms, p99=${readResult.latency.p99}ms`);
  console.log(`Timeouts: ${readResult.timeouts}`);

  // Test 2: Mixed operations (read + write simulation via GET with different endpoints)
  console.log('\n\n🔄 Testing MIXED operations (Various endpoints)...');
  const mixedResult = await autocannon({
    url: config.url,
    connections: config.connections,
    duration: config.duration,
    pipelining: 1,
    requests: [
      {
        method: 'GET',
        path: '/api/mentors',
        headers: {
          'content-type': 'application/json'
        }
      },
      {
        method: 'GET',
        path: '/api/discover-section-visible',
        headers: {
          'content-type': 'application/json'
        }
      },
      {
        method: 'GET',
        path: '/api/admin/ui-config',
        headers: {
          'content-type': 'application/json'
        }
      }
    ]
  });

  console.log('\n📊 MIXED Operations Results:');
  console.log(`Total Requests: ${mixedResult.requests.total.toLocaleString()}`);
  console.log(`Successful: ${(mixedResult.requests.total - mixedResult.errors).toLocaleString()}`);
  console.log(`Failed: ${mixedResult.errors}`);
  console.log(`Throughput: ${(mixedResult.throughput.mean / 1024 / 1024).toFixed(2)} MB/sec`);
  console.log(`Latency: p50=${mixedResult.latency.p50}ms, p97.5=${mixedResult.latency.p97_5}ms, p99=${mixedResult.latency.p99}ms`);
  console.log(`Timeouts: ${mixedResult.timeouts}`);

  // Performance assessment
  const totalRequests = readResult.requests.total + mixedResult.requests.total;
  const totalErrors = readResult.errors + mixedResult.errors;
  const totalTimeouts = readResult.timeouts + mixedResult.timeouts;
  const successRate = ((totalRequests - totalErrors) / totalRequests) * 100;
  const avgLatencyP97 = (readResult.latency.p97_5 + mixedResult.latency.p97_5) / 2;

  console.log('\n\n📈 Database Connection Pool Analysis:');
  console.log(`Total Queries Executed: ${totalRequests.toLocaleString()}`);
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Total Timeouts: ${totalTimeouts}`);
  console.log(`Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`Average P97.5 Latency: ${avgLatencyP97.toFixed(2)}ms`);

  console.log('\n🎯 Connection Pool Assessment:');
  
  if (successRate >= 99.5) {
    console.log('✅ Database connection pool handling load excellently (≥99.5% success)');
  } else if (successRate >= 95) {
    console.log(`⚠️  Database connection pool under stress (${successRate.toFixed(2)}%)`);
  } else {
    console.log(`❌ Database connection pool failing (${successRate.toFixed(2)}% < 95%)`);
  }

  if (totalTimeouts > totalRequests * 0.01) {
    console.log(`⚠️  High timeout rate detected (${((totalTimeouts / totalRequests) * 100).toFixed(2)}%)`);
    console.log('   Recommendation: Increase max_connections or implement PgBouncer');
  } else {
    console.log('✅ Timeout rate acceptable');
  }

  if (avgLatencyP97 < 500) {
    console.log('✅ Database query latency acceptable (<500ms at p97.5)');
  } else if (avgLatencyP97 < 1000) {
    console.log(`⚠️  Database query latency elevated (${avgLatencyP97.toFixed(2)}ms)`);
    console.log('   Recommendation: Add query optimization and caching');
  } else {
    console.log(`❌ Database query latency critical (${avgLatencyP97.toFixed(2)}ms)`);
    console.log('   Recommendation: Urgent optimization needed - check slow queries');
  }

  console.log('\n💡 Connection Pool Recommendations:');
  console.log('   1. Current Config Estimate: ~' + Math.ceil(config.connections * 1.2) + ' max connections needed');
  console.log('   2. Recommended: Set PostgreSQL max_connections >= 5000');
  console.log('   3. Implement PgBouncer for connection pooling');
  console.log('   4. Add read replicas for analytics queries');
  console.log('   5. Enable query caching for frequently accessed data');

  return {
    readResult,
    mixedResult,
    totalRequests,
    successRate,
    avgLatencyP97
  };
}
