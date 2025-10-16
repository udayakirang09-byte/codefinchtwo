import autocannon from 'autocannon';

interface LoadTestConfig {
  url: string;
  connections: number;
  duration: number;
  pipelining: number;
  sessionToken: string;
}

export async function runBookingPaymentLoadTest(config: LoadTestConfig) {
  console.log('💳 Starting Booking & Payment Load Test...');
  console.log(`Connections: ${config.connections}, Duration: ${config.duration}s`);

  // Test student booking flow
  const result = await autocannon({
    url: config.url,
    connections: config.connections,
    duration: config.duration,
    pipelining: config.pipelining,
    requests: [
      {
        method: 'GET',
        path: '/api/students/b2e0f8cc-e66e-4058-871e-7971143e1395/bookings',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${config.sessionToken}`
        }
      },
      {
        method: 'GET',
        path: '/api/students/b2e0f8cc-e66e-4058-871e-7971143e1395/stats',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${config.sessionToken}`
        }
      }
    ]
  });

  console.log('\n📊 Booking & Payment Load Test Results:');
  console.log(`Requests: ${result.requests.total}`);
  console.log(`Throughput: ${result.throughput.mean} bytes/sec`);
  console.log(`Latency: p50=${result.latency.p50}ms, p97.5=${result.latency.p97_5}ms, p99=${result.latency.p99}ms`);
  console.log(`Errors: ${result.errors}`);
  console.log(`Timeouts: ${result.timeouts}`);
  
  return result;
}
