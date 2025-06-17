# Edge Function Version Tracking

This document tracks all Supabase Edge Functions with their current versions, deployment dates, and key changes.

**Last Updated:** December 19, 2024

## Active Edge Functions

| Function Name | Current Version | Deployment Date | Status | Key Changes |
|---------------|----------------|----------------|--------|-------------|
| interview-transcript-batch | v1 | December 19, 2024 | ACTIVE | NEW: Batch processing for transcripts, reduces DB calls by 90% |
| interview-prepper | v3 | June 13, 2025 | ACTIVE | Pre-analyzes candidates for personalized interviews |
| interview-start | v22 | June 13, 2025 | ACTIVE | Enhanced with interview-prepper integration |
| interview-transcript | v15 | June 10, 2025 | ACTIVE | Fixed missing source_architecture column |
| transcript-processor | v13 | May 22, 2025 | ACTIVE | Enhanced performance with better data chunking |
| analyze-resume | v46 | May 2, 2025 | ACTIVE | Upgraded to GPT-4o-mini for better analysis |
| process-resume | v40 | May 2, 2025 | ACTIVE | Improved PDF.co integration |
| generate-position | v12 | May 6, 2025 | ACTIVE | Enhanced prompt for job descriptions |
| enrich-candidate | v35 | May 2, 2025 | ACTIVE | Enhanced PDL field mapping |
| check-env | v18 | April 30, 2025 | ACTIVE | Environment validation |

## Version History

### interview-transcript-batch
- v1 (December 19, 2024): Initial implementation - accepts up to 50 transcript entries per batch, validates session existence, uses single DB transaction

### interview-prepper
- v3 (June 13, 2025): Added comprehensive candidate analysis with fit scores
- v2 (June 12, 2025): Enhanced competency mapping
- v1 (June 11, 2025): Initial implementation

### interview-start
- v22 (June 13, 2025): Integrated interview-prepper for enhanced AI context
- v21 (June 12, 2025): Added personalized greeting support
- v6 (May 31, 2024): Fixed VM isolation security issue, creating unique VM per session instead of per tenant
- v5 (May 20, 2024): Added support for hybrid architecture with direct OpenAI WebRTC
- v4 (May 15, 2024): Improved error handling and added retry logic
- v3 (May 10, 2024): Added support for tenant isolation in VM naming
- v2 (May 5, 2024): Enhanced JWT handling with better authentication
- v1 (May 1, 2024): Initial implementation for SDP proxy approach

### interview-transcript
- v4 (May 20, 2024): Added support for both SDP proxy and hybrid approaches
- v3 (May 15, 2024): Improved transcript formatting and storage
- v2 (May 10, 2024): Enhanced security with better token validation
- v1 (May 5, 2024): Initial implementation for transcript processing

### transcript-processor
- v5 (May 20, 2024): Enhanced performance with better data chunking and storage optimization
- v4 (May 15, 2024): Added support for real-time updates via WebSockets
- v3 (May 12, 2024): Improved error handling and recovery mechanisms
- v2 (May 8, 2024): Added support for multiple transcript formats
- v1 (May 5, 2024): Initial implementation for basic transcript processing

## Deployment Guidelines

When deploying new versions of Edge Functions:

1. Increment the version number in the function code comments
2. Update this document with the new version, date, and key changes
3. Test the function in development environment before deployment
4. Deploy to production using `supabase functions deploy <function-name>`
5. Verify the function is working correctly in production
6. Update related documentation to reflect new functionality

## Status Legend

- **ACTIVE**: Function is deployed and working correctly in production
- **DEPRECATED**: Function is still available but being phased out
- **SUSPENDED**: Function is temporarily disabled
- **DEVELOPMENT**: Function is in development and not yet deployed to production

## Monitoring

To check the status of Edge Functions in production:

```bash
supabase functions list
```

To get detailed logs for a specific function:

```bash
supabase functions logs <function-name>
```

## Rollback Procedure

If a new version has issues in production:

1. Identify the last stable version from this document
2. Check out that version from version control
3. Deploy using `supabase functions deploy <function-name>`
4. Verify functionality is restored
5. Update this document to reflect the rollback

## JWT Hook Configuration

### auth.custom_access_token_hook
- **Status:** ACTIVE (June 3, 2025)
- **Purpose:** Adds tenant_id to JWT claims for RLS policies
- **Configuration:** Set in Supabase Dashboard > Authentication > Hooks
- **Key Implementation:**
  ```sql
  CREATE OR REPLACE FUNCTION auth.custom_access_token_hook(event JSONB)
  RETURNS JSONB AS $$
  -- Adds tenant_id from user_metadata to JWT claims
  ```
- **Important Notes:**
  - Users must sign out and sign back in to receive updated JWT tokens
  - Resolves 403 Forbidden errors when creating interview sessions
  - Enables proper tenant isolation in RLS policies 