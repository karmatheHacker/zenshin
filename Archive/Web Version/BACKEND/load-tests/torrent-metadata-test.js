/**
 * Torrent Metadata Load Test
 * Tests: /metadata/:magnet endpoint
 * Purpose: Test WebTorrent client under concurrent metadata requests
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const metadataFetchTime = new Trend('metadata_fetch_time');
const torrentAdditions = new Counter('torrent_additions');

export const options = {
    stages: [
        { duration: '1m', target: 5 },     // Start slow - WebTorrent is resource-intensive
        { duration: '2m', target: 10 },    // Gradual increase
        { duration: '2m', target: 15 },    // Peak load
        { duration: '1m', target: 5 },     // Ramp down
        { duration: '30s', target: 0 },    // Complete
    ],
    thresholds: {
        'http_req_duration': ['p(95)<10000'], // 95% under 10s (metadata can be slow)
        'errors': ['rate<0.2'],                // 20% error tolerance (P2P can fail)
    },
};

const BASE_URL = 'http://localhost:64621';

// Sample magnet links (replace with actual test magnets)
const TEST_MAGNETS = [
    'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10', // Sintel (open source film)
    'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c', // Big Buck Bunny
];

export default function () {
    const magnetIndex = Math.floor(Math.random() * TEST_MAGNETS.length);
    const magnet = encodeURIComponent(TEST_MAGNETS[magnetIndex]);

    const res = http.get(`${BASE_URL}/metadata/${magnet}`, {
        timeout: '30s', // Longer timeout for P2P operations
    });

    const success = check(res, {
        'status is 200': (r) => r.status === 200,
        'has files array': (r) => {
            try {
                const json = JSON.parse(r.body);
                return Array.isArray(json) && json.length > 0;
            } catch {
                return false;
            }
        },
    });

    if (success) {
        torrentAdditions.add(1);
    }

    errorRate.add(!success);
    metadataFetchTime.add(res.timings.duration);

    sleep(Math.random() * 3 + 2); // Random sleep 2-5s (realistic user behavior)
}
