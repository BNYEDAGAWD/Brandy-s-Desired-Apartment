import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LinkHealthMonitor } from '../js/link-health-monitor.js';

// Mock fetch
global.fetch = vi.fn();
global.AbortController = vi.fn(() => ({
    abort: vi.fn(),
    signal: {}
}));

describe('LinkHealthMonitor', () => {
    let monitor;

    beforeEach(() => {
        monitor = new LinkHealthMonitor();
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with default settings', () => {
            expect(monitor.healthCache).toBeDefined();
            expect(monitor.maxCacheAge).toBe(5 * 60 * 1000);
            expect(monitor.timeoutDuration).toBe(10000);
        });
    });

    describe('URL Health Checking', () => {
        it('should return healthy status for successful requests', async () => {
            fetch.mockResolvedValueOnce({
                status: 200,
                ok: true
            });

            const result = await monitor.checkUrlHealth('https://example.com');
            
            expect(result.healthy).toBe(true);
            expect(result.status).toBe(200);
            expect(result.responseTime).toBeGreaterThanOrEqual(0);
        });

        it('should handle CORS errors gracefully', async () => {
            const corsError = new Error('CORS error');
            corsError.message = 'Network request failed due to CORS';
            fetch.mockRejectedValueOnce(corsError);

            const result = await monitor.checkUrlHealth('https://example.com');
            
            expect(result.status).toBe('cors_blocked');
            expect(result.healthy).toBe(true); // Should assume healthy for CORS blocks
        });

        it('should handle timeout errors', async () => {
            const timeoutError = new Error('Timeout');
            timeoutError.name = 'AbortError';
            fetch.mockRejectedValueOnce(timeoutError);

            const result = await monitor.checkUrlHealth('https://example.com');
            
            expect(result.status).toBe('timeout');
            expect(result.healthy).toBe(false);
        });
    });

    describe('Cache Management', () => {
        it('should cache health results', async () => {
            fetch.mockResolvedValueOnce({
                status: 200,
                ok: true
            });

            const url = 'https://example.com';
            await monitor.checkUrlHealth(url);
            
            const cached = monitor.getFromCache(url);
            expect(cached).toBeDefined();
            expect(cached.healthy).toBe(true);
        });

        it('should return cached results when available', async () => {
            const url = 'https://example.com';
            const cachedResult = {
                healthy: true,
                status: 'cached',
                responseTime: 100,
                lastChecked: Date.now()
            };
            
            monitor.setCache(url, cachedResult);
            
            const result = await monitor.checkUrlHealth(url);
            expect(result).toEqual(cachedResult);
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should clean up old cache entries', () => {
            const oldEntry = {
                healthy: true,
                status: 'old',
                responseTime: 100,
                lastChecked: Date.now() - (10 * 60 * 1000) // 10 minutes ago
            };
            
            monitor.setCache('https://old.com', oldEntry);
            monitor.cleanupCache();
            
            const cached = monitor.getFromCache('https://old.com');
            expect(cached).toBeNull();
        });
    });

    describe('Alternative URLs', () => {
        it('should generate alternative URLs for dead links', () => {
            const alternatives = monitor.generateAlternativeUrls('Mar Vista', '90066');
            
            expect(alternatives).toHaveLength(12); // Updated to match new comprehensive system
            expect(alternatives[0].name).toBe('Google Search');
            expect(alternatives[0].url).toContain('google.com');
            expect(decodeURIComponent(alternatives[0].url)).toContain('Mar Vista');
            expect(alternatives[0].url).toContain('90066');
            expect(alternatives[0].priority).toBe(1); // Should be high priority
        });

        it('should include different types of alternative sources', () => {
            const alternatives = monitor.generateAlternativeUrls('Mar Vista', '90066');
            
            const searchSources = alternatives.filter(alt => alt.type === 'search');
            const listingSources = alternatives.filter(alt => alt.type === 'listings');
            
            expect(searchSources.length).toBeGreaterThan(0);
            expect(listingSources.length).toBeGreaterThan(0);
        });
    });

    describe('Health Summary', () => {
        it('should create health summary for healthy URLs', () => {
            const healthResult = {
                healthy: true,
                status: 'accessible',
                responseTime: 250
            };
            
            const summary = monitor.getHealthSummary(healthResult);
            
            expect(summary.className).toBe('healthy');
            expect(summary.icon).toBe('fas fa-check-circle');
            expect(summary.message).toContain('Accessible');
            expect(summary.message).toContain('250ms');
        });

        it('should create health summary for CORS blocked URLs', () => {
            const healthResult = {
                healthy: true,
                status: 'cors_blocked',
                responseTime: 100
            };
            
            const summary = monitor.getHealthSummary(healthResult);
            
            expect(summary.className).toBe('warning');
            expect(summary.icon).toBe('fas fa-exclamation-triangle');
            expect(summary.message).toContain('CORS');
        });

        it('should create health summary for failed URLs', () => {
            const healthResult = {
                healthy: false,
                status: '404_not_found',
                responseTime: 500
            };
            
            const summary = monitor.getHealthSummary(healthResult);
            
            expect(summary.className).toBe('error');
            expect(summary.icon).toBe('fas fa-unlink');
            expect(summary.message).toContain('not found');
        });
    });

    describe('Cache Statistics', () => {
        it('should provide cache statistics', () => {
            // Add some test entries
            monitor.setCache('https://test1.com', { healthy: true, responseTime: 100, lastChecked: Date.now() });
            monitor.setCache('https://test2.com', { healthy: false, responseTime: 500, lastChecked: Date.now() });
            
            const stats = monitor.getCacheStats();
            
            expect(stats.totalEntries).toBe(2);
            expect(stats.healthyUrls).toBe(1);
            expect(stats.unhealthyUrls).toBe(1);
            expect(stats.averageResponseTime).toBe(300); // (100 + 500) / 2
        });
    });
});