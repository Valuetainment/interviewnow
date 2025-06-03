# AI Interview Insights Platform - Active Context

## Current Date: June 2, 2025

## Project Overview
AI Interview Insights Platform - A comprehensive solution for conducting and analyzing AI-powered interviews. The platform uses Supabase for backend services, React/TypeScript for the frontend, and integrates OpenAI's GPT-4o Realtime API for voice interactions.

## Latest Updates (June 2, 2025)
- **Critical Discovery**: Identified architectural mismatch in WebRTC implementation
  - Frontend sending SDP offers for WebRTC peer connection
  - Fly.io server incorrectly trying to proxy WebRTC as WebSocket
  - OpenAI supports WebRTC with ephemeral tokens (not WebSocket proxy)
- **Implemented Fix**: Transformed Fly.io server to ephemeral token provider
  - Added `/api/realtime/sessions` endpoint for token generation
  - Updated frontend hooks to use ephemeral tokens
  - Maintaining backward compatibility during transition
  - Successfully deployed backend to production
- **Ready for Testing**: Direct browser ↔ OpenAI WebRTC connection with ephemeral tokens

## Current State & Issues

### ✅ Fix Implemented
**WebRTC Ephemeral Token Flow**
- **Backend**: Deployed `/api/realtime/sessions` endpoint to interview-hybrid-template on Fly.io
- **Frontend**: Updated useOpenAIConnection hook to fetch and use ephemeral tokens
- **Architecture**: Hybrid mode now uses direct WebRTC with OpenAI via ephemeral tokens
- **Ready**: For production testing with real interview sessions

### Current Work Focus
1. **Immediate**: Test ephemeral token flow in production
2. **Next**: Verify audio flows directly between browser and OpenAI
3. **Then**: Monitor transcript relay back to our server

### Production Status
- Edge function fix deployed (URL without `/ws` path)
- Fly.io server deployed with ephemeral token endpoint
- Frontend hooks updated to support ephemeral tokens
- Ready for production testing

## Current Project Status
The project has made significant progress in establishing the frontend foundation. We have set up the project structure, created layout components, and configured authentication. Most importantly, we've established a local Supabase development environment with the complete database schema and storage buckets in place. We have also completed implementation of all navigation components (Navbar, Sidebar, Header), enhanced the authentication UI with proper Supabase integration, and implemented a comprehensive dashboard overview experience. We've now completed the resume processing flow, enabling users to upload, process, and analyze candidate resumes. We've also implemented the position creation feature with AI-powered description generation and competency management. Most recently, we've implemented the interview session management interface with a comprehensive testing infrastructure, enhanced the candidate management system with People Data Labs integration, established a complete CI/CD pipeline with GitHub, Supabase, and Vercel integration, and fixed critical issues with authentication and tenant association in the production environment. The latest improvements include storage configuration in production, RLS policy fixes, Edge Function optimization to ensure the resume processing workflow works correctly in the production environment, and the implementation of a robust CandidateProfile page with proper data handling and enhanced display based on the MVP implementation patterns. We've also fixed company creation in production by addressing RLS policies and tenant_id handling, improved the UI navigation by removing redundant elements and simplifying the user experience, and fixed position creation by resolving RLS policy issues that were preventing positions from being saved to the database. We've also completed an evaluation of infrastructure platforms for interview processing, comparing E2B and Fly.io, with a recommendation to use Fly.io for its superior multi-tenant isolation, burstable CPU capacity, and better strategic alignment with our needs. Most recently, we've successfully completed a Fly.io proof-of-concept for interview transcription processing, validating the technical approach with WebSockets and real-time data transmission. We've extended our testing by deploying the proof-of-concept to Fly.io, fixing WebSocket connectivity issues, implementing simulation mode, and successfully testing multi-region deployment across Miami (US) and Frankfurt (Europe). We've documented our security findings and created a comprehensive TEST_SUMMARY.md that confirms Fly.io meets our requirements for hosting the real-time interview transcription service. We've also created comprehensive documentation of our authentication and permissions system, including both user and candidate authentication flows, and implemented database schema changes to support a multi-tenant candidate experience. We've completely implemented and integrated both a WebRTC SDP proxy and a hybrid OpenAI approach for real-time interview transcription. The implementation uses a sophisticated hooks-based architecture for better maintainability and has been fully integrated into the main application. Test routes are available at /test/ngrok, /test/full, /test/openai, and /test/webrtc-hooks to validate different aspects of the functionality. The WebRTC implementation has now been refactored using a hooks-based architecture that eliminates circular dependencies and creates a more maintainable, modular system. We've completed unit tests for all WebRTC hooks, fixed production routing issues, resolved JS errors in the production bundle, and cleaned up the testing structure to focus exclusively on the hybrid architecture approach. We've also implemented and tested a critical security fix in the WebRTC VM isolation model, ensuring per-session isolation instead of per-tenant isolation.

**Latest updates (June 3, 2025):**
- Successfully deployed and tested WebRTC SDP Proxy in production:
  - Updated interview-hybrid-template to use OpenAI Realtime API endpoints (sessions.openai.com/v1/realtime)
  - Fixed authentication to use OpenAI API key directly instead of Supabase
  - Added proper headers including "OpenAI-Beta: realtime=v1"
  - Fixed node-fetch dependency (downgraded to v2.6.9 for CommonJS compatibility)
  - Successfully tested WebSocket connections and SDP exchange in production
  - Created realtime-test.html for production verification
  
