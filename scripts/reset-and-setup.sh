#!/bin/bash

# Reset Database and Setup Test Data Script
# This script resets the local Supabase database and sets up test auth users

set -e  # Exit on error

echo "=== Resetting database and setting up test data ==="
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Step 1: Reset the database
echo "Step 1: Resetting local database..."
npx supabase db reset --local

# Check if reset was successful
if [ $? -eq 0 ]; then
    echo "✓ Database reset completed successfully"
else
    echo "✗ Database reset failed"
    exit 1
fi

echo ""

# Step 2: Run the setup script
echo "Step 2: Setting up test auth users..."
./scripts/setup-local-test-data.sh

echo ""
echo "=== All done! ==="
echo ""
echo "The database has been reset and test users have been created."
echo "You can now log in with any of these accounts (password: TestPassword123!):"
echo "  - admin@testcompany.com (Admin)"
echo "  - user@testcompany.com (User)"
echo "  - john.smith@example.com (User)"
echo "  - sarah.johnson@example.com (User)"
echo "  - michael.chen@example.com (User)" 