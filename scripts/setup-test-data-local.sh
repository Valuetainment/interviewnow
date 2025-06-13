#!/bin/bash

# Script to set up test data in LOCAL Supabase only
# This script creates test users and runs the database seed locally

set -e

echo "Setting up test data for LOCAL Supabase..."
echo ""

# Check if Supabase is running locally
SUPABASE_STATUS=$(npx supabase status 2>&1)
if ! echo "$SUPABASE_STATUS" | grep -q "supabase local development setup is running"; then
    echo "Error: Supabase is not running locally"
    echo "Please start Supabase with: npx supabase start"
    exit 1
fi

# Get local Supabase credentials
echo "Getting local Supabase credentials..."
SUPABASE_URL="http://localhost:54321"

# Get the service role key from the status output
SUPABASE_SERVICE_ROLE_KEY=$(echo "$SUPABASE_STATUS" | grep "service_role key:" | sed 's/service_role key: //' | tr -d ' ')

# If that didn't work, try the JSON approach
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    SUPABASE_JSON=$(npx supabase status -o json 2>&1)
    SUPABASE_SERVICE_ROLE_KEY=$(echo "$SUPABASE_JSON" | jq -r '.api.service_role_key' 2>/dev/null || echo "")
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Error: Could not get local Supabase service role key"
    echo "Make sure Supabase is running: npx supabase start"
    exit 1
fi

echo "✓ Using local Supabase at: $SUPABASE_URL"
echo ""

# Function to create a user via Supabase Admin API
create_user() {
    local email=$1
    local password=$2
    local full_name=$3
    local role=$4
    local user_id=$5
    
    echo "Creating user locally: $email"
    
    # Build the JSON payload
    local payload
    if [ ! -z "$user_id" ]; then
        payload=$(cat <<EOF
{
    "email": "$email",
    "password": "$password",
    "email_confirm": true,
    "id": "$user_id",
    "user_metadata": {
        "full_name": "$full_name",
        "role": "$role"
    }
}
EOF
)
    else
        payload=$(cat <<EOF
{
    "email": "$email",
    "password": "$password",
    "email_confirm": true,
    "user_metadata": {
        "full_name": "$full_name",
        "role": "$role"
    }
}
EOF
)
    fi
    
    # Make the API call to LOCAL Supabase
    response=$(curl -s -X POST \
        "${SUPABASE_URL}/auth/v1/admin/users" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -d "$payload")
    
    # Check if successful
    if echo "$response" | grep -q "\"id\""; then
        echo "✓ Created successfully in local database"
    elif echo "$response" | grep -q "already been registered"; then
        echo "⚠ User already exists in local database"
    else
        echo "✗ Failed: $response"
    fi
    echo ""
}

echo "Creating test users in LOCAL database..."
echo ""

# Create admin user
create_user "admin@testcompany.com" "TestPassword123!" "Admin User" "admin" "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1"

# Create regular user
create_user "user@testcompany.com" "TestPassword123!" "Regular User" "user" "b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2"

# Create candidate users
create_user "john.smith@example.com" "TestPassword123!" "John Smith" "candidate" ""
create_user "sarah.johnson@example.com" "TestPassword123!" "Sarah Johnson" "candidate" ""
create_user "michael.chen@example.com" "TestPassword123!" "Michael Chen" "candidate" ""

echo "Now you need to uncomment the user inserts in supabase/seed.sql and run:"
echo "npx supabase db reset"
echo ""
echo "This will link the auth users to the public.users table."

echo ""
echo "LOCAL test data setup complete!"
echo ""
echo "Test credentials (LOCAL ONLY):"
echo "- Admin: admin@testcompany.com / TestPassword123!"
echo "- User: user@testcompany.com / TestPassword123!"
echo "- Candidates: [name]@example.com / TestPassword123!"
echo ""
echo "Test Tenant ID: d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0"
echo ""
echo "Access your local Supabase at: http://localhost:54321"
echo "Local Supabase Studio: http://localhost:54323" 