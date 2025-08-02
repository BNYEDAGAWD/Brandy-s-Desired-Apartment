"""
Apartment Search Agent using DeepSearchAgent
Specialized agent for finding West Los Angeles apartments with specific criteria
"""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import asyncio
import re
from urllib.parse import quote_plus, urljoin

# DeepSearchAgent imports
from smolagents import ReactJsonAgent, CodeAgent
from smolagents.tools import tool
from core.config.config_loader import ConfigLoader
from tools.search import WebSearchTool
from tools.readurl import ReadUrlTool
from tools.chunk import ChunkTool
from tools.embed import EmbedTool
from tools.rerank import RerankTool

logger = logging.getLogger(__name__)


class ApartmentSearchAgent:
    """
    Specialized agent for apartment searches in West Los Angeles
    Uses DeepSearchAgent's ReAct framework to find verified apartment listings
    """
    
    def __init__(self, config_path: str = "config.toml"):
        self.config = ConfigLoader(config_path)
        self.search_tool = WebSearchTool()
        self.readurl_tool = ReadUrlTool()
        self.chunk_tool = ChunkTool()
        self.embed_tool = EmbedTool()
        self.rerank_tool = RerankTool()
        
        # Initialize React agent with apartment-specific tools
        self.agent = ReactJsonAgent(
            tools=[
                self.apartment_search_tool,
                self.verify_listing_tool,
                self.extract_apartment_details_tool,
                self.validate_apartment_criteria_tool
            ],
            model=self.config.get("agents.common.model", "claude-3-5-sonnet-20241022"),
            max_iterations=self.config.get("agents.common.max_iterations", 15),
            temperature=self.config.get("agents.react.temperature", 0.1)
        )
        
        # Apartment search criteria from config
        self.search_criteria = self.config.get("apartment_search", {})
        
    @tool
    def apartment_search_tool(self, zip_code: str, criteria: Dict[str, Any]) -> List[Dict]:
        """
        Search for apartments in a specific zip code using multiple real estate sources
        
        Args:
            zip_code: Target zip code (90066, 90230, 90232, 90034)
            criteria: Search criteria (price, bedrooms, amenities)
            
        Returns:
            List of apartment listings with verified URLs
        """
        logger.info(f"Searching apartments in zip code: {zip_code}")
        
        # Construct comprehensive search queries for different platforms
        queries = self._generate_search_queries(zip_code, criteria)
        all_listings = []
        
        for platform, query in queries.items():
            try:
                logger.info(f"Searching {platform}: {query}")
                
                # Use DeepSearchAgent's web search
                search_results = self.search_tool.search(
                    query=query,
                    max_results=self.config.get("search_engines.serper.max_results", 10)
                )
                
                # Process search results for apartment listings
                platform_listings = self._extract_apartment_listings(
                    search_results, platform, zip_code
                )
                
                all_listings.extend(platform_listings)
                
                # Rate limiting
                asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Search failed for {platform}: {e}")
                continue
        
        return self._deduplicate_listings(all_listings)
    
    @tool
    def verify_listing_tool(self, listing_url: str) -> Dict[str, Any]:
        """
        Verify apartment listing URL and extract detailed information
        
        Args:
            listing_url: URL of the apartment listing
            
        Returns:
            Verification status and extracted details
        """
        try:
            logger.info(f"Verifying listing: {listing_url}")
            
            # Read URL content using DeepSearchAgent
            content = self.readurl_tool.read_url(listing_url)
            
            if not content:
                return {
                    "verified": False,
                    "error": "Could not access listing URL",
                    "url": listing_url
                }
            
            # Extract apartment details from content
            apartment_details = self._parse_apartment_content(content, listing_url)
            
            return {
                "verified": True,
                "url": listing_url,
                "details": apartment_details,
                "content_length": len(content),
                "verified_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"URL verification failed for {listing_url}: {e}")
            return {
                "verified": False,
                "error": str(e),
                "url": listing_url
            }
    
    @tool
    def extract_apartment_details_tool(self, content: str, source_url: str) -> Dict[str, Any]:
        """
        Extract structured apartment data from listing content
        
        Args:
            content: HTML/text content from listing page
            source_url: Original URL for context
            
        Returns:
            Structured apartment details
        """
        # Chunk content for processing
        chunks = self.chunk_tool.chunk_text(
            text=content,
            chunk_size=self.config.get("chunking.chunk_size", 1000),
            overlap=self.config.get("chunking.chunk_overlap", 200)
        )
        
        # Extract key details using pattern matching and AI
        details = {
            "price": self._extract_price(content),
            "bedrooms": self._extract_bedrooms(content),
            "bathrooms": self._extract_bathrooms(content),
            "sqft": self._extract_sqft(content),
            "address": self._extract_address(content),
            "amenities": self._extract_amenities(content),
            "contact": self._extract_contact_info(content),
            "availability": self._extract_availability(content),
            "description": self._extract_description(content),
            "images": self._extract_image_urls(content, source_url),
            "source_url": source_url,
            "extracted_at": datetime.now().isoformat()
        }
        
        return details
    
    @tool
    def validate_apartment_criteria_tool(self, apartment: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate apartment against Brandy's specific criteria
        
        Args:
            apartment: Apartment details dictionary
            
        Returns:
            Validation results with score and reasoning
        """
        criteria = self.search_criteria
        score = 0
        max_score = 100
        validation_details = {}
        
        # Price validation (25 points)
        price = apartment.get("price", 0)
        if criteria.get("min_rent", 0) <= price <= criteria.get("max_rent", float('inf')):
            score += 25
            validation_details["price"] = "✅ Within budget range"
        else:
            validation_details["price"] = f"❌ Outside budget: ${price}"
        
        # Bedroom validation (20 points)
        bedrooms = apartment.get("bedrooms", 0)
        if bedrooms == criteria.get("bedrooms", 2):
            score += 20
            validation_details["bedrooms"] = "✅ Correct bedroom count"
        else:
            validation_details["bedrooms"] = f"❌ Wrong bedrooms: {bedrooms}"
        
        # Bathroom validation (15 points)
        bathrooms = apartment.get("bathrooms", 0)
        min_bath = criteria.get("min_bathrooms", 1.5)
        max_bath = criteria.get("max_bathrooms", 2.0)
        if min_bath <= bathrooms <= max_bath:
            score += 15
            validation_details["bathrooms"] = "✅ Bathroom count acceptable"
        else:
            validation_details["bathrooms"] = f"❌ Wrong bathrooms: {bathrooms}"
        
        # Required amenities validation (40 points)
        amenities = apartment.get("amenities", [])
        required = criteria.get("required_amenities", [])
        
        amenity_scores = {}
        for req_amenity in required:
            if self._has_amenity(amenities, req_amenity):
                score += 10
                amenity_scores[req_amenity] = "✅ Found"
            else:
                amenity_scores[req_amenity] = "❌ Missing"
        
        validation_details["amenities"] = amenity_scores
        
        return {
            "score": score,
            "max_score": max_score,
            "percentage": round((score / max_score) * 100, 1),
            "validation_details": validation_details,
            "passes_criteria": score >= 80,  # 80% threshold
            "validated_at": datetime.now().isoformat()
        }
    
    def _generate_search_queries(self, zip_code: str, criteria: Dict[str, Any]) -> Dict[str, str]:
        """Generate platform-specific search queries for West LA apartments"""
        base_params = {
            "bedrooms": criteria.get("bedrooms", 2),
            "min_price": criteria.get("min_rent", 4400),
            "max_price": criteria.get("max_rent", 5200),
            "zip_code": zip_code
        }
        
        # Map zip codes to area names for better search targeting
        area_names = {
            "90066": "Mar Vista",
            "90230": "Culver City", 
            "90232": "Culver City",
            "90034": "Palms"
        }
        area_name = area_names.get(zip_code, "West Los Angeles")
        
        queries = {}
        
        # Enhanced Apartments.com query - focus on specific listings
        queries["apartments_com"] = (
            f"site:apartments.com \"{area_name}\" OR \"{zip_code}\" "
            f"{base_params['bedrooms']} bedroom apartment rent "
            f"${base_params['min_price']} ${base_params['max_price']} "
            f"\"washer dryer\" \"air conditioning\" balcony available"
        )
        
        # Enhanced Zillow query - target rental listings
        queries["zillow"] = (
            f"site:zillow.com \"{area_name}\" OR \"{zip_code}\" "
            f"rental {base_params['bedrooms']}bd {base_params['bedrooms']} bedroom "
            f"rent ${base_params['min_price']} ${base_params['max_price']} "
            f"\"for rent\" apartment"
        )
        
        # Enhanced Trulia query - specific unit searches
        queries["trulia"] = (
            f"site:trulia.com \"{area_name}\" OR \"{zip_code}\" "
            f"{base_params['bedrooms']} bedroom apartment rent "
            f"${base_params['min_price']} ${base_params['max_price']} "
            f"\"for rent\" \"available now\""
        )
        
        # Enhanced HotPads query - map-based listings
        queries["hotpads"] = (
            f"site:hotpads.com \"{area_name}\" OR \"{zip_code}\" "
            f"{base_params['bedrooms']} bed apartment rent "
            f"${base_params['min_price']} ${base_params['max_price']} "
            f"\"for rent\" available"
        )
        
        # Enhanced Westside Rentals query - local specialist
        queries["westside_rentals"] = (
            f"site:westsiderentals.com \"{area_name}\" OR \"{zip_code}\" "
            f"{base_params['bedrooms']} bedroom luxury apartment "
            f"${base_params['min_price']} ${base_params['max_price']} "
            f"\"west los angeles\" \"westside\""
        )
        
        # Add Realtor.com for comprehensive coverage
        queries["realtor_com"] = (
            f"site:realtor.com \"{area_name}\" OR \"{zip_code}\" "
            f"{base_params['bedrooms']} bedroom apartment rental "
            f"${base_params['min_price']} ${base_params['max_price']} "
            f"\"for rent\""
        )
        
        # Add RentCafe for luxury apartments
        queries["rentcafe"] = (
            f"site:rentcafe.com \"{area_name}\" OR \"{zip_code}\" "
            f"{base_params['bedrooms']} bedroom luxury apartment "
            f"${base_params['min_price']} ${base_params['max_price']}"
        )
        
        return queries
    
    def _extract_apartment_listings(self, search_results: List[Dict], platform: str, zip_code: str) -> List[Dict]:
        """Extract apartment listings from search results"""
        listings = []
        
        for result in search_results:
            # Basic filtering for apartment-related content
            title = result.get("title", "").lower()
            snippet = result.get("snippet", "").lower()
            url = result.get("url", "")
            
            # Check if result looks like an apartment listing
            if self._is_apartment_listing(title, snippet, url):
                listing = {
                    "title": result.get("title", ""),
                    "url": url,
                    "snippet": result.get("snippet", ""),
                    "platform": platform,
                    "zip_code": zip_code,
                    "found_at": datetime.now().isoformat()
                }
                listings.append(listing)
        
        return listings
    
    def _is_apartment_listing(self, title: str, snippet: str, url: str) -> bool:
        """Enhanced detection of actual apartment listings vs search pages"""
        apartment_indicators = [
            "bedroom", "bath", "apartment", "rent", "$", "sq ft", "sqft",
            "available", "lease", "studio", "1br", "2br", "3br", "unit",
            "floor plan", "amenities", "contact", "tour", "apply"
        ]
        
        # Specific patterns that indicate actual listings
        listing_patterns = [
            r'\$\d{3,5}(?:/month|/mo)?', # Price with month indicator
            r'\d+\s*(?:bed|br|bedroom).*\d+\s*(?:bath|ba)', # Bed/bath combo
            r'\d+\s*sq\s*ft', # Square footage
            r'available\s+(?:now|immediately|\d+/\d+)', # Availability dates
            r'(?:call|contact|phone).*\d{3}.*\d{3}.*\d{4}', # Phone numbers
            r'(?:schedule|book|virtual).*(?:tour|showing|visit)' # Tour scheduling
        ]
        
        # URL patterns that suggest actual listings
        unit_url_patterns = [
            r'/apartment.*\d+', # apartment with numbers
            r'/unit.*\d+', # unit with numbers  
            r'/listing.*\d+', # listing with ID
            r'/property.*\d+', # property with ID
            r'/rent.*\d+.*bedroom', # rent with bedroom info
            r'apartments\.com/.*-ca-\d{5}/.*\d+', # apartments.com specific
            r'zillow\.com/.*rental.*\d+', # zillow rental specific
            r'trulia\.com/.*rent.*\d+' # trulia rent specific
        ]
        
        content = f"{title} {snippet}".lower()
        url_lower = url.lower()
        
        # Check for apartment indicators
        indicator_count = sum(1 for indicator in apartment_indicators if indicator in content)
        
        # Check for listing patterns
        pattern_matches = sum(1 for pattern in listing_patterns if re.search(pattern, content))
        
        # Check for unit-specific URL patterns
        url_matches = sum(1 for pattern in unit_url_patterns if re.search(pattern, url_lower))
        
        # Exclude search/browse pages
        search_excludes = [
            "search", "browse", "filter", "results", "find", "directory",
            "sitemap", "category", "all-apartments", "listings-page"
        ]
        
        is_search_page = any(exclude in url_lower for exclude in search_excludes)
        
        # Enhanced scoring for actual listings
        listing_score = indicator_count + (pattern_matches * 2) + (url_matches * 3)
        
        # Must have strong indicators and not be a search page
        return listing_score >= 4 and not is_search_page
    
    def _parse_apartment_content(self, content: str, url: str) -> Dict[str, Any]:
        """Parse apartment details from listing content"""
        # This would use more sophisticated parsing in a real implementation
        # For now, we'll use pattern matching and basic extraction
        
        details = {}
        
        # Extract price using regex
        price_match = re.search(r'\$(\d{1,3}(?:,\d{3})*)', content)
        if price_match:
            details["price"] = int(price_match.group(1).replace(',', ''))
        
        # Extract bedrooms
        bed_match = re.search(r'(\d+)\s*(?:bed|br|bedroom)', content, re.IGNORECASE)
        if bed_match:
            details["bedrooms"] = int(bed_match.group(1))
        
        # Extract bathrooms
        bath_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)', content, re.IGNORECASE)
        if bath_match:
            details["bathrooms"] = float(bath_match.group(1))
        
        # Extract square footage
        sqft_match = re.search(r'(\d{3,4})\s*(?:sq\s*ft|sqft)', content, re.IGNORECASE)
        if sqft_match:
            details["sqft"] = int(sqft_match.group(1))
        
        return details
    
    def _extract_price(self, content: str) -> Optional[int]:
        """Extract rent price from content"""
        # Multiple price patterns to catch different formats
        patterns = [
            r'\$(\d{1,3}(?:,\d{3})*)\s*(?:/month|/mo|per month)',
            r'\$(\d{1,3}(?:,\d{3})*)',
            r'(\d{1,3}(?:,\d{3})*)\s*(?:/month|/mo)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                price_str = match.group(1).replace(',', '')
                price = int(price_str)
                # Reasonable price range filter
                if 1000 <= price <= 15000:
                    return price
        
        return None
    
    def _extract_bedrooms(self, content: str) -> Optional[int]:
        """Extract bedroom count from content"""
        patterns = [
            r'(\d+)\s*(?:bed|br|bedroom)',
            r'(\d+)bd',
            r'(\d+)-bedroom'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                bedrooms = int(match.group(1))
                if 0 <= bedrooms <= 5:  # Reasonable range
                    return bedrooms
        
        return None
    
    def _extract_bathrooms(self, content: str) -> Optional[float]:
        """Extract bathroom count from content"""
        patterns = [
            r'(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)',
            r'(\d+(?:\.\d+)?)ba',
            r'(\d+(?:\.\d+)?)-bathroom'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                bathrooms = float(match.group(1))
                if 0.5 <= bathrooms <= 5:  # Reasonable range
                    return bathrooms
        
        return None
    
    def _extract_sqft(self, content: str) -> Optional[int]:
        """Extract square footage from content"""
        patterns = [
            r'(\d{3,4})\s*(?:sq\s*ft|sqft|square feet)',
            r'(\d{1,3}(?:,\d{3}))\s*(?:sq\s*ft|sqft)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                sqft_str = match.group(1).replace(',', '')
                sqft = int(sqft_str)
                if 300 <= sqft <= 5000:  # Reasonable range
                    return sqft
        
        return None
    
    def _extract_address(self, content: str) -> Optional[str]:
        """Extract address from content"""
        # Address patterns for Los Angeles area
        patterns = [
            r'(\d+\s+[A-Za-z\s]+(?:Ave|Blvd|St|Drive|Dr|Road|Rd|Place|Pl|Way|Circle|Cir)[^,]*,\s*[A-Za-z\s]+,\s*CA\s*\d{5})',
            r'(\d+\s+[A-Za-z\s]+(?:Avenue|Boulevard|Street|Drive|Road|Place|Way|Circle)[^,]*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None
    
    def _extract_amenities(self, content: str) -> List[str]:
        """Extract amenities from content"""
        amenity_keywords = {
            "washer_dryer": ["washer", "dryer", "w/d", "laundry"],
            "air_conditioning": ["air conditioning", "a/c", "ac", "central air"],
            "outdoor_space": ["balcony", "patio", "deck", "outdoor", "terrace"],
            "parking": ["parking", "garage", "carport"],
            "pool": ["pool", "swimming"],
            "gym": ["gym", "fitness", "exercise"],
            "dishwasher": ["dishwasher"],
            "hardwood": ["hardwood", "wood floor"],
            "granite": ["granite", "stone counter"],
            "stainless": ["stainless steel", "stainless appliance"]
        }
        
        found_amenities = []
        content_lower = content.lower()
        
        for amenity, keywords in amenity_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                found_amenities.append(amenity)
        
        return found_amenities
    
    def _extract_contact_info(self, content: str) -> Dict[str, str]:
        """Extract contact information from content"""
        contact = {}
        
        # Phone number patterns
        phone_patterns = [
            r'(\(\d{3}\)\s*\d{3}-\d{4})',
            r'(\d{3}-\d{3}-\d{4})',
            r'(\d{3}\.\d{3}\.\d{4})'
        ]
        
        for pattern in phone_patterns:
            match = re.search(pattern, content)
            if match:
                contact["phone"] = match.group(1)
                break
        
        # Email patterns
        email_pattern = r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'
        email_match = re.search(email_pattern, content)
        if email_match:
            contact["email"] = email_match.group(1)
        
        return contact
    
    def _extract_availability(self, content: str) -> Optional[str]:
        """Extract availability date from content"""
        patterns = [
            r'available\s+(\w+\s+\d{1,2},?\s+\d{4})',
            r'available\s+(\d{1,2}/\d{1,2}/\d{2,4})',
            r'available\s+(now|immediately)',
            r'move.in\s+(\w+\s+\d{1,2})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return None
    
    def _extract_description(self, content: str) -> Optional[str]:
        """Extract property description from content"""
        # Look for description patterns
        patterns = [
            r'description[:\s]+(.*?)(?:\n\n|\r\n\r\n)',
            r'about this property[:\s]+(.*?)(?:\n\n|\r\n\r\n)',
            r'property details[:\s]+(.*?)(?:\n\n|\r\n\r\n)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
            if match:
                desc = match.group(1).strip()
                if len(desc) > 50:  # Minimum description length
                    return desc[:500]  # Limit description length
        
        return None
    
    def _extract_image_urls(self, content: str, base_url: str) -> List[str]:
        """Extract image URLs from content"""
        image_patterns = [
            r'<img[^>]+src=["\']([^"\']+)["\']',
            r'background-image:\s*url\(["\']?([^"\')]+)["\']?\)',
            r'data-src=["\']([^"\']+)["\']'
        ]
        
        images = []
        for pattern in image_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                # Convert relative URLs to absolute
                if match.startswith('http'):
                    images.append(match)
                elif match.startswith('/'):
                    images.append(urljoin(base_url, match))
        
        # Remove duplicates and limit count
        return list(set(images))[:5]
    
    def _has_amenity(self, amenities: List[str], required_amenity: str) -> bool:
        """Check if apartment has required amenity"""
        amenity_mapping = {
            "washer_dryer": ["washer_dryer", "laundry"],
            "air_conditioning": ["air_conditioning", "ac", "central_air"],
            "outdoor_space": ["outdoor_space", "balcony", "patio", "deck"],
            "above_ground_floor": True  # This would be checked differently
        }
        
        if required_amenity == "above_ground_floor":
            # This would need floor information from the listing
            return True  # Assume true for now
        
        mapped_amenities = amenity_mapping.get(required_amenity, [required_amenity])
        return any(amenity in amenities for amenity in mapped_amenities)
    
    def _deduplicate_listings(self, listings: List[Dict]) -> List[Dict]:
        """Remove duplicate listings based on URL and address similarity"""
        seen_urls = set()
        unique_listings = []
        
        for listing in listings:
            url = listing.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_listings.append(listing)
        
        return unique_listings
    
    async def search_apartments(self, zip_codes: List[str] = None) -> List[Dict[str, Any]]:
        """
        Main method to search for apartments using DeepSearchAgent
        
        Args:
            zip_codes: List of zip codes to search (uses config default if None)
            
        Returns:
            List of verified apartment listings
        """
        if zip_codes is None:
            zip_codes = self.search_criteria.get("target_zip_codes", ["90066", "90230", "90232", "90034"])
        
        all_apartments = []
        
        for zip_code in zip_codes:
            try:
                logger.info(f"Starting search for zip code: {zip_code}")
                
                # Search for apartments in this zip code
                listings = self.apartment_search_tool(zip_code, self.search_criteria)
                
                # Verify and extract details for each listing
                for listing in listings:
                    verification = self.verify_listing_tool(listing["url"])
                    
                    if verification["verified"]:
                        # Extract detailed apartment information
                        details = verification["details"]
                        
                        # Validate against criteria
                        validation = self.validate_apartment_criteria_tool(details)
                        
                        # Only include apartments that meet minimum criteria
                        if validation["passes_criteria"]:
                            apartment = {
                                **listing,
                                **details,
                                "validation": validation,
                                "search_metadata": {
                                    "zip_code": zip_code,
                                    "search_timestamp": datetime.now().isoformat(),
                                    "agent_version": "deepsearch_v1.0"
                                }
                            }
                            all_apartments.append(apartment)
                            logger.info(f"✅ Added verified apartment: {details.get('address', 'Unknown address')}")
                        else:
                            logger.info(f"❌ Apartment failed criteria: {listing.get('title', 'Unknown')}")
                    else:
                        logger.warning(f"⚠️ Could not verify listing: {listing['url']}")
                
                # Rate limiting between zip codes
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Search failed for zip code {zip_code}: {e}")
                continue
        
        logger.info(f"Search complete. Found {len(all_apartments)} verified apartments.")
        return all_apartments