- Fixed JWT claims for RLS policies:
  - Created auth.custom_access_token_hook function with correct JSONB signature
  - Configured JWT hook in Supabase Authentication settings to include tenant_id in claims
  - Updated getCurrentTenantId to check multiple JWT locations for backward compatibility
  - Applied migration to production to create the hook function
  - This resolves 403 Forbidden errors when creating interview sessions
  - Users need to sign out and sign back in to get updated JWT tokens

- Completed comprehensive testing structure cleanup:
  - Finished implementing all unit tests for WebRTC hooks architecture
  - Fixed production routing issues with _redirects file for Netlify and vercel.json for Vercel
  - Resolved JS errors in production bundle by improving tenant ID retrieval
  - Successfully implemented Phases 1-3 of Hybrid Architecture Test Migration Plan
  - Removed all tests specific to original SDP proxy architecture
  - Focused entire testing infrastructure on hybrid OpenAI approach
  - Created TEST_STRUCTURE.md documenting the new test organization

## Features Status

### Production-Verified Features
These features have been fully implemented, thoroughly tested, and verified to work correctly in the production environment:

1. ✅ **Core Infrastructure**
   - ✅ Authentication with tenant isolation
   - ✅ Storage buckets configuration
   - ✅ Database schema and RLS policies
   - ✅ CI/CD pipeline with GitHub/Supabase/Vercel

2. ✅ **Company and Tenant Management**
   - ✅ Default tenant creation
   - ✅ Company CRUD operations
   - ✅ User-tenant association

3. ✅ **Candidate Flow**
   - ✅ Resume upload and processing
   - ✅ PDF.co text extraction
   - ✅ OpenAI analysis with GPT-4o-mini

4. ✅ **Position Creation**
   - ✅ AI-powered descriptions
   - ✅ Competency management with weighting
   - ✅ Position listing and detail views

5. ✅ **Authentication & Permissions**
   - ✅ Role-based access control (RBAC)
   - ✅ JWT claims with tenant context
   - ✅ Multi-layered security approach
   - ✅ UI permission-based rendering

### Locally Implemented Features (Not Yet Verified in Production)
These features have been implemented and tested locally but are not yet fully deployed and verified in the production environment:

1. ✅ **Candidate Profiles**
   - ✅ PDL enrichment functionality
   - ✅ Enhanced profile display
   - ✅ Comprehensive tabbed interface
   - ✅ Area of specialization and achievements sections
   - ✅ Improved data formatting with calendar icons and structured lists
   - ✅ Fixed TypeScript errors and proper data handling

2. 🔄 **Interview Session Management**
   - ✅ Session creation and listing
   - ✅ Interview room with A/V controls
   - ✅ Real-time transcript processing
   - ✅ Infrastructure platform evaluation completed
   - ✅ Fly.io proof-of-concept completed
   - ✅ WebRTC SDP proxy implemented and tested locally
   - ✅ WebRTC hooks-based architecture implemented and tested
   - ✅ Hybrid OpenAI approach implemented and tested locally
   - ✅ Comprehensive testing routes added
   - ✅ Unit tests completed for all WebRTC hooks
   - ✅ Fixed production routing issues
   - ✅ Fixed JS errors in production bundle
   - ✅ Cleaned up testing structure for hybrid architecture focus
   - ✅ VM isolation fix implemented and tested locally
   - 🔄 Pending production verification
   - ⚠️ **CRITICAL ISSUE**: WebRTC SDP Proxy server is SUSPENDED in production and needs to be restarted

3. 🔄 **Candidate Authentication System**
   - ✅ Database schema with candidate-tenant junction table
   - ✅ Multi-tenant support for candidates
   - ✅ Invitation-based registration flow
   - ✅ Row-level security policies
   - 🔄 Pending production deployment

4. 🔄 **Test Interview Flow**
   - ✅ Created TestInterview component for simplified testing
   - ✅ Integrated with real database entities instead of mock data
   - ✅ Added tenant/company selection for proper isolation
   - ✅ Fixed RLS policy issues with tenants table
   - ✅ Fixed RLS policy issues with interview_sessions table
   - ✅ Added company_id to interview_sessions table
   - ✅ Updated user metadata to match actual tenant relationship
   - ✅ Improved error handling and resilience
   - 🔄 Pending production verification

## Current Work Focus
The immediate focus is on verifying the WebRTC and JWT fixes in production and continuing with the interview functionality implementation.

1. ✅ **JWT Claims Hook Configuration** (COMPLETED)
   - ✅ Created auth.custom_access_token_hook function with proper signature
   - ✅ Configured hook in Supabase dashboard
   - ✅ Updated client to handle multiple JWT formats
   - ✅ Applied migration to production
   - ✅ Users need to sign out/in to get new JWT tokens

2. ✅ **WebRTC SDP Proxy Fix** (COMPLETED) 
   - ✅ Updated interview-hybrid-template with OpenAI Realtime API support
   - ✅ Fixed authentication and endpoint issues
   - ✅ Deployed and tested in production environment
   - ✅ Created test page (realtime-test.html) for verification

3. 🔄 **Production Testing and Verification**
   - ⬜ Test interview session creation with new JWT claims
   - ⬜ Verify WebRTC connections work end-to-end
   - ⬜ Monitor performance and resource usage
   - ⬜ Document any issues for troubleshooting

4. 🔄 **Complete Hybrid Architecture Test Migration Plan**
   - 🔄 Phase 4: Enhanced Hybrid Testing (IN PROGRESS)
   - ⬜ Phase 5: Test Automation
   - ⬜ Create developer guide for testing
   - ⬜ Add troubleshooting guide

