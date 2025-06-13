#!/bin/bash

# Comprehensive script to set up all test data after a database reset
# Run this AFTER: npx supabase db reset

set -e

echo "==================================="
echo "Setting up local test data..."
echo "==================================="
echo ""

# Configuration
SUPABASE_URL="http://localhost:54321"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
TENANT_ID="d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0"

# Check if Supabase is running
if ! npx supabase status >/dev/null 2>&1; then
    echo "❌ Error: Supabase is not running. Please run: npx supabase start"
    exit 1
fi

echo "✓ Supabase is running"
echo ""

# Step 1: Create auth users
echo "Step 1: Creating auth users..."
echo "=============================="

# Admin user
echo -n "Creating admin@testcompany.com... "
response=$(curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@testcompany.com",
        "password": "TestPassword123!",
        "email_confirm": true
    }')

admin_id=$(echo "$response" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
if [ -n "$admin_id" ] && [ "$admin_id" != "null" ]; then
    echo "✓ Created (ID: $admin_id)"
else
    # Check if user already exists
    if echo "$response" | grep -q "email_exists"; then
        echo "⚠️  Already exists, fetching ID..."
        # Get existing user ID
        admin_id=$(PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c \
            "SELECT id FROM auth.users WHERE email = 'admin@testcompany.com';" | tr -d ' \n')
        echo "   Found existing ID: $admin_id"
    else
        echo "✗ Failed: $response"
        exit 1
    fi
fi

# Regular user
echo -n "Creating user@testcompany.com... "
response=$(curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "user@testcompany.com",
        "password": "TestPassword123!",
        "email_confirm": true
    }')

user_id=$(echo "$response" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
if [ -n "$user_id" ] && [ "$user_id" != "null" ]; then
    echo "✓ Created (ID: $user_id)"
else
    # Check if user already exists
    if echo "$response" | grep -q "email_exists"; then
        echo "⚠️  Already exists, fetching ID..."
        # Get existing user ID
        user_id=$(PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c \
            "SELECT id FROM auth.users WHERE email = 'user@testcompany.com';" | tr -d ' \n')
        echo "   Found existing ID: $user_id"
    else
        echo "✗ Failed: $response"
        exit 1
    fi
fi

# Candidate users
for email in "john.smith@example.com" "sarah.johnson@example.com" "michael.chen@example.com"; do
    echo -n "Creating $email... "
    response=$(curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"TestPassword123!\",
            \"email_confirm\": true
        }")
    
    if echo "$response" | grep -q '"id"'; then
        echo "✓ Created"
    elif echo "$response" | grep -q "email_exists"; then
        echo "⚠️  Already exists"
    else
        echo "✗ Failed: $response"
    fi
done

echo ""

# Step 2: Link users to public.users table
echo "Step 2: Linking users to public.users table..."
echo "=============================================="

# Link admin user
echo -n "Linking admin user... "
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c \
    "INSERT INTO public.users (id, tenant_id, role, created_at, updated_at) 
     VALUES ('$admin_id', '$TENANT_ID', 'admin', NOW(), NOW()) 
     ON CONFLICT (id) DO UPDATE 
     SET tenant_id = EXCLUDED.tenant_id, role = EXCLUDED.role;" >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Linked"
else
    echo "✗ Failed to link"
    exit 1
fi

# Link regular user
echo -n "Linking regular user... "
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c \
    "INSERT INTO public.users (id, tenant_id, role, created_at, updated_at) 
     VALUES ('$user_id', '$TENANT_ID', 'user', NOW(), NOW()) 
     ON CONFLICT (id) DO UPDATE 
     SET tenant_id = EXCLUDED.tenant_id, role = EXCLUDED.role;" >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Linked"
else
    echo "✗ Failed to link"
    exit 1
fi

echo ""

# Step 3: Verify setup
echo "Step 3: Verifying setup..."
echo "=========================="

echo "Checking linked users:"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c \
    "SELECT u.email || ' -> ' || pu.role || ' (Tenant: ' || t.name || ')' 
     FROM auth.users u 
     INNER JOIN public.users pu ON u.id = pu.id 
     INNER JOIN public.tenants t ON pu.tenant_id = t.id 
     WHERE u.email IN ('admin@testcompany.com', 'user@testcompany.com')
     ORDER BY u.email;" | sed 's/^[ \t]*/  /'

echo ""
echo "Checking test data:"
echo -n "  Tenants: "
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c \
    "SELECT COUNT(*) FROM public.tenants WHERE id = '$TENANT_ID';" | tr -d ' \n'
echo ""

echo -n "  Companies: "
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c \
    "SELECT COUNT(*) FROM public.companies WHERE tenant_id = '$TENANT_ID';" | tr -d ' \n'
echo ""

echo -n "  Positions: "
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c \
    "SELECT COUNT(*) FROM public.positions WHERE tenant_id = '$TENANT_ID';" | tr -d ' \n'
echo ""

echo -n "  Candidates: "
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c \
    "SELECT COUNT(*) FROM public.candidates WHERE tenant_id = '$TENANT_ID';" | tr -d ' \n'
echo ""

echo ""
echo "==================================="
echo "✅ Setup complete!"
echo "==================================="
echo ""
echo "Test credentials:"
echo "  Admin: admin@testcompany.com / TestPassword123!"
echo "  User: user@testcompany.com / TestPassword123!"
echo "  Candidates: [name]@example.com / TestPassword123!"
echo ""
echo "Test Tenant ID: $TENANT_ID"
echo ""
echo "You can now access the application at: http://localhost:8080" 