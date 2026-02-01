# Kamanime Load Testing Suite

## Overview
This directory contains load testing scripts for the Kamanime backend API using k6.

## Prerequisites
```bash
# Install k6 (Windows)
choco install k6

# Or download from: https://k6.io/docs/get-started/installation/
```

## Test Scripts

### 1. Basic Health Test (`basic-health-test.js`)
**Purpose**: Establish baseline performance metrics
**Endpoint**: `GET /ping`
**Load Profile**: 0 → 10 → 50 → 100 → 50 → 0 users over 5 minutes

**Run**:
```bash
k6 run basic-health-test.js
```

**Expected Results**:
- P95 response time: <500ms
- Error rate: <10%
- Throughput: ~100 req/s at peak

---

### 2. Torrent Metadata Test (`torrent-metadata-test.js`)
**Purpose**: Test WebTorrent client under concurrent metadata requests
**Endpoint**: `GET /metadata/:magnet`
**Load Profile**: 0 → 5 → 10 → 15 → 5 → 0 users over 6.5 minutes

**Run**:
```bash
k6 run torrent-metadata-test.js
```

**Expected Results**:
- P95 response time: <10s (P2P operations are slow)
- Error rate: <20% (acceptable for P2P)
- Successful torrent additions tracked

**⚠️ Note**: This test uses public domain torrents (Sintel, Big Buck Bunny). Replace with actual test magnets if needed.

---

### 3. Streaming Load Test (`streaming-load-test.js`)
**Purpose**: Simulate concurrent video streaming with range requests
**Endpoint**: `GET /streamfile/:magnet/:filename`
**Load Profile**: Progressive load with realistic viewing patterns

**Run**:
```bash
k6 run streaming-load-test.js
```

---

## Monitoring During Tests

### Backend Metrics to Watch:
1. **CPU Usage**: `taskmgr` or `Get-Process node | Select-Object CPU`
2. **Memory**: Watch for memory leaks in WebTorrent client
3. **Network I/O**: Monitor torrent download/upload rates
4. **Active Torrents**: Check `client.torrents.length`

### Key Performance Indicators (KPIs):
- **Response Time**: P50, P95, P99 latencies
- **Throughput**: Requests per second
- **Error Rate**: Failed requests / Total requests
- **Resource Usage**: CPU%, Memory%, Network bandwidth

---

## Test Execution Strategy

### Phase 1: Baseline (Health Check)
```bash
k6 run basic-health-test.js
```
**Goal**: Confirm server is responsive under basic load

### Phase 2: WebTorrent Stress (Metadata)
```bash
k6 run torrent-metadata-test.js
```
**Goal**: Identify WebTorrent client bottlenecks

### Phase 3: Streaming Simulation
```bash
k6 run streaming-load-test.js
```
**Goal**: Test video streaming under realistic concurrent viewers

---

## Interpreting Results

### Good Performance:
✅ P95 < 500ms for /ping
✅ P95 < 10s for /metadata
✅ Error rate < 10%
✅ No memory leaks over 10+ minutes

### Warning Signs:
⚠️ Increasing response times over time (memory leak)
⚠️ High error rates (>20%)
⚠️ CPU consistently >80%
⚠️ Torrents not being cleaned up (memory accumulation)

### Critical Issues:
❌ Server crashes
❌ Unresponsive endpoints
❌ Memory usage >2GB
❌ Error rate >50%

---

## Optimization Recommendations

Based on test results, consider:

1. **Torrent Cleanup**: Implement automatic torrent removal after inactivity
2. **Connection Limits**: Limit concurrent WebTorrent connections
3. **Caching**: Cache torrent metadata for frequently accessed content
4. **Rate Limiting**: Prevent abuse of /add and /metadata endpoints
5. **Resource Monitoring**: Add Prometheus/Grafana for real-time metrics

---

## Advanced Testing (Future)

- **Soak Testing**: Run at 50% capacity for 24+ hours
- **Spike Testing**: Sudden traffic bursts (0 → 200 users in 10s)
- **Chaos Engineering**: Kill processes, simulate network failures
- **Database Load**: If you add a database, test query performance

---

## Troubleshooting

**Issue**: k6 not found
**Solution**: Install k6 or use Docker: `docker run --rm -v ${PWD}:/scripts grafana/k6 run /scripts/basic-health-test.js`

**Issue**: Connection refused
**Solution**: Ensure backend is running on port 64621

**Issue**: High error rates
**Solution**: Check backend logs, reduce concurrent users, increase timeouts

---

## Contact
For questions about load testing strategy, consult the performance engineering team.
