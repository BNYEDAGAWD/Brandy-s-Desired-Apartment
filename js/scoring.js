export class ApartmentScoring {
    constructor() {
        this.weights = {
            // Base criteria (50 points total)
            rentInRange: 20,        // Within $4,400-$5,200 range
            mandatoryAmenities: 30, // All required amenities present
            
            // Quality factors (35 points total)
            renovationRecency: 25,  // Recently renovated (within 10 years)
            naturalLight: 15,       // Natural light indicators
            outdoorSpaceQuality: 10, // Quality of balcony/patio/terrace
            
            // Location factors (10 points total)
            zipCodePriority: 10,    // Preferred zip code ranking
            
            // Bonus factors (15 points total)
            premiumAmenities: 5,    // Premium building amenities
            locationRating: 5,      // Excellent location ratings
            professionalPhotos: 3,  // Quality listing photos
            floorLevel: 2,          // Higher floors preferred
        };
        
        this.maxScore = 100;
    }

    calculateScore(apartment, searchCriteria = {
        minRent: 4400,
        maxRent: 5200,
        zipCodePriority: {
            '90066': 1,
            '90230': 2, 
            '90232': 3,
            '90034': 4
        }
    }) {
        let totalScore = 0;
        let scoreBreakdown = {};
        
        // Base Score: Rent within range (20 points)
        const rentScore = this.calculateRentScore(apartment.price, searchCriteria);
        scoreBreakdown.rent = rentScore;
        totalScore += rentScore;
        
        // Mandatory amenities (30 points)
        const amenityScore = this.calculateMandatoryAmenityScore(apartment);
        scoreBreakdown.amenities = amenityScore;
        totalScore += amenityScore;
        
        // Renovation recency (25 points)
        const renovationScore = this.calculateRenovationScore(apartment);
        scoreBreakdown.renovation = renovationScore;
        totalScore += renovationScore;
        
        // Natural light (15 points)
        const lightScore = this.calculateNaturalLightScore(apartment);
        scoreBreakdown.naturalLight = lightScore;
        totalScore += lightScore;
        
        // Outdoor space quality (10 points)
        const outdoorScore = this.calculateOutdoorSpaceScore(apartment);
        scoreBreakdown.outdoorSpace = outdoorScore;
        totalScore += outdoorScore;
        
        // Zip code priority (10 points)
        const locationScore = this.calculateZipCodeScore(apartment.zipCode, searchCriteria);
        scoreBreakdown.location = locationScore;
        totalScore += locationScore;
        
        // Bonus: Premium amenities (5 points)
        const premiumScore = this.calculatePremiumAmenitiesScore(apartment);
        scoreBreakdown.premiumAmenities = premiumScore;
        totalScore += premiumScore;
        
        // Bonus: Location rating (5 points)
        const ratingScore = this.calculateLocationRatingScore(apartment);
        scoreBreakdown.locationRating = ratingScore;
        totalScore += ratingScore;
        
        // Bonus: Professional photos (3 points)
        const photoScore = this.calculatePhotoScore(apartment);
        scoreBreakdown.photos = photoScore;
        totalScore += photoScore;
        
        // Bonus: Floor level preference (2 points)
        const floorScore = this.calculateFloorScore(apartment);
        scoreBreakdown.floor = floorScore;
        totalScore += floorScore;
        
        return Math.round(Math.min(totalScore, this.maxScore));
    }

    getScoreBreakdown(apartment, searchCriteria = {
        minRent: 4400,
        maxRent: 5200,
        zipCodePriority: {
            '90066': 1,
            '90230': 2,
            '90232': 3, 
            '90034': 4
        }
    }) {
        const breakdown = {};
        
        breakdown.price = this.calculateRentScore(apartment.price, searchCriteria);
        breakdown.specs = this.calculateMandatoryAmenityScore(apartment);
        breakdown.floor = this.calculateFloorScore(apartment);
        breakdown.features = this.calculateRenovationScore(apartment) + 
                           this.calculateNaturalLightScore(apartment) + 
                           this.calculateOutdoorSpaceScore(apartment);
        breakdown.renovation = apartment.recentlyRenovated ? 10 : 0;
        
        breakdown.total = Math.min(
            breakdown.price + breakdown.specs + breakdown.floor + 
            breakdown.features + breakdown.renovation, 
            100
        );
        
        return breakdown;
    }

    calculateRentScore(price, searchCriteria) {
        const { minRent, maxRent } = searchCriteria;
        
        if (price < minRent || price > maxRent) {
            return 0;
        }
        
        const optimalRent = (minRent + maxRent) / 2;
        const maxDeviation = (maxRent - minRent) / 2;
        const deviation = Math.abs(price - optimalRent);
        const score = this.weights.rentInRange * (1 - deviation / maxDeviation);
        
        return Math.round(score);
    }

    calculateMandatoryAmenityScore(apartment) {
        const requiredAmenities = {
            washerDryer: false,
            airConditioning: false,
            outdoorSpace: false,
            aboveGroundFloor: false
        };
        
        const features = apartment.features.map(f => f.toLowerCase());
        
        requiredAmenities.washerDryer = features.some(f => 
            (f.includes('washer') && f.includes('dryer')) || 
            f.includes('w/d') || 
            f.includes('laundry')
        );
        
        requiredAmenities.airConditioning = features.some(f => 
            f.includes('air') || 
            f.includes('conditioning') || 
            f.includes('hvac') ||
            f.includes('central air')
        );
        
        requiredAmenities.outdoorSpace = features.some(f => 
            f.includes('balcony') || 
            f.includes('patio') || 
            f.includes('terrace') ||
            f.includes('deck') ||
            f.includes('outdoor')
        );
        
        requiredAmenities.aboveGroundFloor = apartment.floor > 1;
        
        const metRequirements = Object.values(requiredAmenities).filter(Boolean).length;
        const totalRequirements = Object.keys(requiredAmenities).length;
        const completionRate = metRequirements / totalRequirements;
        
        return Math.round(this.weights.mandatoryAmenities * completionRate);
    }

    calculateRenovationScore(apartment) {
        const features = apartment.features.map(f => f.toLowerCase());
        
        const renovationKeywords = [
            'renovated', 'updated', 'remodeled', 'modern', 'new',
            'contemporary', 'upgraded', 'refreshed', 'redesigned'
        ];
        
        const hasRenovationKeywords = features.some(f => 
            renovationKeywords.some(keyword => f.includes(keyword))
        );
        
        const explicitlyRenovated = apartment.recentlyRenovated || false;
        
        const modernAmenities = [
            'stainless steel', 'granite', 'quartz', 'hardwood',
            'modern kitchen', 'designer', 'luxury'
        ];
        
        const hasModernAmenities = features.some(f => 
            modernAmenities.some(amenity => f.includes(amenity))
        );
        
        let score = 0;
        
        if (explicitlyRenovated) {
            score = this.weights.renovationRecency;
        } else if (hasRenovationKeywords && hasModernAmenities) {
            score = this.weights.renovationRecency * 0.8;
        } else if (hasRenovationKeywords || hasModernAmenities) {
            score = this.weights.renovationRecency * 0.5;
        } else {
            score = this.weights.renovationRecency * 0.2;
        }
        
        return Math.round(score);
    }

    calculateNaturalLightScore(apartment) {
        const features = apartment.features.map(f => f.toLowerCase());
        const description = apartment.description?.toLowerCase() || '';
        
        const lightKeywords = [
            'natural light', 'bright', 'sunny', 'light-filled',
            'windows', 'large windows', 'floor-to-ceiling',
            'multiple exposures', 'corner unit'
        ];
        
        const lightIndicators = features.concat([description]).some(text => 
            lightKeywords.some(keyword => text.includes(keyword))
        );
        
        const floorBonus = apartment.floor > 5 ? 0.2 : 0;
        
        let score = 0;
        
        if (lightIndicators) {
            score = this.weights.naturalLight * (0.8 + floorBonus);
        } else {
            score = this.weights.naturalLight * (0.4 + floorBonus);
        }
        
        return Math.round(score);
    }

    calculateOutdoorSpaceScore(apartment) {
        const features = apartment.features.map(f => f.toLowerCase());
        
        const outdoorSpaceTypes = {
            'private balcony': 1.0,
            'terrace': 1.0,
            'private patio': 0.9,
            'deck': 0.8,
            'balcony': 0.7,
            'patio': 0.6,
            'outdoor': 0.5
        };
        
        let maxScore = 0;
        
        for (const [spaceType, multiplier] of Object.entries(outdoorSpaceTypes)) {
            if (features.some(f => f.includes(spaceType))) {
                maxScore = Math.max(maxScore, this.weights.outdoorSpaceQuality * multiplier);
            }
        }
        
        return Math.round(maxScore);
    }

    calculateZipCodeScore(zipCode, searchCriteria) {
        const priority = searchCriteria.zipCodePriority[zipCode] || 5;
        const scoreMultiplier = Math.max(0, (5 - priority) / 4);
        return Math.round(this.weights.zipCodePriority * scoreMultiplier);
    }

    calculatePremiumAmenitiesScore(apartment) {
        const features = apartment.features.map(f => f.toLowerCase());
        
        const premiumAmenities = [
            'swimming pool', 'fitness center', 'gym', 'concierge',
            'doorman', 'roof deck', 'rooftop', 'parking garage',
            'valet parking', 'business center', 'club room'
        ];
        
        const premiumCount = features.filter(f => 
            premiumAmenities.some(amenity => f.includes(amenity))
        ).length;
        
        const score = Math.min(premiumCount * 1.5, this.weights.premiumAmenities);
        return Math.round(score);
    }

    calculateLocationRatingScore(apartment) {
        const zipCodeRatings = {
            '90066': 4.5,
            '90230': 4.2,
            '90232': 3.8,
            '90034': 3.5
        };
        
        const baseRating = zipCodeRatings[apartment.zipCode] || 3.0;
        const priceBonus = apartment.price > 4800 ? 0.2 : 0;
        const finalRating = Math.min(baseRating + priceBonus, 5.0);
        const scoreMultiplier = Math.max(0, (finalRating - 3.0) / 2.0);
        
        return Math.round(this.weights.locationRating * scoreMultiplier);
    }

    calculatePhotoScore(apartment) {
        const imageCount = apartment.images?.length || 0;
        
        if (imageCount >= 5) {
            return this.weights.professionalPhotos;
        } else if (imageCount >= 3) {
            return Math.round(this.weights.professionalPhotos * 0.7);
        } else if (imageCount >= 1) {
            return Math.round(this.weights.professionalPhotos * 0.4);
        } else {
            return 0;
        }
    }

    calculateFloorScore(apartment) {
        const floor = apartment.floor || 2;
        
        if (floor >= 3 && floor <= 6) {
            return this.weights.floorLevel;
        } else if (floor === 2 || floor === 7 || floor === 8) {
            return Math.round(this.weights.floorLevel * 0.7);
        } else if (floor > 8) {
            return Math.round(this.weights.floorLevel * 0.5);
        } else {
            return 0;
        }
    }
}