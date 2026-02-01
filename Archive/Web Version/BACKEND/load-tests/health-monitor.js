/**
 * Backend Health Monitor
 * Tracks system resources during load testing
 * Run this alongside k6 tests to monitor backend health
 */

const http = require('http');
const os = require('os');

const BACKEND_URL = 'http://localhost:64621';
const MONITOR_INTERVAL = 5000; // Check every 5 seconds
const LOG_FILE = 'health-monitor.log';

class HealthMonitor {
    constructor() {
        this.startTime = Date.now();
        this.metrics = [];
        this.previousCPU = process.cpuUsage();
    }

    async checkBackendHealth() {
        return new Promise((resolve) => {
            const start = Date.now();
            http.get(`${BACKEND_URL}/ping`, (res) => {
                const duration = Date.now() - start;
                resolve({
                    status: res.statusCode,
                    responseTime: duration,
                    healthy: res.statusCode === 200
                });
            }).on('error', () => {
                resolve({
                    status: 0,
                    responseTime: -1,
                    healthy: false
                });
            });
        });
    }

    getSystemMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage(this.previousCPU);
        this.previousCPU = process.cpuUsage();

        return {
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            memory: {
                rss: Math.floor(memUsage.rss / 1024 / 1024), // MB
                heapUsed: Math.floor(memUsage.heapUsed / 1024 / 1024), // MB
                heapTotal: Math.floor(memUsage.heapTotal / 1024 / 1024), // MB
                external: Math.floor(memUsage.external / 1024 / 1024), // MB
            },
            cpu: {
                user: Math.floor(cpuUsage.user / 1000), // ms
                system: Math.floor(cpuUsage.system / 1000), // ms
            },
            system: {
                totalMem: Math.floor(os.totalmem() / 1024 / 1024), // MB
                freeMem: Math.floor(os.freemem() / 1024 / 1024), // MB
                loadAvg: os.loadavg(),
            }
        };
    }

    async collectMetrics() {
        const systemMetrics = this.getSystemMetrics();
        const backendHealth = await this.checkBackendHealth();

        const metrics = {
            ...systemMetrics,
            backend: backendHealth
        };

        this.metrics.push(metrics);
        this.logMetrics(metrics);
        this.checkThresholds(metrics);

        return metrics;
    }

    logMetrics(metrics) {
        const { timestamp, uptime, memory, backend } = metrics;

        console.clear();
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║         KAMANIME BACKEND HEALTH MONITOR                ║');
        console.log('╠════════════════════════════════════════════════════════╣');
        console.log(`║ Time: ${timestamp.padEnd(43)}║`);
        console.log(`║ Uptime: ${uptime}s`.padEnd(57) + '║');
        console.log('╠════════════════════════════════════════════════════════╣');
        console.log('║ BACKEND STATUS                                         ║');
        console.log(`║ Health: ${backend.healthy ? '✓ HEALTHY' : '✗ UNHEALTHY'}`.padEnd(57) + '║');
        console.log(`║ Response Time: ${backend.responseTime}ms`.padEnd(57) + '║');
        console.log('╠════════════════════════════════════════════════════════╣');
        console.log('║ MEMORY USAGE                                           ║');
        console.log(`║ Heap Used: ${memory.heapUsed} MB / ${memory.heapTotal} MB`.padEnd(57) + '║');
        console.log(`║ RSS: ${memory.rss} MB`.padEnd(57) + '║');
        console.log(`║ External: ${memory.external} MB`.padEnd(57) + '║');
        console.log('╠════════════════════════════════════════════════════════╣');
        console.log('║ SYSTEM RESOURCES                                       ║');
        console.log(`║ Free Memory: ${metrics.system.freeMem} MB / ${metrics.system.totalMem} MB`.padEnd(57) + '║');
        console.log(`║ Load Average: ${metrics.system.loadAvg.map(l => l.toFixed(2)).join(', ')}`.padEnd(57) + '║');
        console.log('╚════════════════════════════════════════════════════════╝');
    }

    checkThresholds(metrics) {
        const warnings = [];

        // Memory warnings
        if (metrics.memory.heapUsed > 1024) {
            warnings.push(`⚠️  HIGH MEMORY: ${metrics.memory.heapUsed} MB`);
        }

        // Backend health warnings
        if (!metrics.backend.healthy) {
            warnings.push('⚠️  BACKEND UNHEALTHY');
        }

        if (metrics.backend.responseTime > 1000) {
            warnings.push(`⚠️  SLOW RESPONSE: ${metrics.backend.responseTime}ms`);
        }

        // System warnings
        const memUsagePercent = ((metrics.system.totalMem - metrics.system.freeMem) / metrics.system.totalMem) * 100;
        if (memUsagePercent > 90) {
            warnings.push(`⚠️  SYSTEM MEMORY: ${memUsagePercent.toFixed(1)}% used`);
        }

        if (warnings.length > 0) {
            console.log('\n🚨 WARNINGS:');
            warnings.forEach(w => console.log(w));
        }
    }

    generateReport() {
        console.log('\n\n═══════════════════════════════════════════════════════');
        console.log('           LOAD TEST MONITORING REPORT');
        console.log('═══════════════════════════════════════════════════════\n');

        if (this.metrics.length === 0) {
            console.log('No metrics collected.');
            return;
        }

        const avgMemory = this.metrics.reduce((sum, m) => sum + m.memory.heapUsed, 0) / this.metrics.length;
        const maxMemory = Math.max(...this.metrics.map(m => m.memory.heapUsed));
        const avgResponseTime = this.metrics.reduce((sum, m) => sum + m.backend.responseTime, 0) / this.metrics.length;
        const healthyChecks = this.metrics.filter(m => m.backend.healthy).length;
        const healthRate = (healthyChecks / this.metrics.length) * 100;

        console.log(`Total Samples: ${this.metrics.length}`);
        console.log(`Duration: ${this.metrics[this.metrics.length - 1].uptime}s`);
        console.log(`\nMemory:`);
        console.log(`  Average Heap: ${avgMemory.toFixed(2)} MB`);
        console.log(`  Peak Heap: ${maxMemory.toFixed(2)} MB`);
        console.log(`\nBackend Health:`);
        console.log(`  Health Rate: ${healthRate.toFixed(2)}%`);
        console.log(`  Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
        console.log('\n═══════════════════════════════════════════════════════\n');
    }

    start() {
        console.log('🚀 Starting Kamanime Backend Health Monitor...\n');
        console.log('Press Ctrl+C to stop and generate report.\n');

        this.interval = setInterval(async () => {
            await this.collectMetrics();
        }, MONITOR_INTERVAL);

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n\n⏹️  Stopping monitor...\n');
            clearInterval(this.interval);
            this.generateReport();
            process.exit(0);
        });
    }
}

// Start monitoring
const monitor = new HealthMonitor();
monitor.start();
