import autocannon from 'autocannon';

interface LoadTestConfig {
  url: string;
  connections: number;
  duration: number;
  pipelining: number;
}

export async function runAuthLoadTest(config: LoadTestConfig) {
  console.log('🔐 Starting Authentication Load Test...');
  console.log(`Connections: ${config.connections}, Duration: ${config.duration}s`);

  const result = await autocannon({
    url: config.url,
    connections: config.connections,
    duration: config.duration,
    pipelining: config.pipelining,
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

  console.log('\n📊 Authentication Load Test Results:');
  console.log(`Requests: ${result.requests.total}`);
  console.log(`Throughput: ${result.throughput.mean} bytes/sec`);
  console.log(`Latency: p50=${result.latency.p50}ms, p97.5=${result.latency.p97_5}ms, p99=${result.latency.p99}ms`);
  console.log(`Errors: ${result.errors}`);
  console.log(`Timeouts: ${result.timeouts}`);
  
  return result;
}
