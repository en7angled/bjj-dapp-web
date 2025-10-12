#!/bin/bash

# BJJ DApp Environment Setup Script
# This script helps you create the necessary .env files

echo "🚀 BJJ DApp Environment Setup"
echo "=============================="

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

echo
echo "📝 Creating .env file with default values..."

# Create .env file
cat > .env << 'EOF'
# =============================================================================
# BJJ DApp Environment Configuration
# =============================================================================

# Backend API URL (Runtime configuration - RECOMMENDED)
API_BASE_URL=https://bjjbackend.cardano.vip

# Legacy API URL (Build-time configuration - for compatibility)
NEXT_PUBLIC_API_URL=https://bjjbackend.cardano.vip

# API Authentication (Server-side only)
API_USER=cardano
API_PASS=lovelace

# Cardano Network Configuration
NEXT_PUBLIC_PROFILE_POLICY_ID=your_profile_policy_id_here
NEXT_PUBLIC_NETWORK_ID=1

# Development/Debug Configuration (optional)
# ENABLE_DEBUG=true
EOF

echo "✅ .env file created successfully!"
echo
echo "📋 Next steps:"
echo "1. Edit .env file and replace 'your_profile_policy_id_here' with your actual policy ID"
echo "2. If you need a different backend URL, change API_BASE_URL"
echo "3. Run: npm run dev (for development) or docker-compose up (for Docker)"
echo
echo "🧪 Test your configuration:"
echo "   source .env && curl -u \$API_USER:\$API_PASS \$API_BASE_URL/belts/count"
echo
echo "📖 For more details, see: ENV_SETUP.md"
