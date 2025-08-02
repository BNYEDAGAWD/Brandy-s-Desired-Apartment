#\!/bin/bash

# GitHub Pages Deployment Commands for Brandy's Desired Apartment

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Streamlined codebase for GitHub Pages deployment

- Removed 30+ unused dependencies and test files  
- Consolidated CSS into single optimized file
- Simplified build configuration
- Cleaned up redundant Python and JS files
- Optimized for apartment search functionality only

🚀 Generated with Claude Code
https://claude.ai/code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to main branch
git push origin main

# Deploy to GitHub Pages
npm run deploy
