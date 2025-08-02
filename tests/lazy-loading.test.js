import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LazyImageLoader } from '../js/lazy-loading.js';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});

window.IntersectionObserver = mockIntersectionObserver;

// Mock Image constructor
global.Image = class {
  constructor() {
    setTimeout(() => {
      this.onload && this.onload();
    }, 100);
  }
};

describe('LazyImageLoader', () => {
  let lazyLoader;
  let mockContainer;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Create mock container
    mockContainer = document.createElement('div');
    mockContainer.innerHTML = `
      <img data-src="test-image.jpg" alt="Test Image" class="property-image">
      <img data-src="test-image-2.jpg" alt="Test Image 2" class="property-image">
    `;
    document.body.appendChild(mockContainer);

    // Reset mocks
    mockIntersectionObserver.mockClear();
    
    lazyLoader = new LazyImageLoader({
      rootMargin: '50px',
      threshold: 0.1,
      fadeInDuration: 100
    });
  });

  afterEach(() => {
    lazyLoader?.destroy();
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    it('should create IntersectionObserver when supported', () => {
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('should initialize with default options', () => {
      const defaultLoader = new LazyImageLoader();
      expect(defaultLoader.options.rootMargin).toBe('50px');
      expect(defaultLoader.options.threshold).toBe(0.1);
    });

    it('should merge custom options with defaults', () => {
      const customLoader = new LazyImageLoader({
        rootMargin: '100px',
        threshold: 0.5
      });
      expect(customLoader.options.rootMargin).toBe('100px');
      expect(customLoader.options.threshold).toBe(0.5);
    });
  });

  describe('Image Setup', () => {
    it('should setup images for lazy loading', () => {
      const images = document.querySelectorAll('img[data-src]');
      expect(images.length).toBe(2);
      
      images.forEach(img => {
        expect(img.classList.contains('lazy-loading')).toBe(true);
        expect(img.style.opacity).toBe('0');
      });
    });

    it('should add loading indicators to images', () => {
      const containers = document.querySelectorAll('.image-container');
      expect(containers.length).toBeGreaterThan(0);
    });

    it('should set placeholder source if image has no src', () => {
      const img = document.querySelector('img[data-src]');
      expect(img.src).toContain('data:image/svg+xml');
    });
  });

  describe('Image Loading', () => {
    it('should load image when loadImage is called', async () => {
      const img = document.querySelector('img[data-src="test-image.jpg"]');
      const originalSrc = img.getAttribute('data-src');
      
      await lazyLoader.loadImage(img);
      
      expect(img.src).toContain(originalSrc);
      expect(img.hasAttribute('data-src')).toBe(false);
      expect(img.classList.contains('lazy-loaded')).toBe(true);
      expect(img.style.opacity).toBe('1');
    });

    it('should handle image load errors gracefully', async () => {
      // Mock Image to fail
      global.Image = class {
        constructor() {
          setTimeout(() => {
            this.onerror && this.onerror(new Error('Failed to load'));
          }, 100);
        }
      };

      const img = document.querySelector('img[data-src="test-image.jpg"]');
      await lazyLoader.loadImage(img);
      
      expect(img.classList.contains('lazy-error')).toBe(true);
      expect(img.src).toContain('data:image/svg+xml');
    });

    it('should not load the same image twice', async () => {
      const img = document.querySelector('img[data-src="test-image.jpg"]');
      
      await lazyLoader.loadImage(img);
      const firstSrc = img.src;
      
      await lazyLoader.loadImage(img);
      expect(img.src).toBe(firstSrc);
    });
  });

  describe('Observer Management', () => {
    it('should observe images with data-src attribute', () => {
      const observeSpy = vi.spyOn(lazyLoader.observer, 'observe');
      lazyLoader.observeImages();
      
      const images = document.querySelectorAll('img[data-src]');
      expect(observeSpy).toHaveBeenCalledTimes(images.length);
    });

    it('should unobserve image after loading', async () => {
      const unobserveSpy = vi.spyOn(lazyLoader.observer, 'unobserve');
      const img = document.querySelector('img[data-src="test-image.jpg"]');
      
      await lazyLoader.loadImage(img);
      expect(unobserveSpy).toHaveBeenCalledWith(img);
    });

    it('should refresh observer for new images', () => {
      const newImg = document.createElement('img');
      newImg.setAttribute('data-src', 'new-image.jpg');
      newImg.className = 'property-image';
      document.body.appendChild(newImg);
      
      const observeSpy = vi.spyOn(lazyLoader.observer, 'observe');
      lazyLoader.refresh();
      
      expect(observeSpy).toHaveBeenCalledWith(newImg);
    });
  });

  describe('Utility Methods', () => {
    it('should provide loading statistics', () => {
      const stats = lazyLoader.getStats();
      expect(stats).toHaveProperty('loaded');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('pending');
      expect(typeof stats.loaded).toBe('number');
      expect(typeof stats.failed).toBe('number');
      expect(typeof stats.pending).toBe('number');
    });

    it('should load images in specific container', async () => {
      const container = document.createElement('div');
      container.innerHTML = '<img data-src="container-image.jpg" class="property-image">';
      document.body.appendChild(container);
      
      const loadImageSpy = vi.spyOn(lazyLoader, 'loadImage');
      lazyLoader.loadImagesInContainer(container);
      
      expect(loadImageSpy).toHaveBeenCalled();
    });

    it('should destroy observer on cleanup', () => {
      const disconnectSpy = vi.spyOn(lazyLoader.observer, 'disconnect');
      lazyLoader.destroy();
      
      expect(disconnectSpy).toHaveBeenCalled();
      expect(lazyLoader.observer).toBe(null);
    });
  });

  describe('Event Handling', () => {
    it('should dispatch lazyLoaded event on successful load', async () => {
      const img = document.querySelector('img[data-src="test-image.jpg"]');
      let eventFired = false;
      
      img.addEventListener('lazyLoaded', (e) => {
        eventFired = true;
        expect(e.detail.src).toBe('test-image.jpg');
        expect(e.detail.img).toBe(img);
      });
      
      await lazyLoader.loadImage(img);
      expect(eventFired).toBe(true);
    });

    it('should dispatch lazyLoadError event on load failure', async () => {
      // Mock Image to fail
      global.Image = class {
        constructor() {
          setTimeout(() => {
            this.onerror && this.onerror(new Error('Failed to load'));
          }, 100);
        }
      };

      const img = document.querySelector('img[data-src="test-image.jpg"]');
      let errorEventFired = false;
      
      img.addEventListener('lazyLoadError', (e) => {
        errorEventFired = true;
        expect(e.detail.originalSrc).toBe('test-image.jpg');
        expect(e.detail.img).toBe(img);
      });
      
      await lazyLoader.loadImage(img);
      expect(errorEventFired).toBe(true);
    });
  });

  describe('Fallback Behavior', () => {
    it('should load all images when IntersectionObserver is not supported', () => {
      // Temporarily remove IntersectionObserver
      const originalIO = window.IntersectionObserver;
      delete window.IntersectionObserver;
      
      const loadAllImagesSpy = vi.spyOn(LazyImageLoader.prototype, 'loadAllImages');
      new LazyImageLoader();
      
      expect(loadAllImagesSpy).toHaveBeenCalled();
      
      // Restore IntersectionObserver
      window.IntersectionObserver = originalIO;
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed image loads', async () => {
      let attemptCount = 0;
      global.Image = class {
        constructor() {
          attemptCount++;
          setTimeout(() => {
            if (attemptCount < 2) {
              this.onerror && this.onerror(new Error('Failed to load'));
            } else {
              this.onload && this.onload();
            }
          }, 100);
        }
      };

      const img = document.querySelector('img[data-src="test-image.jpg"]');
      await lazyLoader.loadImage(img);
      
      expect(attemptCount).toBeGreaterThan(1);
      expect(img.classList.contains('lazy-loaded')).toBe(true);
    });
  });
});