5. ⬜ **Deploy edge functions for hybrid architecture support**
   - ⬜ Update interview-start and transcript-processor edge functions
   - ⬜ Test with WebRTC integration in production
   - ⬜ Verify correct versioning and functionality

## Front-to-Back Implementation Strategy

We are following a front-to-back implementation strategy for our WebRTC functionality and production deployment:

1. **Frontend First Approach**
   - Complete all client-side components and integrations
   - Test all WebRTC functionality in local environment
   - Implement and validate hooks-based architecture
   - Create comprehensive test routes for different scenarios
   - Ensure frontend resilience with proper error handling

2. **Backend Incremental Deployment**
   - Deploy individual backend services once frontend integration is verified
   - Test each component in isolation before integrating
   - Update edge functions incrementally with backward compatibility
   - Maintain clear version tracking for all deployed functions

3. **Security Implementation**
   - Implement per-session VM isolation for complete security
   - Add JWT validation progressively to each component
   - Ensure proper tenant isolation throughout the system
   - Test security boundaries at each step

4. **Production Verification**
   - Test each component thoroughly in staging before production
   - Deploy with careful monitoring and rollback plans
   - Verify functionality with real-world test interviews
   - Document all deployment steps and verification procedures

This approach allows us to ensure that each component works correctly before integrating it into the full system, reducing the risk of cascading failures and making it easier to identify and fix issues.

## Recent Changes
- Fixed audio playback delays in WebRTC connection:
  - **Issue**: User experienced 1-minute delays before hearing AI responses, despite logs showing immediate responses
  - **Root Cause**: Audio element was created locally without proper management, causing browser buffering issues
  - **Fix**: 
    - Persist audio element across renders
    - Set autoplay and low-latency properties
    - Disable audio processing that adds latency  
    - Proper cleanup on component unmount
  - **Result**: Audio should now play with minimal delay

- Fixed WebRTC SDP Proxy in production:
  - Updated to use OpenAI Realtime API endpoints (sessions.openai.com/v1/realtime)
  - Fixed authentication to use OpenAI API key directly
  - Added proper headers including OpenAI-Beta: realtime=v1
  - Fixed node-fetch dependency compatibility issue
  - Successfully deployed and tested in production environment
  
- Fixed JWT claims for tenant_id in RLS policies:
  - Created auth.custom_access_token_hook function to add tenant_id to JWT
  - Configured JWT hook in Supabase Authentication settings
  - Updated getCurrentTenantId to check multiple JWT locations
  - This resolves 403 Forbidden errors when creating interview sessions
  - Users need to sign out and sign back in to get updated JWT tokens

- Fixed interview_sessions table RLS policies:
  - Added company_id column to interview_sessions table with proper foreign key reference
  - Created RLS policies that handle both NULL company_id values and valid company references
  - Ensured policies check that referenced companies belong to the user's tenant
  - Successfully deployed the migration to production
  - Updated TestInterview component to use company_id correctly

- Updated user metadata:
  - Found mismatch between JWT metadata tenant_id (00000000-0000-0000-0000-000000000000)
  - And actual tenant relationship in the database (11111111-1111-1111-1111-111111111111)
  - Updated the user's metadata to match the actual tenant for proper authentication
  - Fixed the issue without modifying how RLS policies work or changing the application logic

- Fixed tenants table RLS policy:
  - Identified issue with policy using non-existent JWT claim (request.jwt.claim.tenant_id)
  - Created migration to drop problematic policy and create proper policies
  - Added separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
  - Added separate policies for each role (authenticated, anon, service_role)
  - Successfully applied migration to production environment
  - Updated TestInterview page to use tenants table directly

- Improved TestInterview page:
  - Replaced mock data with real database integration
  - Added proper tenant/company selection
  - Fixed bug with candidate selection not working
  - Enhanced UI with better layout and descriptive information
  - Added loading and error state handling
  - Fixed tenant ID lookup with better fallback logic
  - Added comprehensive debug logging for easier troubleshooting
  - Added simpler navigation in sidebar for easier testing access

- Implemented VM isolation security fix:
  - Fixed critical security issue in the hybrid architecture that was using tenant-level isolation
  - Modified interview-start edge function to create unique VM names for each session
  - Updated WebRTC hooks to handle dynamic server URLs from edge function responses
  - Created comprehensive VM isolation documentation (VM_ISOLATION.md)
  - Successfully tested the fix in local environment
  - Created interview-hybrid-template VM for production deployment
  - Enhanced logging for better VM creation and tracking
  - Pending full production deployment following front-to-back approach

- Created edge function version tracking:
  - Added memory-bank/edge-function-versions.md with comprehensive version history
  - Documented all edge functions with their current versions, deployment dates, and key changes
  - Created guidelines for version management and rollback procedures
  - Established central reference for edge function statuses

## Current Issues to Fix
1. ✅ **TypeScript Errors in CandidateProfile.tsx** (RESOLVED)
   - Fixed all type errors relating to array properties and JSON handling
   - Ensured proper typing for Supabase responses
   - Implemented consistent data handling patterns

2. ✅ **Database Migration and Schema Issues** (RESOLVED)
   - Fixed problematic migrations with proper sequencing
   - Ensured tables exist before policies reference them
   - Used schema-qualified names in all SQL statements
   - Addressed dependency issues between tables and policies
   - Added conditional creation with IF EXISTS/IF NOT EXISTS clauses

