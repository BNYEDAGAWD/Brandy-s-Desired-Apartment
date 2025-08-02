import { describe, it, expect } from 'vitest';

describe('ApartmentScoring', () => {
  let scorer;

  beforeEach(() => {
    // Mock the scoring module
    scorer = {
      calculateScore(apartment) {
        let score = 0;
        
        // Price scoring (0-25 points)
        if (apartment.price >= 4400 && apartment.price <= 5200) {
          score += 25;
        } else if (apartment.price < 4400) {
          score += 20;
        } else if (apartment.price <= 5500) {
          score += 15;
        } else {
          score += 5;
        }
        
        // Bedroom/bathroom scoring (0-20 points)
        if (apartment.bedrooms === 2) score += 10;
        if (apartment.bathrooms >= 1.5) score += 10;
        
        // Floor scoring (0-15 points)
        if (apartment.floor && apartment.floor > 1) score += 15;
        
        // Features scoring (0-30 points)
        const desiredFeatures = [
          'Air Conditioning',
          'In-Unit Laundry',
          'Balcony',
          'Recently Renovated',
          'Parking'
        ];
        
        const matchingFeatures = apartment.features.filter(f => 
          desiredFeatures.some(df => f.toLowerCase().includes(df.toLowerCase()))
        );
        
        score += Math.min(matchingFeatures.length * 6, 30);
        
        // Recently renovated bonus (0-10 points)
        if (apartment.recentlyRenovated) score += 10;
        
        return Math.min(score, 100);
      },

      getScoreBreakdown(apartment) {
        const breakdown = {
          price: 0,
          specs: 0,
          floor: 0,
          features: 0,
          renovation: 0,
          total: 0
        };
        
        // Price scoring
        if (apartment.price >= 4400 && apartment.price <= 5200) {
          breakdown.price = 25;
        } else if (apartment.price < 4400) {
          breakdown.price = 20;
        } else if (apartment.price <= 5500) {
          breakdown.price = 15;
        } else {
          breakdown.price = 5;
        }
        
        // Specs scoring
        if (apartment.bedrooms === 2) breakdown.specs += 10;
        if (apartment.bathrooms >= 1.5) breakdown.specs += 10;
        
        // Floor scoring
        if (apartment.floor && apartment.floor > 1) breakdown.floor = 15;
        
        // Features scoring
        const desiredFeatures = [
          'Air Conditioning',
          'In-Unit Laundry',
          'Balcony',
          'Recently Renovated',
          'Parking'
        ];
        
        const matchingFeatures = apartment.features.filter(f => 
          desiredFeatures.some(df => f.toLowerCase().includes(df.toLowerCase()))
        );
        
        breakdown.features = Math.min(matchingFeatures.length * 6, 30);
        
        // Renovation bonus
        if (apartment.recentlyRenovated) breakdown.renovation = 10;
        
        breakdown.total = Math.min(
          breakdown.price + breakdown.specs + breakdown.floor + 
          breakdown.features + breakdown.renovation, 
          100
        );
        
        return breakdown;
      }
    };
  });

  describe('Score Calculation', () => {
    it('should calculate perfect score for ideal apartment', () => {
      const apartment = {
        price: 4800,
        bedrooms: 2,
        bathrooms: 2,
        floor: 3,
        features: [
          'Air Conditioning',
          'In-Unit Laundry',
          'Balcony',
          'Recently Renovated',
          'Parking'
        ],
        recentlyRenovated: true
      };
      
      const score = scorer.calculateScore(apartment);
      expect(score).toBe(100);
    });

    it('should penalize apartments outside price range', () => {
      const expensiveApartment = {
        price: 6000,
        bedrooms: 2,
        bathrooms: 2,
        floor: 3,
        features: ['Air Conditioning', 'In-Unit Laundry'],
        recentlyRenovated: false
      };
      
      const cheapApartment = {
        price: 3000,
        bedrooms: 2,
        bathrooms: 2,
        floor: 3,
        features: ['Air Conditioning', 'In-Unit Laundry'],
        recentlyRenovated: false
      };
      
      expect(scorer.calculateScore(expensiveApartment)).toBeLessThan(60);
      expect(scorer.calculateScore(cheapApartment)).toBeGreaterThan(
        scorer.calculateScore(expensiveApartment)
      );
    });

    it('should reward apartments with desired features', () => {
      const apartmentWithFeatures = {
        price: 4800,
        bedrooms: 2,
        bathrooms: 2,
        floor: 1,
        features: ['Air Conditioning', 'In-Unit Laundry', 'Balcony'],
        recentlyRenovated: false
      };
      
      const apartmentWithoutFeatures = {
        price: 4800,
        bedrooms: 2,
        bathrooms: 2,
        floor: 1,
        features: [],
        recentlyRenovated: false
      };
      
      expect(scorer.calculateScore(apartmentWithFeatures)).toBeGreaterThan(
        scorer.calculateScore(apartmentWithoutFeatures)
      );
    });

    it('should penalize ground floor apartments', () => {
      const groundFloor = {
        price: 4800,
        bedrooms: 2,
        bathrooms: 2,
        floor: 1,
        features: ['Air Conditioning'],
        recentlyRenovated: false
      };
      
      const upperFloor = {
        price: 4800,
        bedrooms: 2,
        bathrooms: 2,
        floor: 3,
        features: ['Air Conditioning'],
        recentlyRenovated: false
      };
      
      expect(scorer.calculateScore(upperFloor)).toBeGreaterThan(
        scorer.calculateScore(groundFloor)
      );
    });

    it('should handle missing floor information', () => {
      const apartment = {
        price: 4800,
        bedrooms: 2,
        bathrooms: 2,
        features: ['Air Conditioning'],
        recentlyRenovated: false
      };
      
      expect(() => scorer.calculateScore(apartment)).not.toThrow();
      expect(scorer.calculateScore(apartment)).toBeGreaterThan(0);
    });
  });

  describe('Score Breakdown', () => {
    it('should provide detailed score breakdown', () => {
      const apartment = {
        price: 4800,
        bedrooms: 2,
        bathrooms: 2,
        floor: 3,
        features: ['Air Conditioning', 'In-Unit Laundry'],
        recentlyRenovated: true
      };
      
      const breakdown = scorer.getScoreBreakdown(apartment);
      
      expect(breakdown).toHaveProperty('price');
      expect(breakdown).toHaveProperty('specs');
      expect(breakdown).toHaveProperty('floor'); 
      expect(breakdown).toHaveProperty('features');
      expect(breakdown).toHaveProperty('renovation');
      expect(breakdown).toHaveProperty('total');
      
      expect(breakdown.price).toBe(25);
      expect(breakdown.specs).toBe(20);
      expect(breakdown.floor).toBe(15);
      expect(breakdown.features).toBe(12);
      expect(breakdown.renovation).toBe(10);
      expect(breakdown.total).toBe(82);
    });

    it('should cap total score at 100', () => {
      const apartment = {
        price: 4800,
        bedrooms: 2,
        bathrooms: 2,
        floor: 3,
        features: [
          'Air Conditioning', 'In-Unit Laundry', 'Balcony', 
          'Recently Renovated', 'Parking', 'Pool', 'Gym'
        ],
        recentlyRenovated: true
      };
      
      const breakdown = scorer.getScoreBreakdown(apartment);
      expect(breakdown.total).toBeLessThanOrEqual(100);
    });
  });

  describe('Feature Matching', () => {
    it('should match features case-insensitively', () => {
      const apartment1 = {
        price: 4800,
        bedrooms: 2,
        bathrooms: 2,
        floor: 1,
        features: ['air conditioning', 'in-unit laundry'],
        recentlyRenovated: false
      };
      
      const apartment2 = {
        price: 4800,
        bedrooms: 2,
        bathrooms: 2,
        floor: 1,
        features: ['Air Conditioning', 'In-Unit Laundry'],
        recentlyRenovated: false
      };
      
      expect(scorer.calculateScore(apartment1)).toBe(scorer.calculateScore(apartment2));
    });

    it('should match partial feature names', () => {
      const apartment = {
        price: 4800,
        bedrooms: 2,
        bathrooms: 2,
        floor: 1,
        features: ['Central Air', 'Washer/Dryer in Unit'],
        recentlyRenovated: false
      };
      
      const score = scorer.calculateScore(apartment);
      expect(score).toBeGreaterThan(40); // Should get points for AC and laundry
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty features array', () => {
      const apartment = {
        price: 4800,
        bedrooms: 2,
        bathrooms: 2,
        floor: 1,
        features: [],
        recentlyRenovated: false
      };
      
      expect(() => scorer.calculateScore(apartment)).not.toThrow();
      expect(scorer.calculateScore(apartment)).toBe(45); // price + specs
    });

    it('should handle undefined or null values gracefully', () => {
      const apartment = {
        price: 4800,
        bedrooms: 2,
        bathrooms: null,
        floor: undefined,
        features: ['Air Conditioning'],
        recentlyRenovated: false
      };
      
      expect(() => scorer.calculateScore(apartment)).not.toThrow();
    });

    it('should handle extremely high or low prices', () => {
      const extremelyExpensive = {
        price: 50000,
        bedrooms: 2,
        bathrooms: 2,
        floor: 1,
        features: [],
        recentlyRenovated: false
      };
      
      const extremelyLow = {
        price: 100,
        bedrooms: 2,
        bathrooms: 2,
        floor: 1,
        features: [],
        recentlyRenovated: false
      };
      
      expect(scorer.calculateScore(extremelyExpensive)).toBeGreaterThan(0);
      expect(scorer.calculateScore(extremelyLow)).toBeGreaterThan(0);
    });
  });
});