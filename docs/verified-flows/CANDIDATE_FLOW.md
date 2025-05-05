# Candidate Creation Flow Documentation

## Overview

This document outlines the complete candidate creation flow, from resume upload to profile display, as implemented in the AI Interview Insights Platform. The flow incorporates multiple Supabase Edge Functions, AI processing, and third-party integrations to create rich candidate profiles.

## Architecture

### Database Schema

#### Candidates Table
```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  resume_text TEXT,
  resume_analysis JSONB,
  skills TEXT[],
  experience JSONB,
  education JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Candidate_Profiles Table
```sql
CREATE TABLE candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- PDL specific fields
  pdl_id TEXT,
  pdl_likelihood INTEGER,
  last_enriched_at TIMESTAMPTZ,
  
  -- Personal info
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  gender TEXT,
  birth_year INTEGER,
  
  -- Location information
  location_name TEXT,
  location_region TEXT,
  location_country TEXT,
  
  -- Work information
  job_title TEXT,
  job_company_name TEXT,
  
  -- Social profiles
  linkedin_url TEXT,
  github_url TEXT,
  
  -- Arrays and structured data
  skills TEXT[],
  experience JSONB,
  education JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT candidate_profiles_candidate_id_key UNIQUE (candidate_id, tenant_id)
);
```

### Edge Functions

The system leverages three key edge functions:

1. **process-resume**: Extracts text from PDF resumes
2. **analyze-resume**: Analyzes resume text using AI to extract structured data
3. **enrich-candidate**: Enriches candidate profiles with third-party data (PDL)

## End-to-End Flow

### 1. Resume Upload

**Component**: `ResumeUploader.tsx`

The flow begins when a user uploads a resume PDF:

1. User selects a PDF file through drag-and-drop or file selector
2. Frontend validates the file (type: PDF, size: <10MB)
3. PDF is uploaded to Supabase Storage in the "resumes" bucket
4. Upload path follows the pattern: `${tenantId}/${timestamp}_${filename}`
5. A public URL is generated for the uploaded file

### 2. Text Extraction

**Edge Function**: `process-resume`

Once the PDF is stored:

1. Frontend calls the process-resume edge function with the PDF's public URL
2. The edge function uses PDF.co API to extract text content
3. PDF.co performs OCR if needed to ensure complete text extraction
4. Extracted text is returned to the frontend

```typescript
// Example API call
const processResumeResponse = await fetch(`${supabaseUrl}/functions/v1/process-resume`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  },
  body: JSON.stringify({ pdfUrl: fileUrl })
});
```

### 3. AI Analysis

**Edge Function**: `analyze-resume`

The extracted text is then analyzed:

1. Frontend calls the analyze-resume edge function with the extracted text
2. The edge function uses OpenAI GPT-4o-mini to analyze the resume
3. AI structures the data into categories: personal info, skills, experience, education, etc.
4. Structured JSON data is returned to the frontend

```typescript
// Example API call
const analyzeResumeResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-resume`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  },
  body: JSON.stringify({ resumeText: processedData.text })
});
```

### 4. Database Storage

After analysis:

1. Frontend creates a new record in the `candidates` table with:
   - Basic information (name, email, phone)
   - Resume URL and extracted text
   - Structured analysis data (JSON)
   - Relevant arrays (skills, experience, education)

2. The candidate's tenant_id is assigned based on the authenticated user's tenant

```typescript
const { data: candidate, error: dbError } = await supabase
  .from('candidates')
  .insert({
    tenant_id: effectiveTenantId,
    full_name: parsedAnalysis.personal_info.full_name,
    email: parsedAnalysis.personal_info.email || '',
    phone: parsedAnalysis.personal_info.phone || '',
    resume_url: fileUrl,
    resume_text: processedData.text,
    skills: parsedAnalysis.skills || [],
    experience: parsedAnalysis.experience || {},
    education: parsedAnalysis.education || [],
    resume_analysis: parsedAnalysis
  })
  .select('id')
  .single();
```

### 5. Profile Enrichment

**Edge Function**: `enrich-candidate`

Once the candidate is created:

1. Frontend makes a non-blocking call to the enrich-candidate edge function
2. The function takes candidate ID, name, email, and phone
3. It queries the People Data Labs (PDL) API to fetch enriched profile data
4. The enriched data is stored in the `candidate_profiles` table
5. The function returns the match likelihood and profile ID

```typescript
// Example API call
const enrichCandidateResponse = await fetch(`${supabaseUrl}/functions/v1/enrich-candidate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  },
  body: JSON.stringify({
    candidate_id: candidate.id,
    email: parsedAnalysis.personal_info.email,
    name: parsedAnalysis.personal_info.full_name,
    phone: parsedAnalysis.personal_info.phone
  })
});
```

### 6. Profile Display

**Component**: `CandidateProfile.tsx`

Finally, the user is redirected to the candidate profile page:

1. Component fetches data from both `candidates` and `candidate_profiles` tables
2. Data is merged following a priority system (enriched data preferred)
3. Component implements fallbacks if either data source is missing
4. UI visually distinguishes enriched data with blue text
5. A tabbed interface shows profile, resume PDF, and assessments

## Key Technical Patterns

### Multi-tenant Isolation

All data is isolated by tenant:
- Every table includes a `tenant_id` column
- RLS policies enforce tenant isolation
- Storage paths include tenant ID for isolation

### Fallback Mechanisms

The system implements robust fallbacks:
1. Tenant ID lookup falls back to:
   - JWT claims -> User record -> Any tenant (development only)
2. Profile data display falls back to:
   - PDL enriched data -> Resume AI analysis -> Base candidate record
3. Database tables handle missing cases:
   - If candidate_profiles table doesn't exist, UI still works with candidate data

### Direct API Calls

Edge functions are called using direct fetch rather than Supabase client:
```typescript
const response = await fetch(`${supabaseUrl}/functions/v1/function-name`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  },
  body: JSON.stringify(data)
});
```

### Type Safety

The implementation includes robust TypeScript types:
- Proper interfaces for database tables
- Type handling for JSON fields
- Safe JSON parsing with error handling
- Defensive array checking

## Error Handling

The flow includes comprehensive error handling:
1. File validation during upload
2. Service availability checks
3. API error handling with descriptive messages
4. Database error handling
5. UI feedback for all processing stages
6. Fallbacks when services are unavailable

## Security Considerations

1. PDF files are stored with public access for PDF.co processing
2. RLS policies restrict data access to users within the same tenant
3. Edge functions use service role for database operations
4. Client operations use row-level security for authorization

## Performance Optimization

1. Non-blocking profile enrichment
2. Parallel data fetching with Promise.all
3. Efficient data structures for quick profile rendering
4. Optimized PDF handling
5. Caching of processed data

## Conclusion

The candidate creation flow demonstrates a sophisticated implementation of:
- AI-powered document processing
- Third-party data enrichment
- Robust error handling
- Thoughtful UX with appropriate feedback
- Secure multi-tenant design

This architecture provides a resilient and scalable approach to candidate management that gracefully handles the complexities of resume processing and data enrichment. 