3. ✅ **Tenants Table RLS Policy Issues** (RESOLVED)
   - Identified policy using non-existent JWT claim (request.jwt.claim.tenant_id)
   - Created migration to fix policy with proper lookup through users table
   - Added proper roles and operations for comprehensive security
   - Successfully applied migration to production environment
   - Updated TestInterview to query tenants table directly

4. ✅ **Interview Sessions Table RLS Issues** (RESOLVED)
   - Added company_id column with foreign key reference
   - Created policies to handle both NULL values and valid references
   - Ensured policies check company tenant matches user tenant
   - Successfully applied migration to production
   - Updated TestInterview component to use company_id properly

5. ✅ **User Metadata Tenant ID Mismatch** (RESOLVED)
   - Found discrepancy between JWT metadata and actual tenant relationship
   - Updated user metadata to match actual tenant ID
   - Maintained consistent approach without changing application logic
   - Ensured RLS policies work correctly with updated metadata
   
6. 🔄 **Production Deployment and Verification**
   - Deploy WebRTC functionality to production environment
   - Verify real-time transcript processing in production
   - Test performance under production conditions
   - Monitor resource usage and make optimizations
   
7. ✅ **WebRTC SDP Proxy Implementation** (RESOLVED)
   - Successfully updated and deployed the interview-hybrid-template on Fly.io
   - Fixed implementation to use OpenAI's Realtime API with proper session creation
   - Implemented correct WebSocket connection handling and SDP exchange
   - Updated code to handle ICE candidates correctly
   - Added proper error handling and logging for debugging
   - Verified the implementation works by testing it in the production environment

8. 🔄 **Edge Function Verification Needed**
   - Verify interview-start edge function (v6) is ACTIVE
   - Verify interview-transcript edge function (v4) is ACTIVE
   - Verify transcript-processor edge function (v5) is ACTIVE
   - See memory-bank/edge-function-versions.md for detailed version tracking
   
9. ✅ **VM Isolation Security Issue** (TESTED LOCALLY, PENDING PRODUCTION DEPLOYMENT)
   - Fixed the hybrid architecture to use per-session isolation instead of tenant-level isolation
   - Updated interview-start edge function to create unique VM names for each session
   - Modified WebRTC hooks to properly handle dynamic server URLs
   - Created documentation for the VM isolation model
   - Successfully tested the fix in local environment
   - Pending deployment to production following front-to-back approach
   - This change ensures proper security and data separation between interview sessions

## Next Steps
1. **Test the TestInterview Page in Production**
   - Verify the page loads properly with real database integration
   - Confirm tenant selection works correctly
   - Test candidate and position selection functionality
   - Create a test interview session and verify it appears in database
   - Verify company selection works correctly and company_id is saved

2. **Deploy the VM Isolation Security Fix to Production**
   - Deploy the updated interview-start edge function (v6)
   - Create production VM template based on local testing
   - Verify per-session VM isolation in production environment
   - Monitor resource usage and VM creation patterns
   - Document production deployment process for future reference

3. **Complete Hybrid Architecture Test Migration Plan**
   - Finish Phase 4: Enhanced Hybrid Testing with robust test coverage
   - Implement Phase 5: Test Automation with streamlined commands
   - Create developer guide for testing hybrid architecture components
   - Document common testing patterns and best practices
   - Add troubleshooting guide for hybrid architecture test failures

4. **Deploy edge functions for hybrid architecture support**
   - Update and deploy interview-start and transcript-processor edge functions
   - Test with WebRTC integration in production
   - Verify correct versioning and functionality
   - Update edge-function-versions.md with new deployments

5. **Test hybrid architecture with real interview sessions in production**
   - Conduct end-to-end tests with actual interviews
   - Validate transcript storage and retrieval
   - Monitor resource usage and performance
   - Document real-world performance characteristics

6. **Implement VM per tenant strategy for isolation**
   - Configure Fly.io for multi-tenant isolation
   - Ensure secure resource allocation
   - Document deployment model
   - Test with multiple tenants to verify isolation

7. **Configure JWT validation for API endpoints**
   - Add JWT validation to WebSocket connections
   - Implement token refresh mechanism
   - Test security model comprehensively
   - Document security implementation details

8. **Enhance Interview Room Experience**
   - Improve UI for real-time transcription display
   - Add visual indicators for connection quality
   - Implement recording and playback functionality
   - Add interviewer AI persona selection

## Active Decisions
1. **Supabase Environment Configuration**
   - Updated Supabase client to automatically detect environment
   - Uses environment variables to determine production vs development
   - Falls back to production mode if detection fails
   - Ensures proper database connectivity in all environments

2. **Multi-tenant User Management**
   - Created default tenants (Acme Corp and Stark Industries)
   - Implemented database trigger to associate new users with default tenant
   - Added RLS policies to ensure proper tenant isolation and access
   - Set up JWT claims to include tenant_id for authentication context
   - Fixed user metadata to match actual tenant relationships
   - Ensured RLS policies work correctly with metadata tenant_id

3. **CI/CD Workflow Architecture**
   - Using GitHub as the central source control repository
   - Implementing Supabase branching for development environments
   - Configuring Supabase to track changes in the `supabase` directory
   - Setting up Vercel for automated frontend deployments
   - Creating a complete workflow: Local → GitHub → Supabase/Vercel

