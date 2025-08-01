// Claude API Integration for Enhanced Search Logic
class ClaudeIntegration {
    constructor() {
        this.apiKey = null; // Will be set by user in settings
        this.baseURL = 'https://api.anthropic.com/v1/messages';
        this.model = 'claude-3-sonnet-20240229';
        this.maxTokens = 1000;
        
        this.init();
    }

    init() {
        // Check for stored API key
        this.apiKey = localStorage.getItem('claude_api_key');
        
        // Create settings panel if API key is not set
        if (!this.apiKey) {
            this.showAPIKeySetup();
        }
    }

    showAPIKeySetup() {
        const existingSetup = document.getElementById('apiKeySetup');
        if (existingSetup) return;

        const setupPanel = document.createElement('div');
        setupPanel.id = 'apiKeySetup';
        setupPanel.className = 'api-key-setup';
        setupPanel.innerHTML = `
            <div class="setup-content">
                <h3><i class="fas fa-key"></i> API Configuration</h3>
                <p>To enable Claude AI enhanced search features, please enter your Anthropic API key:</p>
                <div class="input-group">
                    <input type="password" id="apiKeyInput" placeholder="sk-ant-api..." />
                    <button id="saveApiKey" class="btn-primary">Save</button>
                </div>
                <div class="setup-info">
                    <p><small>
                        <i class="fas fa-info-circle"></i>
                        Your API key is stored locally and never shared. 
                        <a href="https://console.anthropic.com/" target="_blank">Get your API key here</a>
                    </small></p>
                </div>
                <button id="skipApiKey" class="btn-secondary">Skip (Use Mock Data)</button>
            </div>
        `;

        document.body.appendChild(setupPanel);

        // Bind events
        document.getElementById('saveApiKey').addEventListener('click', () => {
            const apiKey = document.getElementById('apiKeyInput').value.trim();
            if (apiKey) {
                this.setAPIKey(apiKey);
                setupPanel.remove();
            }
        });

        document.getElementById('skipApiKey').addEventListener('click', () => {
            setupPanel.remove();
        });

        document.getElementById('apiKeyInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('saveApiKey').click();
            }
        });
    }

    setAPIKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('claude_api_key', apiKey);
        console.log('Claude API key configured');
    }

    async enhanceApartmentDescriptions(apartments) {
        if (!this.apiKey || apartments.length === 0) {
            return apartments; // Return as-is if no API key or no apartments
        }

        try {
            const prompt = this.buildDescriptionEnhancementPrompt(apartments);
            const response = await this.callClaudeAPI(prompt);
            
            if (response && response.enhanced_descriptions) {
                return this.applyEnhancedDescriptions(apartments, response.enhanced_descriptions);
            }
        } catch (error) {
            console.error('Error enhancing descriptions:', error);
        }

        return apartments;
    }

    async generateSearchInsights(apartments) {
        if (!this.apiKey || apartments.length === 0) {
            return null;
        }

        try {
            const prompt = this.buildInsightsPrompt(apartments);
            const response = await this.callClaudeAPI(prompt);
            
            return response;
        } catch (error) {
            console.error('Error generating insights:', error);
            return null;
        }
    }

    buildDescriptionEnhancementPrompt(apartments) {
        const apartmentSummaries = apartments.slice(0, 10).map((apt, index) => ({
            id: index,
            title: apt.title,
            address: apt.address,
            price: apt.price,
            features: apt.features.slice(0, 6),
            score: apt.score
        }));

        return `
You are a real estate expert helping to enhance apartment descriptions for a luxury apartment search in West Los Angeles. 

Here are ${apartmentSummaries.length} apartments that match the search criteria:

${JSON.stringify(apartmentSummaries, null, 2)}

Please provide enhanced descriptions for these apartments that:
1. Highlight the most appealing features
2. Use professional real estate language
3. Emphasize luxury and comfort aspects
4. Keep descriptions concise (2-3 sentences)
5. Focus on what makes each apartment unique

Respond in JSON format:
{
  "enhanced_descriptions": [
    {
      "id": 0,
      "enhanced_description": "Enhanced description here..."
    }
  ]
}
        `;
    }

    buildInsightsPrompt(apartments) {
        const topApartments = apartments.slice(0, 5);
        const avgPrice = apartments.reduce((sum, apt) => sum + apt.price, 0) / apartments.length;
        const scoreDistribution = {
            high: apartments.filter(apt => apt.score >= 80).length,
            medium: apartments.filter(apt => apt.score >= 60 && apt.score < 80).length,
            low: apartments.filter(apt => apt.score < 60).length
        };

        return `
You are a real estate market analyst. Analyze this apartment search data for West Los Angeles and provide insights.

Search Results Summary:
- Total apartments found: ${apartments.length}
- Average price: $${Math.round(avgPrice)}
- Score distribution: ${scoreDistribution.high} high-scoring, ${scoreDistribution.medium} medium-scoring, ${scoreDistribution.low} low-scoring

Top 5 apartments:
${JSON.stringify(topApartments.map(apt => ({
    title: apt.title,
    address: apt.address,
    price: apt.price,
    score: apt.score,
    zipCode: apt.zipCode
})), null, 2)}

Please provide:
1. Market insights about pricing trends
2. Best value recommendations
3. Areas to focus on for better options
4. Red flags to watch for
5. Negotiation opportunities

Respond in JSON format with actionable insights.
        `;
    }

    async callClaudeAPI(prompt) {
        if (!this.apiKey) {
            throw new Error('API key not configured');
        }

        const response = await fetch(this.baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: this.maxTokens,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        try {
            return JSON.parse(data.content[0].text);
        } catch (parseError) {
            console.error('Error parsing Claude response:', parseError);
            return { error: 'Failed to parse response' };
        }
    }

    applyEnhancedDescriptions(apartments, enhancedDescriptions) {
        const enhancedMap = new Map();
        enhancedDescriptions.forEach(item => {
            enhancedMap.set(item.id, item.enhanced_description);
        });

        return apartments.map((apartment, index) => {
            if (index < 10 && enhancedMap.has(index)) {
                return {
                    ...apartment,
                    description: enhancedMap.get(index),
                    enhanced: true
                };
            }
            return apartment;
        });
    }

    // Smart filtering using Claude AI
    async intelligentFilter(apartments, userQuery) {
        if (!this.apiKey || !userQuery.trim()) {
            return apartments;
        }

        try {
            const prompt = `
You are helping filter apartment listings based on user preferences. 

User query: "${userQuery}"

Available apartments (showing first 20):
${JSON.stringify(apartments.slice(0, 20).map(apt => ({
    id: apt.id,
    title: apt.title,
    address: apt.address,
    price: apt.price,
    features: apt.features,
    score: apt.score
})), null, 2)}

Based on the user query, rank these apartments and explain why each is relevant or not relevant.
Focus on matching user intent, not just keywords.

Respond in JSON format:
{
  "filtered_apartments": [
    {
      "id": "apartment_id",
      "relevance_score": 85,
      "reason": "Why this apartment matches the query"
    }
  ]
}
            `;

            const response = await this.callClaudeAPI(prompt);
            
            if (response && response.filtered_apartments) {
                return this.applyIntelligentFiltering(apartments, response.filtered_apartments);
            }
        } catch (error) {
            console.error('Error in intelligent filtering:', error);
        }

        return apartments;
    }

    applyIntelligentFiltering(apartments, filteredResults) {
        const relevanceMap = new Map();
        filteredResults.forEach(result => {
            relevanceMap.set(result.id, {
                relevance: result.relevance_score,
                reason: result.reason
            });
        });

        return apartments
            .map(apartment => {
                const relevanceData = relevanceMap.get(apartment.id);
                if (relevanceData) {
                    return {
                        ...apartment,
                        aiRelevance: relevanceData.relevance,
                        aiReason: relevanceData.reason
                    };
                }
                return apartment;
            })
            .filter(apartment => apartment.aiRelevance !== undefined)
            .sort((a, b) => (b.aiRelevance || 0) - (a.aiRelevance || 0));
    }

    // Generate personalized recommendations
    async generateRecommendations(apartments, userPreferences = {}) {
        if (!this.apiKey) {
            return this.generateMockRecommendations(apartments);
        }

        try {
            const prompt = `
As a real estate expert, provide personalized apartment recommendations based on user preferences and available listings.

User Preferences:
${JSON.stringify(userPreferences, null, 2)}

Available Apartments (top 10 by score):
${JSON.stringify(apartments.slice(0, 10).map(apt => ({
    title: apt.title,
    address: apt.address,
    price: apt.price,
    features: apt.features,
    score: apt.score,
    zipCode: apt.zipCode
})), null, 2)}

Provide:
1. Top 3 recommendations with detailed reasoning
2. Alternative options to consider
3. What to negotiate on
4. Potential concerns to investigate

Respond in JSON format with actionable recommendations.
            `;

            const response = await this.callClaudeAPI(prompt);
            return response;
        } catch (error) {
            console.error('Error generating recommendations:', error);
            return this.generateMockRecommendations(apartments);
        }
    }

    generateMockRecommendations(apartments) {
        const topApartments = apartments.slice(0, 3);
        
        return {
            recommendations: topApartments.map((apt, index) => ({
                apartment_id: apt.id,
                ranking: index + 1,
                reason: `High score of ${apt.score} with excellent ${apt.features.slice(0, 2).join(' and ')}`,
                strengths: apt.features.slice(0, 3),
                concerns: ['Verify parking availability', 'Check actual condition']
            })),
            market_insights: {
                avg_price: Math.round(apartments.reduce((sum, apt) => sum + apt.price, 0) / apartments.length),
                best_value: apartments.find(apt => apt.score > 70 && apt.price < 4700)?.id || null,
                negotiation_tip: 'Focus on move-in incentives rather than base rent'
            }
        };
    }

    // Utility method to check API status
    async testAPIConnection() {
        if (!this.apiKey) {
            return { success: false, error: 'No API key configured' };
        }

        try {
            const response = await this.callClaudeAPI('Test connection. Respond with: {"status": "connected"}');
            return { success: true, response };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Create global instance
const claudeAI = new ClaudeIntegration();