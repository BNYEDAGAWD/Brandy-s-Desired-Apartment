// Main Application Logic
class ApartmentFinderApp {
    constructor() {
        this.apartments = [];
        this.filteredApartments = [];
        this.bookmarkedApartments = JSON.parse(localStorage.getItem('bookmarkedApartments') || '[]');
        this.isSearching = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadBookmarks();
        console.log('Apartment Finder App initialized');
    }

    bindEvents() {
        // Search button
        const searchBtn = document.getElementById('searchBtn');
        searchBtn.addEventListener('click', () => this.startSearch());

        // Filter controls
        const sortBy = document.getElementById('sortBy');
        sortBy.addEventListener('change', () => this.applyFilters());

        const minScore = document.getElementById('minScore');
        minScore.addEventListener('input', (e) => {
            document.getElementById('minScoreValue').textContent = e.target.value;
            this.applyFilters();
        });

        // Filter checkboxes
        ['recentOnly', 'renovatedOnly', 'premiumOnly'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.applyFilters());
        });

        // Filter panel toggle
        const toggleFilters = document.getElementById('toggleFilters');
        const filterContent = document.querySelector('.filter-content');
        toggleFilters.addEventListener('click', () => {
            const isExpanded = filterContent.style.display !== 'none';
            filterContent.style.display = isExpanded ? 'none' : 'block';
            toggleFilters.innerHTML = isExpanded ? 
                '<i class="fas fa-chevron-down"></i>' : 
                '<i class="fas fa-chevron-up"></i>';
        });

        // Modal controls
        const modal = document.getElementById('apartmentModal');
        const closeModal = document.getElementById('closeModal');
        
        closeModal.addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        exportBtn.addEventListener('click', () => this.exportResults());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                this.closeModal();
            }
            if (e.key === 'Enter' && e.ctrlKey && !this.isSearching) {
                this.startSearch();
            }
        });
    }

    async startSearch() {
        if (this.isSearching) return;
        
        this.isSearching = true;
        this.showLoadingState();
        
        try {
            // Initialize search engine
            const searchEngine = new ApartmentSearchEngine();
            
            // Start search with progress updates
            const apartments = await searchEngine.searchApartments((progress) => {
                this.updateProgress(progress);
            });
            
            this.apartments = apartments;
            this.applyFilters();
            this.showResults();
            
        } catch (error) {
            console.error('Search failed:', error);
            this.showToast('Search failed. Please try again.', 'error');
        } finally {
            this.isSearching = false;
            this.hideLoadingState();
        }
    }

    showLoadingState() {
        const searchBtn = document.getElementById('searchBtn');
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        searchBtn.style.display = 'none';
        loadingIndicator.style.display = 'block';
        
        // Hide results section
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('filterPanel').style.display = 'none';
    }

    hideLoadingState() {
        const searchBtn = document.getElementById('searchBtn');
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        searchBtn.style.display = 'inline-block';
        loadingIndicator.style.display = 'none';
    }

    updateProgress(progress) {
        const steps = ['step1', 'step2', 'step3', 'step4'];
        const currentStep = Math.min(Math.floor(progress / 25), 3);
        
        steps.forEach((stepId, index) => {
            const element = document.getElementById(stepId);
            if (index < currentStep) {
                element.className = 'step completed';
            } else if (index === currentStep) {
                element.className = 'step active';
            } else {
                element.className = 'step';
            }
        });
    }

    applyFilters() {
        if (!this.apartments.length) return;

        let filtered = [...this.apartments];
        
        // Apply score filter
        const minScore = parseInt(document.getElementById('minScore').value);
        filtered = filtered.filter(apt => apt.score >= minScore);
        
        // Apply checkbox filters
        if (document.getElementById('recentOnly').checked) {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(apt => new Date(apt.datePosted) > weekAgo);
        }
        
        if (document.getElementById('renovatedOnly').checked) {
            filtered = filtered.filter(apt => apt.recentlyRenovated);
        }
        
        if (document.getElementById('premiumOnly').checked) {
            filtered = filtered.filter(apt => apt.premiumAmenities);
        }
        
        // Apply sorting
        const sortBy = document.getElementById('sortBy').value;
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'score': return b.score - a.score;
                case 'price-low': return a.price - b.price;
                case 'price-high': return b.price - a.price;
                case 'newest': return new Date(b.datePosted) - new Date(a.datePosted);
                default: return b.score - a.score;
            }
        });
        
        this.filteredApartments = filtered;
        this.renderResults();
    }

    showResults() {
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('filterPanel').style.display = 'block';
        
        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    renderResults() {
        const resultsGrid = document.getElementById('resultsGrid');
        const recentResults = document.getElementById('recentResults');
        const recentListings = document.getElementById('recentListings');
        const noResults = document.getElementById('noResults');
        const resultsCount = document.getElementById('resultsCount');
        
        // Update results count
        resultsCount.textContent = `${this.filteredApartments.length} apartments found`;
        
        if (this.filteredApartments.length === 0) {
            resultsGrid.innerHTML = '';
            recentResults.innerHTML = '';
            recentListings.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }
        
        noResults.style.display = 'none';
        
        // Separate recent listings (past week)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentApartments = this.filteredApartments.filter(apt => 
            new Date(apt.datePosted) > weekAgo
        );
        const allApartments = this.filteredApartments;
        
        // Render recent listings
        if (recentApartments.length > 0) {
            recentListings.style.display = 'block';
            recentResults.innerHTML = recentApartments
                .slice(0, 6)
                .map(apt => this.createApartmentCard(apt, true))
                .join('');
        } else {
            recentListings.style.display = 'none';
        }
        
        // Render all results
        resultsGrid.innerHTML = allApartments
            .map(apt => this.createApartmentCard(apt))
            .join('');
        
        // Add click events to apartment cards
        document.querySelectorAll('.apartment-card').forEach(card => {
            card.addEventListener('click', () => {
                const apartmentId = card.dataset.apartmentId;
                const apartment = this.apartments.find(apt => apt.id === apartmentId);
                this.showApartmentDetails(apartment);
            });
        });
    }

    createApartmentCard(apartment, isRecent = false) {
        const scoreClass = apartment.score >= 80 ? 'high' : 
                          apartment.score >= 60 ? 'medium' : 'low';
        
        const features = apartment.features.slice(0, 3).map(feature => 
            `<span class="feature-tag ${apartment.highlightFeatures?.includes(feature) ? 'highlight' : ''}">${feature}</span>`
        ).join('');
        
        const bookmarked = this.bookmarkedApartments.includes(apartment.id);
        
        return `
            <div class="apartment-card fade-in" data-apartment-id="${apartment.id}">
                <div class="card-image">
                    ${apartment.images && apartment.images.length > 0 ? 
                        `<img src="${apartment.images[0]}" alt="${apartment.title}" onerror="this.style.display='none'">` :
                        '<i class="fas fa-image">No Image Available</i>'
                    }
                    <div class="score-badge ${scoreClass}">${apartment.score}</div>
                    ${bookmarked ? '<div class="bookmark-indicator"><i class="fas fa-bookmark"></i></div>' : ''}
                </div>
                <div class="card-content">
                    <h3 class="card-title">${apartment.title}</h3>
                    <p class="card-address">
                        <i class="fas fa-map-marker-alt"></i>
                        ${apartment.address}
                    </p>
                    
                    <div class="card-details">
                        <div class="detail-item">
                            <i class="fas fa-bed"></i>
                            ${apartment.bedrooms} bed
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-bath"></i>
                            ${apartment.bathrooms} bath
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-ruler-combined"></i>
                            ${apartment.sqft || 'N/A'} sq ft
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-building"></i>
                            Floor ${apartment.floor || 'N/A'}
                        </div>
                    </div>
                    
                    <div class="card-features">
                        ${features}
                        ${apartment.features.length > 3 ? 
                            `<span class="feature-tag">+${apartment.features.length - 3} more</span>` : 
                            ''
                        }
                    </div>
                    
                    <div class="card-price">$${apartment.price.toLocaleString()}/month</div>
                </div>
            </div>
        `;
    }

    showApartmentDetails(apartment) {
        const modal = document.getElementById('apartmentModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        
        modalTitle.textContent = apartment.title;
        
        const scoreClass = apartment.score >= 80 ? 'high' : 
                          apartment.score >= 60 ? 'medium' : 'low';
        
        const imageGallery = apartment.images && apartment.images.length > 0 ? 
            `<div class="image-gallery">
                ${apartment.images.map(img => `<img src="${img}" alt="Apartment image" style="width: 100%; margin-bottom: 1rem; border-radius: 8px;">`).join('')}
            </div>` : 
            '<div class="no-image">No images available</div>';
        
        modalBody.innerHTML = `
            ${imageGallery}
            
            <div class="apartment-details">
                <div class="detail-header">
                    <div class="score-display">
                        <span class="score-badge ${scoreClass}">${apartment.score}</span>
                        <span class="score-label">Match Score</span>
                    </div>
                    <div class="price-display">
                        <span class="price">$${apartment.price.toLocaleString()}</span>
                        <span class="price-label">per month</span>
                    </div>
                </div>
                
                <div class="address-section">
                    <h4><i class="fas fa-map-marker-alt"></i> Address</h4>
                    <p>${apartment.address}</p>
                    <p><strong>Zip Code:</strong> ${apartment.zipCode}</p>
                </div>
                
                <div class="specs-section">
                    <h4><i class="fas fa-info-circle"></i> Specifications</h4>
                    <div class="specs-grid">
                        <div class="spec-item">
                            <i class="fas fa-bed"></i>
                            <span>${apartment.bedrooms} Bedrooms</span>
                        </div>
                        <div class="spec-item">
                            <i class="fas fa-bath"></i>
                            <span>${apartment.bathrooms} Bathrooms</span>
                        </div>
                        <div class="spec-item">
                            <i class="fas fa-ruler-combined"></i>
                            <span>${apartment.sqft || 'N/A'} sq ft</span>
                        </div>
                        <div class="spec-item">
                            <i class="fas fa-building"></i>
                            <span>Floor ${apartment.floor || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="amenities-section">
                    <h4><i class="fas fa-star"></i> Amenities & Features</h4>
                    <div class="amenities-grid">
                        ${apartment.features.map(feature => 
                            `<div class="amenity-item ${apartment.highlightFeatures?.includes(feature) ? 'highlight' : ''}">
                                <i class="fas fa-check"></i>
                                ${feature}
                            </div>`
                        ).join('')}
                    </div>
                </div>
                
                ${apartment.description ? `
                    <div class="description-section">
                        <h4><i class="fas fa-file-text"></i> Description</h4>
                        <p>${apartment.description}</p>
                    </div>
                ` : ''}
                
                <div class="contact-section">
                    <h4><i class="fas fa-phone"></i> Contact Information</h4>
                    <p><strong>Phone:</strong> ${apartment.contact?.phone || 'Not available'}</p>
                    <p><strong>Email:</strong> ${apartment.contact?.email || 'Not available'}</p>
                    <p><strong>Source:</strong> ${apartment.source}</p>
                    <p><strong>Posted:</strong> ${new Date(apartment.datePosted).toLocaleDateString()}</p>
                </div>
            </div>
        `;
        
        // Update bookmark button
        const isBookmarked = this.bookmarkedApartments.includes(apartment.id);
        bookmarkBtn.innerHTML = isBookmarked ? 
            '<i class="fas fa-bookmark"></i> Bookmarked' : 
            '<i class="far fa-bookmark"></i> Bookmark';
        
        bookmarkBtn.onclick = () => this.toggleBookmark(apartment.id);
        
        // Show modal
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }

    closeModal() {
        const modal = document.getElementById('apartmentModal');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }

    toggleBookmark(apartmentId) {
        const index = this.bookmarkedApartments.indexOf(apartmentId);
        if (index > -1) {
            this.bookmarkedApartments.splice(index, 1);
            this.showToast('Bookmark removed', 'warning');
        } else {
            this.bookmarkedApartments.push(apartmentId);
            this.showToast('Apartment bookmarked!', 'success');
        }
        
        localStorage.setItem('bookmarkedApartments', JSON.stringify(this.bookmarkedApartments));
        this.renderResults(); // Re-render to update bookmark indicators
        
        // Update bookmark button in modal
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        const isBookmarked = this.bookmarkedApartments.includes(apartmentId);
        bookmarkBtn.innerHTML = isBookmarked ? 
            '<i class="fas fa-bookmark"></i> Bookmarked' : 
            '<i class="far fa-bookmark"></i> Bookmark';
    }

    loadBookmarks() {
        console.log(`Loaded ${this.bookmarkedApartments.length} bookmarked apartments`);
    }

    exportResults() {
        if (this.filteredApartments.length === 0) {
            this.showToast('No results to export', 'warning');
            return;
        }
        
        const exportData = this.filteredApartments.map(apt => ({
            title: apt.title,
            address: apt.address,
            price: apt.price,
            bedrooms: apt.bedrooms,
            bathrooms: apt.bathrooms,
            sqft: apt.sqft,
            score: apt.score,
            features: apt.features.join(', '),
            contact: apt.contact?.phone || '',
            source: apt.source,
            datePosted: apt.datePosted
        }));
        
        const csv = this.convertToCSV(exportData);
        this.downloadCSV(csv, 'apartment-search-results.csv');
        this.showToast('Results exported successfully!', 'success');
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

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                                 type === 'error' ? 'exclamation-circle' : 
                                 'exclamation-triangle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 4000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ApartmentFinderApp();
});