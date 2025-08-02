# DeepSearchAgent Integration Setup Guide

This guide explains how to set up and run the apartment finder with real DeepSearchAgent integration for live apartment searches.

## 🏗️ Architecture Overview

The application now uses a hybrid architecture:
- **Frontend**: JavaScript (Vite) serving the minimalistic UI
- **Backend**: Python DeepSearchAgent API server for real apartment searches
- **Fallback**: Enhanced demo data when backend is unavailable

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ with pip
- Node.js 18+ with npm
- Git

### 1. Full Setup (Recommended)
```bash
# Clone and setup everything
git clone https://github.com/BNYEDAGAWD/Brandy-s-Desired-Apartment.git
cd Brandy-s-Desired-Apartment

# Install all dependencies and setup configuration
npm run fullstack:setup

# Configure your API keys (see Configuration section)
nano .env

# Run both frontend and backend
npm run fullstack:dev
```

### 2. Frontend Only (Demo Mode)
```bash
# Just run the frontend with demo data
npm install
npm run dev
```

## ⚙️ Configuration

### Required API Keys

Create `.env` file from template:
```bash
cp .env.example .env
```

Edit `.env` with your API keys:
```bash
# Required for real searches
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SERPER_API_KEY=your_serper_google_search_api_key_here

# Optional for enhanced features
WOLFRAM_ALPHA_APPID=your_wolfram_alpha_app_id_here
```

### Configuration File

Copy and customize the configuration:
```bash
cp config.template.toml config.toml
```

Key settings in `config.toml`:
```toml
[agents.common]
model = "claude-3-5-sonnet-20241022"
max_iterations = 15

[apartment_search]
target_zip_codes = ["90066", "90230", "90232", "90034"]  # West LA
min_rent = 4400
max_rent = 5200
bedrooms = 2
required_amenities = ["washer_dryer", "air_conditioning", "outdoor_space"]
```

## 🔑 Getting API Keys

### Anthropic API Key
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Create account and add billing
3. Generate API key in API Keys section
4. Add to `.env` as `ANTHROPIC_API_KEY`

### Serper Google Search API
1. Visit [serper.dev](https://serper.dev)
2. Sign up for free account (2,500 free searches)
3. Get API key from dashboard
4. Add to `.env` as `SERPER_API_KEY`

## 🏃‍♂️ Running the Application

### Development Mode (Both Services)
```bash
npm run fullstack:dev
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Frontend Only
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Uses demo data fallback

### Backend Only
```bash
npm run backend:dev
```
- Backend API: http://localhost:8000

## 🔍 How It Works

### Real Search Mode (Backend Available)
1. User clicks "Search Apartments"
2. Frontend calls DeepSearchAgent API
3. DeepSearchAgent performs intelligent web searches:
   - Searches apartments.com, zillow.com, trulia.com, etc.
   - Uses AI to identify actual apartment listings
   - Extracts detailed apartment information
   - Validates listings against Brandy's criteria
4. Returns verified, scored apartments
5. Frontend displays results with real URLs

### Demo Mode (Backend Unavailable)
1. User clicks "Search Apartments"
2. Frontend generates realistic demo data
3. Simulates the search process with progress indicators
4. Shows apartments with demo URLs for testing UI

## 🛠️ Backend API Endpoints

### Health Check
```bash
GET /health
```
Returns backend status and agent readiness.

### Search Apartments
```bash
POST /search
Content-Type: application/json

{
  "zip_codes": ["90066", "90230"],
  "max_results": 50,
  "filters": {
    "min_price": 4400,
    "max_price": 5200,
    "min_score": 70
  }
}
```

### Verify Listing
```bash
POST /verify-listing
Content-Type: application/json

{
  "listing_url": "https://www.apartments.com/..."
}
```

### Get Configuration
```bash
GET /config
```
Returns current search criteria and settings.

## 🧪 Testing

### Test Backend Connection
```bash
curl http://localhost:8000/health
```

### Test Search API
```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"zip_codes": ["90066"]}'
```

### Frontend Tests
```bash
npm run test
```

## 🚀 Deployment

### Frontend (GitHub Pages)
```bash
npm run deploy
```

### Backend (Production)
The backend requires a Python hosting service like:
- Railway
- Render
- DigitalOcean App Platform
- AWS Lambda

Example Railway deployment:
1. Connect GitHub repository
2. Set environment variables (API keys)
3. Use start command: `python src/api_server.py`

## 🔧 Troubleshooting

### Backend Not Starting
- Check Python version: `python --version` (need 3.8+)
- Install dependencies: `pip install -r requirements.txt`
- Check API keys in `.env` file

### No Search Results
- Verify SERPER_API_KEY is correct
- Check API quota (serper.dev dashboard)
- Check logs: backend terminal output

### Frontend Connection Issues
- Ensure backend is running on port 8000
- Check browser console for CORS errors
- Verify `CORS_ORIGINS` in `.env` includes frontend URL

### Demo Mode Always Active
- Check backend health: `curl localhost:8000/health`
- Verify API keys are set correctly
- Check backend logs for errors

## 📊 Search Quality

The DeepSearchAgent provides:
- **Real URLs**: Direct links to actual apartment listings
- **Verified Information**: AI-extracted apartment details
- **Scoring**: Apartments ranked by fit to Brandy's criteria
- **Source Attribution**: Clear source identification
- **Link Health**: URL validation and backup options

## 🔄 Fallback Behavior

When DeepSearchAgent is unavailable:
1. System automatically falls back to demo mode
2. User sees realistic but simulated apartment data
3. Demo apartments have placeholder URLs
4. Clear indication in console: "📋 Falling back to demo data mode..."

## 📝 Development Notes

### Adding New Search Sources
1. Add source to `_generate_search_queries()` in `apartment_search_agent.py`
2. Update URL patterns in `_is_apartment_listing()`
3. Test with new source URLs

### Customizing Search Criteria
1. Edit `config.toml` apartment_search section
2. Modify validation logic in `validate_apartment_criteria_tool()`
3. Update frontend criteria in `real-search-engine.js`

### Debugging Searches
1. Enable debug logging in backend
2. Check browser console for frontend logs
3. Use `/verify-listing` endpoint to test specific URLs

## 🎯 Production Checklist

- [ ] API keys configured and valid
- [ ] Backend deployed and accessible
- [ ] Frontend environment variables updated
- [ ] CORS origins configured correctly
- [ ] Rate limiting and error handling tested
- [ ] Monitoring and alerts configured

## 📞 Support

For issues with:
- **Frontend**: Check browser console and network tab
- **Backend**: Check server logs and API responses  
- **Search Quality**: Review query patterns and validation logic
- **Performance**: Monitor API quotas and response times