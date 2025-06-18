-- Migration: add_enhanced_role_system
-- Created: Wed Jun 18 04:15:49 PM EDT 2025
-- 
-- Description: [Add description here]

-- Add your SQL here

-- Enhanced Role System Migration
-- This migration adds support for System Admin, Tenant Admin, Tenant Interviewer, and Tenant Candidate roles

-- Step 1: Add tenancy_type to tenants table
ALTER TABLE public.tenants
ADD COLUMN tenancy_type text DEFAULT 'enterprise' CHECK (tenancy_type IN ('enterprise', 'self-service'));

-- Step 2: Update users table to support new role types and allow NULL tenant_id for system admins
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tenant_id_fkey;
ALTER TABLE public.users ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.users
ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.users
ADD CONSTRAINT users_role_check CHECK (role IN ('system_admin', 'tenant_admin', 'tenant_interviewer', 'tenant_candidate', 'user'));

-- Step 3: Create company_codes table for tenant invitations
CREATE TABLE public.company_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  used_at timestamptz,
  used_by uuid REFERENCES auth.users(id)
);

-- Step 4: Create tenant_invitations table
CREATE TABLE public.tenant_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  tenant_name text NOT NULL,
  company_code text UNIQUE NOT NULL,
  tenancy_type text DEFAULT 'enterprise' CHECK (tenancy_type IN ('enterprise', 'self-service')),
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  tenant_id uuid REFERENCES public.tenants(id)
);

-- Step 5: Create interviewer_company_access table for fine-grained access control
CREATE TABLE public.interviewer_company_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Step 6: Create billing related tables
CREATE TABLE public.billing_information (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_customer_id text,
  payment_method_id text,
  card_last4 text,
  card_brand text,
  card_exp_month integer,
  card_exp_year integer,
  billing_email text,
  billing_address jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  stripe_invoice_id text,
  amount_due integer NOT NULL, -- in cents
  amount_paid integer DEFAULT 0, -- in cents
  currency text DEFAULT 'usd',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  due_date date,
  paid_at timestamptz,
  invoice_pdf_url text,
  line_items jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id),
  stripe_payment_intent_id text,
  amount integer NOT NULL, -- in cents
  currency text DEFAULT 'usd',
  status text CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  payment_method text,
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

-- Step 7: Create indexes for performance
CREATE INDEX idx_company_codes_tenant_id ON public.company_codes(tenant_id);
CREATE INDEX idx_company_codes_expires_at ON public.company_codes(expires_at);
CREATE INDEX idx_tenant_invitations_email ON public.tenant_invitations(email);
CREATE INDEX idx_tenant_invitations_expires_at ON public.tenant_invitations(expires_at);
CREATE INDEX idx_interviewer_company_access_user_id ON public.interviewer_company_access(user_id);
CREATE INDEX idx_interviewer_company_access_company_id ON public.interviewer_company_access(company_id);
CREATE INDEX idx_billing_information_tenant_id ON public.billing_information(tenant_id);
CREATE INDEX idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_payment_history_tenant_id ON public.payment_history(tenant_id);
CREATE INDEX idx_payment_history_invoice_id ON public.payment_history(invoice_id);

-- Step 8: Update RLS policies

-- System Admin RLS Helper Function
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'system_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies that need updates
DROP POLICY IF EXISTS "Users can view their own tenant data" ON public.tenants;
DROP POLICY IF EXISTS "Users can view companies in their tenant" ON public.companies;
DROP POLICY IF EXISTS "Users can view positions in their tenant" ON public.positions;
DROP POLICY IF EXISTS "Users can view candidates in their tenant" ON public.candidates;
DROP POLICY IF EXISTS "Users can view interview sessions in their tenant" ON public.interview_sessions;
DROP POLICY IF EXISTS "Users can view transcript entries in their tenant" ON public.transcript_entries;

-- Tenants table policies
CREATE POLICY "System admins can view all tenants" ON public.tenants
  FOR SELECT USING (is_system_admin());

CREATE POLICY "Users can view their own tenant" ON public.tenants
  FOR SELECT USING (
    id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "System admins can manage all tenants" ON public.tenants
  FOR ALL USING (is_system_admin());

-- Companies table policies
CREATE POLICY "System admins can view all companies" ON public.companies
  FOR SELECT USING (is_system_admin());

CREATE POLICY "Tenant users can view companies based on role" ON public.companies
  FOR SELECT USING (
    -- Tenant admins see all companies in their tenant
    (EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND tenant_id = companies.tenant_id
      AND role = 'tenant_admin'
    ))
    OR
    -- Tenant interviewers see only companies they have access to
    (EXISTS (
      SELECT 1 FROM public.interviewer_company_access ica
      JOIN public.users u ON u.id = ica.user_id
      WHERE ica.user_id = auth.uid()
      AND ica.company_id = companies.id
      AND u.role = 'tenant_interviewer'
    ))
  );

CREATE POLICY "System admins can manage all companies" ON public.companies
  FOR ALL USING (is_system_admin());

CREATE POLICY "Tenant admins can manage companies in their tenant" ON public.companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND tenant_id = companies.tenant_id
      AND role = 'tenant_admin'
    )
  );

-- Positions table policies
CREATE POLICY "System admins can view all positions" ON public.positions
  FOR SELECT USING (is_system_admin());