4. **Edge Function Architecture**
   - Using Deno.serve as recommended by Supabase guidelines 
   - Following npm: prefixed imports for dependencies (e.g., `npm:openai@4.29.0`)
   - Providing proper CORS headers for browser compatibility
   - Setting up configuration files (deno.json, import_map.json) for consistent imports
   - Simplifying type handling to avoid compilation issues in Deno environment
   - Using `--env-file` flag with `supabase_secrets.env` for local development
   - Configured Edge Function secrets in Supabase dashboard for production
   - Disabled JWT verification for all Edge Functions to simplify authentication
   - Using internal service role key for any database operations
   - Direct API calls instead of relying on JWT verification
   - Created version tracking system for all edge functions
   - See memory-bank/edge-function-versions.md for comprehensive tracking

5. **PDL Integration Approach**
   - Created separate candidate_profiles table for PDL-enriched data
   - Implemented enrich-candidate Edge Function for PDL API integration
   - Using PDL_API_KEY as a Supabase secret
   - Visually distinguishing PDL-enriched data in the UI (blue text)
   - Implementing fallback logic to use resume data when PDL data is unavailable
   - Adding "Enhanced" badge to indicate profiles with PDL enrichment

6. **Candidate Profile Interface Design**
   - Dual-table approach for candidate data:
     - candidates table: Core information from resume parsing
     - candidate_profiles table: Enriched information from PDL
   - Implementing proper interfaces to handle both data sources
   - Using fallback patterns to ensure data display regardless of source
   - Visually distinguishing enriched data with blue text
   - Providing tabbed interface for different data categories
   - Handling missing tables with visual indicators for pending upgrades
   - Improved visualization with better data formatting based on MVP patterns:
       - More structured experience display with clear visual hierarchy
       - Enhanced date formatting with calendar icons
       - Responsibility lists instead of paragraphs
       - Blue highlighting for company names and institutions
       - Better badge styling for skills and areas of specialization
       - Dedicated sections for different types of information

7. **Database Schema Type Safety**
   - Implementing proper TypeScript interfaces for all database entities
   - Ensuring alignment between database schema and frontend interfaces
   - Using conditional type handling for JSON fields
   - Implementing fallback mechanisms for missing data
   - Adding proper error handling for parsing JSON strings
   - Using Record<string, unknown> instead of any for better type safety
   - Implementing helper functions for data normalization
   - Adding proper type assertions with unknown as intermediate step

8. **Position Creation Architecture**
   - Using a dedicated Edge Function (`generate-position`) for AI-powered description generation
   - Implementing a two-step process:
     1. User provides basic position information
     2. AI generates detailed description and suggests competencies
   - Using OpenAI's GPT-4o-mini for generating structured position data
   - Implementing client-side validation with zod schema

9. **Interview Session Management Approach**
   - Storing session data with references to candidates and positions
   - Implementing status tracking (scheduled, in_progress, completed, cancelled)
   - Using real-time updates for transcript display
   - Separating invitation management from session creation
   - Building dedicated interview room with media controls
   - Added company_id to track which company an interview is for
   - Created RLS policies that handle both NULL and valid company_id values
   - Ensured proper tenant isolation with company verification

10. **Testing and Environment Infrastructure**
    - Creating interactive setup scripts for environment variables
    - Implementing verification tools for API connectivity
    - Developing comprehensive testing documentation
    - Separating Edge Function testing from frontend testing
    - Using `--no-verify-jwt` flag for local Edge Function testing to bypass authentication
    - Created `check-env` Edge Function to verify API key access
    - Implemented focused hybrid architecture tests
    - Created standardized testing approach with clear status indicators

11. **Production Storage Configuration**
    - Created separate storage buckets for different file types:
      - resumes bucket for PDF files with 10MB limit
      - videos bucket for interview recordings with 1GB limit
      - audio bucket for audio files with 100MB limit
    - Configured public access for the resumes bucket to allow PDF.co processing
    - Implemented storage RLS policies for authenticated users
    - Added policy to allow objects to be publicly readable for processing
    - Created migration files for consistent storage configuration

12. **Database RLS Policy Approach**
    - Fixed user self-data access with "Users can view own data" policy
    - Simplified candidates table access with permissive policy for authenticated users
    - Created storage policies to allow authenticated users to perform operations
    - Used migration files for standardizing policy changes
    - Documented policy changes in memory bank for future reference
    - Fixed tenant_id lookup in RLS policies to use proper user table joins
    - Created proper policies for interview_sessions with company_id validation
    - Ensured consistent approach across all tables with foreign key relationships

13. **Frontend API Call Architecture**
    - Changed from using supabase.functions.invoke to direct fetch API calls
    - Included apikey header for proper authentication
    - Added better error handling and status code checking
    - Implemented more detailed logging for debugging
    - Used non-blocking pattern for non-critical operations (like enrichment)

14. **Candidate Profile Database Architecture**
    - Dedicated candidate_profiles table for PDL-enriched data
    - 1:1 relationship with candidates table via candidate_id
    - Includes tenant_id for multi-tenant isolation
    - RLS policies for proper access control
    - Typed interfaces for better TypeScript integration

15. **Interview Processing Infrastructure**
    - Evaluated E2B and Fly.io as potential platforms
    - Selected Fly.io for stronger isolation capabilities
    - Leveraging Fly.io's Apps → Machines structure for tenant isolation
    - Taking advantage of burstable CPU for interview transcription workloads
    - Planning API interfaces for frontend to communicate with Fly.io services
    - Completed successful proof-of-concept with WebSocket-based communication
    - Created isolated test environment to validate technical approach
    - Confirmed Fly.io's suitability for our interview processing needs
    - Documented comprehensive integration plan for main application

