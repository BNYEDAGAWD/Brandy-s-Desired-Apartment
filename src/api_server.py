"""
FastAPI server for DeepSearchAgent Apartment Search
Provides REST API endpoints for the JavaScript frontend
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

from apartment_search_agent import ApartmentSearchAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="DeepSearchAgent Apartment Finder",
    description="AI-powered apartment search for West Los Angeles",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8080", 
        "https://bnyedagawd.github.io",
        "https://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global agent instance
search_agent: Optional[ApartmentSearchAgent] = None

# Pydantic models for API
class SearchRequest(BaseModel):
    zip_codes: Optional[List[str]] = Field(
        default=None,
        description="List of zip codes to search (defaults to config values)"
    )
    max_results: Optional[int] = Field(
        default=50,
        description="Maximum number of results to return"
    )
    filters: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional search filters"
    )

class SearchResponse(BaseModel):
    success: bool
    apartments: List[Dict[str, Any]]
    total_found: int
    search_metadata: Dict[str, Any]
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    agent_ready: bool
    version: str

# Background task storage
search_tasks = {}

@app.on_event("startup")
async def startup_event():
    """Initialize the search agent on startup"""
    global search_agent
    try:
        config_path = Path(__file__).parent.parent / "config.toml"
        search_agent = ApartmentSearchAgent(str(config_path))
        logger.info("✅ DeepSearchAgent initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize DeepSearchAgent: {e}")
        search_agent = None

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if search_agent else "unhealthy",
        timestamp=datetime.now().isoformat(),
        agent_ready=search_agent is not None,
        version="1.0.0"
    )

@app.post("/search", response_model=SearchResponse)
async def search_apartments(request: SearchRequest, background_tasks: BackgroundTasks):
    """
    Search for apartments using DeepSearchAgent
    Returns immediately with a task ID, search runs in background
    """
    if not search_agent:
        raise HTTPException(
            status_code=503,
            detail="Search agent not available. Check server logs."
        )
    
    try:
        logger.info(f"Starting apartment search with request: {request}")
        
        # Start search in background
        task_id = f"search_{datetime.now().timestamp()}"
        
        # For immediate response, we'll run a quick search
        # In production, this would be fully async with task tracking
        apartments = await search_agent.search_apartments(request.zip_codes)
        
        # Apply additional filters if provided
        if request.filters:
            apartments = apply_filters(apartments, request.filters)
        
        # Limit results
        if request.max_results:
            apartments = apartments[:request.max_results]
        
        return SearchResponse(
            success=True,
            apartments=apartments,
            total_found=len(apartments),
            search_metadata={
                "task_id": task_id,
                "search_timestamp": datetime.now().isoformat(),
                "zip_codes": request.zip_codes or search_agent.search_criteria.get("target_zip_codes"),
                "agent_type": "deepsearch_react"
            }
        )
        
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )

@app.get("/search/status/{task_id}")
async def get_search_status(task_id: str):
    """Get status of a background search task"""
    task = search_tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        "task_id": task_id,
        "status": task.get("status", "unknown"),
        "progress": task.get("progress", 0),
        "results": task.get("results", []),
        "error": task.get("error")
    }

@app.post("/verify-listing")
async def verify_listing(listing_url: str):
    """Verify a specific apartment listing URL"""
    if not search_agent:
        raise HTTPException(status_code=503, detail="Search agent not available")
    
    try:
        verification = search_agent.verify_listing_tool(listing_url)
        return verification
    except Exception as e:
        logger.error(f"Listing verification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/config")
async def get_search_config():
    """Get current search configuration"""
    if not search_agent:
        raise HTTPException(status_code=503, detail="Search agent not available")
    
    return {
        "search_criteria": search_agent.search_criteria,
        "target_zip_codes": search_agent.search_criteria.get("target_zip_codes"),
        "price_range": {
            "min": search_agent.search_criteria.get("min_rent"),
            "max": search_agent.search_criteria.get("max_rent")
        },
        "required_amenities": search_agent.search_criteria.get("required_amenities")
    }

def apply_filters(apartments: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Apply additional filters to apartment results"""
    filtered = apartments
    
    # Price filter
    if "min_price" in filters:
        filtered = [apt for apt in filtered if apt.get("price", 0) >= filters["min_price"]]
    
    if "max_price" in filters:
        filtered = [apt for apt in filtered if apt.get("price", float('inf')) <= filters["max_price"]]
    
    # Minimum score filter
    if "min_score" in filters:
        filtered = [
            apt for apt in filtered 
            if apt.get("validation", {}).get("percentage", 0) >= filters["min_score"]
        ]
    
    # Amenity filters
    if "required_amenities" in filters:
        for amenity in filters["required_amenities"]:
            filtered = [
                apt for apt in filtered 
                if amenity in apt.get("amenities", [])
            ]
    
    return filtered

# Background task for long-running searches
async def background_search_task(task_id: str, zip_codes: List[str], agent: ApartmentSearchAgent):
    """Background task for apartment search"""
    try:
        search_tasks[task_id] = {"status": "running", "progress": 0}
        
        # Update progress as search proceeds
        apartments = []
        total_zips = len(zip_codes)
        
        for i, zip_code in enumerate(zip_codes):
            search_tasks[task_id]["progress"] = int((i / total_zips) * 100)
            zip_apartments = await agent.search_apartments([zip_code])
            apartments.extend(zip_apartments)
        
        search_tasks[task_id] = {
            "status": "completed",
            "progress": 100,
            "results": apartments,
            "completed_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        search_tasks[task_id] = {
            "status": "failed",
            "error": str(e),
            "failed_at": datetime.now().isoformat()
        }

if __name__ == "__main__":
    # Get configuration from environment
    host = os.getenv("FASTAPI_HOST", "localhost")
    port = int(os.getenv("FASTAPI_PORT", "8000"))
    
    logger.info(f"Starting DeepSearchAgent API server on {host}:{port}")
    
    uvicorn.run(
        "api_server:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )