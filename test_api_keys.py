#!/usr/bin/env python3
"""
API Key Test Script for DeepSearchAgent
Tests both Anthropic Claude and Serper API connectivity
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_serper_api():
    """Test Serper Google Search API"""
    print("🔍 Testing Serper API...")
    
    api_key = os.getenv("SERPER_API_KEY")
    if not api_key:
        print("❌ SERPER_API_KEY not found in environment")
        return False
    
    url = "https://google.serper.dev/search"
    payload = json.dumps({
        "q": "apartments for rent Mar Vista CA 90066 2 bedroom",
        "num": 5
    })
    headers = {
        'X-API-KEY': api_key,
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, headers=headers, data=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            results_count = len(data.get('organic', []))
            print(f"✅ Serper API working! Found {results_count} search results")
            
            # Show first result
            if data.get('organic'):
                first_result = data['organic'][0]
                print(f"   First result: {first_result.get('title', 'No title')}")
                print(f"   URL: {first_result.get('link', 'No link')}")
            
            return True
        else:
            print(f"❌ Serper API error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Serper API test failed: {e}")
        return False

def test_anthropic_api():
    """Test Anthropic Claude API"""
    print("\n🤖 Testing Anthropic Claude API...")
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not found in environment")
        return False
    
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }
    
    payload = {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 100,
        "messages": [
            {
                "role": "user",
                "content": "Hello! Just testing the API connection. Please respond with 'API test successful' and the current Claude model."
            }
        ]
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            content = data.get('content', [])
            if content:
                message = content[0].get('text', 'No response text')
                print(f"✅ Anthropic API working!")
                print(f"   Claude response: {message}")
                return True
            else:
                print("❌ Anthropic API returned empty response")
                return False
        else:
            print(f"❌ Anthropic API error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Anthropic API test failed: {e}")
        return False

def test_apartment_search_simulation():
    """Simulate a quick apartment search query"""
    print("\n🏠 Testing apartment search simulation...")
    
    # Test if we can combine both APIs for apartment search
    serper_key = os.getenv("SERPER_API_KEY")
    claude_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not serper_key or not claude_key:
        print("❌ Missing API keys for apartment search test")
        return False
    
    # Simulate search for West LA apartments
    search_query = "site:apartments.com Mar Vista CA 90066 2 bedroom apartment rent $4400-$5200"
    
    url = "https://google.serper.dev/search"
    payload = json.dumps({
        "q": search_query,
        "num": 3
    })
    headers = {
        'X-API-KEY': serper_key,
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, headers=headers, data=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            organic_results = data.get('organic', [])
            
            print(f"✅ Found {len(organic_results)} apartment search results")
            
            # Show apartment-related results
            apartment_count = 0
            for result in organic_results:
                title = result.get('title', '').lower()
                if any(keyword in title for keyword in ['apartment', 'rent', 'bedroom', '$']):
                    apartment_count += 1
                    print(f"   📍 {result.get('title', 'No title')}")
                    print(f"      {result.get('link', 'No link')}")
            
            if apartment_count > 0:
                print(f"✅ Apartment search simulation successful! Found {apartment_count} relevant listings")
                return True
            else:
                print("⚠️ Search worked but no apartment-specific results found")
                return True
        else:
            print(f"❌ Apartment search failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Apartment search test failed: {e}")
        return False

def main():
    """Run all API tests"""
    print("🚀 DeepSearchAgent API Key Test Suite")
    print("=" * 50)
    
    # Test individual APIs
    serper_ok = test_serper_api()
    claude_ok = test_anthropic_api()
    
    # Test combined apartment search
    search_ok = test_apartment_search_simulation()
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"   Serper API: {'✅ PASS' if serper_ok else '❌ FAIL'}")
    print(f"   Claude API: {'✅ PASS' if claude_ok else '❌ FAIL'}")
    print(f"   Apartment Search: {'✅ PASS' if search_ok else '❌ FAIL'}")
    
    all_tests_passed = serper_ok and claude_ok and search_ok
    
    if all_tests_passed:
        print("\n🎉 All tests passed! DeepSearchAgent is ready for apartment searches.")
        print("\nNext steps:")
        print("1. Start the backend: npm run backend:dev")
        print("2. Start the frontend: npm run dev")
        print("3. Visit http://localhost:3000 and test the search")
    else:
        print("\n⚠️ Some tests failed. Check API keys and network connection.")
        print("\nTroubleshooting:")
        if not serper_ok:
            print("- Verify SERPER_API_KEY in .env file")
            print("- Check Serper.dev account and quota")
        if not claude_ok:
            print("- Verify ANTHROPIC_API_KEY in .env file")
            print("- Check Anthropic Console account and billing")
    
    return all_tests_passed

if __name__ == "__main__":
    main()