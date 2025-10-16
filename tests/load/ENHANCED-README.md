# CodeConnect Enhanced Load Testing Suite

Comprehensive load testing suite for validating CodeConnect platform performance under 3000+ concurrent users with focus on login concurrency, database connection pooling, and WebSocket stress testing.

## 🎯 Test Coverage

### Core Load Tests
1. **Login Concurrency Stress Test** - 3000 simultaneous logins (student + mentor)
2. **Database Connection Pool Test** - Validates PostgreSQL connection handling
3. **Authentication Flow** - Session management under load
4. **Mentor Discovery** - Search and filtering with 3000 users
5. **WebSocket Connections** - Real-time messaging and notifications
6. **Recording Access** - Video playback under concurrent load

### Key Metrics Tracked
- **Performance**: Latency (p50, p97.5, p99), Throughput
- **Reliability**: Success rate, Error count, Timeout rate
- **Scalability**: Connection handling, Database pool saturation
- **Real-time**: WebSocket message latency, Connection stability

## 🚀 Running Load Tests

### Comprehensive Test Suite (All Tests)
```bash
tsx tests/load/comprehensive-load-test.ts
```

### Individual Test Scenarios

#### 1. Login Concurrency Test (3000 simultaneous logins)
```bash
tsx tests/load/login-concurrency-test.ts
```
Tests both student and mentor login flows under extreme concurrency.

#### 2. Database Connection Pool Test
```bash
tsx tests/load/db-connection-pool-test.ts
```
Validates database can handle 3000+ concurrent connections with read/write operations.

#### 3. WebSocket Load Test
```bash
tsx tests/load/websocket-load-test.ts
```
Tests 1000-3000 concurrent WebSocket connections with message throughput.

#### 4. Authentication Flow
```bash
tsx tests/load/auth-load-test.ts
```

#### 5. Mentor Discovery
```bash
tsx tests/load/mentor-discovery-test.ts
```

#### 6. Recording Access
```bash
tsx tests/load/recording-access-test.ts
```

## ⚙️ Configuration

### Environment Variables
```bash
# Base API URL
export BASE_URL=http://localhost:5000

# WebSocket URL
export WS_URL=ws://localhost:5000

# Number of concurrent users (default: 3000)
export CONCURRENT_USERS=3000
```

### Test Duration
- Default: 30 seconds per scenario
- Configurable in each test file

## 📊 Performance SLOs

| Metric | Target | Critical |
|--------|--------|----------|
| Login Success Rate | > 99% | > 95% |
| P97.5 Latency | < 500ms | < 1000ms |
| Database Success Rate | > 99.5% | > 95% |
| WebSocket Connection Success | > 95% | > 90% |
| Timeout Rate | < 1% | < 5% |

## 🏗️ Infrastructure Requirements

### For 3000 Concurrent Users

#### Database (PostgreSQL)
- **max_connections**: >= 5000
- **Connection Pooling**: PgBouncer (required)
- **Read Replicas**: 2+ for analytics
- **Monitoring**: pg_stat_activity, connection count

#### Application Server
- **Instances**: 4+ (horizontal scaling)
- **vCPU**: 4+ per instance
- **Memory**: 8GB+ per instance
- **Autoscaling**: Enabled (CPU > 70%)

#### WebSocket Server
- **Max Connections**: 5000+ per instance
- **Sticky Sessions**: Required
- **Backup Instances**: 2+ for failover

#### Caching Layer
- **Redis**: For session and data caching
- **CDN**: For static assets
- **Query Cache**: For frequently accessed data

## 📈 Test Results Interpretation

### Login Concurrency Test
- ✅ **Good**: 99%+ success, <500ms p97.5 latency
- ⚠️ **Warning**: 95-99% success, 500-1000ms latency
- ❌ **Critical**: <95% success, >1000ms latency

### Database Connection Pool
- ✅ **Good**: 99.5%+ success, <1% timeouts
- ⚠️ **Warning**: 95-99.5% success, 1-5% timeouts
- ❌ **Critical**: <95% success, >5% timeouts

### WebSocket Connections
- ✅ **Good**: 95%+ connection success, <100ms message latency
- ⚠️ **Warning**: 90-95% success, 100-200ms latency
- ❌ **Critical**: <90% success, >200ms latency

## 🔧 Troubleshooting

### High Login Latency
1. Check database connection pool saturation
2. Verify bcrypt rounds (should be 10-12)
3. Enable session caching
4. Scale horizontally

### Database Connection Timeouts
1. Increase max_connections in PostgreSQL
2. Implement PgBouncer connection pooling
3. Add connection timeout logging
4. Review slow query logs

### WebSocket Connection Failures
1. Check firewall/load balancer settings
2. Verify sticky session configuration
3. Monitor WebSocket server resources
4. Increase connection limits

### High Error Rates
1. Check server resource utilization (CPU, memory)
2. Review application error logs
3. Verify database health
4. Check network connectivity

## 📊 Sample Test Output

```
================================================================================
🚀 CODECONNECT ENHANCED COMPREHENSIVE LOAD TEST
================================================================================

Test Configuration:
  Base URL: http://localhost:5000
  WebSocket URL: ws://localhost:5000
  Concurrent Users: 3,000
  Test Duration: 30 seconds per scenario

================================================================================

📍 PHASE 1: LOGIN CONCURRENCY STRESS TEST
----------------------------------------
🔐 Starting Login Concurrency Stress Test...
Simultaneous Logins: 3000, Duration: 30s

📊 Student Login Concurrency Results:
Total Login Attempts: 45,678
Successful Logins: 45,345
Failed Logins: 333
Success Rate: 99.27%
Latency: p50=234ms, p97.5=456ms, p99=678ms

✅ Login system handling high concurrency well (≥99% success rate)
✅ Login latency acceptable (<500ms at p97.5)

...
```

## 🎯 Next Steps After Load Testing

1. **Address Bottlenecks**: Fix any critical issues identified
2. **Optimize Performance**: Implement caching, query optimization
3. **Scale Infrastructure**: Add instances, connection pooling
4. **Enable Monitoring**: Set up Grafana/Prometheus
5. **Continuous Testing**: Integrate into CI/CD pipeline

## 📝 Notes

- Payment gateway transaction tests are excluded (on hold)
- WebSocket tests require WebSocket server to be running
- Some tests may be skipped if services are unavailable
- Results may vary based on hardware and network conditions
