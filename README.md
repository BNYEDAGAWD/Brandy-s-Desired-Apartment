# 🏠 Brandy's Desired Apartment Finder

A sophisticated web application for finding luxury rental apartments in West Los Angeles powered by **DeepSearchAgent** - an intelligent AI system that performs real apartment searches and delivers verified, high-quality listings.

[![Deploy to GitHub Pages](https://github.com/BNYEDAGAWD/Brandy-s-Desired-Apartment/actions/workflows/deploy.yml/badge.svg)](https://github.com/BNYEDAGAWD/Brandy-s-Desired-Apartment/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://bnyedagawd.github.io/Brandy-s-Desired-Apartment/)

## 🎯 Project Overview

This application helps find rental apartments in West Los Angeles that match specific luxury criteria, with automated search functionality across multiple platforms and an intelligent scoring system powered by Claude AI.

### 🎪 Live Demo
**[Visit the Live Application](https://bnyedagawd.github.io/Brandy-s-Desired-Apartment/)**

## ✨ Key Features

### 🔍 **One-Click Search System**
- **Automated Multi-Platform Search**: Search across Apartments.com, Westside Rentals, Zillow, and more
- **Real-Time Progress Updates**: Visual progress indicators during search operations
- **Smart Data Aggregation**: Combines results from multiple sources with duplicate removal

### 🎯 **Intelligent Scoring Algorithm**
- **Weighted Scoring System**: 100-point scale based on specific criteria
- **Mandatory Requirements**: Filters for 2-bed, 1.5-2 bath, above ground floor, A/C, W/D, outdoor space
- **Quality Preferences**: Prioritizes recent renovations, natural light, modern amenities
- **Location Priority**: Ranks by zip code preference (Mar Vista > Culver City > Palms)

### 🤖 **DeepSearchAgent Integration**
- **Real Web Searches**: Live searches across apartments.com, zillow.com, trulia.com, and more
- **AI-Powered Extraction**: Intelligent parsing of apartment details from listing pages
- **Verified URLs**: All listings link to actual apartment pages, not search results
- **Smart Validation**: AI validates apartments against Brandy's specific criteria
- **Fallback Mode**: Enhanced demo data when real search backend is unavailable

### 📱 **Responsive Design**
- **Mobile-First**: Optimized for all device sizes
- **Progressive Enhancement**: Works without JavaScript as a fallback
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation
- **Fast Loading**: Optimized for performance on all networks

## 🏗️ Technical Architecture

### Hybrid Architecture
- **Frontend**: JavaScript (Vite) with minimalistic emerald/sapphire UI
- **Backend**: Python DeepSearchAgent for real apartment searches
- **Integration**: RESTful API communication with intelligent fallback

### Technology Stack
- **Frontend**: Pure JavaScript ES6+, CSS Grid & Flexbox, Web APIs
- **Backend**: Python, FastAPI, DeepSearchAgent (ReAct framework)
- **AI**: Anthropic Claude, Serper Google Search API
- **Deployment**: GitHub Pages (frontend), Railway/Render (backend)

### Search Criteria
```javascript
{
  rentRange: "$4,400 - $5,200/month",
  bedrooms: 2,
  bathrooms: "1.5 - 2.0",
  requiredAmenities: [
    "In-unit washer/dryer",
    "Air conditioning", 
    "Outdoor space (balcony/patio/terrace)",
    "Above ground floor"
  ],
  preferredFeatures: [
    "Recently renovated (within 10 years)",
    "Modern/contemporary interior",
    "Ample natural light"
  ],
  targetZipCodes: {
    "90066": "Mar Vista (Priority 1)",
    "90230": "Central Culver City (Priority 2)", 
    "90232": "Southeast Culver City (Priority 3)",
    "90034": "Palms (Priority 4)"
  }
}
```

### Scoring System
The application uses a sophisticated 100-point scoring algorithm:

| Category | Weight | Description |
|----------|--------|-------------|
| **Rent Range** | 20 points | Within $4,400-$5,200 budget |
| **Mandatory Amenities** | 30 points | All required features present |
| **Renovation Status** | 25 points | Recent updates/modern finishes |
| **Natural Light** | 15 points | Bright, well-lit spaces |
| **Outdoor Space Quality** | 10 points | Balcony/patio/terrace type |
| **Zip Code Priority** | 10 points | Location preference ranking |
| **Bonus Features** | Up to 15 points | Premium amenities, photos, floor level |

## 🚀 Getting Started

### Quick Start
1. **Visit the Live App**: [https://bnyedagawd.github.io/Brandy-s-Desired-Apartment/](https://bnyedagawd.github.io/Brandy-s-Desired-Apartment/)
2. **Click "Start Apartment Search"**: Initiates the automated search process
3. **Review Results**: Browse sorted, scored apartment listings
4. **Apply Filters**: Refine results using the filter panel
5. **View Details**: Click any apartment card for full information

### Full Setup (Real Search)
```bash
# Clone and setup everything
git clone https://github.com/BNYEDAGAWD/Brandy-s-Desired-Apartment.git
cd Brandy-s-Desired-Apartment

# Install all dependencies and setup configuration
npm run fullstack:setup

# Configure API keys (see DEEPSEARCH_SETUP.md)
cp .env.example .env
nano .env

# Run both frontend and backend
npm run fullstack:dev
```

### Frontend Only (Demo Mode)
```bash
# Just run the frontend with demo data
npm install
npm run dev
```

### DeepSearchAgent Setup
1. **Get API Keys**: [Anthropic](https://console.anthropic.com/) + [Serper](https://serper.dev)
2. **Configure Backend**: See [DEEPSEARCH_SETUP.md](DEEPSEARCH_SETUP.md) for detailed instructions
3. **Real Search Mode**: Backend provides live apartment searches with verified URLs

## 📁 Project Structure

```
brandy-apartment-finder/
├── index.html                 # Main application page
├── css/
│   ├── styles.css            # Core styling
│   └── responsive.css        # Mobile-responsive design
├── js/
│   ├── app.js               # Main application logic
│   ├── search-engine.js     # Multi-platform search system
│   ├── scoring.js           # Intelligent ranking algorithm  
│   └── ui-components.js     # UI utilities and components
├── api/
│   └── claude-integration.js # AI-powered enhancements
├── assets/
│   ├── images/              # Application images
│   └── icons/               # UI icons
├── .github/
│   ├── workflows/
│   │   └── deploy.yml       # GitHub Pages deployment
│   └── lighthouse/
│       └── lighthouse.json  # Performance configuration
├── package.json             # Project configuration
└── README.md               # This file
```

## 🎨 User Interface

### Search Interface
- **Criteria Display**: Visual representation of search parameters
- **One-Click Trigger**: Prominent search button with progress indicators
- **Loading States**: Real-time progress through zip codes and data sources

### Results Dashboard
- **Apartment Cards**: Score badges, key details, and feature highlights
- **Recent Listings**: Separate section for new postings (past week)
- **Sorting Options**: Best match, price, newest listings
- **Filter Panel**: Dynamic filtering by score, features, and recency

### Detailed View
- **Image Gallery**: Multiple apartment photos
- **Score Breakdown**: Detailed explanation of ranking factors
- **Contact Information**: Direct listing source details
- **Bookmark System**: Save interesting apartments locally

## 🔧 Configuration

### Search Parameters
Modify `js/search-engine.js` to adjust:
- Rent range limits
- Required amenities
- Zip code priorities
- Data source preferences

### Scoring Weights
Adjust scoring in `js/scoring.js`:
```javascript
this.weights = {
  rentInRange: 20,
  mandatoryAmenities: 30,
  renovationRecency: 25,
  naturalLight: 15,
  // ... other weights
};
```

### UI Customization
Update CSS variables in `css/styles.css`:
```css
:root {
  --primary-color: #2c3e50;
  --secondary-color: #3498db;
  --accent-color: #e74c3c;
  /* ... other variables */
}
```

## 🚀 Deployment

### Automatic Deployment
- **GitHub Actions**: Automatically deploys to GitHub Pages on push to main
- **Performance Testing**: Runs Lighthouse audits on each deployment
- **Asset Optimization**: Compresses and optimizes resources

### Manual Deployment
```bash
# Build and deploy to GitHub Pages
npm run deploy

# Or deploy to custom hosting
# Upload all files to your web server
```

## 📊 Performance & Analytics

### Lighthouse Scores
- **Performance**: Target 80+ (optimized images, minimal JS)
- **Accessibility**: Target 90+ (ARIA labels, keyboard navigation) 
- **Best Practices**: Target 80+ (HTTPS, security headers)
- **SEO**: Target 80+ (meta tags, structured data)

### Browser Support
- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile Devices**: iOS Safari 13+, Chrome Mobile 80+
- **Fallback**: Graceful degradation for older browsers

## 🔒 Privacy & Security

### Data Handling
- **No Personal Data Storage**: Only search preferences stored locally
- **API Key Security**: Claude API keys stored in browser localStorage only
- **External Requests**: HTTPS-only connections to apartment listing APIs
- **Rate Limiting**: Respectful API usage with delays between requests

### Legal Compliance
- **Terms of Service**: Respects all data source terms and conditions
- **Rate Limiting**: Implements delays to prevent overwhelming servers
- **Data Attribution**: Proper crediting of listing sources

## 🤝 Contributing

### Development Workflow
1. **Fork Repository**: Create your own copy
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Changes**: `git commit -m 'Add amazing feature'`
4. **Push to Branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**: Submit for review

### Code Standards
- **ES6+ JavaScript**: Modern syntax and features
- **CSS Methodology**: BEM naming convention
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: <3s load time, <100ms interaction response

## 📝 API Documentation

### Search Engine API
```javascript
const searchEngine = new ApartmentSearchEngine();
const apartments = await searchEngine.searchApartments(progressCallback);
```

### Scoring System API
```javascript
const scorer = new ApartmentScorer();
const score = scorer.calculateScore(apartment, searchCriteria);
const explanation = scorer.getScoreExplanation(apartment);
```

### Claude Integration API
```javascript
const claudeAI = new ClaudeIntegration();
const enhanced = await claudeAI.enhanceApartmentDescriptions(apartments);
const insights = await claudeAI.generateSearchInsights(apartments);
```

## 🐛 Troubleshooting

### Common Issues

**Search Not Working**
- Check browser console for JavaScript errors
- Verify internet connection for external API calls
- Try refreshing the page to reset application state

**No Results Found**
- Criteria may be too restrictive - adjust filters
- Mock data generation may have created fewer apartments
- Check if specific zip codes are returning results

**Claude AI Features Not Working**
- Ensure API key is properly configured
- Check browser console for API errors
- Verify API key has proper permissions and credits

**Performance Issues**
- Check network speed for large image loading
- Clear browser cache and localStorage
- Disable Claude AI features if experiencing slowdowns

## 📈 Future Enhancements

### Planned Features
- **Real-Time Notifications**: Email alerts for new matching listings
- **Advanced Filtering**: Machine learning-based preference learning
- **Virtual Tours**: 360° photo integration
- **Commute Calculator**: Travel time to work/key locations
- **Price History**: Tracking rent changes over time
- **Neighborhood Insights**: Crime data, school ratings, amenities

### Technical Improvements
- **Service Worker**: Offline capability and caching
- **PWA Features**: Install prompt, push notifications
- **Database Integration**: User accounts and saved searches
- **API Optimization**: Caching and request optimization
- **Testing Suite**: Automated unit and integration tests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Apartment Listing Sources**: Apartments.com, Westside Rentals, Zillow, and others
- **Anthropic Claude AI**: For intelligent search enhancements
- **Font Awesome**: For comprehensive icon library
- **GitHub Pages**: For free, reliable hosting
- **Open Source Community**: For tools and inspiration

## 📞 Support

### Getting Help
- **GitHub Issues**: [Report bugs or request features](https://github.com/BNYEDAGAWD/Brandy-s-Desired-Apartment/issues)
- **Documentation**: Check this README for detailed information
- **Code Examples**: Review source code for implementation details

### Contact Information
- **Repository**: [GitHub Repository](https://github.com/BNYEDAGAWD/Brandy-s-Desired-Apartment)
- **Live Application**: [https://bnyedagawd.github.io/Brandy-s-Desired-Apartment/](https://bnyedagawd.github.io/Brandy-s-Desired-Apartment/)

---

**Built with ❤️ for finding the perfect West LA apartment**