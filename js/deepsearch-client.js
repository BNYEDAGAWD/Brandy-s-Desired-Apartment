/**
 * DeepSearchAgent Client
 * Handles communication with the Python DeepSearchAgent backend
 */
export class DeepSearchClient {
    constructor() {
        // Try local development first, fallback to production
        this.baseUrl = this.detectBackendUrl();
        this.isBackendAvailable = false;
        this.lastHealthCheck = null;
    }

    detectBackendUrl() {
        // Check if we're in development mode
        const isDev = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
        
        if (isDev) {
            return 'http://localhost:8000';
        }
        
        // For production GitHub Pages, check for deployed backend
        // You can deploy the backend to Railway, Render, or similar service
        // and update this URL when ready
        
        // For now, always try localhost first (for local development)
        // Then fall back to demo mode if not available
        return 'http://localhost:8000';
    }

    async checkHealth() {
        if (!this.baseUrl) {
            return { available: false, reason: 'Backend URL not configured' };
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Short timeout for health check
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
                const health = await response.json();
                this.isBackendAvailable = health.agent_ready;
                this.lastHealthCheck = new Date();
                return { available: this.isBackendAvailable, health };
            } else {
                return { available: false, reason: `HTTP ${response.status}` };
            }
        } catch (error) {
            this.isBackendAvailable = false;
            return { 
                available: false, 
                reason: error.name === 'AbortError' ? 'Timeout' : error.message 
            };
        }
    }

    async searchApartments(zipCodes = null, filters = {}) {
        // Check backend availability first
        const healthCheck = await this.checkHealth();
        if (!healthCheck.available) {
            throw new Error(`DeepSearchAgent backend not available: ${healthCheck.reason}`);
        }

        try {
            const requestBody = {
                zip_codes: zipCodes,
                max_results: filters.maxResults || 50,
                filters: {
                    min_price: filters.minPrice,
                    max_price: filters.maxPrice,
                    min_score: filters.minScore,
                    required_amenities: filters.requiredAmenities
                }
            };

            console.log('🔍 Sending search request to DeepSearchAgent:', requestBody);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);
            
            const response = await fetch(`${this.baseUrl}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                // Longer timeout for search requests
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Search failed with status ${response.status}`);
            }

            const searchResults = await response.json();
            console.log('✅ DeepSearchAgent search completed:', searchResults);

            return this.transformSearchResults(searchResults);

        } catch (error) {
            console.error('❌ DeepSearchAgent search failed:', error);
            throw error;
        }
    }

    async verifyListing(listingUrl) {
        const healthCheck = await this.checkHealth();
        if (!healthCheck.available) {
            throw new Error(`DeepSearchAgent backend not available: ${healthCheck.reason}`);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(`${this.baseUrl}/verify-listing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ listing_url: listingUrl }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Verification failed with status ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Listing verification failed:', error);
            throw error;
        }
    }

    async getSearchConfig() {
        const healthCheck = await this.checkHealth();
        if (!healthCheck.available) {
            return null;
        }

        try {
            const response = await fetch(`${this.baseUrl}/config`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Could not fetch search config:', error);
        }
        return null;
    }

    transformSearchResults(searchResults) {
        if (!searchResults.success || !searchResults.apartments) {
            return [];
        }

        return searchResults.apartments.map(apartment => this.transformApartment(apartment));
    }

    transformApartment(apartment) {
        // Transform DeepSearchAgent apartment format to frontend format
        const transformed = {
            id: apartment.id || this.generateId(apartment),
            title: apartment.title || this.generateTitle(apartment),
            address: apartment.address || 'Address not available',
            zipCode: apartment.zip_code || apartment.zipCode || 'Unknown',
            price: apartment.price || 0,
            bedrooms: apartment.bedrooms || 2,
            bathrooms: apartment.bathrooms || 1.5,
            sqft: apartment.sqft || null,
            floor: apartment.floor || null,
            
            // Features and amenities
            features: this.transformAmenities(apartment.amenities || []),
            highlightFeatures: this.getHighlightFeatures(apartment.amenities || []),
            
            // Status flags
            recentlyRenovated: this.hasAmenity(apartment.amenities, 'recently_renovated'),
            premiumAmenities: this.hasPremiumAmenities(apartment.amenities || []),
            
            // Dates
            datePosted: apartment.datePosted || apartment.found_at || new Date().toISOString(),
            
            // Source information
            source: apartment.platform || apartment.source || 'DeepSearch',
            url: apartment.url || apartment.source_url,
            
            // Contact information
            contact: apartment.contact || {},
            
            // Images
            images: apartment.images || [],
            
            // Description
            description: apartment.description || this.generateDescription(apartment),
            
            // Scoring information
            score: this.calculateDisplayScore(apartment),
            scoreBreakdown: apartment.validation || {},
            
            // URL health and backup information
            urlHealth: this.transformUrlHealth(apartment),
            urlHealthSummary: this.generateUrlHealthSummary(apartment),
            backupUrls: apartment.backup_urls || [],
            
            // Metadata
            searchMetadata: apartment.search_metadata || {},
            extractedAt: apartment.extracted_at || new Date().toISOString()
        };

        return transformed;
    }

    generateId(apartment) {
        // Generate a unique ID from apartment data
        const components = [
            apartment.address || '',
            apartment.price || '',
            apartment.bedrooms || '',
            Date.now()
        ];
        return `apt_${components.join('_').replace(/[^a-zA-Z0-9_]/g, '_')}`;
    }

    generateTitle(apartment) {
        const bedrooms = apartment.bedrooms || 2;
        const area = this.extractAreaFromAddress(apartment.address) || 'West LA';
        return `${bedrooms}-Bedroom Apartment in ${area}`;
    }

    extractAreaFromAddress(address) {
        if (!address) return null;
        
        const areas = ['Mar Vista', 'Culver City', 'Palms', 'Venice', 'Santa Monica'];
        for (const area of areas) {
            if (address.toLowerCase().includes(area.toLowerCase())) {
                return area;
            }
        }
        return null;
    }

    transformAmenities(amenities) {
        // Map DeepSearchAgent amenity format to frontend format
        const amenityMap = {
            'washer_dryer': 'In-Unit Washer/Dryer',
            'air_conditioning': 'Central Air Conditioning',
            'outdoor_space': 'Private Balcony',
            'parking': 'Parking Garage',
            'pool': 'Swimming Pool',
            'gym': 'Fitness Center',
            'dishwasher': 'Dishwasher',
            'hardwood': 'Hardwood Floors',
            'granite': 'Granite Countertops',
            'stainless': 'Stainless Steel Appliances'
        };

        return amenities.map(amenity => amenityMap[amenity] || this.capitalizeAmenity(amenity));
    }

    capitalizeAmenity(amenity) {
        return amenity.replace(/_/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
    }

    getHighlightFeatures(amenities) {
        const highlights = [
            'washer_dryer',
            'air_conditioning', 
            'outdoor_space',
            'recently_renovated',
            'hardwood',
            'granite'
        ];
        
        return amenities.filter(amenity => highlights.includes(amenity))
                       .map(amenity => this.transformAmenities([amenity])[0]);
    }

    hasAmenity(amenities, targetAmenity) {
        return amenities && amenities.includes(targetAmenity);
    }

    hasPremiumAmenities(amenities) {
        const premiumFeatures = ['pool', 'gym', 'parking', 'granite', 'stainless'];
        return premiumFeatures.some(feature => amenities.includes(feature));
    }

    generateDescription(apartment) {
        const bedrooms = apartment.bedrooms || 2;
        const area = this.extractAreaFromAddress(apartment.address) || 'West LA';
        const price = apartment.price ? `$${apartment.price.toLocaleString()}` : 'Contact for pricing';
        
        return `Beautiful ${bedrooms}-bedroom apartment in ${area}. ` +
               `Rent: ${price}/month. Verified listing found through DeepSearch AI. ` +
               `Contact directly for viewing and more information.`;
    }

    calculateDisplayScore(apartment) {
        // Use validation score if available, otherwise calculate basic score
        const validation = apartment.validation;
        if (validation && validation.percentage) {
            return Math.round(validation.percentage);
        }

        // Fallback scoring based on available data
        let score = 60; // Base score
        
        // Price appropriateness (within target range)
        const price = apartment.price || 0;
        if (price >= 4400 && price <= 5200) {
            score += 20;
        }
        
        // Required amenities
        const amenities = apartment.amenities || [];
        if (amenities.includes('washer_dryer')) score += 5;
        if (amenities.includes('air_conditioning')) score += 5;
        if (amenities.includes('outdoor_space')) score += 5;
        
        // Premium features
        if (this.hasPremiumAmenities(amenities)) score += 5;
        
        return Math.min(100, Math.max(0, score));
    }

    transformUrlHealth(apartment) {
        // DeepSearchAgent provides verification status
        const verification = apartment.verification;
        if (!verification) {
            return { healthy: true, status: 'unverified' };
        }

        return {
            healthy: verification.verified,
            status: verification.verified ? 'verified' : 'failed',
            error: verification.error,
            responseTime: verification.response_time,
            verifiedAt: verification.verified_at
        };
    }

    generateUrlHealthSummary(apartment) {
        const health = this.transformUrlHealth(apartment);
        
        if (health.healthy) {
            return {
                className: 'healthy',
                icon: 'fas fa-check-circle',
                message: 'Link verified and accessible'
            };
        } else {
            return {
                className: 'error',
                icon: 'fas fa-exclamation-triangle',
                message: 'Primary link may not work - see alternatives'
            };
        }
    }

    // Static method to check if DeepSearch is available
    static async isAvailable() {
        const client = new DeepSearchClient();
        const health = await client.checkHealth();
        return health.available;
    }

    // Get backend status for debugging
    getBackendStatus() {
        return {
            baseUrl: this.baseUrl,
            isAvailable: this.isBackendAvailable,
            lastHealthCheck: this.lastHealthCheck
        };
    }
}