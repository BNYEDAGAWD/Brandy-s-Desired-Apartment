export class ApartmentSearchEngine {
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
        
        this.dataSources = [
            { name: 'apartments.com', priority: 1, active: true },
            { name: 'westside_rentals', priority: 1, active: true },
            { name: 'zillow', priority: 1, active: true },
            { name: 'trulia', priority: 2, active: true },
            { name: 'hotpads', priority: 2, active: true },
            { name: 'redfin', priority: 2, active: true },
            { name: 'rentcafe', priority: 2, active: true },
            { name: 'zumper', priority: 2, active: true },
            { name: 'realtor.com', priority: 2, active: true },
            { name: 'craigslist', priority: 3, active: true }
        ];
        
        // Scoring will be handled by external module
    }

    async searchApartments(progressCallback) {
        const allApartments = [];
        const currentProgress = 0;
        const totalSteps = this.searchCriteria.zipCodes.length + 1; // +1 for final scoring
        
        // Search each zip code
        for (let i = 0; i < this.searchCriteria.zipCodes.length; i++) {
            const zipCode = this.searchCriteria.zipCodes[i];
            
            if (progressCallback) {
                progressCallback((i / totalSteps) * 100);
            }
            
            try {
                const apartments = await this.searchZipCode(zipCode);
                allApartments.push(...apartments);
                
                // Add small delay to prevent overwhelming APIs
                await this.delay(500);
            } catch (error) {
                console.error(`Error searching zip code ${zipCode}:`, error);
            }
        }
        
        // Final scoring and ranking
        if (progressCallback) {
            progressCallback(((totalSteps - 1) / totalSteps) * 100);
        }
        
        // Return apartments without scoring (will be handled by caller)
        const validApartments = allApartments.filter(apt => this.validateApartment(apt));
        
        if (progressCallback) {
            progressCallback(100);
        }
        
        return this.removeDuplicates(validApartments);
    }

    async searchZipCode(zipCode) {
        console.log(`Searching zip code: ${zipCode}`);
        
        // Since we can't actually call external APIs in this demo,
        // we'll generate realistic mock data based on the zip code
        return this.generateMockApartments(zipCode);
    }

    generateMockApartments(zipCode) {
        const apartmentCount = Math.floor(Math.random() * 15) + 5; // 5-20 apartments per zip
        const apartments = [];
        
        // Zip code specific data
        const zipCodeData = {
            '90066': { // Mar Vista
                areaName: 'Mar Vista',
                basePrice: 4800,
                priceVariance: 300,
                neighborhoods: ['Mar Vista', 'Venice Adjacent', 'Westside']
            },
            '90230': { // Central Culver City
                areaName: 'Culver City',
                basePrice: 4600,
                priceVariance: 400,
                neighborhoods: ['Downtown Culver City', 'Arts District', 'Hayden Tract']
            },
            '90232': { // Southeast Culver City
                areaName: 'Culver City',
                basePrice: 4500,
                priceVariance: 350,
                neighborhoods: ['Fox Hills', 'Culver West', 'Baldwin Hills Adjacent']
            },
            '90034': { // Palms
                areaName: 'Palms',
                basePrice: 4400,
                priceVariance: 300,
                neighborhoods: ['Palms', 'Motor Avenue', 'Mid City West']
            }
        };
        
        const areaData = zipCodeData[zipCode];
        const streetNames = [
            'Pacific Ave', 'Lincoln Blvd', 'Venice Blvd', 'Washington Blvd',
            'Motor Ave', 'Sepulveda Blvd', 'Culver Blvd', 'Jefferson Blvd',
            'Pico Blvd', 'Olympic Blvd', 'Exposition Blvd', 'National Blvd'
        ];
        
        const buildingTypes = [
            'Modern Apartment Complex', 'Luxury Townhome', 'Contemporary Loft',
            'Garden Style Apartment', 'Mid-Rise Building', 'Renovated Complex'
        ];
        
        const amenityPool = [
            'In-Unit Washer/Dryer', 'Central Air Conditioning', 'Private Balcony',
            'Stainless Steel Appliances', 'Hardwood Floors', 'Walk-in Closet',
            'Granite Countertops', 'Swimming Pool', 'Fitness Center', 'Parking Garage',
            'Pet Friendly', 'Dishwasher', 'Recently Renovated', 'Natural Light',
            'High Ceilings', 'Modern Kitchen', 'Patio/Deck', 'Storage Unit'
        ];
        
        for (let i = 0; i < apartmentCount; i++) {
            const buildingNumber = Math.floor(Math.random() * 9999) + 1000;
            const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
            const buildingType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
            
            // Price calculation with some variance
            const basePrice = areaData.basePrice;
            const priceOffset = (Math.random() - 0.5) * areaData.priceVariance * 2;
            const price = Math.round((basePrice + priceOffset) / 50) * 50; // Round to nearest $50
            
            // Ensure price is within budget
            const finalPrice = Math.max(4400, Math.min(5200, price));
            
            // Random but realistic features
            const selectedAmenities = this.selectRandomAmenities(amenityPool, 8, 12);
            const floor = Math.floor(Math.random() * 8) + 2; // Floors 2-9 (above ground)
            const sqft = 900 + Math.floor(Math.random() * 400); // 900-1300 sq ft
            const bathrooms = Math.random() > 0.4 ? 2.0 : 1.5; // 60% chance of 2 bath, 40% chance of 1.5
            
            // Recent renovation chance (higher for more expensive units)
            const renovationChance = (finalPrice - 4400) / 800; // 0-1 based on price
            const recentlyRenovated = Math.random() < (0.3 + renovationChance * 0.4);
            
            // Recent posting (some apartments are newer listings)
            const daysAgo = Math.floor(Math.random() * 30); // 0-30 days ago
            const datePosted = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
            
            const apartment = {
                id: `apt_${zipCode}_${i}_${Date.now()}`,
                title: `${buildingType} in ${areaData.areaName}`,
                address: `${buildingNumber} ${streetName}, ${areaData.areaName}, CA ${zipCode}`,
                zipCode,
                price: finalPrice,
                bedrooms: 2,
                bathrooms,
                sqft,
                floor,
                features: selectedAmenities,
                highlightFeatures: this.getHighlightFeatures(selectedAmenities),
                recentlyRenovated,
                premiumAmenities: selectedAmenities.includes('Swimming Pool') || 
                                selectedAmenities.includes('Fitness Center') ||
                                selectedAmenities.includes('Parking Garage'),
                datePosted: datePosted.toISOString(),
                source: this.getRandomSource(),
                url: this.generateListingUrl(buildingType, areaData.areaName, zipCode, finalPrice),
                backupUrls: this.generateBackupUrls(areaData.areaName, zipCode),
                contact: {
                    phone: this.generatePhoneNumber(),
                    email: `leasing@${buildingType.toLowerCase().replace(/\s+/g, '')}apartments.com`
                },
                images: this.generateMockImages(),
                description: this.generateDescription(buildingType, areaData.areaName, selectedAmenities),
                score: 0 // Will be calculated later
            };
            
            apartments.push(apartment);
        }
        
        return apartments;
    }

    selectRandomAmenities(pool, min, max) {
        const count = Math.floor(Math.random() * (max - min + 1)) + min;
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    getHighlightFeatures(features) {
        const highlights = [];
        const highlightMap = {
            'In-Unit Washer/Dryer': 'In-Unit Washer/Dryer',
            'Central Air Conditioning': 'Central Air Conditioning',
            'Private Balcony': 'Private Balcony',
            'Recently Renovated': 'Recently Renovated',
            'Natural Light': 'Natural Light',
            'Modern Kitchen': 'Modern Kitchen'
        };
        
        features.forEach(feature => {
            if (highlightMap[feature]) {
                highlights.push(feature);
            }
        });
        
        return highlights;
    }

    getRandomSource() {
        const sources = [
            'Apartments.com', 'Westside Rentals', 'Zillow Rentals',
            'Trulia', 'HotPads', 'Redfin', 'RentCafe', 'Zumper'
        ];
        return sources[Math.floor(Math.random() * sources.length)];
    }

    generatePhoneNumber() {
        const areaCode = ['310', '424', '323'][Math.floor(Math.random() * 3)];
        const exchange = Math.floor(Math.random() * 900) + 100;
        const number = Math.floor(Math.random() * 9000) + 1000;
        return `(${areaCode}) ${exchange}-${number}`;
    }

    generateListingUrl(buildingType, areaName, zipCode, price) {
        // Ultra-stable URL generation - prioritize simplicity and reliability
        const stableSources = [
            {
                name: 'Apartments.com',
                baseUrl: 'https://www.apartments.com',
                template: (_building, area, zip, _price) => {
                    // Use the most stable page - just metro area
                    return 'los-angeles-ca/';
                },
                weight: 3 // Higher weight = more likely to be selected
            },
            {
                name: 'Zillow',
                baseUrl: 'https://www.zillow.com',
                template: (_building, area, zip, _price) => {
                    // Use metro-level rentals page
                    return 'los-angeles-ca/rentals/';
                },
                weight: 3
            },
            {
                name: 'Trulia',
                baseUrl: 'https://www.trulia.com',
                template: (_building, area, zip, _price) => {
                    // Use stable city-level page
                    return 'for_rent/Los_Angeles,CA/';
                },
                weight: 2
            },
            {
                name: 'HotPads',
                baseUrl: 'https://hotpads.com',
                template: (_building, area, zip, _price) => {
                    // Use city-level search
                    return 'los-angeles-ca/apartments-for-rent';
                },
                weight: 2
            },
            {
                name: 'Westside Rentals',
                baseUrl: 'https://www.westsiderentals.com',
                template: (_building, area, zip, _price) => {
                    // Use homepage - most stable
                    return '';
                },
                weight: 2
            },
            {
                name: 'Realtor.com',
                baseUrl: 'https://www.realtor.com',
                template: (_building, area, zip, _price) => {
                    // Use city-level apartments page
                    return 'apartments-for-rent/Los-Angeles_CA';
                },
                weight: 1
            }
        ];

        // Select source based on weights (higher weight = more likely)
        const totalWeight = stableSources.reduce((sum, source) => sum + source.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedSource;

        for (const source of stableSources) {
            random -= source.weight;
            if (random <= 0) {
                selectedSource = source;
                break;
            }
        }

        // Fallback to first source if selection failed
        if (!selectedSource) {
            selectedSource = stableSources[0];
        }

        try {
            const urlPath = selectedSource.template(buildingType, areaName, zipCode, price);
            const finalUrl = urlPath ? `${selectedSource.baseUrl}/${urlPath}` : selectedSource.baseUrl;
            
            // Validate the generated URL
            if (!this.isValidUrl(finalUrl)) {
                throw new Error('Generated invalid URL');
            }
            
            return finalUrl;
        } catch (error) {
            console.warn(`URL generation failed for ${selectedSource.name}, using safe fallback:`, error);
            // Ultra-safe fallback - guaranteed to work
            return 'https://www.apartments.com/los-angeles-ca/';
        }
    }

    // Enhanced URL validation
    isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }

    // Helper method to sanitize city names for URLs
    sanitizeCityName(cityName) {
        return cityName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    }

    generateMockImages() {
        // In a real app, these would be actual image URLs
        const imageCount = Math.floor(Math.random() * 5) + 1; // 1-5 images
        const images = [];
        
        for (let i = 0; i < imageCount; i++) {
            images.push(`https://via.placeholder.com/600x400/f0f0f0/666666?text=Apartment+Image+${i + 1}`);
        }
        
        return images;
    }

    generateDescription(buildingType, area, amenities) {
        const descriptions = [
            `Beautiful ${buildingType.toLowerCase()} located in the heart of ${area}. This stunning 2-bedroom unit features modern finishes and premium amenities.`,
            `Discover luxury living in this ${buildingType.toLowerCase()} in ${area}. Perfectly designed for comfort and style.`,
            `Spacious and bright 2-bedroom apartment in a desirable ${area} location. This ${buildingType.toLowerCase()} offers the perfect blend of comfort and convenience.`
        ];
        
        const baseDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
        const amenityText = amenities.slice(0, 4).join(', ');
        
        return `${baseDescription} Key features include: ${amenityText}. Contact us today to schedule a viewing!`;
    }

    // Removed scoreAndRankApartments - handled by external scoring module

    removeDuplicates(apartments) {
        const seen = new Set();
        return apartments.filter(apartment => {
            const key = `${apartment.address}_${apartment.price}_${apartment.bedrooms}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // URL validation and health checking
    async validateUrl(url) {
        try {
            // Use a simple HEAD request to check if URL exists
            // Note: This may be blocked by CORS, so we'll use a graceful fallback
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                mode: 'no-cors' // Bypass CORS for basic connectivity check
            });
            
            clearTimeout(timeoutId);
            return { valid: true, status: response.status || 'unknown' };
        } catch (error) {
            // If HEAD request fails, the URL might still work for users
            // Return as potentially valid with warning
            return { 
                valid: true, 
                status: 'unverified',
                warning: 'Could not verify URL due to CORS or network restrictions'
            };
        }
    }

    // Enhanced URL generation with validation
    async generateValidatedListingUrl(buildingType, areaName, zipCode, price) {
        const primaryUrl = this.generateListingUrl(buildingType, areaName, zipCode, price);
        
        // In development/testing, validate the URL
        if (process.env.NODE_ENV === 'development') {
            const validation = await this.validateUrl(primaryUrl);
            if (validation.warning) {
                console.warn(`URL validation warning for ${primaryUrl}: ${validation.warning}`);
            }
        }
        
        return primaryUrl;
    }

    // Generate comprehensive backup URLs using enhanced link monitor
    generateBackupUrls(areaName, zipCode, price) {
        // Import the enhanced alternative URL generator from link health monitor
        const encodedArea = encodeURIComponent(areaName || '');
        const encodedQuery = encodeURIComponent(`${areaName} CA ${zipCode} apartments rent 2 bedroom`);
        
        // Primary backup sources - guaranteed to work
        const primaryBackups = [
            {
                name: 'Google Search',
                url: `https://www.google.com/search?q=${encodedQuery}&tbm=&tbs=qdr:m`,
                type: 'search',
                priority: 1,
                description: 'Search all listings'
            },
            {
                name: 'Apartments.com Browse',
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
                description: 'Rental listings'
            }
        ];

        // Secondary backup sources  
        const secondaryBackups = [
            {
                name: 'HotPads',
                url: `https://hotpads.com/los-angeles-ca/apartments-for-rent`,
                type: 'listings',
                priority: 2,
                description: 'Map-based search'
            },
            {
                name: 'Westside Rentals',
                url: `https://www.westsiderentals.com/`,
                type: 'listings',
                priority: 2,
                description: 'Westside specialist'
            }
        ];

        // Return prioritized backup options
        return [...primaryBackups, ...secondaryBackups];
    }

    // Method to validate apartment against mandatory criteria
    validateApartment(apartment) {
        const criteria = this.searchCriteria;
        
        // Check price range
        if (apartment.price < criteria.minRent || apartment.price > criteria.maxRent) {
            return false;
        }
        
        // Check bedrooms
        if (apartment.bedrooms !== criteria.bedrooms) {
            return false;
        }
        
        // Check bathrooms
        if (apartment.bathrooms < criteria.minBathrooms || apartment.bathrooms > criteria.maxBathrooms) {
            return false;
        }
        
        // Check required amenities (simplified check)
        const features = apartment.features.map(f => f.toLowerCase());
        const hasWasherDryer = features.some(f => f.includes('washer') && f.includes('dryer'));
        const hasAC = features.some(f => f.includes('air') || f.includes('conditioning'));
        const hasOutdoor = features.some(f => f.includes('balcony') || f.includes('patio') || f.includes('deck'));
        const aboveGround = apartment.floor > 1;
        
        if (!hasWasherDryer || !hasAC || !hasOutdoor || !aboveGround) {
            return false;
        }
        
        return true;
    }
}