CREATE POLICY "Tenant users can view positions based on company access" ON public.positions
  FOR SELECT USING (
    -- Tenant admins see all positions in their tenant
    (EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND tenant_id = positions.tenant_id
      AND role = 'tenant_admin'
    ))
    OR
    -- Tenant interviewers see positions for companies they have access to
    (EXISTS (
      SELECT 1 FROM public.interviewer_company_access ica
      JOIN public.users u ON u.id = ica.user_id
      WHERE ica.user_id = auth.uid()
      AND ica.company_id = positions.company_id
      AND u.role = 'tenant_interviewer'
    ))
  );

CREATE POLICY "System admins can manage all positions" ON public.positions
  FOR ALL USING (is_system_admin());

-- Candidates table policies
CREATE POLICY "System admins can view all candidates" ON public.candidates
  FOR SELECT USING (is_system_admin());

CREATE POLICY "Tenant users can view candidates based on company access" ON public.candidates
  FOR SELECT USING (
    -- Tenant admins see all candidates in their tenant
    (EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND tenant_id = candidates.tenant_id
      AND role = 'tenant_admin'
    ))
    OR
    -- Tenant interviewers see candidates for companies they have access to
    (EXISTS (
      SELECT 1 FROM public.interviewer_company_access ica
      JOIN public.users u ON u.id = ica.user_id
      WHERE ica.user_id = auth.uid()
      AND ica.company_id = candidates.company_id
      AND u.role = 'tenant_interviewer'
    ))
  );

CREATE POLICY "System admins can manage all candidates" ON public.candidates
  FOR ALL USING (is_system_admin());

-- Interview sessions policies
CREATE POLICY "System admins can view all interview sessions" ON public.interview_sessions
  FOR SELECT USING (is_system_admin());

CREATE POLICY "Tenant users can view interview sessions based on position access" ON public.interview_sessions
  FOR SELECT USING (
    -- Tenant admins see all sessions in their tenant
    (EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND tenant_id = interview_sessions.tenant_id
      AND role = 'tenant_admin'
    ))
    OR
    -- Tenant interviewers see sessions for positions in companies they have access to
    (EXISTS (
      SELECT 1 FROM public.positions p
      JOIN public.interviewer_company_access ica ON ica.company_id = p.company_id
      JOIN public.users u ON u.id = ica.user_id
      WHERE p.id = interview_sessions.position_id
      AND ica.user_id = auth.uid()
      AND u.role = 'tenant_interviewer'
    ))
  );

CREATE POLICY "System admins can manage all interview sessions" ON public.interview_sessions
  FOR ALL USING (is_system_admin());

-- Transcript entries policies
CREATE POLICY "System admins can view all transcript entries" ON public.transcript_entries
  FOR SELECT USING (is_system_admin());

CREATE POLICY "Tenant users can view transcript entries based on session access" ON public.transcript_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions s
      WHERE s.id = transcript_entries.session_id
      AND (
        -- System admin
        is_system_admin()
        OR
        -- Tenant admin
        (EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND tenant_id = s.tenant_id
          AND role = 'tenant_admin'
        ))
        OR
        -- Tenant interviewer with access to the position's company
        (EXISTS (
          SELECT 1 FROM public.positions p
          JOIN public.interviewer_company_access ica ON ica.company_id = p.company_id
          JOIN public.users u ON u.id = ica.user_id
          WHERE p.id = s.position_id
          AND ica.user_id = auth.uid()
          AND u.role = 'tenant_interviewer'
        ))
      )
    )
  );

-- RLS policies for new tables

-- Company codes policies
ALTER TABLE public.company_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage all company codes" ON public.company_codes
  FOR ALL USING (is_system_admin());

CREATE POLICY "Tenant admins can view their tenant's company codes" ON public.company_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND tenant_id = company_codes.tenant_id
      AND role = 'tenant_admin'
    )
  );

-- Tenant invitations policies
ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage all tenant invitations" ON public.tenant_invitations
  FOR ALL USING (is_system_admin());

CREATE POLICY "Anyone can view invitations by company code" ON public.tenant_invitations
  FOR SELECT USING (true); -- Needed for signup flow

-- Interviewer company access policies
ALTER TABLE public.interviewer_company_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage all interviewer access" ON public.interviewer_company_access
  FOR ALL USING (is_system_admin());

CREATE POLICY "Tenant admins can manage interviewer access in their tenant" ON public.interviewer_company_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND tenant_id = interviewer_company_access.tenant_id
      AND role = 'tenant_admin'
    )
  );

CREATE POLICY "Interviewers can view their own access" ON public.interviewer_company_access
  FOR SELECT USING (user_id = auth.uid());

-- Billing information policies
ALTER TABLE public.billing_information ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage all billing information" ON public.billing_information
  FOR ALL USING (is_system_admin());

CREATE POLICY "Tenant admins can view their billing information" ON public.billing_information
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND tenant_id = billing_information.tenant_id
      AND role = 'tenant_admin'
    )
  );

-- Invoices policies
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage all invoices" ON public.invoices
  FOR ALL USING (is_system_admin());

CREATE POLICY "Tenant admins can view their invoices" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND tenant_id = invoices.tenant_id
      AND role = 'tenant_admin'
    )
  );

-- Payment history policies
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage all payment history" ON public.payment_history
  FOR ALL USING (is_system_admin());

CREATE POLICY "Tenant admins can view their payment history" ON public.payment_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND tenant_id = payment_history.tenant_id
      AND role = 'tenant_admin'
    )
  );

-- Update trigger for billing_information
CREATE TRIGGER update_billing_information_updated_at BEFORE UPDATE ON public.billing_information
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for invoices
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