16. **Authentication and Permissions System**
    - Implemented role-based access control (RBAC) for tenant users
    - Created candidate-specific authentication system with multi-tenant support
    - Used JWT claims to store tenant_id and role information
    - Implemented layered security with JWT validation, RLS policies, and UI permission checks
    - Documented the complete system in verified-flows for reference
    - Separated tenant user and candidate authentication flows for clarity
    - Designed flows to support different use cases for each user type
    - Fixed user metadata tenant_id to match actual tenant relationships
    - Ensured consistent tenant_id values across JWT and database

17. **WebRTC Architecture**
    - Implemented hybrid OpenAI approach as primary architecture
    - Created hooks-based architecture for better maintainability
    - Established clear interface between UI components and WebRTC functionality
    - Implemented proper resource management and cleanup
    - Added support for different connection modes (simulation, direct OpenAI)
    - Created comprehensive testing infrastructure with multiple test routes
    - Enabled ngrok tunneling for local development and testing
    - Documented architectural comparison for future decisions
    - Removed original SDP proxy approach in favor of hybrid architecture
    - Successfully tested WebSocket connections and SDP exchange locally
    - Pending production deployment following front-to-back approach

18. **TestInterview Page Approach**
    - Replacing mock data with real database entities
    - Implementing proper tenant selection for testing
    - Avoiding workarounds by fixing underlying RLS policy issues
    - Adding comprehensive error handling and loading states
    - Providing fallback mechanisms for error recovery
    - Enhanced UI with better layout and visual organization
    - Added simplified sidebar navigation for easier testing access
    - Added company selection with proper company_id saving
    - Fixed tenant_id handling for more reliable authentication

19. **RLS Policy Architecture**
   - Creating separate policies for each database operation (SELECT, INSERT, UPDATE, DELETE)
   - Creating separate policies for each role (authenticated, anon, service_role)
   - Using proper lookup through users table rather than JWT claims
   - Adding proper handling of foreign key relationships with tenant verification
   - Adding comments to document policy purpose and behavior
   - Following Supabase guidelines for RLS policy creation
   - Using lowercase SQL for better readability and consistency
   - Creating migration files for policy changes to ensure consistency

20. **VM Isolation Security Model**
   - Implemented per-session VM isolation (one VM per interview)
   - Created unique VM naming convention: interview-{architecture}-{tenantId}-{sessionShortId}
   - Modified interview-start edge function to create unique VM per session
   - Updated WebRTC hooks to handle dynamic server URLs
   - Successfully tested local implementation
   - Documented model in docs/architecture/VM_ISOLATION.md
   - Pending production deployment following front-to-back approach
   - This provides complete separation between interviews with no data leakage
   - Improved security and resource management for multi-tenant system

## Key Technical Decisions

- **WebRTC Architecture**: Implemented hybrid OpenAI approach with hooks-based architecture, removing the original SDP proxy approach
- **SDP Exchange Approach**: SDP exchange occurs through Fly.io, but actual audio/video streams go directly between client and OpenAI
- **API Key Security**: API keys are never exposed to the client; all sensitive operations proxied through Fly.io
- **Session Isolation**: One VM per interview session for complete isolation and security (tested locally, pending production deployment)
- **Authentication Method**: JWT-based authentication for API endpoints (partial implementation in interview-start edge function)
- **Turn Detection**: Server-side VAD (Voice Activity Detection) for optimal turn-taking
- **Candidate-Tenant Model**: Junction table for many-to-many relationships between candidates and tenants
- **Invitation System**: Secure function for generating invitation tokens that create candidate-tenant relationships
- **SDP Format Preservation**: Line-by-line processing to maintain exact SDP format compatibility
- **Hooks Architecture**: Specialized hooks for different aspects of WebRTC functionality
- **WebRTC Components Structure**: Core hooks (useConnectionState, useRetry, useAudioVisualization), connection hooks (useWebRTCConnection, useWebSocketConnection, useOpenAIConnection), and orchestration hook (useWebRTC)
- **Test Architecture**: Test files for individual hooks, test pages for interactive testing, and simulation tools for local development
- **RLS Policy Structure**: Separate policies for each operation and role, proper handling of foreign key relationships with tenant verification
- **Front-to-Back Implementation**: Complete frontend components first, then deploy backend services incrementally, with security measures added progressively

## Implementation Priorities

1. Core infrastructure setup (Fly.io VM template, secure credential storage)
2. Backend APIs and services (SDP exchange, transcript storage)
3. Database implementation (schema updates, RLS policies)
4. Client components (WebRTC connection, video recording)
5. Authentication and security (JWT validation, tenant isolation)
6. Testing (automated tests, stress testing)
7. Monitoring and reliability (logging, recovery logic)
8. Deployment and operations (automation, scaling)
9. Documentation (technical architecture, API endpoints)

## Reference Documentation

- **Hybrid Architecture Specification**: docs/development/hybrid-architecture-spec.md
- **Implementation Guide**: docs/development/hybrid-implementation-guide.md
- **Technical Flow**: docs/development/hybrid-technical-flow.md
- **Implementation Checklist**: memory-bank/hybrid-implementation-checklist.md
- **OpenAI WebRTC Integration**: docs/development/openai-webrtc-integration.md
- **WebRTC SDP Proxy Test Documentation**: fly-interview-poc/WEBRTC-SDP-PROXY-TEST.md
- **Architecture Comparison**: docs/architecture/ARCHITECTURE_COMPARISON.md
- **Automated Testing Guide**: docs/development/AUTOMATED_TESTING.md
- **Authentication and Permissions Flow**: docs/verified-flows/USER_AUTH_PERMISSIONS_FLOW.md
- **Candidate Authentication Flow**: docs/verified-flows/CANDIDATE_AUTH_FLOW.md
- **VM Isolation Documentation**: docs/architecture/VM_ISOLATION.md
- **Edge Function Version Tracking**: memory-bank/edge-function-versions.md

