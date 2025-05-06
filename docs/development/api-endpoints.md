# API Endpoints Documentation

This document provides detailed information about all API endpoints in the AI Interview Insights Platform, focusing on Edge Functions deployed to Supabase.

## Overview

Our platform uses Supabase Edge Functions for various AI-powered operations. Each Edge Function follows these standards:

- Uses Deno runtime
- Implements CORS handling for browser compatibility
- Returns proper HTTP status codes for errors
- Uses TypeScript for type safety
- Provides JSON responses
- Follows the proper error handling pattern with try/catch blocks

## Edge Function Endpoints

### 1. Process Resume (`/functions/process-resume`)

**Purpose**: Extracts text from uploaded PDF resumes using PDF.co API.

**Request**:
```http
POST /functions/process-resume
Content-Type: application/json

{
  "resumeUrl": "https://xxxx.supabase.co/storage/v1/object/public/resumes/example.pdf",
  "filename": "example.pdf"
}
```

**Response**:
```json
{
  "text": "Extracted text content from the resume...",
  "pages": 2,
  "status": "success"
}
```

**Error Responses**:
- `400`: Invalid input parameters
- `500`: PDF processing error or API failure

**Authentication**: 
- Requires valid Supabase JWT or service role key

**Dependencies**:
- PDF.co API

**Notes**:
- Maximum file size: 10MB
- Supported format: PDF only

---

### 2. Analyze Resume (`/functions/analyze-resume`)

**Purpose**: Analyzes extracted resume text using OpenAI to create structured candidate data.

**Request**:
```http
POST /functions/analyze-resume
Content-Type: application/json

{
  "text": "Extracted text content from the resume...",
  "tenant_id": "11111111-1111-1111-1111-111111111111"
}
```

**Response**:
```json
{
  "analysis": {
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+1 (555) 123-4567",
    "summary": "Experienced software engineer with 5+ years...",
    "skills": ["JavaScript", "React", "Node.js", "TypeScript"],
    "experience": [
      {
        "company": "Tech Company",
        "position": "Senior Developer",
        "startDate": "2019-01",
        "endDate": "Present",
        "description": "Led development team on various projects..."
      }
    ],
    "education": [
      {
        "institution": "University of Technology",
        "degree": "B.S. Computer Science",
        "year": "2018"
      }
    ]
  },
  "status": "success"
}
```

**Error Responses**:
- `400`: Missing or invalid parameters
- `500`: OpenAI API error or processing failure

**Authentication**:
- Requires valid Supabase JWT or service role key

**Dependencies**:
- OpenAI API (GPT-4o-mini model)

**Notes**:
- Optimized for technical resumes
- Can handle various resume formats
- Analysis quality depends on text extraction quality

---

### 3. Enrich Candidate (`/functions/enrich-candidate`)

**Purpose**: Enriches candidate data with additional information from People Data Labs API.

**Request**:
```http
POST /functions/enrich-candidate
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "tenant_id": "11111111-1111-1111-1111-111111111111",
  "candidate_id": "22222222-2222-2222-2222-222222222222"
}
```

**Response**:
```json
{
  "enriched_data": {
    "full_name": "Jane Marie Smith",
    "linkedin_url": "https://linkedin.com/in/janesmithdev",
    "work_experience": [
      {
        "company": {
          "name": "Tech Solutions Inc.",
          "size": "51-200",
          "industry": "Software Engineering"
        },
        "title": "Senior Software Engineer",
        "start_date": "2019-01-01",
        "end_date": null,
        "location": "San Francisco, CA",
        "description": "Leading frontend development team..."
      }
    ],
    "skills": ["React", "TypeScript", "AWS", "Node.js", "GraphQL"],
    "education": [
      {
        "school": "University of California, Berkeley",
        "degree": "Bachelor of Science",
        "field_of_study": "Computer Science",
        "end_date": "2018-05-01"
      }
    ],
    "location": {
      "name": "San Francisco, CA",
      "country": "US",
      "region": "California"
    }
  },
  "status": "success"
}
```

**Error Responses**:
- `400`: Missing parameters
- `404`: Candidate not found
- `500`: PDL API error or processing failure

**Authentication**:
- Requires valid Supabase JWT or service role key

**Dependencies**:
- People Data Labs API

**Notes**:
- Non-blocking operation (client should not wait for completion)
- Data saved to candidate_profiles table
- May return limited data based on PDL match confidence

---

### 4. Generate Position (`/functions/generate-position`)

**Purpose**: Creates AI-generated position descriptions and suggested competencies based on minimal input.

**Request**:
```http
POST /functions/generate-position
Content-Type: application/json

{
  "title": "Senior Frontend Developer",
  "shortDescription": "Looking for an experienced frontend developer to join our team",
  "experienceLevel": "Senior"
}
```

