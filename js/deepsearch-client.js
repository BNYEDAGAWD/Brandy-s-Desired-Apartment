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
            // Use optimized LA DMA parameters
            const requestBody = {
                zip_codes: zipCodes || ['90066', '90230', '90232', '90034'],
                max_results: filters.maxResults || 50,
                filters: {
                    min_price: filters.minPrice || 4400,
                    max_price: filters.maxPrice || 5200,
                    min_score: filters.minScore || 75,
                    required_amenities: filters.requiredAmenities || [
                        'In-unit washer/dryer',
                        'Air conditioning',
                        'Outdoor space (balcony/patio/terrace)',
                        'Above ground floor'
                    ]
                },
                geo_params: {
                    location: 'Los Angeles, CA',
                    dma_code: 'los-angeles-dma',
                    radius: '25mi',
                    region: 'us-west'
                },
                search_params: {
                    freshness: 'week',  // Past week listings
                    sort: 'relevance',
                    dedup: true
                }
            };

            console.log('🔍 Sending LA DMA optimized search request to DeepSearchAgent:', requestBody);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 90000); // Increased timeout for thorough search
            
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
        // Map DeepSearchAgent amenity format to frontend format with updated mappings
        const amenityMap = {
            'washer_dryer': 'In-Unit Washer/Dryer',
            'washer_dryer_in_unit': 'In-Unit Washer/Dryer',
            'air_conditioning': 'Central Air Conditioning',
            'outdoor_space': 'Private Balcony/Patio',
            'above_ground_floor': 'Above Ground Floor',
            'renovated': 'Recently Renovated',
            'natural_light': 'Ample Natural Light',
            'parking': 'Parking Included',
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
            'washer_dryer_in_unit',
            'air_conditioning', 
            'outdoor_space',
            'above_ground_floor',
            'renovated',
            'recently_renovated',
            'natural_light',
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
        // Use validation score if available, otherwise calculate based on criteria
        const validation = apartment.validation;
        if (validation && validation.percentage) {
            return Math.round(validation.percentage);
        }

        // Enhanced scoring based on specific requirements
        let score = 50; // Base score
        
        // Price appropriateness (within target range) - 25 points
        const price = apartment.price || 0;
        if (price >= 4400 && price <= 5200) {
            score += 25;
        } else if (price >= 4000 && price <= 5500) {
            score += 15; // Partial credit for close range
        }
        
        // Required amenities - 10 points each (40 total)
        const amenities = apartment.amenities || [];
        if (amenities.includes('washer_dryer') || amenities.includes('washer_dryer_in_unit')) score += 10;
        if (amenities.includes('air_conditioning')) score += 10;
        if (amenities.includes('outdoor_space')) score += 10;
        if (amenities.includes('above_ground_floor')) score += 10;
        
        // Preferred features - 5 points each (15 total)
        if (amenities.includes('renovated') || amenities.includes('recently_renovated')) score += 5;
        if (amenities.includes('natural_light')) score += 5;
        if (this.hasPremiumAmenities(amenities)) score += 5;
        
        // Location priority boost
        const zipCode = apartment.zip_code || apartment.zipCode;
        const priorityBoost = {
            '90066': 10, // Mar Vista - Priority 1
            '90230': 7,  // Central Culver City - Priority 2
            '90232': 5,  // Southeast Culver City - Priority 3
            '90034': 3   // Palms - Priority 4
        };
        score += priorityBoost[zipCode] || 0;
        
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