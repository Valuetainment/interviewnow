# Position Creation Flow

This document details the complete end-to-end flow for creating, managing, and viewing positions within the AI Interview Insights Platform.

## Overview

The position creation flow allows users to create structured job positions with AI-generated descriptions and competency requirements. These positions serve as the foundation for candidate matching and interview assessments. The flow encompasses several key components:

1. **Position Creation UI**: Form-based interface for basic position information
2. **AI-Powered Description Generation**: OpenAI integration for detailed position descriptions
3. **Competency Management**: Selection and weighting of job competencies
4. **Position Storage**: Database integration with proper tenant isolation
5. **Position Listing**: Display of available positions with filtering
6. **Position Detail View**: Comprehensive display of position information

## Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Basic Position │     │ AI-Generated    │     │ Competency      │
│  Information    │────▶│ Description     │────▶│ Selection &     │
│                 │     │                 │     │ Weighting       │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Position       │◀────│ Database        │◀────│ Final Position  │
│  Detail View    │     │ Storage         │     │ Validation      │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Database Schema

### Positions Table

```sql
CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  role_overview TEXT,
  key_responsibilities TEXT,
  required_qualifications TEXT,
  preferred_qualifications TEXT,
  benefits TEXT,
  key_competencies_section TEXT,
  experience_level TEXT,
  company_id UUID,
  CONSTRAINT positions_pkey PRIMARY KEY (id),
  CONSTRAINT positions_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies (id),
  CONSTRAINT positions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

CREATE INDEX idx_positions_tenant_id ON public.positions USING btree (tenant_id);
CREATE INDEX idx_positions_company_id ON public.positions USING btree (company_id);
```

### Competencies Table

```sql
CREATE TABLE public.competencies (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT competencies_pkey PRIMARY KEY (id),
  CONSTRAINT competencies_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

CREATE INDEX idx_competencies_tenant_id ON public.competencies USING btree (tenant_id);
```

### Position Competencies Junction Table

```sql
CREATE TABLE public.position_competencies (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  position_id UUID NOT NULL,
  competency_id UUID NOT NULL,
  weight INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT position_competencies_pkey PRIMARY KEY (id),
  CONSTRAINT position_competencies_position_id_fkey FOREIGN KEY (position_id) REFERENCES positions (id) ON DELETE CASCADE,
  CONSTRAINT position_competencies_competency_id_fkey FOREIGN KEY (competency_id) REFERENCES competencies (id) ON DELETE CASCADE
);

CREATE INDEX idx_position_competencies_position_id ON public.position_competencies USING btree (position_id);
CREATE INDEX idx_position_competencies_competency_id ON public.position_competencies USING btree (competency_id);
```

## Row Level Security Policies

The following RLS policies ensure proper tenant isolation and access control:

### Positions Table Policies

```sql
-- Select policy - allow users to view positions from their tenant
CREATE POLICY positions_select_policy ON positions
FOR SELECT TO authenticated
USING (
  tenant_id IN (
    SELECT t.id FROM tenants t
    INNER JOIN user_tenants ut ON t.id = ut.tenant_id
    WHERE ut.user_id = (SELECT auth.uid())
  )
);

-- Insert policy - allow users to create positions in their tenant
CREATE POLICY positions_insert_policy ON positions
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT t.id FROM tenants t
    INNER JOIN user_tenants ut ON t.id = ut.tenant_id
    WHERE ut.user_id = (SELECT auth.uid())
  )
);

-- Update policy - allow users to update positions in their tenant
CREATE POLICY positions_update_policy ON positions
FOR UPDATE TO authenticated
USING (
  tenant_id IN (
    SELECT t.id FROM tenants t
    INNER JOIN user_tenants ut ON t.id = ut.tenant_id
    WHERE ut.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT t.id FROM tenants t
    INNER JOIN user_tenants ut ON t.id = ut.tenant_id
    WHERE ut.user_id = (SELECT auth.uid())
  )
);

-- Delete policy - allow users to delete positions in their tenant
CREATE POLICY positions_delete_policy ON positions
FOR DELETE TO authenticated
USING (
  tenant_id IN (
    SELECT t.id FROM tenants t
    INNER JOIN user_tenants ut ON t.id = ut.tenant_id
    WHERE ut.user_id = (SELECT auth.uid())
  )
);
```

