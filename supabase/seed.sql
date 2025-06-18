-- Supabase Seed Data
-- This file creates test data for development and testing purposes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create test tenant
INSERT INTO public.tenants (id, name, plan_tier, tenancy_type, created_at, updated_at)
VALUES 
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Test Company Inc', 'pro', 'enterprise', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Auth Users Information
-- The setup-local-test-data.sh script will create the following auth users:
-- SYSTEM ADMIN:
-- Email: system.admin@interviewnow.ai, Password: TestPassword123! (System Admin role)
--
-- TENANT ADMINS (one for each company):
-- Email: admin@techcorp.com, Password: TestPassword123! (Tenant Admin for TechCorp Solutions)
-- Email: admin@innovatetech.com, Password: TestPassword123! (Tenant Admin for InnovateTech Labs)
--
-- TENANT INTERVIEWERS (one for each company):
-- Email: interviewer@techcorp.com, Password: TestPassword123! (Tenant Interviewer for TechCorp Solutions)
-- Email: interviewer@innovatetech.com, Password: TestPassword123! (Tenant Interviewer for InnovateTech Labs)
--
-- TENANT CANDIDATES (no login capability):
-- These are created as candidates only, without auth.users entries

-- Note: The public.users entries are created by the setup script after auth users are created

-- Create test companies
INSERT INTO public.companies (id, tenant_id, name, culture, story, values_data, benefits_data, created_at, updated_at)
VALUES 
  (
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'TechCorp Solutions',
    'We foster a culture of innovation, collaboration, and continuous learning. Our team members are encouraged to take ownership, experiment with new ideas, and grow both personally and professionally.',
    'Founded in 2015, TechCorp Solutions started as a small startup with a big vision: to revolutionize how businesses leverage AI and machine learning. Today, we''re a leading provider of AI-powered solutions serving Fortune 500 companies worldwide.',
    '{
      "description": "Innovation, Integrity, Impact, Inclusion",
      "items": ["Innovation", "Integrity", "Impact", "Inclusion", "Continuous Learning"]
    }'::jsonb,
    '{
      "description": "Comprehensive health insurance, 401k matching, flexible work arrangements, unlimited PTO, professional development budget",
      "items": ["Health Insurance", "401k Matching", "Remote Work", "Unlimited PTO", "Learning Budget", "Stock Options"]
    }'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'InnovateTech Labs',
    'At InnovateTech Labs, we believe in pushing boundaries and creating the future. Our diverse team thrives in an environment that values creativity, autonomy, and continuous experimentation.',
    'Started in 2018 as a small R&D lab, InnovateTech Labs has grown into a cutting-edge technology company specializing in emerging technologies like blockchain, IoT, and quantum computing. We partner with startups and enterprises to bring revolutionary ideas to life.',
    '{
      "description": "Curiosity, Collaboration, Courage, Customer-First",
      "items": ["Curiosity", "Collaboration", "Courage", "Customer-First", "Radical Transparency"]
    }'::jsonb,
    '{
      "description": "Full medical coverage, equity participation, flexible hours, remote-first culture, annual tech budget",
      "items": ["Medical & Dental", "Equity Options", "Fully Remote", "Flexible Hours", "$5000 Tech Budget", "Conference Allowance"]
    }'::jsonb,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Create sample billing information for the test tenant
INSERT INTO public.billing_information (id, tenant_id, billing_email, created_at, updated_at)
VALUES 
  (
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'billing@testcompany.com',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Create sample invoices for the test tenant
INSERT INTO public.invoices (id, tenant_id, invoice_number, amount_due, amount_paid, status, due_date, line_items, created_at, updated_at)
VALUES 
  (
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'INV-2025-001',
    50000, -- $500.00
    50000,
    'paid',
    NOW() - INTERVAL '15 days',
    '[{"description": "Pro Plan - Monthly", "amount": 50000}]'::jsonb,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '15 days'
  ),
  (
    'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'INV-2025-002',
    50000, -- $500.00
    0,
    'open',
    NOW() + INTERVAL '15 days',
    '[{"description": "Pro Plan - Monthly", "amount": 50000}]'::jsonb,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Create sample payment history
INSERT INTO public.payment_history (id, tenant_id, invoice_id, amount, status, payment_method, created_at)
VALUES 
  (
    'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
    50000,
    'succeeded',
    'card',
    NOW() - INTERVAL '15 days'
  )
ON CONFLICT (id) DO NOTHING;

-- The setup script will create interviewer_company_access entries after creating the users
-- to give interviewers access to their respective companies