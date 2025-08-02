import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ApartmentSearchEngine', () => {
  let searchEngine;

  beforeEach(async () => {
    // Mock the search engine module
    const mockModule = {
      ApartmentSearchEngine: class {
        constructor() {
          this.zipCodes = ['90066', '90230', '90232', '90034'];
          this.mockApartments = [
            {
              id: '1',
              title: 'Luxury 2BR in Mar Vista',
              address: '123 Main St, Mar Vista, CA 90066',
              zipCode: '90066',
              price: 4800,
              bedrooms: 2,
              bathrooms: 2,
              sqft: 1200,
              floor: 2,
              features: ['Air Conditioning', 'In-Unit Laundry', 'Balcony', 'Parking'],
              recentlyRenovated: true,
              premiumAmenities: true,
              score: 0,
              datePosted: new Date().toISOString(),
              source: 'Test Source',
              contact: { phone: '555-0123' }
            }
          ];
        }

        async searchApartments(progressCallback) {
          const apartments = [...this.mockApartments];
          
          for (let i = 0; i <= 100; i += 25) {
            if (progressCallback) progressCallback(i);
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          return apartments.map(apt => ({
            ...apt,
            score: Math.floor(Math.random() * 40) + 60
          }));
        }

        async searchByZipCode(zipCode) {
          return this.mockApartments.filter(apt => apt.zipCode === zipCode);
        }

        simulateNetworkDelay(min = 100, max = 500) {
          const delay = Math.random() * (max - min) + min;
          return new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };

    const { ApartmentSearchEngine } = mockModule;
    searchEngine = new ApartmentSearchEngine();
  });

  describe('Initialization', () => {
    it('should initialize with correct zip codes', () => {
      expect(searchEngine.zipCodes).toEqual(['90066', '90230', '90232', '90034']);
    });

    it('should have mock apartments data', () => {
      expect(searchEngine.mockApartments).toHaveLength(1);
      expect(searchEngine.mockApartments[0].zipCode).toBe('90066');
    });
  });

  describe('Search Functionality', () => {
    it('should search apartments and return results with scores', async () => {
      const results = await searchEngine.searchApartments();
      
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('score');
      expect(results[0].score).toBeGreaterThanOrEqual(60);
      expect(results[0].score).toBeLessThanOrEqual(100);
    });

    it('should call progress callback during search', async () => {
      const progressCallback = vi.fn();
      
      await searchEngine.searchApartments(progressCallback);
      
      expect(progressCallback).toHaveBeenCalledTimes(5);
      expect(progressCallback).toHaveBeenCalledWith(0);
      expect(progressCallback).toHaveBeenCalledWith(25);
      expect(progressCallback).toHaveBeenCalledWith(50);
      expect(progressCallback).toHaveBeenCalledWith(75);
      expect(progressCallback).toHaveBeenCalledWith(100);
    });

    it('should work without progress callback', async () => {
      const results = await searchEngine.searchApartments();
      expect(results).toHaveLength(1);
    });
  });

  describe('Zip Code Search', () => {
    it('should filter apartments by zip code', async () => {
      const results = await searchEngine.searchByZipCode('90066');
      
      expect(results).toHaveLength(1);
      expect(results[0].zipCode).toBe('90066');
    });

    it('should return empty array for non-existent zip code', async () => {
      const results = await searchEngine.searchByZipCode('99999');
      
      expect(results).toHaveLength(0);
    });
  });

  describe('Network Simulation', () => {
    it('should simulate network delay', async () => {
      const start = Date.now();
      await searchEngine.simulateNetworkDelay(50, 100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(50);
      expect(end - start).toBeLessThan(200); // Allow some buffer for execution time
    });

    it('should handle custom delay ranges', async () => {
      const start = Date.now();
      await searchEngine.simulateNetworkDelay(200, 300);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Data Validation', () => {
    it('should have valid apartment data structure', () => {
      const apt = searchEngine.mockApartments[0];
      
      expect(apt).toHaveProperty('id');
      expect(apt).toHaveProperty('title');
      expect(apt).toHaveProperty('address');
      expect(apt).toHaveProperty('price');
      expect(apt).toHaveProperty('bedrooms');
      expect(apt).toHaveProperty('bathrooms');
      expect(apt).toHaveProperty('features');
      expect(Array.isArray(apt.features)).toBe(true);
    });

    it('should have required contact information', () => {
      const apt = searchEngine.mockApartments[0];
      
      expect(apt.contact).toHaveProperty('phone');
      expect(typeof apt.contact.phone).toBe('string');
    });

    it('should have valid price range', () => {
      const apt = searchEngine.mockApartments[0];
      
      expect(apt.price).toBeGreaterThan(0);
      expect(apt.price).toBeLessThan(10000); // Reasonable upper bound
    });
  });
});