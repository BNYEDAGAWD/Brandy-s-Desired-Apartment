import { describe, it, expect, beforeEach, vi } from 'vitest';

// Setup DOM environment
document.body.innerHTML = `
<!DOCTYPE html>
<html>
<body>
  <div id="searchBtn"></div>
  <div id="sortBy"></div>
  <div id="minScore"></div>
  <div id="minScoreValue"></div>
  <div id="recentOnly"></div>
  <div id="renovatedOnly"></div>
  <div id="premiumOnly"></div>
  <div id="toggleFilters"></div>
  <div id="apartmentModal"></div>
  <div id="closeModal"></div>
  <div id="exportBtn"></div>
  <div id="resultsSection"></div>
  <div id="filterPanel"></div>
  <div id="loadingIndicator"></div>
  <div id="resultsGrid"></div>
  <div id="recentResults"></div>
  <div id="recentListings"></div>
  <div id="noResults"></div>
  <div id="resultsCount"></div>
  <div id="toastContainer"></div>
  <div class="filter-content"></div>
  <div class="step" id="step1"></div>
  <div class="step" id="step2"></div>
  <div class="step" id="step3"></div>
  <div class="step" id="step4"></div>
</body>
</html>
`;

// Mock the app modules
const mockSearchEngine = {
  searchApartments: vi.fn().mockResolvedValue([
    {
      id: '1',
      title: 'Test Apartment',
      address: '123 Test St',
      price: 4500,
      bedrooms: 2,
      bathrooms: 2,
      score: 85,
      features: ['AC', 'Laundry', 'Balcony'],
      datePosted: new Date().toISOString(),
      contact: { phone: '555-0123' },
      source: 'Test Source'
    }
  ])
};

global.ApartmentSearchEngine = function() {
  return mockSearchEngine;
};

// Mock classes
class ApartmentFinderApp {
  constructor() {
    this.apartments = [];
    this.filteredApartments = [];
    this.bookmarkedApartments = [];
    this.isSearching = false;
  }

  async startSearch() {
    this.isSearching = true;
    const apartments = await mockSearchEngine.searchApartments();
    this.apartments = apartments;
    this.filteredApartments = apartments;
    this.isSearching = false;
    return apartments;
  }

  applyFilters() {
    // Basic filtering implementation for tests
    this.filteredApartments = [...this.apartments];
  }

  toggleBookmark(id) {
    const index = this.bookmarkedApartments.indexOf(id);
    if (index > -1) {
      this.bookmarkedApartments.splice(index, 1);
    } else {
      this.bookmarkedApartments.push(id);
    }
  }

  convertToCSV(data) {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? 
          `"${value}"` : value
      ).join(',')
    );
    return [headers, ...rows].join('\n');
  }

  exportResults() {
    if (this.filteredApartments.length === 0) {
      this.showToast('No results to export', 'warning');
      return;
    }
    this.showToast('Results exported successfully!', 'success');
  }

  showToast() {
    // Mock implementation
  }

  updateProgress() {
    // Mock implementation
  }
}

describe('ApartmentFinderApp', () => {
  let app;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
    <div id="searchBtn"></div>
    <div id="sortBy"></div>
    <div id="minScore"></div>
    <div id="minScoreValue"></div>
    <div id="recentOnly"></div>
    <div id="renovatedOnly"></div>
    <div id="premiumOnly"></div>
    <div id="toggleFilters"></div>
    <div id="apartmentModal"></div>
    <div id="closeModal"></div>
    <div id="exportBtn"></div>
    <div id="resultsSection"></div>
    <div id="filterPanel"></div>
    <div id="loadingIndicator"></div>
    <div id="resultsGrid"></div>
    <div id="recentResults"></div>
    <div id="recentListings"></div>
    <div id="noResults"></div>
    <div id="resultsCount"></div>
    <div id="toastContainer"></div>
    <div class="filter-content"></div>
    <div class="step" id="step1"></div>
    <div class="step" id="step2"></div>
    <div class="step" id="step3"></div>
    <div class="step" id="step4"></div>
    `;
    
    // Reset localStorage mock
    global.localStorage.clear();
    
    // Create new app instance
    app = new ApartmentFinderApp();
  });

  describe('Initialization', () => {
    it('should initialize with empty apartments array', () => {
      expect(app.apartments).toEqual([]);
      expect(app.filteredApartments).toEqual([]);
      expect(app.isSearching).toBe(false);
    });

    it('should load bookmarks from localStorage', () => {
      global.localStorage.setItem('bookmarkedApartments', JSON.stringify(['1', '2']));
      const newApp = new ApartmentFinderApp();
      expect(newApp.bookmarkedApartments).toEqual(['1', '2']);
    });
  });

  describe('Search Functionality', () => {
    it('should start search and update apartments', async () => {
      await app.startSearch();
      
      expect(mockSearchEngine.searchApartments).toHaveBeenCalled();
      expect(app.apartments).toHaveLength(1);
      expect(app.apartments[0].title).toBe('Test Apartment');
    });

    it('should handle search errors gracefully', async () => {
      mockSearchEngine.searchApartments.mockRejectedValueOnce(new Error('Search failed'));
      const showToastSpy = vi.spyOn(app, 'showToast');
      
      await app.startSearch();
      
      expect(showToastSpy).toHaveBeenCalledWith('Search failed. Please try again.', 'error');
    });

    it('should show and hide loading state correctly', async () => {
      const searchBtn = document.getElementById('searchBtn');
      const loadingIndicator = document.getElementById('loadingIndicator');
      
      const searchPromise = app.startSearch();
      
      // Check loading state
      expect(searchBtn.style.display).toBe('none');
      expect(loadingIndicator.style.display).toBe('block');
      
      await searchPromise;
      
      // Check post-loading state
      expect(searchBtn.style.display).toBe('inline-block');
      expect(loadingIndicator.style.display).toBe('none');
    });
  });

  describe('Filter Functionality', () => {
    beforeEach(async () => {
      app.apartments = [
        {
          id: '1',
          score: 90,
          price: 4500,
          datePosted: new Date().toISOString(),
          recentlyRenovated: true,
          premiumAmenities: true
        },
        {
          id: '2',
          score: 70,
          price: 5000,
          datePosted: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          recentlyRenovated: false,
          premiumAmenities: false
        }
      ];
    });

    it('should filter by minimum score', () => {
      document.getElementById('minScore').value = '80';
      app.applyFilters();
      
      expect(app.filteredApartments).toHaveLength(1);
      expect(app.filteredApartments[0].id).toBe('1');
    });

    it('should filter recent listings only', () => {
      document.getElementById('recentOnly').checked = true;
      app.applyFilters();
      
      expect(app.filteredApartments).toHaveLength(1);
      expect(app.filteredApartments[0].id).toBe('1');
    });

    it('should sort by price low to high', () => {
      document.getElementById('sortBy').value = 'price-low';
      app.applyFilters();
      
      expect(app.filteredApartments[0].price).toBe(4500);
      expect(app.filteredApartments[1].price).toBe(5000);
    });

    it('should sort by price high to low', () => {
      document.getElementById('sortBy').value = 'price-high';
      app.applyFilters();
      
      expect(app.filteredApartments[0].price).toBe(5000);
      expect(app.filteredApartments[1].price).toBe(4500);
    });
  });

  describe('Bookmark Functionality', () => {
    it('should add apartment to bookmarks', () => {
      app.toggleBookmark('1');
      
      expect(app.bookmarkedApartments).toContain('1');
      expect(global.localStorage.getItem('bookmarkedApartments')).toBe('["1"]');
    });

    it('should remove apartment from bookmarks', () => {
      app.bookmarkedApartments = ['1'];
      app.toggleBookmark('1');
      
      expect(app.bookmarkedApartments).not.toContain('1');
      expect(global.localStorage.getItem('bookmarkedApartments')).toBe('[]');
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      app.filteredApartments = [
        {
          title: 'Test Apartment',
          address: '123 Test St',
          price: 4500,
          bedrooms: 2,
          bathrooms: 2,
          score: 85,
          features: ['AC', 'Laundry'],
          contact: { phone: '555-0123' },
          source: 'Test Source',
          datePosted: '2024-01-01'
        }
      ];
    });

    it('should convert data to CSV format', () => {
      const data = [
        { name: 'Test', value: 123 },
        { name: 'Test2', value: 456 }
      ];
      
      const csv = app.convertToCSV(data);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('name,value');
      expect(lines[1]).toBe('Test,123');
      expect(lines[2]).toBe('Test2,456');
    });

    it('should handle CSV values with commas', () => {
      const data = [{ name: 'Test, Inc.', value: 123 }];
      const csv = app.convertToCSV(data);
      
      expect(csv).toContain('"Test, Inc."');
    });

    it('should show warning when no results to export', () => {
      app.filteredApartments = [];
      const showToastSpy = vi.spyOn(app, 'showToast');
      
      app.exportResults();
      
      expect(showToastSpy).toHaveBeenCalledWith('No results to export', 'warning');
    });
  });

  describe('Toast Notifications', () => {
    it('should show toast with correct message and type', () => {
      const container = document.getElementById('toastContainer');
      
      app.showToast('Test message', 'success');
      
      const toast = container.querySelector('.toast');
      expect(toast).toBeTruthy();
      expect(toast.classList.contains('success')).toBe(true);
      expect(toast.textContent).toContain('Test message');
    });
  });

  describe('Progress Updates', () => {
    it('should update progress steps correctly', () => {
      app.updateProgress(50);
      
      expect(document.getElementById('step1').className).toBe('step completed');
      expect(document.getElementById('step2').className).toBe('step completed');
      expect(document.getElementById('step3').className).toBe('step active');
      expect(document.getElementById('step4').className).toBe('step');
    });

    it('should handle progress at boundaries', () => {
      app.updateProgress(0);
      expect(document.getElementById('step1').className).toBe('step active');
      
      app.updateProgress(100);
      expect(document.getElementById('step4').className).toBe('step completed');
    });
  });
});