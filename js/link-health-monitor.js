/**
 * Link Health Monitor
 * Monitors and tracks the health of apartment listing URLs
 * Provides fallback mechanisms for dead links
 */

export class LinkHealthMonitor {
    constructor() {
        this.healthCache = new Map();
        this.maxCacheAge = 5 * 60 * 1000; // 5 minutes
        this.timeoutDuration = 10000; // 10 seconds
    }

    /**
     * Check if a URL is accessible with enhanced error handling
     * @param {string} url - URL to check
     * @returns {Promise<{healthy: boolean, status: string, responseTime: number}>}
     */
    async checkUrlHealth(url) {
        // Check cache first
        const cached = this.getFromCache(url);
        if (cached) {
            return cached;
        }

        const startTime = Date.now();
        let timeoutId;
        
        try {
            // Enhanced URL validation
            if (!this.isValidUrl(url)) {
                throw new Error('Invalid URL format');
            }

            // Use a timeout to prevent hanging requests
            const controller = new window.AbortController();
            timeoutId = setTimeout(() => controller.abort(), this.timeoutDuration);

            // Try multiple methods for better reliability
            let response;
            try {
                // First try HEAD request with no-cors
                response = await fetch(url, {
                    method: 'HEAD',
                    signal: controller.signal,
                    mode: 'no-cors',
                    cache: 'no-cache',
                    redirect: 'follow'
                });
            } catch {
                // If HEAD fails, try GET with no-cors as fallback
                response = await fetch(url, {
                    method: 'GET',
                    signal: controller.signal,
                    mode: 'no-cors',
                    cache: 'no-cache',
                    redirect: 'follow'
                });
            }

            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;

            // Enhanced status detection
            let actualStatus = 'accessible';
            let healthy = true;

            // For no-cors requests, we can't read the actual status
            // but if no error was thrown, the URL is likely accessible
            if (response.type === 'opaque') {
                actualStatus = 'cors_accessible';
            } else if (response.status) {
                actualStatus = response.status;
                healthy = response.status >= 200 && response.status < 400;
            }

            const result = {
                healthy,
                status: actualStatus,
                responseTime,
                lastChecked: Date.now(),
                method: 'validated'
            };

            this.setCache(url, result);
            return result;

        } catch (error) {
            if (timeoutId) clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;

            let status = 'unknown';
            let healthy = false;

            // Enhanced error classification
            if (error.name === 'AbortError') {
                status = 'timeout';
            } else if (error.message.includes('CORS') || error.message.includes('cross-origin')) {  
                // CORS blocked - URL might still work for users
                status = 'cors_blocked';
                healthy = true; // Assume healthy since we can't verify
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                // Check if it's a potential domain issue
                if (this.isKnownGoodDomain(url)) {
                    status = 'network_cors';
                    healthy = true; // Known good domain, likely CORS issue
                } else {
                    status = 'network_error';
                }
            } else if (error.message.includes('404') || error.message.includes('Not Found')) {
                status = '404_not_found';
            } else if (error.message.includes('Invalid URL')) {
                status = 'invalid_url';
            } else {
                status = 'error';
            }

            const result = {
                healthy,
                status,
                responseTime,
                error: error.message,
                lastChecked: Date.now(),
                method: 'error_detected'
            };

            this.setCache(url, result);
            return result;
        }
    }

    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {boolean} Whether URL is valid
     */
    isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }

    /**
     * Check if domain is known to be reliable
     * @param {string} url - URL to check
     * @returns {boolean} Whether domain is known good
     */
    isKnownGoodDomain(url) {
        const knownGoodDomains = [
            'apartments.com',
            'zillow.com',
            'trulia.com',
            'hotpads.com',
            'westsiderentals.com',
            'realtor.com',
            'rent.com',
            'padmapper.com',
            'craigslist.org',
            'facebook.com',
            'google.com'
        ];

        try {
            const hostname = new URL(url).hostname.toLowerCase();
            return knownGoodDomains.some(domain => hostname.includes(domain));
        } catch {
            return false;
        }
    }

    /**
     * Check health of multiple URLs
     * @param {Array<string>} urls - URLs to check
     * @returns {Promise<Array<{url: string, health: Object}>>}
     */
    async checkMultipleUrls(urls) {
        const checks = urls.map(async (url) => ({
            url,
            health: await this.checkUrlHealth(url)
        }));

        return await Promise.all(checks);
    }

    /**
     * Get health status from cache
     * @param {string} url - URL to lookup
     * @returns {Object|null} Cached health result or null
     */
    getFromCache(url) {
        const cached = this.healthCache.get(url);
        if (cached && (Date.now() - cached.lastChecked) < this.maxCacheAge) {
            return cached;
        }
        return null;
    }

    /**
     * Store health status in cache
     * @param {string} url - URL to cache
     * @param {Object} result - Health check result
     */
    setCache(url, result) {
        this.healthCache.set(url, result);
        
        // Clean up old cache entries periodically
        if (this.healthCache.size > 100) {
            this.cleanupCache();
        }
    }

    /**
     * Remove old entries from cache
     */
    cleanupCache() {
        const now = Date.now();
        for (const [url, result] of this.healthCache.entries()) {
            if ((now - result.lastChecked) > this.maxCacheAge) {
                this.healthCache.delete(url);
            }
        }
    }

    /**
     * Get health summary for UI display
     * @param {Object} healthResult - Result from checkUrlHealth
     * @returns {Object} UI-friendly health summary
     */
    getHealthSummary(healthResult) {
        const { healthy, status, responseTime, error } = healthResult;

        let summary = {
            className: 'unknown',
            icon: 'fas fa-question-circle',
            message: 'Unknown status',
            color: '#6c757d'
        };

        if (healthy) {
            if (status === 'cors_blocked') {
                summary = {
                    className: 'warning',
                    icon: 'fas fa-exclamation-triangle',
                    message: 'Cannot verify (CORS), but likely accessible',
                    color: '#f39c12'
                };
            } else {
                summary = {
                    className: 'healthy',
                    icon: 'fas fa-check-circle',
                    message: `Accessible (${responseTime}ms)`,
                    color: '#27ae60'
                };
            }
        } else {
            switch (status) {
                case 'timeout':
                    summary = {
                        className: 'error',
                        icon: 'fas fa-clock',
                        message: 'Connection timeout',
                        color: '#e74c3c'
                    };
                    break;
                case '404_not_found':
                    summary = {
                        className: 'error',
                        icon: 'fas fa-unlink',
                        message: 'Page not found (404)',
                        color: '#e74c3c'
                    };
                    break;
                case 'network_error':
                    summary = {
                        className: 'error',
                        icon: 'fas fa-wifi',
                        message: 'Network error',
                        color: '#e74c3c'
                    };
                    break;
                default:
                    summary = {
                        className: 'error',
                        icon: 'fas fa-exclamation-circle',
                        message: error ? `Error: ${error.substring(0, 50)}...` : 'Connection failed',
                        color: '#e74c3c'
                    };
            }
        }

        return summary;
    }

    /**
     * Generate comprehensive alternative search URLs for dead links
     * @param {string} areaName - Area name (e.g., "Mar Vista")
     * @param {string} zipCode - Zip code (e.g., "90066")
     * @param {number} price - Price range
     * @returns {Array<{name: string, url: string, priority: number, type: string}>} Alternative URLs
     */
    generateAlternativeUrls(areaName, zipCode, price) {
        const encodedArea = encodeURIComponent(areaName || '');
        const encodedQuery = encodeURIComponent(`${areaName} CA ${zipCode} apartments rent 2 bedroom`);
        const priceQuery = price ? encodeURIComponent(`${areaName} apartments under ${price} rent`) : encodedQuery;
        
        return [
            // High-priority alternatives - General searches that always work
            {
                name: 'Google Search',
                url: `https://www.google.com/search?q=${encodedQuery}&tbm=&tbs=qdr:m`,
                type: 'search',
                priority: 1,
                description: 'Comprehensive search results'
            },
            {
                name: 'Apartments.com',
                url: `https://www.apartments.com/los-angeles-ca/`,
                type: 'listings',
                priority: 1,
                description: 'Browse LA apartments'
            },
            {
                name: 'Zillow Rentals',
                url: `https://www.zillow.com/los-angeles-ca/rentals/`,
                type: 'listings',
                priority: 1,
                description: 'Rental listings on Zillow'
            },
            
            // Medium-priority alternatives - More specific searches
            {
                name: 'Rent.com Search',
                url: `https://www.rent.com/california/los-angeles-apartments`,
                type: 'listings',
                priority: 2,
                description: 'Rent.com listings'
            },
            {
                name: 'HotPads',
                url: `https://hotpads.com/los-angeles-ca/apartments-for-rent`,
                type: 'listings',
                priority: 2,
                description: 'Map-based apartment search'
            },
            {
                name: 'Trulia Rentals',
                url: `https://www.trulia.com/for_rent/Los_Angeles,CA/`,
                type: 'listings',
                priority: 2,
                description: 'Neighborhood-focused search'
            },
            
            // Specialized alternatives
            {
                name: 'Westside Rentals',
                url: `https://www.westsiderentals.com/`,
                type: 'listings',
                priority: 2,
                description: 'Westside LA specialist'
            },
            {
                name: 'PadMapper',
                url: `https://www.padmapper.com/apartments/los-angeles-ca`,
                type: 'listings',
                priority: 3,
                description: 'Interactive map search'
            },
            
            // Community-based alternatives
            {
                name: 'Craigslist LA',
                url: `https://losangeles.craigslist.org/search/apa?query=${encodedArea}+${zipCode}`,
                type: 'community',
                priority: 3,
                description: 'Community listings'
            },
            {
                name: 'Facebook Marketplace',
                url: `https://www.facebook.com/marketplace/los-angeles/propertyrentals`,
                type: 'community',
                priority: 3,
                description: 'Social marketplace'
            },
            
            // Backup generic searches
            {
                name: 'Bing Search',
                url: `https://www.bing.com/search?q=${priceQuery}`,
                type: 'search',
                priority: 4,
                description: 'Alternative search engine'
            },
            {
                name: 'Realtor.com',
                url: `https://www.realtor.com/apartments-for-rent/Los-Angeles_CA`,
                type: 'listings',
                priority: 4,
                description: 'Realtor apartment listings'
            }
        ].sort((a, b) => a.priority - b.priority);
    }

    /**
     * Generate smart backup URLs based on primary URL failure type
     * @param {string} primaryUrl - The failed primary URL
     * @param {string} areaName - Area name
     * @param {string} zipCode - Zip code  
     * @param {number} price - Price range
     * @param {string} failureType - Type of failure detected
     * @returns {Array} Tailored backup URLs
     */
    generateSmartBackups(primaryUrl, areaName, zipCode, price, failureType) {
        const allAlternatives = this.generateAlternativeUrls(areaName, zipCode, price);
        
        // Filter based on failure type
        switch (failureType) {
            case 'cors_blocked':
            case 'network_cors':
                // CORS issues - prioritize search engines and known-good domains
                return allAlternatives.filter(alt => 
                    alt.type === 'search' || alt.priority <= 2
                ).slice(0, 4);
                
            case 'timeout':
                // Timeout issues - prioritize faster, simpler sites
                return allAlternatives.filter(alt => 
                    alt.priority <= 2 && alt.type !== 'community'
                ).slice(0, 3);
                
            case '404_not_found':
            case 'invalid_url':
                // URL structure issues - provide comprehensive alternatives
                return allAlternatives.slice(0, 6);
                
            default:
                // Generic failure - provide balanced mix
                return allAlternatives.slice(0, 5);
        }
    }

    /**
     * Monitor apartment URLs and update health status
     * @param {Array<Object>} apartments - Array of apartment objects
     * @returns {Promise<Array<Object>>} Apartments with health status
     */
    async monitorApartmentUrls(apartments) {
        // eslint-disable-next-line no-console
        console.log(`🔍 Monitoring health of ${apartments.length} apartment URLs...`);
        
        const monitored = [];
        
        for (const apartment of apartments) {
            try {
                const health = await this.checkUrlHealth(apartment.url);
                const healthSummary = this.getHealthSummary(health);
                
                monitored.push({
                    ...apartment,
                    urlHealth: health,
                    urlHealthSummary: healthSummary,
                    // Add alternative URLs if main link is unhealthy
                    alternativeUrls: !health.healthy ? 
                        this.generateAlternativeUrls(apartment.address?.split(',')[1]?.trim(), apartment.zipCode, apartment.price) : 
                        apartment.backupUrls || []
                });
                
                // Add small delay to avoid overwhelming servers
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn(`Failed to monitor URL for apartment ${apartment.id}:`, error);
                monitored.push({
                    ...apartment,
                    urlHealth: { healthy: false, status: 'monitor_error', error: error.message },
                    urlHealthSummary: {
                        className: 'error',
                        icon: 'fas fa-exclamation-circle',
                        message: 'Monitoring failed',
                        color: '#e74c3c'
                    }
                });
            }
        }
        
        // eslint-disable-next-line no-console
        console.log(`✅ URL monitoring complete. ${monitored.filter(a => a.urlHealth?.healthy).length}/${monitored.length} URLs appear healthy.`);
        
        return monitored;
    }

    /**
     * Clear all cached health data
     */
    clearCache() {
        this.healthCache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        const entries = Array.from(this.healthCache.values());
        
        return {
            totalEntries: this.healthCache.size,
            healthyUrls: entries.filter(e => e.healthy).length,
            unhealthyUrls: entries.filter(e => !e.healthy).length,
            averageResponseTime: entries.length > 0 ? 
                entries.reduce((sum, e) => sum + (e.responseTime || 0), 0) / entries.length : 0,
            oldestEntry: entries.length > 0 ? 
                Math.min(...entries.map(e => e.lastChecked)) : null,
            newestEntry: entries.length > 0 ? 
                Math.max(...entries.map(e => e.lastChecked)) : null
        };
    }
}

// Export singleton instance
export const linkHealthMonitor = new LinkHealthMonitor();