## WebRTC Implementation Architecture

The platform has transitioned to a hybrid architecture approach:

1. **Original SDP Proxy** (fly-interview-poc) - LEGACY/REMOVED:
   - Traditional WebRTC SDP proxy with server-side audio processing
   - Full audio transmission over WebSockets
   - Higher latency and more server resources required
   - This approach has been DEPRECATED in favor of the hybrid architecture
   - **Status: SUSPENDED in production**

2. **Hybrid OpenAI Approach** (fly-interview-hybrid) - CURRENT APPROACH:
   - Uses OpenAI's native WebRTC capabilities
   - Fly.io only serves as a secure SDP exchange proxy
   - Direct WebRTC connection between client and OpenAI
   - Lower latency and more efficient resource usage
   - **Status: Implemented and tested locally, pending production deployment**

Both architectures now use a **per-session VM isolation model**, where each interview session gets its own dedicated VM for complete isolation. This ensures proper security, performance, and tenant separation in our multi-tenant SaaS platform.

The current architecture uses a hooks-based implementation for better maintainability:

### Core WebRTC Hooks
- **useConnectionState**: Manages connection state transitions and reporting
- **useRetry**: Implements retry logic with exponential backoff
- **useAudioVisualization**: Manages audio capture and visualization

### Connection Hooks
- **useWebRTCConnection**: Handles WebRTC peer connection establishment and ICE negotiation
- **useWebSocketConnection**: Manages WebSocket connections to SDP proxy
- **useOpenAIConnection**: Specialized hook for direct OpenAI WebRTC connections
- **useSDPProxy**: Specialized hook for SDP proxy architecture
- **useTranscriptManager**: Manages transcript data and storage

### Orchestration Hook
- **useWebRTC**: Main entry point that coordinates all specialized hooks

This architecture eliminates circular dependencies and creates a more maintainable system by separating concerns into focused hooks with clear responsibilities.

### VM Isolation Security Model
- **Per-Session Isolation**: Each interview session gets its own dedicated VM
- **Complete Process Isolation**: No shared processes or memory spaces between sessions
- **Network Isolation**: Unique IP addresses and endpoints per session
- **Data Isolation**: No persistent storage between sessions
- **Automatic Cleanup**: VM destruction after session completion
- **Zero Cross-Session Access**: Prevents any potential data leakage between interviews
- **Replaced Previous Approach**: Improved from previous per-tenant isolation model

## WebRTC Implementation Status

The WebRTC implementation has been fully developed and tested locally with the following status:

1. **WebSocket Connection:** Successfully established WebSocket connections in local testing
2. **SDP Exchange:** Verified SDP exchange functionality through secure proxy
3. **Audio Transmission:** Confirmed direct audio streaming between client and OpenAI
4. **Transcript Processing:** Implemented and tested transcript display and storage
5. **VM Isolation:** Implemented and tested per-session VM isolation model locally

The implementation follows our front-to-back approach, with all client-side components completed and tested locally. The production deployment is pending, with the following steps required:

1. Deploy updated edge functions to production
2. Create production VM templates
3. Configure proper API keys and security settings
4. Test with real interview sessions
5. Implement monitoring and performance tracking

## Production Infrastructure Status

### WebRTC SDP Proxy
- **Application Name:** `interview-sdp-proxy`
- **Status: SUSPENDED** (Last deployed: May 9, 2025)
- **Primary Region:** `mia` (Miami)
- **Access URLs:**
  - WebSocket: `wss://interview-sdp-proxy.fly.dev/ws`
  - HTTP/Status: `https://interview-sdp-proxy.fly.dev`

### Hybrid Architecture Template
- **Application Name:** `interview-hybrid-template`
- **Status: ACTIVE** (Local testing completed)
- **Primary Region:** `mia` (Miami)
- **Implementation Files:**
  - Main production server: `index.js`
  - Docker configuration: `Dockerfile`
  - Fly.io configuration: `fly.toml`
- **Pending Production Deployment**

### Supabase Edge Functions
- **interview-start**: v6 (ACTIVE) - Updated with VM isolation fix
- **interview-transcript**: v4 (ACTIVE)
- **transcript-processor**: v5 (ACTIVE)
- **See memory-bank/edge-function-versions.md for detailed version tracking**

## Production Testing Instructions
1. Start the SDP proxy server (suspended)
2. Use test page: `https://[YOUR_DOMAIN]/simple-webrtc-test`
3. Set server URL to: `wss://interview-sdp-proxy.fly.dev/ws`
4. Turn off simulation mode for real OpenAI testing
5. Verify WebRTC connection and transcript generation 

## Development Commands

### Start Development Server
```bash
npm run dev
```

### Start Simulation Server (for local testing)
```bash
cd fly-interview-hybrid
node simple-server.js
```

### Start Ngrok Tunnel for Testing
```bash
# In a separate terminal
ngrok http 3001
```

When ngrok starts, it will display a URL like: `https://a1b2c3d4.ngrok.io`
Use this URL in your WebRTC testing by replacing:
- `http://` with `ws://` for WebSocket connections
- `https://` with `wss://` for secure WebSocket connections

