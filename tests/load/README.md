# CodeConnect Load Testing Suite

Comprehensive load testing suite for validating CodeConnect platform performance under high concurrent user load.

## Test Coverage

The load testing suite tests all critical user flows:

1. **Authentication Flow** - User login and session management
2. **Mentor Discovery** - Search, filtering, and browsing mentors
3. **Booking & Payment** - Course booking and payment processing
4. **Recording Access** - Video recording retrieval and playback
5. **WebSocket Connections** - Real-time notifications and messaging

## Running Load Tests

### Full Test Suite (3000 Concurrent Users)
```bash
tsx tests/load/run-load-tests.ts
```

### Individual Test Scenarios
```bash
# Auth load test
tsx tests/load/auth-load-test.ts

# Mentor discovery test
tsx tests/load/mentor-discovery-test.ts

# Booking & payment test
tsx tests/load/booking-payment-test.ts

# Recording access test
tsx tests/load/recording-access-test.ts
```

## Test Configuration

- **Concurrent Users**: 3000 (configurable)
- **Test Duration**: 30 seconds per scenario
- **Pipelining**: 1 (sequential requests)
- **Metrics Tracked**:
  - Total requests processed
  - Throughput (bytes/sec)
  - Latency (p50, p95, p99)
  - Error count
  - Timeout count
  - Success rate

## Performance SLOs

- **P95 Latency**: < 1000ms
- **Success Rate**: > 99%
- **Error Rate**: < 1%

## Infrastructure Requirements

For optimal performance with 3000 concurrent users:

### Database
- PostgreSQL `max_connections` >= 5000
- PgBouncer connection pooling
- Read replicas for analytics

### Application
- 4+ Express.js instances (horizontal scaling)
- Azure App Service autoscaling enabled
- Sticky sessions for WebSocket connections

### Caching
- Redis cache for frequently accessed data
- CDN for static assets
- Cached mentor discovery results

### Monitoring
- Grafana dashboards for real-time metrics
- Alerts for P95 latency > 1000ms
- Database connection pool monitoring

## Test Results Interpretation

The test runner provides:
1. **Per-scenario metrics** - Detailed performance for each flow
2. **Overall statistics** - Aggregated performance across all scenarios
3. **Performance assessment** - Pass/fail against SLOs
4. **Recommendations** - Actionable optimization suggestions

## Troubleshooting

### High Latency
- Check database query performance
- Verify connection pool configuration
- Review application logs for bottlenecks

### High Error Rates
- Check server resources (CPU, memory)
- Verify database connection limits
- Review application error logs

### Timeouts
- Increase connection timeout settings
- Scale horizontally
- Optimize slow queries
