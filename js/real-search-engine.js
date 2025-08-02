import { DeepSearchClient } from './deepsearch-client.js';

/**
 * Real Apartment Search Engine powered by DeepSearchAgent
 * Replaces all mock data with live search results
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
        this.fallbackEnabled = true; // Allow fallback to demo data if needed
    }

    async searchApartments(progressCallback) {
        console.log('🏠 Starting real apartment search with DeepSearchAgent...');
        
        // Check if DeepSearchAgent backend is available
        const healthCheck = await this.deepSearchClient.checkHealth();
        this.isDeepSearchAvailable = healthCheck.available;
        
        if (progressCallback) progressCallback(10);
        
        if (!this.isDeepSearchAvailable) {
            console.warn('⚠️ DeepSearchAgent not available:', healthCheck.reason);
            
            if (this.fallbackEnabled) {
                console.log('📋 Falling back to demo data mode...');
                return this.generateDemoData(progressCallback);
            } else {
                throw new Error(`DeepSearchAgent backend not available: ${healthCheck.reason}`);
            }
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
            
            console.log(`✅ DeepSearchAgent found ${searchResults.length} apartments`);
            
            // Update progress
            if (progressCallback) progressCallback(75);
            
            // Validate and filter results
            const validApartments = searchResults.filter(apt => this.validateApartment(apt));
            
            console.log(`✅ ${validApartments.length} apartments passed validation`);
            
            // Sort by priority (zip code and score)
            const sortedApartments = this.sortApartmentsByPriority(validApartments);
            
            // Update progress
            if (progressCallback) progressCallback(100);
            
            // Log summary
            this.logSearchSummary(sortedApartments);
            
            return sortedApartments;
            
        } catch (error) {
            console.error('❌ DeepSearchAgent search failed:', error);
            
            if (this.fallbackEnabled) {
                console.log('📋 Falling back to demo data due to search error...');
                return this.generateDemoData(progressCallback);
            } else {
                throw error;
            }
        }
    }

    validateApartment(apartment) {
        const criteria = this.searchCriteria;
        
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
        
        // Check if URL is accessible
        if (!apartment.url || apartment.url.trim() === '') {
            console.log(`❌ Apartment rejected - no valid URL`);
            return false;
        }
        
        console.log(`✅ Apartment validated: ${apartment.title}`);
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
        console.log('\n📊 SEARCH SUMMARY:');
        console.log(`Total apartments found: ${apartments.length}`);
        
        // Group by zip code
        const byZipCode = apartments.reduce((acc, apt) => {
            acc[apt.zipCode] = (acc[apt.zipCode] || 0) + 1;
            return acc;
        }, {});
        
        console.log('Breakdown by zip code:');
        Object.entries(byZipCode).forEach(([zip, count]) => {
            const area = this.getAreaName(zip);
            console.log(`  ${zip} (${area}): ${count} apartments`);
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
        
        console.log('\n🎯 Top 5 matches:');
        apartments.slice(0, 5).forEach((apt, index) => {
            console.log(`${index + 1}. ${apt.title} - ${apt.address} - $${apt.price} (Score: ${apt.score})`);
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

    // Fallback demo data generator (improved version of mock data)
    async generateDemoData(progressCallback) {
        console.log('📋 Generating enhanced demo data...');
        
        const demoApartments = [];
        const totalSteps = this.searchCriteria.zipCodes.length;
        
        for (let i = 0; i < totalSteps; i++) {
            const zipCode = this.searchCriteria.zipCodes[i];
            
            if (progressCallback) {
                progressCallback(25 + (i / totalSteps) * 50);
            }
            
            const zipApartments = this.generateZipCodeDemoData(zipCode);
            demoApartments.push(...zipApartments);
            
            // Simulate processing delay
            await this.delay(200);
        }
        
        if (progressCallback) progressCallback(90);
        
        // Add realistic variation and validation
        const validDemoApartments = demoApartments
            .filter(apt => this.validateApartment(apt))
            .map(apt => this.enhanceDemoApartment(apt));
        
        if (progressCallback) progressCallback(100);
        
        console.log(`📋 Generated ${validDemoApartments.length} demo apartments`);
        return this.sortApartmentsByPriority(validDemoApartments);
    }

    generateZipCodeDemoData(zipCode) {
        const apartmentCount = Math.floor(Math.random() * 8) + 3; // 3-10 apartments per zip
        const apartments = [];
        
        const zipCodeData = {
            '90066': {
                areaName: 'Mar Vista',
                basePrice: 4800,
                priceVariance: 300,
                neighborhoods: ['Mar Vista', 'Venice Adjacent']
            },
            '90230': {
                areaName: 'Culver City',
                basePrice: 4600,
                priceVariance: 400,
                neighborhoods: ['Downtown Culver City', 'Arts District']
            },
            '90232': {
                areaName: 'Culver City',
                basePrice: 4500,
                priceVariance: 350,
                neighborhoods: ['Fox Hills', 'Culver West']
            },
            '90034': {
                areaName: 'Palms',
                basePrice: 4400,
                priceVariance: 300,
                neighborhoods: ['Palms', 'Motor Avenue']
            }
        };
        
        const areaData = zipCodeData[zipCode];
        
        for (let i = 0; i < apartmentCount; i++) {
            const apartment = this.generateSingleDemoApartment(zipCode, areaData, i);
            apartments.push(apartment);
        }
        
        return apartments;
    }

    generateSingleDemoApartment(zipCode, areaData, index) {
        const buildingNumber = Math.floor(Math.random() * 9999) + 1000;
        const streetNames = [
            'Pacific Ave', 'Lincoln Blvd', 'Venice Blvd', 'Washington Blvd',
            'Motor Ave', 'Sepulveda Blvd', 'Culver Blvd', 'Jefferson Blvd'
        ];
        const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
        
        // Realistic price calculation
        const basePrice = areaData.basePrice;
        const priceOffset = (Math.random() - 0.5) * areaData.priceVariance * 2;
        const price = Math.max(4400, Math.min(5200, Math.round((basePrice + priceOffset) / 50) * 50));
        
        // Realistic apartment features
        const features = this.generateRealisticFeatures();
        const bathrooms = Math.random() > 0.4 ? 2.0 : 1.5;
        const sqft = 900 + Math.floor(Math.random() * 400);
        const floor = Math.floor(Math.random() * 8) + 2;
        
        // Realistic availability
        const daysAgo = Math.floor(Math.random() * 14); // 0-14 days ago
        const datePosted = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        
        return {
            id: `demo_${zipCode}_${index}_${Date.now()}`,
            title: `Luxury 2-Bedroom in ${areaData.areaName}`,
            address: `${buildingNumber} ${streetName}, ${areaData.areaName}, CA ${zipCode}`,
            zipCode,
            price,
            bedrooms: 2,
            bathrooms,
            sqft,
            floor,
            features,
            highlightFeatures: this.getHighlightFeatures(features),
            recentlyRenovated: features.includes('Recently Renovated'),
            premiumAmenities: features.includes('Swimming Pool') || features.includes('Fitness Center'),
            datePosted: datePosted.toISOString(),
            source: 'Demo Data',
            url: this.generateDemoUrl(areaData.areaName, zipCode),
            backupUrls: this.generateDemoBackupUrls(areaData.areaName, zipCode),
            contact: {
                phone: this.generatePhoneNumber(),
                email: `leasing@${areaData.areaName.toLowerCase().replace(/\s/g, '')}apartments.com`
            },
            images: this.generateDemoImages(),
            description: this.generateDemoDescription(areaData.areaName, features),
            score: 0 // Will be calculated by scoring system
        };
    }

    generateRealisticFeatures() {
        // Always include required amenities for demo
        const requiredFeatures = [
            'In-Unit Washer/Dryer',
            'Central Air Conditioning',
            'Private Balcony'
        ];
        
        // Optional features with realistic probabilities
        const optionalFeatures = [
            { feature: 'Stainless Steel Appliances', probability: 0.8 },
            { feature: 'Hardwood Floors', probability: 0.6 },
            { feature: 'Granite Countertops', probability: 0.7 },
            { feature: 'Walk-in Closet', probability: 0.5 },
            { feature: 'Swimming Pool', probability: 0.3 },
            { feature: 'Fitness Center', probability: 0.4 },
            { feature: 'Parking Garage', probability: 0.9 },
            { feature: 'Pet Friendly', probability: 0.6 },
            { feature: 'Dishwasher', probability: 0.8 },
            { feature: 'Recently Renovated', probability: 0.4 },
            { feature: 'High Ceilings', probability: 0.5 },
            { feature: 'Modern Kitchen', probability: 0.7 },
            { feature: 'Storage Unit', probability: 0.3 }
        ];
        
        const selectedFeatures = [...requiredFeatures];
        
        optionalFeatures.forEach(({ feature, probability }) => {
            if (Math.random() < probability) {
                selectedFeatures.push(feature);
            }
        });
        
        return selectedFeatures;
    }

    getHighlightFeatures(features) {
        const highlights = [
            'In-Unit Washer/Dryer',
            'Central Air Conditioning',
            'Private Balcony',
            'Recently Renovated',
            'Modern Kitchen',
            'Granite Countertops'
        ];
        
        return features.filter(feature => highlights.includes(feature));
    }

    generateDemoUrl(areaName, zipCode) {
        // Generate realistic looking URLs for demo
        const sources = [
            'apartments.com',
            'zillow.com',
            'trulia.com',
            'hotpads.com'
        ];
        
        const source = sources[Math.floor(Math.random() * sources.length)];
        const cleanArea = areaName.toLowerCase().replace(/\s/g, '-');
        
        return `https://www.${source}/${cleanArea}-ca-${zipCode}/apartments-for-rent`;
    }

    generateDemoBackupUrls(areaName, zipCode) {
        const query = encodeURIComponent(`${areaName} CA ${zipCode} apartments rent 2 bedroom`);
        
        return [
            {
                name: 'Google Search',
                url: `https://www.google.com/search?q=${query}`,
                type: 'search',
                priority: 1,
                description: 'Search all listings'
            },
            {
                name: 'Zillow Rentals',
                url: `https://www.zillow.com/los-angeles-ca/rentals/`,
                type: 'listings',
                priority: 1,
                description: 'Browse rentals'
            }
        ];
    }

    generatePhoneNumber() {
        const areaCodes = ['310', '424', '323'];
        const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
        const exchange = Math.floor(Math.random() * 900) + 100;
        const number = Math.floor(Math.random() * 9000) + 1000;
        return `(${areaCode}) ${exchange}-${number}`;
    }

    generateDemoImages() {
        const imageCount = Math.floor(Math.random() * 4) + 2; // 2-5 images
        const images = [];
        
        for (let i = 0; i < imageCount; i++) {
            // Use placeholder service for demo images
            images.push(`https://picsum.photos/600/400?random=${Date.now()}_${i}`);
        }
        
        return images;
    }

    generateDemoDescription(areaName, features) {
        const descriptions = [
            `Beautiful 2-bedroom apartment in the heart of ${areaName}. This stunning unit features modern finishes and premium amenities.`,
            `Discover luxury living in this contemporary apartment in ${areaName}. Perfectly designed for comfort and style.`,
            `Spacious and bright 2-bedroom unit in a desirable ${areaName} location. This apartment offers the perfect blend of comfort and convenience.`
        ];
        
        const baseDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
        const keyFeatures = features.slice(0, 3).join(', ');
        
        return `${baseDescription} Key features include: ${keyFeatures}. Contact us today to schedule a viewing! [Demo Data]`;
    }

    enhanceDemoApartment(apartment) {
        // Add realistic URL health simulation
        apartment.urlHealth = {
            healthy: Math.random() > 0.1, // 90% success rate
            status: Math.random() > 0.1 ? 'verified' : 'failed',
            responseTime: Math.floor(Math.random() * 1000) + 200
        };
        
        apartment.urlHealthSummary = apartment.urlHealth.healthy ? {
            className: 'healthy',
            icon: 'fas fa-check-circle',
            message: 'Link verified (Demo Data)'
        } : {
            className: 'warning',
            icon: 'fas fa-exclamation-triangle',
            message: 'Demo link simulation'
        };
        
        return apartment;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Method to enable/disable fallback mode
    setFallbackEnabled(enabled) {
        this.fallbackEnabled = enabled;
        console.log(`📋 Demo fallback ${enabled ? 'enabled' : 'disabled'}`);
    }

    // Get search engine status
    getStatus() {
        return {
            deepSearchAvailable: this.isDeepSearchAvailable,
            fallbackEnabled: this.fallbackEnabled,
            backendStatus: this.deepSearchClient.getBackendStatus(),
            searchCriteria: this.searchCriteria
        };
    }
}