// Apartment Scoring Algorithm
class ApartmentScorer {
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

    calculateScore(apartment, searchCriteria) {
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
        
        // Store breakdown for debugging
        apartment.scoreBreakdown = scoreBreakdown;
        
        return Math.round(Math.min(totalScore, this.maxScore));
    }

    calculateRentScore(price, searchCriteria) {
        const { minRent, maxRent } = searchCriteria;
        
        if (price < minRent || price > maxRent) {
            return 0; // Outside acceptable range
        }
        
        // Calculate optimal rent (closer to middle of range gets higher score)
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
        
        // Check for washer/dryer
        requiredAmenities.washerDryer = features.some(f => 
            (f.includes('washer') && f.includes('dryer')) || 
            f.includes('w/d') || 
            f.includes('laundry')
        );
        
        // Check for air conditioning
        requiredAmenities.airConditioning = features.some(f => 
            f.includes('air') || 
            f.includes('conditioning') || 
            f.includes('hvac') ||
            f.includes('central air')
        );
        
        // Check for outdoor space
        requiredAmenities.outdoorSpace = features.some(f => 
            f.includes('balcony') || 
            f.includes('patio') || 
            f.includes('terrace') ||
            f.includes('deck') ||
            f.includes('outdoor')
        );
        
        // Check floor level
        requiredAmenities.aboveGroundFloor = apartment.floor > 1;
        
        // Calculate score based on percentage of requirements met
        const metRequirements = Object.values(requiredAmenities).filter(Boolean).length;
        const totalRequirements = Object.keys(requiredAmenities).length;
        const completionRate = metRequirements / totalRequirements;
        
        return Math.round(this.weights.mandatoryAmenities * completionRate);
    }