### Testing with Ngrok URL in the App
1. Copy the ngrok URL (example: `https://a1b2c3d4.ngrok.io`)
2. Open http://localhost:8080/interview-test-simple
3. Replace the Server URL with the WebSocket version of the ngrok URL:
   - Change `https://a1b2c3d4.ngrok.io` to `wss://a1b2c3d4.ngrok.io`
4. Test the connection

### Current Ngrok URL
The current ngrok URL being used for testing is:
```
wss://4d5fb0d8191c.ngrok.app
```
This URL has been updated in both the client code (InterviewTestSimple.tsx) and server handling logic (simple-server.js) to ensure consistent connections.

### Start SDP Proxy (if stopped)
```bash
cd fly-interview-hybrid && fly machines start <machine-id>
```

### Redeploy SDP Proxy (after changes)
```bash
cd fly-interview-hybrid && fly deploy
```

### Deploy Edge Functions (if needed)
```bash
supabase functions deploy interview-start
supabase functions deploy transcript-processor
```

### Check Edge Function Status
```bash
supabase functions list
```

### Get Edge Function Logs
```bash
supabase functions logs <function-name>
```

## Test URLs
- Local development: http://localhost:8080/
- Ngrok test interview: http://localhost:8080/test/ngrok
- Direct OpenAI test: http://localhost:8080/test/openai
- Full interview test: http://localhost:8080/test/full
- WebRTC hooks test: http://localhost:8080/test/webrtc-hooks
- Production SDP proxy: wss://interview-sdp-proxy.fly.dev/ws
- Local simulation server: ws://localhost:3001
- Current ngrok tunnel: wss://4d5fb0d8191c.ngrok.app
- Production test page: https://[YOUR_DOMAIN]/realtime-test.html 

## Active Context

## Current Status: ✅ MAJOR MILESTONE - Full Interview Completed Successfully!

**Date**: June 3, 2025, 6:30 PM UTC

### 🎉 BREAKTHROUGH ACHIEVEMENT
- ✅ **CONFIRMED**: Full interview conversation completed from start to goodbye
- ✅ **CONFIRMED**: All WebRTC audio fixes successful
- ✅ **CONFIRMED**: Sustained audio playback throughout entire session
- ✅ **CONFIRMED**: Performance optimizations effective

### Successful Implementation Status
- ✅ **WebRTC Connection**: Perfect (ephemeral tokens, SDP negotiation, data channels)
- ✅ **Microphone**: Captures user voice flawlessly
- ✅ **Transcription**: Both directions working perfectly (user ↔ AI)
- ✅ **Audio Playback**: **CONFIRMED WORKING** - Sustained throughout full interview
- ✅ **Performance**: **CONFIRMED OPTIMIZED** - No more visualization loop issues

### Fixes That Resolved the Issues ✅

#### 1. Audio Playback Fix (Commit 69dbe62) - **CONFIRMED SUCCESSFUL**
- **Problem**: Audio element being recreated on each track, causing interruption
- **Solution**: Persistent audio element with proper stream management
- **Implementation**:
  - No recreation of audio element during conversation
  - Enhanced user interaction handling for autoplay policies
  - Detailed audio event logging for debugging
  - Better error handling for failed playback attempts
- **Result**: ✅ **FULL INTERVIEW AUDIO CONFIRMED WORKING**

#### 2. Performance Optimization (Commit 19e4d7f) - **CONFIRMED SUCCESSFUL**
- **Problem**: Visualization loop running 251,998 iterations causing browser lag
- **Solution**: Proper throttling with timeout-based scheduling
- **Implementation**:
  - Throttled visualization loop from 60fps → 10fps
  - Timeout-based scheduling instead of frame-skipping
  - Reduced CPU usage in visualization loop
  - Fixed TypeScript issues with webkit audio context
- **Result**: ✅ **PERFORMANCE OPTIMIZED AND CONFIRMED**

#### 3. Infrastructure Fix - **CONFIRMED WORKING**
- **Problem**: Both Fly.io machines were stopped
- **Solution**: Restarted both machines manually
- **Result**: ✅ **SERVER INFRASTRUCTURE STABLE**

### Architecture Status - **PRODUCTION READY**
- **Hybrid Mode**: Fully functional and confirmed in production
- **Connection Flow**: End-to-end WebRTC working perfectly
- **Token Management**: Ephemeral tokens from Fly.io working reliably
- **Direct Connection**: Browser ↔ OpenAI WebRTC confirmed stable

### Key Success Factors Documented
1. **Simplified Approach**: Removed complex fallbacks that introduced issues
2. **Persistent Audio**: Key breakthrough - no element recreation during conversation
3. **Performance Throttling**: CPU optimization critical for sustained operation
4. **Server Stability**: Both Fly.io machines must be running for token generation

### What This Milestone Means
- ✅ **Technical Proof**: Full WebRTC implementation working end-to-end
- ✅ **Production Viability**: Platform ready for real interview sessions
- ✅ **Architecture Validation**: Hybrid approach confirmed optimal
- ✅ **User Experience**: Seamless conversation flow achieved

### CRITICAL: Preserve This Working State
- **Current codebase is GOLDEN** - do not modify WebRTC audio handling
- **Fly.io machines must stay running** - monitor health checks
- **Ephemeral token flow is proven** - maintain current implementation
- **Performance settings optimized** - keep visualization throttling

### Next Steps (Build on Success)
1. **Document working configuration** as reference implementation
2. **Create backup of current working state**
3. **Add monitoring to prevent regression**
4. **Build additional features on this solid foundation**

**MILESTONE CELEBRATION**: We have achieved a complete, working AI interview platform with real-time voice interaction! 🚀
