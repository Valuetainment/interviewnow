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

# Create auth users
echo "Creating System Admin..."
create_user "system.admin@interviewnow.ai" "TestPassword123!" "System Admin"

echo ""
echo "Creating Tenant Admins..."
create_user "admin@techcorp.com" "TestPassword123!" "TechCorp Admin"
create_user "admin@innovatetech.com" "TestPassword123!" "InnovateTech Admin"

echo ""
echo "Creating Tenant Interviewers..."
create_user "interviewer@techcorp.com" "TestPassword123!" "TechCorp Interviewer"
create_user "interviewer@innovatetech.com" "TestPassword123!" "InnovateTech Interviewer"

echo ""
echo "NOTE: Candidates are created without auth.users entries (no login capability)"

echo ""
echo "Step 2: Ensuring all auth users are linked to public.users with correct roles..."

# Get the actual user IDs from auth.users and link them to public.users
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres << EOF
-- First, create or update the system admin (no tenant_id)
INSERT INTO public.users (id, tenant_id, role, created_at, updated_at)
SELECT 
    au.id,
    NULL as tenant_id,  -- System admin has no tenant
    'system_admin' as role,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users au
WHERE au.email = 'system.admin@interviewnow.ai'
ON CONFLICT (id) DO UPDATE
SET role = 'system_admin',
    tenant_id = NULL,
    updated_at = NOW();

-- Create or update tenant admins
INSERT INTO public.users (id, tenant_id, role, created_at, updated_at)
SELECT 
    au.id,
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid as tenant_id,
    'tenant_admin' as role,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users au
WHERE au.email IN ('admin@techcorp.com', 'admin@innovatetech.com')
ON CONFLICT (id) DO UPDATE
SET role = 'tenant_admin',
    tenant_id = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid,
    updated_at = NOW();

-- Create or update tenant interviewers
INSERT INTO public.users (id, tenant_id, role, created_at, updated_at)
SELECT 
    au.id,
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid as tenant_id,
    'tenant_interviewer' as role,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users au
WHERE au.email IN ('interviewer@techcorp.com', 'interviewer@innovatetech.com')
ON CONFLICT (id) DO UPDATE
SET role = 'tenant_interviewer',
    tenant_id = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid,
    updated_at = NOW();
EOF

echo ""
echo "Step 3: Creating interviewer company access entries..."

PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres << EOF
-- Grant TechCorp interviewer access to TechCorp Solutions
INSERT INTO public.interviewer_company_access (user_id, company_id, tenant_id, granted_by, created_at)
SELECT 
    u.id as user_id,
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'::uuid as company_id,
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid as tenant_id,
    admin.id as granted_by,
    NOW() as created_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
CROSS JOIN (
    SELECT u2.id FROM public.users u2
    JOIN auth.users au2 ON u2.id = au2.id
    WHERE au2.email = 'admin@techcorp.com'
) admin
WHERE au.email = 'interviewer@techcorp.com'
ON CONFLICT (user_id, company_id) DO NOTHING;

-- Grant InnovateTech interviewer access to InnovateTech Labs
INSERT INTO public.interviewer_company_access (user_id, company_id, tenant_id, granted_by, created_at)
SELECT 
    u.id as user_id,
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2'::uuid as company_id,
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'::uuid as tenant_id,
    admin.id as granted_by,
    NOW() as created_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
CROSS JOIN (
    SELECT u2.id FROM public.users u2
    JOIN auth.users au2 ON u2.id = au2.id
    WHERE au2.email = 'admin@innovatetech.com'
) admin
WHERE au.email = 'interviewer@innovatetech.com'
ON CONFLICT (user_id, company_id) DO NOTHING;
EOF

echo ""
echo "Step 4: Creating test candidates (without auth.users entries)..."

PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres << EOF
-- Update existing candidates to ensure they don't have auth_id (no login capability)
UPDATE public.candidates
SET auth_id = NULL,
    auth_email = NULL
WHERE email IN ('john.smith@example.com', 'sarah.johnson@example.com', 'michael.chen@example.com');

