import { DeepSearchClient } from './deepsearch-client.js';

/**
 * Real Apartment Search Engine powered by DeepSearchAgent
 * Live API results only - no demo data fallbacks
 */
export class RealApartmentSearchEngine {
    constructor() {
        this.searchCriteria = {
            minRent: 4400,
            maxRent: 5200,
            bedrooms: 2,
            minBathrooms: 1.5,
            maxBathrooms: 2.0,
            zipCodes: ['90066', '90230', '90232', '90034'],
            zipCodePriority: {
                '90066': 1, // Mar Vista - highest priority
                '90230': 2, // Central Culver City
                '90232': 3, // Southeast Culver City
                '90034': 4  // Palms
            },
            requiredAmenities: [
                'washer_dryer',
                'air_conditioning',
                'outdoor_space',
                'above_ground_floor'
            ],
            preferredFeatures: [
                'recently_renovated',
                'modern_interior',
                'natural_light'
            ]
        };
        
        this.deepSearchClient = new DeepSearchClient();
        this.isDeepSearchAvailable = false;
    }

    async searchApartments(progressCallback) {
        console.log('🏠 Starting live apartment search with DeepSearchAgent...');
        
        // Check if DeepSearchAgent backend is available
        const healthCheck = await this.deepSearchClient.checkHealth();
        this.isDeepSearchAvailable = healthCheck.available;
        
        if (progressCallback) progressCallback(10);
        
        if (!this.isDeepSearchAvailable) {
            console.warn('⚠️ DeepSearchAgent not available:', healthCheck.reason);
            throw new Error(`DeepSearchAgent backend not available: ${healthCheck.reason}. Please start the backend server.`);
        }

        try {
            // Update progress
            if (progressCallback) progressCallback(25);
            
            // Prepare search filters
            const searchFilters = {
                minPrice: this.searchCriteria.minRent,
                maxPrice: this.searchCriteria.maxRent,
                maxResults: 50,
                requiredAmenities: this.searchCriteria.requiredAmenities
            };
            
            console.log('🔍 Searching with DeepSearchAgent...', {
                zipCodes: this.searchCriteria.zipCodes,
                filters: searchFilters
            });
            
            // Update progress
            if (progressCallback) progressCallback(50);
            
            // Execute search using DeepSearchAgent
            const searchResults = await this.deepSearchClient.searchApartments(
                this.searchCriteria.zipCodes,
                searchFilters
            );
            
            console.log(`✅ DeepSearchAgent found ${searchResults.length} live apartments`);
            
            // Update progress
            if (progressCallback) progressCallback(75);
            
            // Validate and filter results
            const validApartments = searchResults.filter(apt => this.validateApartment(apt));
            
            console.log(`✅ ${validApartments.length} live apartments passed validation`);
            
            // Sort by priority (zip code and score)
            const sortedApartments = this.sortApartmentsByPriority(validApartments);
            
            // Update progress
            if (progressCallback) progressCallback(100);
            
            // Log summary
            this.logSearchSummary(sortedApartments);
            
            return sortedApartments;
            
        } catch (error) {
            console.error('❌ DeepSearchAgent search failed:', error);
            throw new Error(`DeepSearchAgent search failed: ${error.message}. Please check backend configuration.`);
        }
    }

    validateApartment(apartment) {
        const criteria = this.searchCriteria;
        
        // Check required fields
        if (!apartment.title || !apartment.address || !apartment.url) {
            console.log(`❌ Apartment rejected - missing required fields`);
            return false;
        }
        
        // Check price range
        if (apartment.price < criteria.minRent || apartment.price > criteria.maxRent) {
            console.log(`❌ Apartment rejected - price ${apartment.price} outside range`);
            return false;
        }
        
        // Check bedrooms
        if (apartment.bedrooms !== criteria.bedrooms) {
            console.log(`❌ Apartment rejected - ${apartment.bedrooms} bedrooms, need ${criteria.bedrooms}`);
            return false;
        }
        
        // Check bathrooms
        if (apartment.bathrooms < criteria.minBathrooms || apartment.bathrooms > criteria.maxBathrooms) {
            console.log(`❌ Apartment rejected - ${apartment.bathrooms} bathrooms outside range`);
            return false;
        }
        
        // Ensure URL is accessible
        if (!apartment.url || apartment.url.trim() === '') {
            console.log(`❌ Apartment rejected - no valid URL`);
            return false;
        }
        
        console.log(`✅ Live apartment validated: ${apartment.title}`);
        return true;
    }

    sortApartmentsByPriority(apartments) {
        return apartments.sort((a, b) => {
            // First sort by zip code priority
            const priorityA = this.searchCriteria.zipCodePriority[a.zipCode] || 999;
            const priorityB = this.searchCriteria.zipCodePriority[b.zipCode] || 999;
            
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            
            // Then sort by score
            return (b.score || 0) - (a.score || 0);
        });
    }

    logSearchSummary(apartments) {
        console.log('\n📊 LIVE SEARCH SUMMARY:');
        console.log(`Total live apartments found: ${apartments.length}`);
        
        // Group by zip code
        const byZipCode = apartments.reduce((acc, apt) => {
            acc[apt.zipCode] = (acc[apt.zipCode] || 0) + 1;
            return acc;
        }, {});
        
        console.log('Breakdown by zip code:');
        Object.entries(byZipCode).forEach(([zip, count]) => {
            const area = this.getAreaName(zip);
            console.log(`  ${zip} (${area}): ${count} live apartments`);
        });
        
        // Data sources
        const sources = apartments.reduce((acc, apt) => {
            acc[apt.source] = (acc[apt.source] || 0) + 1;
            return acc;
        }, {});
        
        console.log('Data sources:');
        Object.entries(sources).forEach(([source, count]) => {
            console.log(`  ${source}: ${count} listings`);
        });
        
        // Price range
        const prices = apartments.map(apt => apt.price).filter(p => p > 0);
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
            console.log(`Price range: $${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()} (avg: $${avgPrice.toLocaleString()})`);
        }
        
        // Score distribution
        const scores = apartments.map(apt => apt.score).filter(s => s > 0);
        if (scores.length > 0) {
            const avgScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
            const highScore = Math.max(...scores);
            console.log(`Score range: ${Math.min(...scores)} - ${highScore} (avg: ${avgScore})`);
        }
        
        console.log('\n🎯 Top 5 live matches:');
        apartments.slice(0, 5).forEach((apt, index) => {
            console.log(`${index + 1}. ${apt.title} - ${apt.address} - $${apt.price} (Score: ${apt.score}) [${apt.source}]`);
        });
    }

    getAreaName(zipCode) {
        const areaMap = {
            '90066': 'Mar Vista',
            '90230': 'Culver City',
            '90232': 'Culver City',
            '90034': 'Palms'
        };
        return areaMap[zipCode] || 'West LA';
    }

    // Get search engine status
    getStatus() {
        return {
            type: 'live',
            deepSearchAvailable: this.isDeepSearchAvailable,
            backendStatus: this.deepSearchClient.getBackendStatus(),
            searchCriteria: this.searchCriteria,
            message: 'Live apartment search powered by DeepSearchAgent'
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}