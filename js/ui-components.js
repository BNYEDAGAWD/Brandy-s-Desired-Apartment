export class UIComponents {
    constructor() {
        this.modal = null;
        this.toastContainer = null;
        this.init();
    }

    init() {
        this.modal = document.getElementById('apartmentModal');
        this.toastContainer = document.getElementById('toastContainer');
        this.bindGlobalEvents();
    }

    bindGlobalEvents() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC to close modal
            if (e.key === 'Escape' && this.modal && this.modal.classList.contains('show')) {
                this.closeModal();
            }
            
            // Ctrl+F to focus on search
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                const searchBtn = document.getElementById('searchBtn');
                if (searchBtn && searchBtn.style.display !== 'none') {
                    searchBtn.focus();
                }
            }
        });

        // Handle window resize for responsive adjustments
        window.addEventListener('resize', this.debounce(() => {
            this.adjustLayoutForViewport();
        }, 250));

        // Handle scroll for sticky elements
        window.addEventListener('scroll', this.throttle(() => {
            this.handleScroll();
        }, 100));
    }

    // Modal management
    showModal(content, title = 'Details') {
        if (!this.modal) return;

        const modalTitle = this.modal.querySelector('#modalTitle');
        const modalBody = this.modal.querySelector('#modalBody');

        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = content;

        this.modal.style.display = 'flex';
        setTimeout(() => {
            this.modal.classList.add('show');
            this.trapFocus(this.modal);
        }, 10);

        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        if (!this.modal) return;

        this.modal.classList.remove('show');
        setTimeout(() => {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    // Toast notifications with enhanced features
    showToast(message, type = 'info', duration = 4000, actions = null) {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const icon = iconMap[type] || iconMap.info;
        
        let actionsHTML = '';
        if (actions && actions.length > 0) {
            actionsHTML = `
                <div class="toast-actions">
                    ${actions.map(action => 
                        `<button class="toast-action" data-action="${action.id}">${action.label}</button>`
                    ).join('')}
                </div>
            `;
        }

        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="toast-message">
                    <span>${message}</span>
                    ${actionsHTML}
                </div>
                <button class="toast-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add event listeners
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));

        if (actions) {
            toast.querySelectorAll('.toast-action').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const actionId = e.target.dataset.action;
                    const action = actions.find(a => a.id === actionId);
                    if (action && action.callback) {
                        action.callback();
                    }
                    this.removeToast(toast);
                });
            });
        }

        this.toastContainer.appendChild(toast);
        
        // Trigger show animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }

        return toast;
    }

    removeToast(toast) {
        if (!toast || !toast.parentNode) return;

        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Loading states
    showLoadingSpinner(element, text = 'Loading...') {
        if (!element) return;

        const spinner = document.createElement('div');
        spinner.className = 'loading-overlay';
        spinner.innerHTML = `
            <div class="spinner-container">
                <div class="spinner"></div>
                <span class="loading-text">${text}</span>
            </div>
        `;

        element.style.position = 'relative';
        element.appendChild(spinner);

        return spinner;
    }

    hideLoadingSpinner(element) {
        if (!element) return;

        const spinner = element.querySelector('.loading-overlay');
        if (spinner) {
            spinner.remove();
        }
    }

    // Viewport and responsive utilities
    adjustLayoutForViewport() {
        const viewport = this.getViewportSize();
        
        // Adjust grid columns based on viewport
        const resultsGrid = document.querySelector('.results-grid');
        if (resultsGrid) {
            if (viewport.width < 768) {
                resultsGrid.style.gridTemplateColumns = '1fr';
            } else if (viewport.width < 1200) {
                resultsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            } else {
                resultsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
            }
        }

        // Adjust modal size on small screens
        if (this.modal) {
            const modalContent = this.modal.querySelector('.modal-content');
            if (modalContent) {
                if (viewport.width < 768) {
                    modalContent.style.margin = '1rem';
                    modalContent.style.maxHeight = 'calc(100vh - 2rem)';
                } else {
                    modalContent.style.margin = '2rem';
                    modalContent.style.maxHeight = '90vh';
                }
            }
        }
    }

    getViewportSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    // Scroll handling
    handleScroll() {
        const scrollY = window.scrollY;
        
        // Add shadow to header when scrolled
        const header = document.querySelector('.header');
        if (header) {
            if (scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        // Show/hide back to top button
        this.toggleBackToTop(scrollY > 300);
    }

    toggleBackToTop(show) {
        let backToTopBtn = document.getElementById('backToTop');
        
        if (show && !backToTopBtn) {
            backToTopBtn = document.createElement('button');
            backToTopBtn.id = 'backToTop';
            backToTopBtn.className = 'back-to-top';
            backToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            document.body.appendChild(backToTopBtn);
        }
        
        if (backToTopBtn) {
            backToTopBtn.style.display = show ? 'block' : 'none';
        }
    }

    // Focus management for accessibility
    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        if (firstFocusable) {
            firstFocusable.focus();
        }
        
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
    }

    // Animation utilities
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            element.style.opacity = Math.min(progress, 1);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    fadeOut(element, duration = 300) {
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            element.style.opacity = 1 - Math.min(progress, 1);
            
            if (progress >= 1) {
                element.style.display = 'none';
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    slideDown(element, duration = 300) {
        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.style.display = 'block';
        
        const targetHeight = element.scrollHeight;
        let start = null;
        
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            element.style.height = `${targetHeight * Math.min(progress, 1)}px`;
            
            if (progress >= 1) {
                element.style.height = '';
                element.style.overflow = '';
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    slideUp(element, duration = 300) {
        const startHeight = element.offsetHeight;
        let start = null;
        
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            element.style.height = `${startHeight * (1 - Math.min(progress, 1))}px`;
            element.style.overflow = 'hidden';
            
            if (progress >= 1) {
                element.style.display = 'none';
                element.style.height = '';
                element.style.overflow = '';
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Format utilities
    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }

    formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        return phone;
    }

    // Validation utilities
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    isValidPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length === 10;
    }

    // Local storage utilities
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return defaultValue;
        }
    }

    removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }
}

// Export for use in other modules
export const UI = new UIComponents();