**Response**:
```json
{
  "role_overview": "We are seeking an experienced Senior Frontend Developer to join our dynamic team...",
  "key_responsibilities": "- Design and implement responsive user interfaces...\n- Collaborate with UX designers...",
  "required_qualifications": "- 5+ years of experience with JavaScript and modern frameworks...",
  "preferred_qualifications": "- Experience with GraphQL and state management libraries...",
  "benefits": "- Competitive salary and comprehensive benefits package...",
  "key_competencies_section": "The ideal candidate will excel in frontend architecture, UI/UX implementation, and technical leadership.",
  "suggested_competencies": [
    {
      "name": "Technical Knowledge",
      "description": "Depth of JavaScript and framework expertise",
      "suggested_weight": 30
    },
    {
      "name": "Problem Solving",
      "description": "Ability to debug and solve complex UI/UX issues",
      "suggested_weight": 25
    },
    {
      "name": "Communication",
      "description": "Ability to communicate technical concepts clearly",
      "suggested_weight": 20
    },
    {
      "name": "UI/UX Design",
      "description": "Understanding of design principles and implementation",
      "suggested_weight": 15
    },
    {
      "name": "Teamwork",
      "description": "Collaborate effectively with cross-functional teams",
      "suggested_weight": 10
    }
  ],
  "status": "success"
}
```

**Error Responses**:
- `400`: Missing or invalid parameters
- `500`: OpenAI API error or processing failure

**Authentication**:
- Requires valid Supabase JWT or service role key

**Dependencies**:
- OpenAI API (GPT-4o-mini model)

**Notes**:
- Generation uses GPT-4o-mini model
- Competencies are selected based on position requirements
- Always generates 5 competencies with weights totaling 100%

---

### 5. Check Environment (`/functions/check-env`)

**Purpose**: Verifies API key access and environment configuration.

**Request**:
```http
GET /functions/check-env
```

**Response**:
```json
{
  "status": "success",
  "checks": {
    "openai": true,
    "pdfco": true,
    "pdl": true
  },
  "env": "production"
}
```

**Error Responses**:
- `500`: Missing environment variables or invalid keys

**Authentication**:
- Requires valid Supabase JWT or service role key

**Dependencies**:
- None (checks other API dependencies)

**Notes**:
- For diagnostic purposes only
- Does not reveal actual API keys, only checks validity

---

### 6. Transcript Processor (`/functions/transcript-processor`)

**Purpose**: Processes interview transcripts to extract insights and assessment data.

**Request**:
```http
POST /functions/transcript-processor
Content-Type: application/json

{
  "transcript": "Full interview transcript text...",
  "position_id": "33333333-3333-3333-3333-333333333333",
  "candidate_id": "22222222-2222-2222-2222-222222222222",
  "competencies": [
    {
      "id": "44444444-4444-4444-4444-444444444444",
      "name": "Technical Knowledge",
      "weight": 30
    },
    {
      "id": "55555555-5555-5555-5555-555555555555",
      "name": "Communication",
      "weight": 20
    }
  ]
}
```

**Response**:
```json
{
  "analysis": {
    "competency_scores": [
      {
        "competency_id": "44444444-4444-4444-4444-444444444444",
        "name": "Technical Knowledge",
        "score": 85,
        "evidence": [
          "Candidate demonstrated deep understanding of React hooks",
          "Correctly explained closure concepts in JavaScript"
        ]
      },
      {
        "competency_id": "55555555-5555-5555-5555-555555555555",
        "name": "Communication",
        "score": 90,
        "evidence": [
          "Clearly articulated complex concepts",
          "Used appropriate technical terminology"
        ]
      }
    ],
    "overall_impression": "Strong technical candidate with excellent communication skills...",
    "areas_of_strength": ["JavaScript expertise", "Problem-solving approach"],
    "areas_for_improvement": ["Could improve knowledge of backend technologies"]
  },
  "status": "success"
}
```

**Error Responses**:
- `400`: Missing parameters or invalid data
- `500`: OpenAI API error or processing failure

**Authentication**:
- Requires valid Supabase JWT or service role key

**Dependencies**:
- OpenAI API (GPT-4 model)

**Notes**:
- Processing may take longer for extensive transcripts
- Analysis quality depends on transcript quality
- Competency scores are normalized to 0-100 scale

## Direct API Calls vs. Client-Side Integration

For client-side integration, use the fetch API with the following pattern:

```typescript
const callEdgeFunction = async (functionName, payload) => {
  const response = await fetch(
    `${process.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        'apikey': process.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Error calling ${functionName}`);
  }

  return await response.json();
};
```

## Error Handling Best Practices

All API calls should implement:

1. **Request validation** - Validate inputs before processing
2. **Try/catch blocks** - Always wrap API calls in try/catch
3. **Specific error messages** - Return meaningful error details
4. **Appropriate status codes** - Use standard HTTP status codes
5. **Fallback strategies** - Implement graceful degradation when services fail

## Authentication Requirements

All Edge Functions require authentication:

- **JWT token** - For user-context operations 
- **Service role key** - For administrative operations

Functions verify authentication or use service role internally based on operation context.

## Rate Limiting and Quotas

- OpenAI API has token usage limits
- PDF.co has per-day document processing limits
- PDL has monthly query limits

The system implements exponential backoff for OpenAI API rate limits. 