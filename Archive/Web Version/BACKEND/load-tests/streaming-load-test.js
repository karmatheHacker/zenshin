/**
 * Streaming Load Test
 * Tests: /streamfile/:magnet/:filename endpoint
 * Purpose: Simulate concurrent video streaming with realistic range requests
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const streamingTime = new Trend('streaming_time');
const bytesStreamed = new Counter('bytes_streamed');
const concurrentViewers = new Counter('concurrent_viewers');

export const options = {
    stages: [
        { duration: '1m', target: 3 },     // 3 concurrent viewers
        { duration: '3m', target: 10 },    // Ramp to 10 viewers
        { duration: '3m', target: 15 },    // Peak: 15 concurrent streams
        { duration: '2m', target: 5 },     // Ramp down
        { duration: '1m', target: 0 },     // Complete
    ],
    thresholds: {
        'http_req_duration': ['p(95)<3000'], // 95% under 3s for stream chunks
        'errors': ['rate<0.15'],              // 15% error tolerance
    },
};

const BASE_URL = 'http://localhost:64621';

// Test configuration (replace with actual test data)
const TEST_MAGNET = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10';
const TEST_FILENAME = 'Sintel.mp4'; // Replace with actual filename from torrent

export default function () {
    const magnet = encodeURIComponent(TEST_MAGNET);
    const filename = encodeURIComponent(TEST_FILENAME);

    // Simulate video player requesting chunks
    // Typical video player requests 1-2MB chunks
    const chunkSize = 1024 * 1024 * 2; // 2MB chunks
    const startByte = Math.floor(Math.random() * 100) * chunkSize; // Random position
    const endByte = startByte + chunkSize - 1;

    const headers = {
        'Range': `bytes=${startByte}-${endByte}`,
    };

    const res = http.get(`${BASE_URL}/streamfile/${magnet}/${filename}`, {
        headers: headers,
        timeout: '30s',
    });

    const success = check(res, {
        'status is 206 (Partial Content)': (r) => r.status === 206,
        'has Content-Range header': (r) => r.headers['Content-Range'] !== undefined,
        'response has data': (r) => r.body.length > 0,
    });

    if (success) {
        bytesStreamed.add(res.body.length);
        concurrentViewers.add(1);
    }

    errorRate.add(!success);
    streamingTime.add(res.timings.duration);

    // Simulate realistic viewing pattern
    // Users watch for 5-15 seconds before requesting next chunk
    sleep(Math.random() * 10 + 5);
}

export function handleSummary(data) {
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
        'streaming-results.json': JSON.stringify(data),
    };
}

function textSummary(data, options) {
    const indent = options.indent || '';
    const colors = options.enableColors;

    let summary = '\n';
    summary += `${indent}✓ Total Requests: ${data.metrics.http_reqs.values.count}\n`;
    summary += `${indent}✓ Bytes Streamed: ${(data.metrics.bytes_streamed.values.count / 1024 / 1024).toFixed(2)} MB\n`;
    summary += `${indent}✓ Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n`;
    summary += `${indent}✓ P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;

    return summary;
}
