#!/usr/bin/env bash

# Build and test script for CI/CD pipelines

set -e

echo "🏗️  Building application..."

# Install dependencies
npm ci

# Run linting
echo "🔍 Running linter..."
npm run lint || true

# Build for production
echo "🔨 Building for production..."
npm run build

echo "✅ Build successful!"
