import WebSocket from 'ws';

interface WebSocketLoadConfig {
  url: string;
  concurrentConnections: number;
  messagesPerConnection: number;
  duration: number; // in seconds
}

export async function runWebSocketLoadTest(config: WebSocketLoadConfig) {
  console.log('🌐 Starting WebSocket Load Test...');
  console.log(`Concurrent Connections: ${config.concurrentConnections}`);
  console.log(`Messages per Connection: ${config.messagesPerConnection}`);
  console.log(`Duration: ${config.duration}s\n`);

  const connections: WebSocket[] = [];
  const metrics = {
    totalConnections: 0,
    successfulConnections: 0,
    failedConnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    errors: 0,
    startTime: Date.now(),
    endTime: 0,
    latencies: [] as number[]
  };

  // Create concurrent WebSocket connections
  const connectionPromises = Array.from({ length: config.concurrentConnections }, async (_, index) => {
    return new Promise<void>((resolve) => {
      try {
        const ws = new WebSocket(config.url);
        metrics.totalConnections++;
        
        const messageStartTimes = new Map<string, number>();
        
        ws.on('open', () => {
          metrics.successfulConnections++;
          connections.push(ws);
          
          // Send messages
          for (let i = 0; i < config.messagesPerConnection; i++) {
            const messageId = `conn${index}_msg${i}`;
            const message = JSON.stringify({
              type: 'test',
              id: messageId,
              data: `Test message ${i} from connection ${index}`,
              timestamp: Date.now()
            });
            
            messageStartTimes.set(messageId, Date.now());
            ws.send(message);
            metrics.messagesSent++;
          }
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            const latency = Date.now() - (messageStartTimes.get(message.id) || Date.now());
            metrics.latencies.push(latency);
            metrics.messagesReceived++;
          } catch {
            metrics.messagesReceived++;
          }
        });

        ws.on('error', (error) => {
          metrics.errors++;
          metrics.failedConnections++;
        });

        ws.on('close', () => {
          resolve();
        });

        // Close connection after duration
        setTimeout(() => {
          ws.close();
        }, config.duration * 1000);
        
      } catch (error) {
        metrics.failedConnections++;
        metrics.errors++;
        resolve();
      }
    });
  });

  // Wait for all connections to complete
  await Promise.all(connectionPromises);
  metrics.endTime = Date.now();

  // Calculate statistics
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  const successRate = (metrics.successfulConnections / metrics.totalConnections) * 100;
  const messageSuccessRate = metrics.messagesSent > 0 
    ? (metrics.messagesReceived / metrics.messagesSent) * 100 
    : 0;

  // Calculate latency percentiles
  metrics.latencies.sort((a, b) => a - b);
  const getPercentile = (p: number) => {
    const index = Math.floor((metrics.latencies.length * p) / 100);
    return metrics.latencies[index] || 0;
  };

  console.log('\n📊 WebSocket Load Test Results:');
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log(`Total Connection Attempts: ${metrics.totalConnections}`);
  console.log(`Successful Connections: ${metrics.successfulConnections}`);
  console.log(`Failed Connections: ${metrics.failedConnections}`);
  console.log(`Connection Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`\nMessages Sent: ${metrics.messagesSent.toLocaleString()}`);
  console.log(`Messages Received: ${metrics.messagesReceived.toLocaleString()}`);
  console.log(`Message Success Rate: ${messageSuccessRate.toFixed(2)}%`);
  console.log(`Errors: ${metrics.errors}`);
  
  if (metrics.latencies.length > 0) {
    console.log(`\nMessage Latency:`);
    console.log(`  p50: ${getPercentile(50)}ms`);
    console.log(`  p95: ${getPercentile(95)}ms`);
    console.log(`  p99: ${getPercentile(99)}ms`);
  }

  console.log('\n🎯 WebSocket Performance Assessment:');
  if (successRate >= 95) {
    console.log('✅ WebSocket server handling concurrent connections well (≥95% success)');
  } else {
    console.log(`⚠️  WebSocket connection issues (${successRate.toFixed(2)}% < 95% target)`);
  }

  if (metrics.latencies.length > 0 && getPercentile(95) < 100) {
    console.log('✅ Message latency acceptable (<100ms at p95)');
  } else if (metrics.latencies.length > 0) {
    console.log(`⚠️  High message latency (${getPercentile(95)}ms at p95)`);
  }

  return metrics;
}
