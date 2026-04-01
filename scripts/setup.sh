#!/usr/bin/env bash

# Installation script for DOAMS (Daily Outlet Account Management System)
# This script sets up all necessary dependencies and configuration

set -e

echo "🚀 Setting up Daily Outlet Account Management System..."

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "   Node version: $NODE_VERSION"

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Create environment file from example
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from example..."
    cp .env.example .env.local
    echo "   ⚠️  Please update .env.local with your credentials:"
    echo "      - DATABASE_URL (from Neon)"
    echo "      - CLERK API Keys"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Neon and Clerk credentials"
echo "2. Run 'npm run db:push' to create database schema"
echo "3. Run 'npm run db:seed' to populate initial outlets"
echo "4. Run 'npm run dev' to start development server"
echo ""
echo "📚 Documentation: See README.md for detailed setup instructions"