### Competencies Table Policies

```sql
-- Select policy - allow users to view competencies from their tenant
CREATE POLICY competencies_select_policy ON competencies
FOR SELECT TO authenticated
USING (
  tenant_id IN (
    SELECT t.id FROM tenants t
    INNER JOIN user_tenants ut ON t.id = ut.tenant_id
    WHERE ut.user_id = (SELECT auth.uid())
  )
);

-- Insert policy - allow users to create competencies in their tenant
CREATE POLICY competencies_insert_policy ON competencies
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT t.id FROM tenants t
    INNER JOIN user_tenants ut ON t.id = ut.tenant_id
    WHERE ut.user_id = (SELECT auth.uid())
  )
);

-- Update policy - allow users to update competencies in their tenant
CREATE POLICY competencies_update_policy ON competencies
FOR UPDATE TO authenticated
USING (
  tenant_id IN (
    SELECT t.id FROM tenants t
    INNER JOIN user_tenants ut ON t.id = ut.tenant_id
    WHERE ut.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT t.id FROM tenants t
    INNER JOIN user_tenants ut ON t.id = ut.tenant_id
    WHERE ut.user_id = (SELECT auth.uid())
  )
);

-- Delete policy - allow users to delete competencies in their tenant
CREATE POLICY competencies_delete_policy ON competencies
FOR DELETE TO authenticated
USING (
  tenant_id IN (
    SELECT t.id FROM tenants t
    INNER JOIN user_tenants ut ON t.id = ut.tenant_id
    WHERE ut.user_id = (SELECT auth.uid())
  )
);
```

### Position Competencies Table Policies

```sql
-- Position competencies inherit access control from positions and competencies tables
CREATE POLICY position_competencies_select_policy ON position_competencies
FOR SELECT TO authenticated
USING (
  position_id IN (
    SELECT id FROM positions
    WHERE tenant_id IN (
      SELECT t.id FROM tenants t
      INNER JOIN user_tenants ut ON t.id = ut.tenant_id
      WHERE ut.user_id = (SELECT auth.uid())
    )
  )
);

-- Similar policies for INSERT, UPDATE, DELETE operations...
```

## Edge Functions

### generate-position Edge Function

The `generate-position` Edge Function uses OpenAI to generate detailed position descriptions based on minimal user input:

**Endpoint**: `/functions/generate-position`

**Input**:
```json
{
  "title": "QA Analyst",
  "shortDescription": "Looking for a detail-oriented QA Analyst to join our team",
  "experienceLevel": "Mid-level"
}
```

**Output**:
```json
{
  "role_overview": "We are seeking a detail-oriented and proactive QA Analyst to join our dynamic team...",
  "key_responsibilities": "- Develop, execute, and maintain test plans...",
  "required_qualifications": "- Bachelor's degree in Computer Science...",
  "preferred_qualifications": "- Experience with automated testing tools...",
  "benefits": "- Competitive salary and benefits...",
  "key_competencies_section": "The ideal candidate will excel in quality assurance practices...",
  "suggested_competencies": [
    {
      "name": "Technical Knowledge",
      "description": "Depth of technical skills and expertise related to the role",
      "suggested_weight": 30
    },
    // Additional competencies...
  ]
}
```

**Implementation Notes**:
- Uses OpenAI's GPT-4o-mini model for generation
- Follows Supabase Edge Function best practices (Deno.serve, npm: imports)
- Includes comprehensive error handling and CORS support
- Disables JWT verification for more reliable access
- Uses service role key for database operations when necessary

## Frontend Components

### CreatePosition Component

