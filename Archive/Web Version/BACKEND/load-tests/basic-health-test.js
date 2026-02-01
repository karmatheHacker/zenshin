/**
 * Basic Health Check Load Test
 * Tests: /ping endpoint
 * Purpose: Establish baseline performance metrics
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
    stages: [
        { duration: '30s', target: 10 },   // Ramp up to 10 users
        { duration: '1m', target: 50 },    // Ramp up to 50 users
        { duration: '2m', target: 100 },   // Ramp up to 100 users
        { duration: '1m', target: 50 },    // Ramp down to 50
        { duration: '30s', target: 0 },    // Ramp down to 0
    ],
    thresholds: {
        'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
        'errors': ['rate<0.1'],              // Error rate should be below 10%
    },
};

const BASE_URL = 'http://localhost:64621';

export default function () {
    const res = http.get(`${BASE_URL}/ping`);

    const success = check(res, {
        'status is 200': (r) => r.status === 200,
        'response is pong': (r) => r.body === 'pong',
        'response time < 200ms': (r) => r.timings.duration < 200,
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);

    sleep(1);
}