-- Clean up any auth.users entries for candidates (they shouldn't be able to login)
DELETE FROM auth.users
WHERE email IN ('john.smith@example.com', 'sarah.johnson@example.com', 'michael.chen@example.com', 
                'emily.rodriguez@example.com', 'david.park@example.com', 'sophia.zhang@example.com');

-- Clean up any public.users entries for candidates
DELETE FROM public.users
WHERE id IN (
    SELECT auth_id FROM public.candidates 
    WHERE email IN ('john.smith@example.com', 'sarah.johnson@example.com', 'michael.chen@example.com',
                    'emily.rodriguez@example.com', 'david.park@example.com', 'sophia.zhang@example.com')
    AND auth_id IS NOT NULL
);
EOF

echo ""
echo "Step 5: Creating test notifications..."

# Create test notifications for the tenant admins
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres << EOF
-- Create notifications for TechCorp admin
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
WHERE au.email = 'admin@techcorp.com'
LIMIT 1;

-- Create notification for InnovateTech admin
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
    '88888888-8888-8888-8888-888888888882'::uuid,
    'interview_completed',
    'Interview Completed',
    'Interview with David Park for IoT Solutions Architect has been completed',
    false,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'admin@innovatetech.com'
LIMIT 1;

-- Verify notifications were created
SELECT COUNT(*) as notification_count FROM public.notifications;
EOF

echo ""
echo "Step 6: Verifying setup..."

# Check the linked users
echo "Checking linked users:"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c \
    "SELECT u.email || ' -> ' || COALESCE(pu.role, 'not linked') || ' (Tenant: ' || COALESCE(t.name, 'No Tenant') || ')' 
     FROM auth.users u 
     LEFT JOIN public.users pu ON u.id = pu.id 
     LEFT JOIN public.tenants t ON pu.tenant_id = t.id 
     WHERE u.email IN ('system.admin@interviewnow.ai', 'admin@techcorp.com', 'admin@innovatetech.com', 
                       'interviewer@techcorp.com', 'interviewer@innovatetech.com')
     ORDER BY 
        CASE pu.role 
            WHEN 'system_admin' THEN 1
            WHEN 'tenant_admin' THEN 2
            WHEN 'tenant_interviewer' THEN 3
            ELSE 4
        END,
        u.email;" | sed 's/^[ \t]*/  /'

echo ""
echo "Checking interviewer access:"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c \
    "SELECT au.email || ' -> ' || c.name
     FROM public.interviewer_company_access ica
     JOIN public.users u ON ica.user_id = u.id
     JOIN auth.users au ON u.id = au.id
     JOIN public.companies c ON ica.company_id = c.id
     ORDER BY au.email;" | sed 's/^[ \t]*/  /'

echo ""
echo "Checking candidates (should have no auth access):"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c \
    "SELECT c.email || ' -> ' || 
        CASE 
            WHEN c.auth_id IS NULL THEN 'No login (correct)'
            ELSE 'Has auth access (ERROR!)'
        END
     FROM public.candidates c
     WHERE c.email IN ('john.smith@example.com', 'sarah.johnson@example.com', 'michael.chen@example.com')
     ORDER BY c.email;" | sed 's/^[ \t]*/  /'

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Users with login access:"
echo "  SYSTEM ADMIN:"
echo "    - system.admin@interviewnow.ai (password: TestPassword123!)"
echo ""
echo "  TENANT ADMINS:"
echo "    - admin@techcorp.com (password: TestPassword123!)"
echo "    - admin@innovatetech.com (password: TestPassword123!)"
echo ""
echo "  TENANT INTERVIEWERS:"
echo "    - interviewer@techcorp.com (password: TestPassword123!) - Access to: TechCorp Solutions"
echo "    - interviewer@innovatetech.com (password: TestPassword123!) - Access to: InnovateTech Labs"
echo ""
echo "Candidates (no login access):"
echo "  - john.smith@example.com"
echo "  - sarah.johnson@example.com"
echo "  - michael.chen@example.com"
echo ""
echo "You can now log in with the appropriate user to test different access levels." 