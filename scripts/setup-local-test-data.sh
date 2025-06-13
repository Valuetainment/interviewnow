#!/bin/bash

# Setup Local Test Data Script
# This script creates auth users and then runs the seed file to populate test data

set -e  # Exit on error

echo "=== Setting up local test data ==="
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Step 1: Create auth users using the Supabase API
echo "Step 1: Creating auth users..."

# Configuration
SUPABASE_URL="http://localhost:54321"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

# Function to create a user
create_user() {
  local email=$1
  local password=$2
  local name=$3
  
  echo "Creating $name..."
  
  response=$(curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$email\",
      \"password\": \"$password\",
      \"email_confirm\": true
    }")
  
  if echo "$response" | grep -q '"id"'; then
    echo "  ✓ Created successfully"
  elif echo "$response" | grep -q "email_exists"; then
    echo "  ⚠ Already exists"
  else
    echo "  ✗ Failed: $response"
  fi
}

# Create all users
create_user "admin@testcompany.com" "TestPassword123!" "admin user"
create_user "user@testcompany.com" "TestPassword123!" "regular user"
create_user "john.smith@example.com" "TestPassword123!" "John Smith"
create_user "sarah.johnson@example.com" "TestPassword123!" "Sarah Johnson"
create_user "michael.chen@example.com" "TestPassword123!" "Michael Chen"

echo ""
echo "Step 2: Creating temporary seed file with public users enabled..."

# Create a temporary seed file with public users uncommented
cp supabase/seed.sql supabase/seed-with-users.sql

# Uncomment the public users inserts
sed -i 's/^-- INSERT INTO public.users/INSERT INTO public.users/g' supabase/seed-with-users.sql
sed -i 's/^-- VALUES/VALUES/g' supabase/seed-with-users.sql
sed -i 's/^--   (/  (/g' supabase/seed-with-users.sql
sed -i 's/^-- ON CONFLICT (id) DO NOTHING;/ON CONFLICT (id) DO NOTHING;/g' supabase/seed-with-users.sql

echo ""
echo "Step 3: Running seed file..."

# Run the modified seed file
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seed-with-users.sql

# Clean up temporary file
rm -f supabase/seed-with-users.sql

echo ""
echo "Step 4: Ensuring all auth users are linked to public.users..."

# Get the actual user IDs from auth.users and link them to public.users
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres << EOF
-- Link any auth users that aren't already in public.users
INSERT INTO public.users (id, tenant_id, role, created_at, updated_at)
SELECT 
    au.id,
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid as tenant_id,
    CASE 
        WHEN au.email = 'admin@testcompany.com' THEN 'admin'
        ELSE 'user'
    END as role,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
AND au.email IN ('admin@testcompany.com', 'user@testcompany.com', 'john.smith@example.com', 'sarah.johnson@example.com', 'michael.chen@example.com');

-- Update any existing records to ensure they have the correct tenant_id
UPDATE public.users 
SET tenant_id = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('admin@testcompany.com', 'user@testcompany.com', 'john.smith@example.com', 'sarah.johnson@example.com', 'michael.chen@example.com')
);
EOF

echo ""
echo "Step 5: Verifying setup..."

# Check the linked users
echo "Checking linked users:"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c \
    "SELECT u.email || ' -> ' || COALESCE(pu.role, 'not linked') || ' (Tenant: ' || COALESCE(t.name, 'none') || ')' 
     FROM auth.users u 
     LEFT JOIN public.users pu ON u.id = pu.id 
     LEFT JOIN public.tenants t ON pu.tenant_id = t.id 
     WHERE u.email IN ('admin@testcompany.com', 'user@testcompany.com', 'john.smith@example.com', 'sarah.johnson@example.com', 'michael.chen@example.com')
     ORDER BY u.email;" | sed 's/^[ \t]*/  /'

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Test users created:"
echo "  - admin@testcompany.com (password: TestPassword123!)"
echo "  - user@testcompany.com (password: TestPassword123!)"
echo "  - john.smith@example.com (password: TestPassword123!)"
echo "  - sarah.johnson@example.com (password: TestPassword123!)"
echo "  - michael.chen@example.com (password: TestPassword123!)"
echo ""
echo "All users are now properly linked to the test tenant."
echo "You can now log in with any of these users to test the application." 