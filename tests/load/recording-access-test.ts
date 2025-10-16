import autocannon from 'autocannon';

interface LoadTestConfig {
  url: string;
  connections: number;
  duration: number;
  pipelining: number;
  sessionToken: string;
}

export async function runRecordingAccessLoadTest(config: LoadTestConfig) {
  console.log('🎥 Starting Recording Access Load Test...');
  console.log(`Connections: ${config.connections}, Duration: ${config.duration}s`);

  const result = await autocannon({
    url: config.url,
    connections: config.connections,
    duration: config.duration,
    pipelining: config.pipelining,
    requests: [
      {
        method: 'GET',
        path: '/api/recordings/merged/b2e0f8cc-e66e-4058-871e-7971143e1395',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${config.sessionToken}`
        }
      }
    ]
  });

  console.log('\n📊 Recording Access Load Test Results:');
  console.log(`Requests: ${result.requests.total}`);
  console.log(`Throughput: ${result.throughput.mean} bytes/sec`);
  console.log(`Latency: p50=${result.latency.p50}ms, p95=${result.latency.p95}ms, p99=${result.latency.p99}ms`);
  console.log(`Errors: ${result.errors}`);
  console.log(`Timeouts: ${result.timeouts}`);
  
  return result;
}
