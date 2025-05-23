# API Documentation

This directory contains API documentation for the AI Interview Insights Platform.

## 📚 Available Documentation

### OpenAPI/Swagger Documentation
- **[openapi.yaml](./openapi.yaml)** - OpenAPI 3.0 specification for all Edge Functions
- **[Swagger UI](./index.html)** - Interactive API documentation (open in browser)
- **[Edge Function Details](../development/api-endpoints.md)** - Comprehensive documentation with examples

## 🚀 Quick Start

### View API Documentation Locally
```bash
# From project root
cd docs/api
python -m http.server 8000
# Open http://localhost:8000 in your browser
```

### Authentication
All API endpoints require a Supabase JWT token with the following structure:
```json
{
  "sub": "user-uuid",
  "app_metadata": {
    "tenant_id": "tenant-uuid"
  }
}
```

Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📋 Available Endpoints

### Resume Processing
- `POST /process-resume` - Extract text from PDF
- `POST /analyze-resume` - Analyze resume with AI

### Candidates
- `POST /enrich-candidate` - Enrich profile with People Data Labs

### Positions
- `POST /generate-position` - Generate job description and competencies

### Interviews
- `POST /interview-start` - Initialize WebRTC interview session
- `POST /transcript-processor` - Process interview transcripts

## 🧪 Testing the API

### Using Swagger UI
1. Open the Swagger UI in your browser
2. Click "Authorize" and enter your JWT token
3. Try out any endpoint directly from the documentation

### Using cURL
```bash
# Example: Analyze a resume
curl -X POST https://your-project.supabase.co/functions/v1/analyze-resume \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "John Doe, Software Engineer...",
    "candidate_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### Using Postman
Import the OpenAPI specification:
1. Open Postman
2. Click Import → File → Select `openapi.yaml`
3. Set your JWT token in the collection authorization

## 🔧 Updating the Documentation

When adding new endpoints:
1. Update `openapi.yaml` with the new endpoint specification
2. Include request/response schemas and examples
3. Add appropriate tags for grouping
4. Test the endpoint in Swagger UI

## 📦 Client SDK Generation

Generate TypeScript client from the OpenAPI spec:
```bash
npm install -g @openapitools/openapi-generator-cli
openapi-generator-cli generate -i openapi.yaml -g typescript-fetch -o ../src/api-client
``` 