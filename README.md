# Brandy's Desired Apartment Finder

A sophisticated West Los Angeles apartment search application featuring advanced verification and intelligent link processing.

## 🚀 Advanced Features

- **Intelligent Multi-Platform Search**: Automated search across Apartments.com, Zillow, Trulia, HotPads, Westside Rentals, and more
- **Advanced Link Verification**: Sophisticated verification engine with address correlation, property matching, and provider authentication
- **Smart Restriction Handling**: Adaptive processing that handles CORS, CSP, and rate limiting transparently
- **LA DMA Optimization**: Geo-targeted for Los Angeles market with priority zip codes
- **Silent Operation**: Advanced verification runs in background with no user-facing technical messages
- **Intelligent Fallbacks**: Comprehensive alternative options when primary links are restricted

## Target Criteria

- **Budget**: $4,400 - $5,200/month
- **Bedrooms**: 2 
- **Bathrooms**: 1.5 - 2.0
- **Required Amenities**: In-unit W/D, A/C, outdoor space, above ground floor
- **Priority Areas**: Mar Vista (90066), Culver City (90230/90232), Palms (90034)

## Deployment

Live at: https://bnyedagawd.github.io/Brandy-s-Desired-Apartment/

## Development

```bash
# Install dependencies
npm install

# Run development server  
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Advanced Backend (Optional)

For live search functionality with DeepSearch AI agent:

```bash
# Install Python dependencies
npm run backend:install

# Start DeepSearch backend server
npm run backend:start

# Run full-stack development
npm run fullstack
```

## 🧠 Technical Architecture

- **Frontend**: Vite + JavaScript with advanced verification engine
- **Backend**: Python FastAPI with DeepSearch AI agent
- **Verification**: Multi-factor link correlation and validation
- **Processing**: Adaptive scraping with browser restriction handling
- **Deployment**: GitHub Pages with automated CI/CD

## 🎯 Advanced Verification System

The application includes a sophisticated verification engine that:

- **Address Correlation**: Matches listing addresses with destination URLs
- **Property Verification**: Correlates price, bedrooms, bathrooms, and amenities
- **Provider Authentication**: Validates URL structures and domain authenticity  
- **Visual Verification**: Image fingerprinting when browser permissions allow
- **Confidence Scoring**: Weighted algorithms for intelligent link optimization
- **Restriction Handling**: Silent adaptation to CORS, CSP, and rate limiting

All verification operates silently in the background, ensuring seamless user experience while maximizing link accuracy and reliability.
