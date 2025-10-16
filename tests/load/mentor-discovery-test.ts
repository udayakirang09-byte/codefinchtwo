import autocannon from 'autocannon';

interface LoadTestConfig {
  url: string;
  connections: number;
  duration: number;
  pipelining: number;
}

export async function runMentorDiscoveryLoadTest(config: LoadTestConfig) {
  console.log('🔍 Starting Mentor Discovery Load Test...');
  console.log(`Connections: ${config.connections}, Duration: ${config.duration}s`);

  const result = await autocannon({
    url: config.url,
    connections: config.connections,
    duration: config.duration,
    pipelining: config.pipelining,
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
        path: '/api/mentors?subject=JavaScript&priceMin=0&priceMax=1000',
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
      }
    ]
  });

  console.log('\n📊 Mentor Discovery Load Test Results:');
  console.log(`Requests: ${result.requests.total}`);
  console.log(`Throughput: ${result.throughput.mean} bytes/sec`);
  console.log(`Latency: p50=${result.latency.p50}ms, p95=${result.latency.p95}ms, p99=${result.latency.p99}ms`);
  console.log(`Errors: ${result.errors}`);
  console.log(`Timeouts: ${result.timeouts}`);
  
  return result;
}
