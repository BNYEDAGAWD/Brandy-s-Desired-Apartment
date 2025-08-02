/**
 * Lazy Loading utility for property images with Intersection Observer
 * Optimizes performance by loading images only when they enter the viewport
 */
export class LazyImageLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: '50px',
            threshold: 0.1,
            placeholderSrc: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmNWY1ZjUiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlZWVlZWUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNHB4IiBmaWxsPSIjOTk5OTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==',
            errorSrc: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNHB4IiBmaWxsPSIjOTk5OTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5JbWFnZSBVbmF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=',
            fadeInDuration: 300,
            retryAttempts: 2,
            retryDelay: 1000,
            ...options
        };

        this.observer = null;
        this.loadedImages = new Set();
        this.failedImages = new Set();
        this.retryCount = new Map();
        
        this.init();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            this.loadAllImages();
            return;
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                }
            });
        }, {
            rootMargin: this.options.rootMargin,
            threshold: this.options.threshold
        });

        this.observeImages();
    }

    observeImages() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            if (!this.loadedImages.has(img)) {
                this.setupImageForLazyLoading(img);
                this.observer.observe(img);
            }
        });
    }

    setupImageForLazyLoading(img) {
        // Set placeholder if no src is set
        if (!img.src || img.src === '') {
            img.src = this.options.placeholderSrc;
        }

        // Add loading class
        img.classList.add('lazy-loading');
        
        // Add loading indicator
        this.addLoadingIndicator(img);

        // Set initial opacity for fade effect
        img.style.opacity = '0';
        img.style.transition = `opacity ${this.options.fadeInDuration}ms ease-in-out`;
    }

    addLoadingIndicator(img) {
        const container = img.parentElement;
        if (!container.classList.contains('image-container')) {
            // Wrap img in container if not already wrapped
            const wrapper = document.createElement('div');
            wrapper.className = 'image-container';
            img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(img);
        }

        // Add loading indicator
        if (!container.querySelector('.loading-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'loading-indicator';
            indicator.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
            `;
            container.appendChild(indicator);
        }
    }

    async loadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src || this.loadedImages.has(img)) {
            return;
        }

        try {
            // Stop observing this image
            if (this.observer) {
                this.observer.unobserve(img);
            }

            // Pre-load the image
            await this.preloadImage(src);

            // Set the actual source
            img.src = src;
            img.removeAttribute('data-src');

            // Add loaded class and fade in
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
            
            // Fade in effect
            img.style.opacity = '1';

            // Remove loading indicator
            this.removeLoadingIndicator(img);

            // Mark as loaded
            this.loadedImages.add(img);

            // Trigger custom event
            img.dispatchEvent(new CustomEvent('lazyLoaded', {
                detail: { src, img }
            }));

        } catch (error) {
            console.warn('Failed to load image:', src, error);
            await this.handleImageError(img, src);
        }
    }

    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            
            // Set a timeout for the image load
            setTimeout(() => {
                reject(new Error(`Image load timeout: ${src}`));
            }, 10000);
            
            img.src = src;
        });
    }

    async handleImageError(img, originalSrc) {
        const retryKey = originalSrc;
        const currentRetries = this.retryCount.get(retryKey) || 0;

        if (currentRetries < this.options.retryAttempts) {
            // Retry loading
            this.retryCount.set(retryKey, currentRetries + 1);
            
            await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
            
            try {
                await this.preloadImage(originalSrc);
                img.src = originalSrc;
                img.removeAttribute('data-src');
                img.classList.remove('lazy-loading');
                img.classList.add('lazy-loaded');
                img.style.opacity = '1';
                this.removeLoadingIndicator(img);
                this.loadedImages.add(img);
                return;
            } catch (retryError) {
                console.warn(`Retry ${currentRetries + 1} failed for image:`, originalSrc);
            }
        }

        // Final fallback
        img.src = this.options.errorSrc;
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-error');
        img.style.opacity = '1';
        this.removeLoadingIndicator(img);
        this.failedImages.add(img);

        // Trigger error event
        img.dispatchEvent(new CustomEvent('lazyLoadError', {
            detail: { originalSrc, img }
        }));
    }

    removeLoadingIndicator(img) {
        const container = img.parentElement;
        const indicator = container.querySelector('.loading-indicator');
        if (indicator) {
            indicator.classList.add('fade-out');
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 200);
        }
    }

    // Fallback for browsers without Intersection Observer
    loadAllImages() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            this.setupImageForLazyLoading(img);
            this.loadImage(img);
        });
    }

    // Refresh observer for dynamically added images
    refresh() {
        if (this.observer) {
            this.observeImages();
        }
    }

    // Add new images to be lazy loaded
    observe(images) {
        if (!this.observer) return;

        const imgArray = Array.isArray(images) ? images : [images];
        imgArray.forEach(img => {
            if (img.tagName === 'IMG' && img.hasAttribute('data-src')) {
                this.setupImageForLazyLoading(img);
                this.observer.observe(img);
            }
        });
    }

    // Manually load specific images
    loadImagesInContainer(container) {
        const images = container.querySelectorAll('img[data-src]');
        images.forEach(img => this.loadImage(img));
    }

    // Get loading statistics
    getStats() {
        return {
            loaded: this.loadedImages.size,
            failed: this.failedImages.size,
            pending: document.querySelectorAll('img[data-src]').length
        };
    }

    // Destroy the lazy loader
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.loadedImages.clear();
        this.failedImages.clear();
        this.retryCount.clear();
    }
}

// Create singleton instance
export const lazyLoader = new LazyImageLoader();

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            lazyLoader.refresh();
        });
    } else {
        lazyLoader.refresh();
    }
}