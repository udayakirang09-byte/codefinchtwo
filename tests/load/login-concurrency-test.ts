import autocannon from 'autocannon';

interface LoadTestConfig {
  url: string;
  connections: number;
  duration: number;
  pipelining: number;
}

export async function runLoginConcurrencyTest(config: LoadTestConfig) {
  console.log('🔐 Starting Login Concurrency Stress Test...');
  console.log(`Simultaneous Logins: ${config.connections}, Duration: ${config.duration}s`);

  // Test with student logins
  const studentResult = await autocannon({
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

  console.log('\n📊 Student Login Concurrency Results:');
  console.log(`Total Login Attempts: ${studentResult.requests.total}`);
  console.log(`Successful Logins: ${studentResult.requests.total - studentResult.errors}`);
  console.log(`Failed Logins: ${studentResult.errors}`);
  console.log(`Throughput: ${(studentResult.throughput.mean / 1024).toFixed(2)} KB/sec`);
  console.log(`Latency: p50=${studentResult.latency.p50}ms, p97.5=${studentResult.latency.p97_5}ms, p99=${studentResult.latency.p99}ms`);
  console.log(`Timeouts: ${studentResult.timeouts}`);
  
  // Test with mentor logins
  console.log('\n🎓 Testing Mentor Login Concurrency...');
  const mentorResult = await autocannon({
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
          email: 'testteacher@apptest.com',
          password: 'test123',
          role: 'mentor'
        })
      }
    ]
  });

  console.log('\n📊 Mentor Login Concurrency Results:');
  console.log(`Total Login Attempts: ${mentorResult.requests.total}`);
  console.log(`Successful Logins: ${mentorResult.requests.total - mentorResult.errors}`);
  console.log(`Failed Logins: ${mentorResult.errors}`);
  console.log(`Throughput: ${(mentorResult.throughput.mean / 1024).toFixed(2)} KB/sec`);
  console.log(`Latency: p50=${mentorResult.latency.p50}ms, p97.5=${mentorResult.latency.p97_5}ms, p99=${mentorResult.latency.p99}ms`);
  console.log(`Timeouts: ${mentorResult.timeouts}`);
  
  // Combined analysis
  const totalRequests = studentResult.requests.total + mentorResult.requests.total;
  const totalErrors = studentResult.errors + mentorResult.errors;
  const successRate = ((totalRequests - totalErrors) / totalRequests) * 100;
  
  console.log('\n📈 Combined Login Concurrency Analysis:');
  console.log(`Total Login Attempts: ${totalRequests.toLocaleString()}`);
  console.log(`Total Successful: ${(totalRequests - totalErrors).toLocaleString()}`);
  console.log(`Total Failed: ${totalErrors}`);
  console.log(`Overall Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`Average Latency p97.5: ${((studentResult.latency.p97_5 + mentorResult.latency.p97_5) / 2).toFixed(2)}ms`);
  
  // Performance assessment
  console.log('\n🎯 Login Concurrency Assessment:');
  if (successRate >= 99) {
    console.log('✅ Login system handling high concurrency well (≥99% success rate)');
  } else {
    console.log(`⚠️  Login system struggling with concurrency (${successRate.toFixed(2)}% < 99% target)`);
  }
  
  if (studentResult.latency.p97_5 < 500 && mentorResult.latency.p97_5 < 500) {
    console.log('✅ Login latency acceptable (<500ms at p97.5)');
  } else {
    console.log(`⚠️  High login latency detected (Student: ${studentResult.latency.p97_5}ms, Mentor: ${mentorResult.latency.p97_5}ms)`);
  }
  
  return { studentResult, mentorResult, successRate };
}
