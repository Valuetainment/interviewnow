#!/bin/bash

# First Time Setup Script
# Run this after cloning the repository to set up everything

set -e  # Exit on error

echo ""
echo "=== First Time Setup ==="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "supabase/config.toml" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Step 1: Install dependencies
echo "Step 1: Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

echo ""

# Step 2: Make all scripts executable
echo "Step 2: Making scripts executable..."
chmod +x scripts/*.sh
echo "✓ Scripts are now executable"

echo ""

# Step 3: Start Supabase
echo "Step 3: Starting Supabase..."
if ! npx supabase status >/dev/null 2>&1; then
    echo "Starting Supabase services (this may take a minute)..."
    npx supabase start
    echo "✓ Supabase started"
else
    echo "✓ Supabase is already running"
fi

echo ""

# Step 4: Run database setup
echo "Step 4: Setting up database and test data..."
./scripts/reset-and-setup.sh

echo ""
echo "=== First time setup complete! ==="
echo ""
echo "You can now start the development server with:"
echo "  npm run dev"
echo ""
echo "And log in with any of these test accounts (password: TestPassword123!):"
echo "  - admin@testcompany.com"
echo "  - user@testcompany.com"
echo "  - john.smith@example.com"
echo "  - sarah.johnson@example.com"
echo "  - michael.chen@example.com" 