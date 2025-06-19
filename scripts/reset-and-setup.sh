#!/bin/bash

# Reset Database and Setup Test Data Script
# This script resets the local Supabase database and sets up test auth users

set -e  # Exit on error

echo ""t
echo "=== Resetting database and setting up test data ==="
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Error: node_modules not found. Please run 'npm install' first"
    exit 1
fi

# Check if Supabase CLI is available
if ! npx supabase --version >/dev/null 2>&1; then
    echo "Error: Supabase CLI not found. Please run 'npm install' first"
    exit 1
fi

# Check if Supabase is running
if ! npx supabase status >/dev/null 2>&1; then
    echo "Error: Supabase is not running. Please run 'npx supabase start' first"
    exit 1
fi

# Check if setup script exists and is executable
if [ ! -f "./scripts/helpers/setup-local-test-data.sh" ]; then
    echo "Error: setup-local-test-data.sh not found in scripts/helpers/"
    exit 1
fi

# Make sure the setup script is executable
chmod +x ./scripts/helpers/setup-local-test-data.sh

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
./scripts/helpers/setup-local-test-data.sh

echo ""
echo "=== All done! ==="
echo ""
echo "The database has been reset and test users have been created."
echo "You can now log in with any of these accounts (password: TestPassword123!):"
echo ""
echo "SYSTEM ADMIN:"
echo "  - system.admin@interviewnow.ai (System Admin - manages all tenants)"
echo ""
echo "TENANT ADMINS:"
echo "  - admin@techcorp.com (Admin for TechCorp Solutions)"
echo "  - admin@innovatetech.com (Admin for InnovateTech Labs)"
echo "  - admin@greenfuture.com (Admin for GreenFuture Technologies)"
echo ""
echo "TENANT INTERVIEWERS:"
echo "  - interviewer@techcorp.com (Access to: TechCorp Solutions only)"
echo "  - interviewer@innovatetech.com (Access to: InnovateTech Labs)"
echo "  - interviewer@greenfuture.com (Access to: GreenFuture Technologies)"
echo "  - interviewer.all@testcompany.com (Access to: ALL 3 companies)"
echo ""
echo "NOTE: Candidates do NOT have login access. They can only access interviews via invitation links." 