Key features of the position creation UI:
- Multi-step form with save logic
- Form validation using Zod schemas
- API integration with generate-position Edge Function
- Interactive competency weighting UI with validation
- Comprehensive error handling and user feedback

### Positions Listing Component

Key features of the positions listing UI:
- Fetches real positions from database using tenant isolation
- Sorting and filtering capabilities
- Card-based display with key position information
- Loading states and error handling
- Navigation to position detail view

### PositionDetail Component

Key features of the position detail UI:
- Tabbed interface for different information categories
- Detailed display of all position fields
- Competency visualization with weight distribution
- Candidate matching display (using mock data for now)
- Loading states and error handling

## Common Failure Points and Solutions

### RLS Policy Issues

**Problem**: Positions could not be created due to incorrect RLS policies using non-existent JWT claims.

**Solution**: Implemented proper RLS policies using tenant lookup from user ID instead of JWT claims.

### Competency Management

**Problem**: Competencies table had similar RLS policy issues.

**Solution**: Applied the same RLS policy fixes to competencies table.

### Position Listing

**Problem**: Positions listing page was using mock data instead of fetching real positions.

**Solution**: Updated component to fetch real positions from database with proper tenant isolation.

### Error Handling

**Problem**: Limited error information when saving positions.

**Solution**: Added detailed error logging and improved error messages to help troubleshoot issues.

## Testing and Verification

1. **Unit Testing**: Components tested individually for correct rendering and state management.
2. **Integration Testing**: Position creation flow tested end-to-end in development environment.
3. **Production Verification**: Complete flow verified in production environment.
4. **Manual Testing**: All error cases and edge cases manually tested.

## Usage Example

Here's an example of using the position creation flow:

1. User navigates to `/create-position`
2. User fills out basic position information:
   - Title: "QA Analyst"
   - Short Description: "Looking for a detail-oriented QA Analyst to join our team"
   - Experience Level: "Mid-level"
3. User clicks "Generate Description" button
4. System calls `generate-position` Edge Function to create detailed description
5. User reviews generated content and makes any adjustments
6. User proceeds to competency selection and weighting
7. User adjusts weights to ensure they sum to 100%
8. User saves the position
9. System stores position and competencies in database with proper tenant isolation
10. User is redirected to position detail view

## API Endpoints and Data Models

### Position Creation

**Endpoint**: `POST /positions`

**Request Body**:
```typescript
interface CreatePositionRequest {
  title: string;
  description?: string;
  role_overview?: string;
  key_responsibilities?: string;
  required_qualifications?: string;
  preferred_qualifications?: string;
  benefits?: string;
  key_competencies_section?: string;
  experience_level?: string;
  company_id?: string;
  competencies: {
    id: string;
    name: string;
    description?: string;
    weight: number;
  }[];
}
```

**Response Body**:
```typescript
interface CreatePositionResponse {
  id: string;
  title: string;
  // Other position fields...
  created_at: string;
}
```

### Position Retrieval

**Endpoint**: `GET /positions/{id}`

**Response Body**:
```typescript
interface PositionResponse {
  id: string;
  title: string;
  description?: string;
  role_overview?: string;
  key_responsibilities?: string;
  required_qualifications?: string;
  preferred_qualifications?: string;
  benefits?: string;
  key_competencies_section?: string;
  experience_level?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
  competencies?: {
    id: string;
    name: string;
    description?: string;
    weight: number;
  }[];
}
```

## Conclusion

The Position Creation flow is a core component of the AI Interview Insights Platform, enabling users to create detailed job descriptions with AI assistance and manage competency requirements for candidates. The flow has been fully implemented, tested, and verified in production, with robust error handling and comprehensive documentation.

## Future Enhancements

1. **Assessment Engine Integration**: Direct linking between positions and assessment criteria.
2. **Candidate Matching**: Automated matching of candidates to positions based on competencies.
3. **Position Templates**: Ability to create and reuse position templates.
4. **Advanced Filtering**: Enhanced search and filtering for positions listing.
5. **Analytics**: Position-level analytics for hiring effectiveness. 