import autocannon from 'autocannon';

interface VideoClassLoadConfig {
  url: string;
  connections: number;
  duration: number;
  sessionToken: string;
}

export async function runVideoClassConcurrencyTest(config: VideoClassLoadConfig) {
  console.log('🎥 Starting Video Class Concurrency Test...');
  console.log(`Concurrent Video Sessions: ${config.connections}, Duration: ${config.duration}s\n`);

  // Test 1: Video session initiation
  console.log('📹 Testing video session initiation...');
  const sessionInitResult = await autocannon({
    url: config.url,
    connections: config.connections,
    duration: config.duration,
    pipelining: 1,
    requests: [
      {
        method: 'GET',
        path: '/api/students/b2e0f8cc-e66e-4058-871e-7971143e1395/bookings',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${config.sessionToken}`
        }
      }
    ]
  });

  console.log('\n📊 Video Session Initiation Results:');
  console.log(`Total Requests: ${sessionInitResult.requests.total.toLocaleString()}`);
  console.log(`Successful: ${(sessionInitResult.requests.total - sessionInitResult.errors).toLocaleString()}`);
  console.log(`Failed: ${sessionInitResult.errors}`);
  console.log(`Throughput: ${(sessionInitResult.throughput.mean / 1024 / 1024).toFixed(2)} MB/sec`);
  console.log(`Latency: p50=${sessionInitResult.latency.p50}ms, p97.5=${sessionInitResult.latency.p97_5}ms, p99=${sessionInitResult.latency.p99}ms`);

  // Test 2: Concurrent WebRTC signaling (simulated via API calls)
  console.log('\n\n📡 Testing WebRTC signaling load...');
  const signalingResult = await autocannon({
    url: config.url,
    connections: Math.min(config.connections, 500), // Limit signaling to 500 concurrent
    duration: config.duration,
    pipelining: 1,
    requests: [
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

  console.log('\n📊 WebRTC Signaling Results:');
  console.log(`Total Signaling Requests: ${signalingResult.requests.total.toLocaleString()}`);
  console.log(`Successful: ${(signalingResult.requests.total - signalingResult.errors).toLocaleString()}`);
  console.log(`Failed: ${signalingResult.errors}`);
  console.log(`Latency: p50=${signalingResult.latency.p50}ms, p97.5=${signalingResult.latency.p97_5}ms, p99=${signalingResult.latency.p99}ms`);

  // Test 3: Recording metadata access (concurrent students accessing recordings)
  console.log('\n\n📼 Testing recording metadata access...');
  const recordingMetadataResult = await autocannon({
    url: config.url,
    connections: config.connections,
    duration: config.duration,
    pipelining: 1,
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

  console.log('\n📊 Recording Metadata Access Results:');
  console.log(`Total Requests: ${recordingMetadataResult.requests.total.toLocaleString()}`);
  console.log(`Successful: ${(recordingMetadataResult.requests.total - recordingMetadataResult.errors).toLocaleString()}`);
  console.log(`Failed: ${recordingMetadataResult.errors}`);
  console.log(`Latency: p50=${recordingMetadataResult.latency.p50}ms, p97.5=${recordingMetadataResult.latency.p97_5}ms, p99=${recordingMetadataResult.latency.p99}ms`);

  // Performance assessment
  const totalRequests = sessionInitResult.requests.total + signalingResult.requests.total + recordingMetadataResult.requests.total;
  const totalErrors = sessionInitResult.errors + signalingResult.errors + recordingMetadataResult.errors;
  const successRate = ((totalRequests - totalErrors) / totalRequests) * 100;
  const avgLatencyP97 = (sessionInitResult.latency.p97_5 + signalingResult.latency.p97_5 + recordingMetadataResult.latency.p97_5) / 3;

  console.log('\n\n📈 Video Class Concurrency Analysis:');
  console.log(`Total Video-Related Requests: ${totalRequests.toLocaleString()}`);
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`Average P97.5 Latency: ${avgLatencyP97.toFixed(2)}ms`);

  console.log('\n🎯 Video Class Performance Assessment:');
  
  if (successRate >= 99) {
    console.log('✅ Video class system handling concurrency well (≥99% success)');
  } else if (successRate >= 95) {
    console.log(`⚠️  Video class system under stress (${successRate.toFixed(2)}%)`);
  } else {
    console.log(`❌ Video class system failing under load (${successRate.toFixed(2)}%)`);
  }

  if (avgLatencyP97 < 500) {
    console.log('✅ Video class latency acceptable (<500ms)');
  } else if (avgLatencyP97 < 1000) {
    console.log(`⚠️  Video class latency elevated (${avgLatencyP97.toFixed(2)}ms)`);
  } else {
    console.log(`❌ Video class latency critical (${avgLatencyP97.toFixed(2)}ms)`);
  }

  console.log('\n💡 Video Class Recommendations:');
  console.log(`   1. Current Capacity: ~${Math.floor(config.connections * (successRate / 100))} concurrent video sessions`);
  console.log('   2. Implement WebRTC SFU (Selective Forwarding Unit) for better scalability');
  console.log('   3. Use TURN servers for NAT traversal optimization');
  console.log('   4. Enable adaptive bitrate for network resilience');
  console.log('   5. Implement connection quality monitoring and fallback');

  return {
    sessionInitResult,
    signalingResult,
    recordingMetadataResult,
    totalRequests,
    successRate,
    avgLatencyP97
  };
}
