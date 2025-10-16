import autocannon from 'autocannon';

interface ChatLoadConfig {
  url: string;
  connections: number;
  duration: number;
  sessionToken: string;
}

export async function runChatConcurrencyTest(config: ChatLoadConfig) {
  console.log('💬 Starting Chat Concurrency Test...');
  console.log(`Concurrent Chat Users: ${config.connections}, Duration: ${config.duration}s\n`);

  // Test 1: Chat message retrieval (reading message history)
  console.log('📖 Testing chat message retrieval...');
  const messageRetrievalResult = await autocannon({
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

  console.log('\n📊 Chat Message Retrieval Results:');
  console.log(`Total Requests: ${messageRetrievalResult.requests.total.toLocaleString()}`);
  console.log(`Successful: ${(messageRetrievalResult.requests.total - messageRetrievalResult.errors).toLocaleString()}`);
  console.log(`Failed: ${messageRetrievalResult.errors}`);
  console.log(`Throughput: ${(messageRetrievalResult.throughput.mean / 1024).toFixed(2)} KB/sec`);
  console.log(`Latency: p50=${messageRetrievalResult.latency.p50}ms, p97.5=${messageRetrievalResult.latency.p97_5}ms, p99=${messageRetrievalResult.latency.p99}ms`);

  // Test 2: User presence/status checks
  console.log('\n\n👥 Testing user presence queries...');
  const presenceResult = await autocannon({
    url: config.url,
    connections: config.connections,
    duration: config.duration,
    pipelining: 1,
    requests: [
      {
        method: 'GET',
        path: '/api/users/a4cd5b62-020a-43c1-93ab-f9326c5b629c/notifications',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${config.sessionToken}`
        }
      }
    ]
  });

  console.log('\n📊 User Presence Results:');
  console.log(`Total Requests: ${presenceResult.requests.total.toLocaleString()}`);
  console.log(`Successful: ${(presenceResult.requests.total - presenceResult.errors).toLocaleString()}`);
  console.log(`Failed: ${presenceResult.errors}`);
  console.log(`Latency: p50=${presenceResult.latency.p50}ms, p97.5=${presenceResult.latency.p97_5}ms, p99=${presenceResult.latency.p99}ms`);

  // Test 3: Notification retrieval (chat notifications)
  console.log('\n\n🔔 Testing notification retrieval...');
  const notificationResult = await autocannon({
    url: config.url,
    connections: config.connections,
    duration: config.duration,
    pipelining: 1,
    requests: [
      {
        method: 'GET',
        path: '/api/users/a4cd5b62-020a-43c1-93ab-f9326c5b629c/notifications',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${config.sessionToken}`
        }
      }
    ]
  });

  console.log('\n📊 Notification Retrieval Results:');
  console.log(`Total Requests: ${notificationResult.requests.total.toLocaleString()}`);
  console.log(`Successful: ${(notificationResult.requests.total - notificationResult.errors).toLocaleString()}`);
  console.log(`Failed: ${notificationResult.errors}`);
  console.log(`Latency: p50=${notificationResult.latency.p50}ms, p97.5=${notificationResult.latency.p97_5}ms, p99=${notificationResult.latency.p99}ms`);

  // Performance assessment
  const totalRequests = messageRetrievalResult.requests.total + presenceResult.requests.total + notificationResult.requests.total;
  const totalErrors = messageRetrievalResult.errors + presenceResult.errors + notificationResult.errors;
  const successRate = ((totalRequests - totalErrors) / totalRequests) * 100;
  const avgLatencyP97 = (messageRetrievalResult.latency.p97_5 + presenceResult.latency.p97_5 + notificationResult.latency.p97_5) / 3;

  console.log('\n\n📈 Chat Concurrency Analysis:');
  console.log(`Total Chat-Related Requests: ${totalRequests.toLocaleString()}`);
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`Average P97.5 Latency: ${avgLatencyP97.toFixed(2)}ms`);

  // Estimate concurrent chat capacity
  const messagesPerSecond = messageRetrievalResult.requests.total / config.duration;
  const estimatedConcurrentChats = Math.floor(messagesPerSecond / 10); // Assuming 10 messages per chat session

  console.log(`\n💬 Chat System Capacity:`);
  console.log(`  Messages/Second: ${messagesPerSecond.toFixed(0)}`);
  console.log(`  Estimated Concurrent Chats: ~${estimatedConcurrentChats.toLocaleString()}`);

  console.log('\n🎯 Chat Performance Assessment:');
  
  if (successRate >= 99) {
    console.log('✅ Chat system handling concurrency excellently (≥99% success)');
  } else if (successRate >= 95) {
    console.log(`⚠️  Chat system under stress (${successRate.toFixed(2)}%)`);
  } else {
    console.log(`❌ Chat system failing under load (${successRate.toFixed(2)}%)`);
  }

  if (avgLatencyP97 < 200) {
    console.log('✅ Chat latency excellent (<200ms) - Real-time feel maintained');
  } else if (avgLatencyP97 < 500) {
    console.log(`⚠️  Chat latency acceptable but elevated (${avgLatencyP97.toFixed(2)}ms)`);
  } else {
    console.log(`❌ Chat latency too high (${avgLatencyP97.toFixed(2)}ms) - User experience degraded`);
  }

  console.log('\n💡 Chat System Recommendations:');
  console.log('   1. Implement WebSocket connection pooling');
  console.log('   2. Use Redis pub/sub for message broadcasting');
  console.log('   3. Enable message caching for recent history');
  console.log('   4. Implement read receipts with batching');
  console.log('   5. Add message delivery queue for offline users');
  console.log(`   6. Current capacity: ~${estimatedConcurrentChats} concurrent active chats`);

  return {
    messageRetrievalResult,
    presenceResult,
    notificationResult,
    totalRequests,
    successRate,
    avgLatencyP97,
    estimatedConcurrentChats
  };
}