    calculateRenovationScore(apartment) {
        const features = apartment.features.map(f => f.toLowerCase());
        
        // Check for renovation indicators
        const renovationKeywords = [
            'renovated', 'updated', 'remodeled', 'modern', 'new',
            'contemporary', 'upgraded', 'refreshed', 'redesigned'
        ];
        
        const hasRenovationKeywords = features.some(f => 
            renovationKeywords.some(keyword => f.includes(keyword))
        );
        
        // Check if explicitly marked as recently renovated
        const explicitlyRenovated = apartment.recentlyRenovated || false;
        
        // Check for modern amenities that suggest recent renovation
        const modernAmenities = [
            'stainless steel', 'granite', 'quartz', 'hardwood',
            'modern kitchen', 'designer', 'luxury'
        ];
        
        const hasModernAmenities = features.some(f => 
            modernAmenities.some(amenity => f.includes(amenity))
        );
        
        let score = 0;
        
        if (explicitlyRenovated) {
            score = this.weights.renovationRecency; // Full points
        } else if (hasRenovationKeywords && hasModernAmenities) {
            score = this.weights.renovationRecency * 0.8; // 80% of points
        } else if (hasRenovationKeywords || hasModernAmenities) {
            score = this.weights.renovationRecency * 0.5; // 50% of points
        } else {
            score = this.weights.renovationRecency * 0.2; // 20% of points (older unit)
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
        
        // Higher floors typically get more light
        const floorBonus = apartment.floor > 5 ? 0.2 : 0;
        
        let score = 0;
        
        if (lightIndicators) {
            score = this.weights.naturalLight * (0.8 + floorBonus); // Base 80% + floor bonus
        } else {
            score = this.weights.naturalLight * (0.4 + floorBonus); // Base 40% + floor bonus
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
        
        // Convert priority to score (1 = highest priority = highest score)
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
        
        // Score based on number of premium amenities (max 5 points)
        const score = Math.min(premiumCount * 1.5, this.weights.premiumAmenities);
        
        return Math.round(score);
    }

    calculateLocationRatingScore(apartment) {
        // This would typically come from external data sources
        // For demo purposes, we'll simulate based on zip code and price
        
        const zipCodeRatings = {
            '90066': 4.5, // Mar Vista - excellent walkability
            '90230': 4.2, // Central Culver City - great amenities
            '90232': 3.8, // Southeast Culver City - good location
            '90034': 3.5  // Palms - decent location
        };
        
        const baseRating = zipCodeRatings[apartment.zipCode] || 3.0;
        
        // Higher rent might indicate better location within zip code
        const priceBonus = apartment.price > 4800 ? 0.2 : 0;
        
        const finalRating = Math.min(baseRating + priceBonus, 5.0);
        
        // Convert rating to score (4.5+ = full points, 3.0 = 50% points)
        const scoreMultiplier = Math.max(0, (finalRating - 3.0) / 2.0);
        
        return Math.round(this.weights.locationRating * scoreMultiplier);
    }

    calculatePhotoScore(apartment) {
        const imageCount = apartment.images?.length || 0;
        
        if (imageCount >= 5) {
            return this.weights.professionalPhotos; // Full points for 5+ photos
        } else if (imageCount >= 3) {
            return Math.round(this.weights.professionalPhotos * 0.7); // 70% for 3-4 photos
        } else if (imageCount >= 1) {
            return Math.round(this.weights.professionalPhotos * 0.4); // 40% for 1-2 photos
        } else {
            return 0; // No photos
        }
    }

    calculateFloorScore(apartment) {
        const floor = apartment.floor || 2;
        
        // Optimal floors are 3-6 (not too low, not too high)
        if (floor >= 3 && floor <= 6) {
            return this.weights.floorLevel;
        } else if (floor === 2 || floor === 7 || floor === 8) {
            return Math.round(this.weights.floorLevel * 0.7);
        } else if (floor > 8) {
            return Math.round(this.weights.floorLevel * 0.5); // Too high
        } else {
            return 0; // Ground floor or below (doesn't meet criteria)
        }
    }

    // Utility method to get detailed score explanation
    getScoreExplanation(apartment) {
        if (!apartment.scoreBreakdown) {
            return 'Score breakdown not available';
        }
        
        const breakdown = apartment.scoreBreakdown;
        const explanations = [];
        
        explanations.push(`Rent Score: ${breakdown.rent}/${this.weights.rentInRange} points`);
        explanations.push(`Amenities: ${breakdown.amenities}/${this.weights.mandatoryAmenities} points`);
        explanations.push(`Renovation: ${breakdown.renovation}/${this.weights.renovationRecency} points`);
        explanations.push(`Natural Light: ${breakdown.naturalLight}/${this.weights.naturalLight} points`);
        explanations.push(`Outdoor Space: ${breakdown.outdoorSpace}/${this.weights.outdoorSpaceQuality} points`);
        explanations.push(`Location: ${breakdown.location}/${this.weights.zipCodePriority} points`);
        
        if (breakdown.premiumAmenities > 0) {
            explanations.push(`Premium Amenities Bonus: +${breakdown.premiumAmenities} points`);
        }
        
        if (breakdown.locationRating > 0) {
            explanations.push(`Location Rating Bonus: +${breakdown.locationRating} points`);
        }
        
        if (breakdown.photos > 0) {
            explanations.push(`Photo Quality Bonus: +${breakdown.photos} points`);
        }
        
        if (breakdown.floor > 0) {
            explanations.push(`Floor Level Bonus: +${breakdown.floor} points`);
        }
        
        return explanations.join('\n');
    }

    // Method to suggest improvements for low-scoring apartments
    getSuggestions(apartment) {
        const suggestions = [];
        const breakdown = apartment.scoreBreakdown || {};
        
        if (breakdown.rent < this.weights.rentInRange * 0.8) {
            suggestions.push('Consider apartments closer to your optimal price range');
        }
        
        if (breakdown.amenities < this.weights.mandatoryAmenities * 0.8) {
            suggestions.push('Look for apartments with all required amenities (A/C, W/D, outdoor space)');
        }
        
        if (breakdown.renovation < this.weights.renovationRecency * 0.6) {
            suggestions.push('Prioritize recently renovated or modern apartments');
        }
        
        if (breakdown.naturalLight < this.weights.naturalLight * 0.6) {
            suggestions.push('Look for apartments with better natural light (higher floors, corner units)');
        }
        
        if (breakdown.location < this.weights.zipCodePriority * 0.6) {
            suggestions.push('Focus on preferred zip codes (90066, 90230)');
        }
        
        return suggestions.length > 0 ? suggestions : ['This apartment meets most of your criteria well!'];
    }
}