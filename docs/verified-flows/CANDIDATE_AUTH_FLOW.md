# Candidate Authentication & Multi-Tenant Flow

## Overview

This document describes the authentication flow for candidates, enabling them to:
- Register and authenticate in the platform
- Connect to multiple tenant companies
- Access interview sessions across different companies
- Manage their profile and resume information

## Database Schema

### Key Tables

1. **candidates**
   - Main candidate information table
   - Now includes auth-related columns (`auth_id`, `auth_email`)
   - Stores resume data and parsed information

2. **candidate_tenants**
   - Junction table for many-to-many candidate-tenant relationships
   - Enables candidates to connect with multiple companies
   - Tracks relationship status and history

3. **interview_invitations**
   - Manages secure tokens for invitation and verification
   - Links candidates to specific interview sessions

### Schema Changes

The following changes were applied to support this flow:

```sql
-- Added auth fields to candidates table
ALTER TABLE candidates 
ADD COLUMN auth_id UUID REFERENCES auth.users(id),
ADD COLUMN auth_email TEXT,
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Created junction table for candidate-tenant relationships
CREATE TABLE candidate_tenants (
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  relationship_type TEXT NOT NULL DEFAULT 'candidate',
  invitation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_interaction TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (candidate_id, tenant_id)
);
```

## Authentication Flow

### Registration Process

1. **Invitation-Based Registration**
   - Candidate receives email invitation from a tenant
   - Clicks secure token link to accept invitation
   - Creates account or connects existing account
   - Account linked to candidate record through `auth_id`

2. **Future Enhancement: Resume Upload Registration**
   - Public page allows resume upload without prior account
   - System creates candidate record with pending status
   - Email sent for verification and account completion
   - After verification, account linked to candidate record

### Row Level Security Policies

```sql
-- Candidate can see their own tenant relationships
CREATE POLICY "Candidates can view their own tenant relationships" ON candidate_tenants
  FOR SELECT
  USING (candidate_id IN (
    SELECT c.id FROM candidates c
    WHERE c.auth_id = auth.uid()
  ));

-- Candidates can view their own profile
CREATE POLICY "Candidates can view their own profile" ON candidates
  FOR SELECT
  USING (auth_id = auth.uid());
```

## Multi-Tenant Support

Candidates can maintain relationships with multiple tenant companies, with the following features:

- Each relationship tracked separately in `candidate_tenants`
- Separate status tracking per tenant relationship
- Interview sessions grouped by tenant
- Profile information shared across tenants

## Invitation System

The system includes a secure invitation function to handle candidate invitations:

```sql
-- Function to create candidate invitation
CREATE FUNCTION create_candidate_invitation(
  p_tenant_id UUID,
  p_candidate_email TEXT,
  p_position_id UUID DEFAULT NULL
) RETURNS UUID 
```

This function:
- Creates or finds the candidate record
- Creates an interview session if position provided
- Generates a secure invitation token
- Establishes the candidate-tenant relationship

## Frontend Components (Planned)

1. **CandidateRegistration**
   - Email verification
   - Account creation
   - Profile completion

2. **CandidateDashboard**
   - Overview of all tenant relationships
   - Upcoming interviews across companies
   - Profile management

3. **InterviewPreparation**
   - Company-specific preparation resources
   - Position details and requirements
   - Interview scheduling

## API Endpoints (Planned)

1. `/api/candidate/register`
   - Handles account creation and verification

2. `/api/candidate/invitations`
   - Lists and manages invitations

3. `/api/candidate/interviews`
   - Retrieves interview sessions from all tenants

4. `/api/candidate/profile`
   - Manages candidate profile information

## Security Considerations

- Strict RLS policies ensure candidates only see their own data
- Invitation tokens are short-lived and single-use
- Clear separation between tenant and candidate authentication
- Audit logging of all invitation and authentication events 