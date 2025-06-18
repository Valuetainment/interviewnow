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
# InnovateTech Labs candidates
create_user "emily.rodriguez@example.com" "TestPassword123!" "Emily Rodriguez"
create_user "david.park@example.com" "TestPassword123!" "David Park"
create_user "sophia.zhang@example.com" "TestPassword123!" "Dr. Sophia Zhang"

echo ""
echo "Step 2: Ensuring all auth users are linked to public.users..."

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
AND au.email IN ('admin@testcompany.com', 'user@testcompany.com', 'john.smith@example.com', 'sarah.johnson@example.com', 'michael.chen@example.com', 'emily.rodriguez@example.com', 'david.park@example.com', 'sophia.zhang@example.com');

-- Update any existing records to ensure they have the correct tenant_id
UPDATE public.users 
SET tenant_id = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('admin@testcompany.com', 'user@testcompany.com', 'john.smith@example.com', 'sarah.johnson@example.com', 'michael.chen@example.com', 'emily.rodriguez@example.com', 'david.park@example.com', 'sophia.zhang@example.com')
);
EOF

echo ""
echo "Step 3: Creating test notifications..."

# Create test notifications for the users
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres << EOF
-- Create notifications for admin user
INSERT INTO public.notifications (
    user_id,
    tenant_id,
    interview_session_id,
    type,
    title,
    message,
    is_read,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid,
    '22222222-2222-2222-2222-222222222226'::uuid,
    'interview_completed',
    'Interview Completed',
    'Interview with Sarah Johnson for Product Manager has been completed',
    false,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
FROM public.users u
WHERE u.role = 'admin' 
AND u.tenant_id = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid
LIMIT 1;

-- Create another unread notification for admin
INSERT INTO public.notifications (
    user_id,
    tenant_id,
    interview_session_id,
    type,
    title,
    message,
    is_read,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid,
    '22222222-2222-2222-2222-222222222228'::uuid,
    'interview_completed',
    'Interview Completed',
    'Interview with Michael Chen for Senior Software Engineer has been completed',
    false,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
FROM public.users u
WHERE u.role = 'admin' 
AND u.tenant_id = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid
LIMIT 1;

-- Create a read notification for admin (to show read state)
INSERT INTO public.notifications (
    user_id,
    tenant_id,
    interview_session_id,
    type,
    title,
    message,
    is_read,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid,
    '22222222-2222-2222-2222-222222222227'::uuid,
    'interview_completed',
    'Interview Completed',
    'Interview with John Smith for Senior Software Engineer has been completed',
    true,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 hour'
FROM public.users u
WHERE u.role = 'admin' 
AND u.tenant_id = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid
LIMIT 1;

-- Create notification for regular user
INSERT INTO public.notifications (
    user_id,
    tenant_id,
    interview_session_id,
    type,
    title,
    message,
    is_read,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid,
    '22222222-2222-2222-2222-222222222226'::uuid,
    'interview_completed',
    'Interview Completed',
    'Interview with Sarah Johnson for Product Manager has been completed',
    false,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.role = 'user' 
AND u.tenant_id = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid
AND au.email = 'user@testcompany.com'
LIMIT 1;

-- Verify notifications were created
SELECT COUNT(*) as notification_count FROM public.notifications;
EOF

echo ""
echo "Step 4: Verifying setup..."

# Check the linked users
echo "Checking linked users:"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c \
    "SELECT u.email || ' -> ' || COALESCE(pu.role, 'not linked') || ' (Tenant: ' || COALESCE(t.name, 'none') || ')' 
     FROM auth.users u 
     LEFT JOIN public.users pu ON u.id = pu.id 
     LEFT JOIN public.tenants t ON pu.tenant_id = t.id 
     WHERE u.email IN ('admin@testcompany.com', 'user@testcompany.com', 'john.smith@example.com', 'sarah.johnson@example.com', 'michael.chen@example.com', 'emily.rodriguez@example.com', 'david.park@example.com', 'sophia.zhang@example.com')
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
echo "  - emily.rodriguez@example.com (password: TestPassword123!)"
echo "  - david.park@example.com (password: TestPassword123!)"
echo "  - sophia.zhang@example.com (password: TestPassword123!)"
echo ""
echo "All users are now properly linked to the test tenant."
echo "You can now log in with any of these users to test the application." 