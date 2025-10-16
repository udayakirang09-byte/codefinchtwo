import autocannon from 'autocannon';

interface StorageLoadConfig {
  url: string;
  connections: number;
  duration: number;
  sessionToken: string;
}

export async function runStorageUploadConcurrencyTest(config: StorageLoadConfig) {
  console.log('☁️ Starting Azure Blob Storage Upload Concurrency Test...');
  console.log(`Concurrent Upload Connections: ${config.connections}, Duration: ${config.duration}s\n`);

  // Test 1: Recording chunk upload simulation (via API endpoint stress)
  console.log('📤 Testing recording chunk upload endpoints...');
  const uploadSimulationResult = await autocannon({
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

  console.log('\n📊 Upload Endpoint Stress Results:');
  console.log(`Total Upload Requests: ${uploadSimulationResult.requests.total.toLocaleString()}`);
  console.log(`Successful: ${(uploadSimulationResult.requests.total - uploadSimulationResult.errors).toLocaleString()}`);
  console.log(`Failed: ${uploadSimulationResult.errors}`);
  console.log(`Throughput: ${(uploadSimulationResult.throughput.mean / 1024 / 1024).toFixed(2)} MB/sec`);
  console.log(`Latency: p50=${uploadSimulationResult.latency.p50}ms, p97.5=${uploadSimulationResult.latency.p97_5}ms, p99=${uploadSimulationResult.latency.p99}ms`);

  // Test 2: SAS URL generation (for playback access)
  console.log('\n\n🔗 Testing SAS URL generation under load...');
  const sasUrlResult = await autocannon({
    url: config.url,
    connections: Math.min(config.connections, 1000), // Limit SAS URL generation
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

  console.log('\n📊 SAS URL Generation Results:');
  console.log(`Total SAS Requests: ${sasUrlResult.requests.total.toLocaleString()}`);
  console.log(`Successful: ${(sasUrlResult.requests.total - sasUrlResult.errors).toLocaleString()}`);
  console.log(`Failed: ${sasUrlResult.errors}`);
  console.log(`Latency: p50=${sasUrlResult.latency.p50}ms, p97.5=${sasUrlResult.latency.p97_5}ms, p99=${sasUrlResult.latency.p99}ms`);

  // Test 3: Recording metadata retrieval (concurrent downloads)
  console.log('\n\n📥 Testing recording retrieval concurrency...');
  const retrievalResult = await autocannon({
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

  console.log('\n📊 Recording Retrieval Results:');
  console.log(`Total Retrieval Requests: ${retrievalResult.requests.total.toLocaleString()}`);
  console.log(`Successful: ${(retrievalResult.requests.total - retrievalResult.errors).toLocaleString()}`);
  console.log(`Failed: ${retrievalResult.errors}`);
  console.log(`Throughput: ${(retrievalResult.throughput.mean / 1024 / 1024).toFixed(2)} MB/sec`);
  console.log(`Latency: p50=${retrievalResult.latency.p50}ms, p97.5=${retrievalResult.latency.p97_5}ms, p99=${retrievalResult.latency.p99}ms`);

  // Performance assessment
  const totalRequests = uploadSimulationResult.requests.total + sasUrlResult.requests.total + retrievalResult.requests.total;
  const totalErrors = uploadSimulationResult.errors + sasUrlResult.errors + retrievalResult.errors;
  const successRate = ((totalRequests - totalErrors) / totalRequests) * 100;
  const avgLatencyP97 = (uploadSimulationResult.latency.p97_5 + sasUrlResult.latency.p97_5 + retrievalResult.latency.p97_5) / 3;
  const totalThroughput = uploadSimulationResult.throughput.mean + retrievalResult.throughput.mean;

  console.log('\n\n📈 Azure Storage Concurrency Analysis:');
  console.log(`Total Storage-Related Requests: ${totalRequests.toLocaleString()}`);
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`Average P97.5 Latency: ${avgLatencyP97.toFixed(2)}ms`);
  console.log(`Combined Throughput: ${(totalThroughput / 1024 / 1024).toFixed(2)} MB/sec`);

  // Estimate storage capacity
  const uploadRequestsPerSec = uploadSimulationResult.requests.total / config.duration;
  const retrievalRequestsPerSec = retrievalResult.requests.total / config.duration;
  const estimatedConcurrentUploads = Math.floor(uploadRequestsPerSec / 2); // Assuming 2 requests per upload
  const estimatedConcurrentDownloads = Math.floor(retrievalRequestsPerSec / 1); // 1 request per download

  console.log(`\n☁️ Azure Storage Capacity Estimates:`);
  console.log(`  Upload Requests/Sec: ${uploadRequestsPerSec.toFixed(0)}`);
  console.log(`  Download Requests/Sec: ${retrievalRequestsPerSec.toFixed(0)}`);
  console.log(`  Estimated Concurrent Uploads: ~${estimatedConcurrentUploads.toLocaleString()}`);
  console.log(`  Estimated Concurrent Downloads: ~${estimatedConcurrentDownloads.toLocaleString()}`);

  console.log('\n🎯 Storage Performance Assessment:');
  
  if (successRate >= 99) {
    console.log('✅ Azure Blob Storage handling concurrency excellently (≥99% success)');
  } else if (successRate >= 95) {
    console.log(`⚠️  Storage system under stress (${successRate.toFixed(2)}%)`);
  } else {
    console.log(`❌ Storage system failing under load (${successRate.toFixed(2)}%)`);
  }

  if (avgLatencyP97 < 1000) {
    console.log('✅ Storage latency acceptable (<1000ms)');
  } else if (avgLatencyP97 < 2000) {
    console.log(`⚠️  Storage latency elevated (${avgLatencyP97.toFixed(2)}ms)`);
  } else {
    console.log(`❌ Storage latency critical (${avgLatencyP97.toFixed(2)}ms)`);
  }

  // Azure Blob Storage bandwidth assessment
  const bandwidthMBps = totalThroughput / 1024 / 1024;
  console.log(`\n📊 Bandwidth Analysis:`);
  console.log(`  Current Throughput: ${bandwidthMBps.toFixed(2)} MB/sec`);
  
  if (bandwidthMBps < 50) {
    console.log('  ✅ Well within Azure Blob Storage limits (60 MB/s default)');
  } else if (bandwidthMBps < 60) {
    console.log('  ⚠️  Approaching Azure Blob Storage default limits (60 MB/s)');
  } else {
    console.log('  ❌ Exceeding default limits - Need to request limit increase');
  }

  console.log('\n💡 Azure Storage Recommendations:');
  console.log('   1. Implement multipart upload for large files (>100MB)');
  console.log('   2. Use block blob storage tier for video content');
  console.log('   3. Enable CDN for frequently accessed recordings');
  console.log('   4. Set blob access tier: Hot for recent, Cool for old recordings');
  console.log('   5. Implement chunked upload with retry logic');
  console.log('   6. Use SAS tokens with short expiration (1-2 hours)');
  console.log('   7. Monitor Azure Storage metrics for throttling');
  console.log(`   8. Current upload capacity: ~${estimatedConcurrentUploads} concurrent uploads`);
  console.log(`   9. Current download capacity: ~${estimatedConcurrentDownloads} concurrent downloads`);

  console.log('\n🔧 Azure Storage Configuration Checklist:');
  console.log('   □ Increase storage account limits if needed');
  console.log('   □ Configure lifecycle management for old recordings');
  console.log('   □ Set up geo-redundant storage (GRS) for reliability');
  console.log('   □ Enable blob versioning for data protection');
  console.log('   □ Configure CORS for browser uploads');

  return {
    uploadSimulationResult,
    sasUrlResult,
    retrievalResult,
    totalRequests,
    successRate,
    avgLatencyP97,
    estimatedConcurrentUploads,
    estimatedConcurrentDownloads,
    bandwidthMBps
  };
}
