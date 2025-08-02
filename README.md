# Brandy's Desired Apartment Finder

A streamlined West Los Angeles apartment search application with real-time data aggregation.

## Features

- **Automated Multi-Platform Search**: Searches across Apartments.com, Zillow, Trulia, and more
- **LA DMA Optimization**: Geo-targeted for Los Angeles market with priority zip codes  
- **Real-Time Results**: Live data from apartment listing sources
- **Smart Filtering**: Advanced scoring system for apartment matching

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

## Backend (Optional)

For live search functionality, run the DeepSearch backend:

```bash
# Install Python dependencies
npm run backend:install

# Start backend server
npm run backend:start
```
