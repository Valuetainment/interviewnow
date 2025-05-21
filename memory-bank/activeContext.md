# AI Interview Insights Platform - Active Context

## Current Project Status
The project has made significant progress in establishing the frontend foundation. We have set up the project structure, created layout components, and configured authentication. Most importantly, we've established a local Supabase development environment with the complete database schema and storage buckets in place. We have also completed implementation of all navigation components (Navbar, Sidebar, Header), enhanced the authentication UI with proper Supabase integration, and implemented a comprehensive dashboard overview experience. We've now completed the resume processing flow, enabling users to upload, process, and analyze candidate resumes. We've also implemented the position creation feature with AI-powered description generation and competency management. Most recently, we've implemented the interview session management interface with a comprehensive testing infrastructure, enhanced the candidate management system with People Data Labs integration, established a complete CI/CD pipeline with GitHub, Supabase, and Vercel integration, and fixed critical issues with authentication and tenant association in the production environment. The latest improvements include storage configuration in production, RLS policy fixes, Edge Function optimization to ensure the resume processing workflow works correctly in the production environment, and the implementation of a robust CandidateProfile page with proper data handling and enhanced display based on the MVP implementation patterns. We've also fixed company creation in production by addressing RLS policies and tenant_id handling, improved the UI navigation by removing redundant elements and simplifying the user experience, and fixed position creation by resolving RLS policy issues that were preventing positions from being saved to the database. We've also completed an evaluation of infrastructure platforms for interview processing, comparing E2B and Fly.io, with a recommendation to use Fly.io for its superior multi-tenant isolation, burstable CPU capacity, and better strategic alignment with our needs. Most recently, we've successfully completed a Fly.io proof-of-concept for interview transcription processing, validating the technical approach with WebSockets and real-time data transmission. We've extended our testing by deploying the proof-of-concept to Fly.io, fixing WebSocket connectivity issues, implementing simulation mode, and successfully testing multi-region deployment across Miami (US) and Frankfurt (Europe). We've documented our security findings and created a comprehensive TEST_SUMMARY.md that confirms Fly.io meets our requirements for hosting the real-time interview transcription service. We've also created comprehensive documentation of our authentication and permissions system, including both user and candidate authentication flows, and implemented database schema changes to support a multi-tenant candidate experience. We've completely implemented and integrated both a WebRTC SDP proxy and a hybrid OpenAI approach for real-time interview transcription. The implementation uses a sophisticated hooks-based architecture for better maintainability and has been fully integrated into the main application. Test routes are available at /test/ngrok, /test/full, /test/openai, and /test/webrtc-hooks to validate different aspects of the functionality. The WebRTC implementation has now been refactored using a hooks-based architecture that eliminates circular dependencies and creates a more maintainable, modular system. We've completed unit tests for all WebRTC hooks, fixed production routing issues, resolved JS errors in the production bundle, and cleaned up the testing structure to focus exclusively on the hybrid architecture approach.

Most recently, we've identified and fixed a critical security issue in the WebRTC VM isolation model. The hybrid architecture was incorrectly using a tenant-level isolation approach (one VM per tenant), which could potentially lead to data leakage between interview sessions within the same tenant. We've updated the code to ensure proper per-session isolation (one VM per interview session) for both hybrid and SDP proxy architectures. This includes changes to the interview-start edge function, the WebRTC hooks implementation, and comprehensive documentation of the isolation model. We're now working on improving the TestInterview page by replacing mock data with real database integration, connecting the page to Supabase, and implementing proper tenant selection. We also identified and fixed a significant RLS policy issue with the tenants table, which was causing "unrecognized configuration parameter 'request.jwt.claim.tenant_id'" errors. 

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

1. 🔄 **Candidate Profiles**
   - ✅ PDL enrichment functionality
   - ✅ Enhanced profile display
   - 🔄 Pending deployment of candidate_profiles table
   - ✅ Fixed TypeScript errors (RESOLVED)

2. 🔄 **Interview Session Management**
   - ✅ Session creation and listing
   - ✅ Interview room with A/V controls
   - ✅ Real-time transcript processing
   - ✅ Infrastructure platform evaluation completed
   - ✅ Fly.io proof-of-concept completed
   - ✅ WebRTC SDP proxy implemented and tested
   - ✅ WebRTC SDP proxy integration into main application (COMPLETED)
   - ✅ Hooks-based architecture implemented for WebRTC functionality
   - ✅ Hybrid OpenAI approach implemented
   - ✅ Comprehensive testing routes added
   - ✅ Unit tests completed for all WebRTC hooks
   - ✅ Fixed production routing issues
   - ✅ Fixed JS errors in production bundle
   - ✅ Cleaned up testing structure for hybrid architecture focus
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
   - ✅ Improved error handling and resilience
   - 🔄 Pending production verification

## Current Work Focus
The immediate focus is on improving the TestInterview page functionality and fixing RLS policy issues that prevent proper database access. We also need to restart the WebRTC SDP Proxy in production.

1. ✅ **TestInterview Page Improvements**
   - ✅ Replaced mock data with real Supabase database integration
   - ✅ Added company/tenant selection to interview test flow
   - ✅ Improved UI with 3-column layout for selections
   - ✅ Enhanced error handling and loading states
   - ✅ Fixed tenant ID lookup issues with better error handling
   - ✅ Fixed RLS policy for the tenants table preventing access
   - ✅ Created migration to replace problematic policy using JWT claim

2. ⚠️ **URGENT: Restart WebRTC SDP Proxy**
   - ⬜ Run `fly apps start interview-sdp-proxy`
   - ⬜ Verify the proxy is running with `fly apps status interview-sdp-proxy`
   - ⬜ Check logs with `fly logs interview-sdp-proxy`

3. 🔄 **Hybrid Architecture Test Migration Plan**
   - 🔄 Phase 4: Enhanced Hybrid Testing (IN PROGRESS)
   - ⬜ Phase 5: Test Automation

## Recent Changes
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
  - Deployed the fix to production, including edge function and frontend changes
  - Created interview-hybrid-template VM for production deployment
  - Enhanced logging for better VM creation and tracking

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

4. 🔄 **Production Deployment and Verification**
   - Deploy WebRTC functionality to production environment
   - Verify real-time transcript processing in production
   - Test performance under production conditions
   - Monitor resource usage and make optimizations
   
5. ⚠️ **CRITICAL: WebRTC SDP Proxy Suspended**
   - WebRTC SDP Proxy is currently SUSPENDED in production (last deployed May 9, 2025)
   - Must be restarted with `fly apps start interview-sdp-proxy`
   - Verify status with `fly apps status interview-sdp-proxy`
   - Check logs with `fly logs interview-sdp-proxy`

6. 🔄 **Edge Function Verification Needed**
   - Verify interview-start edge function (v5) is ACTIVE
   - Verify interview-transcript edge function (v4) is ACTIVE
   - Verify transcript-processor edge function (v5) is ACTIVE
   
7. ✅ **VM Isolation Security Issue** (RESOLVED)
   - Fixed the hybrid architecture to use per-session isolation instead of tenant-level isolation
   - Updated interview-start edge function to create unique VM names for each session
   - Modified WebRTC hooks to properly handle dynamic server URLs
   - Created documentation for the VM isolation model
   - This change ensures proper security and data separation between interview sessions

## Next Steps
1. ⚠️ **URGENT: Restart the SDP Proxy Server**
   - Run `fly apps start interview-sdp-proxy`
   - Verify the app is running with `fly apps status interview-sdp-proxy`
   - Check logs with `fly logs interview-sdp-proxy`

2. **Test the TestInterview Page in Production**
   - Verify the page loads properly with real database integration
   - Confirm tenant selection works correctly
   - Test candidate and position selection functionality
   - Create a test interview session and verify it appears in database

3. **Deploy the VM Isolation Security Fix**
   - Deploy the updated interview-start edge function
   - Test the per-session VM isolation in a controlled environment
   - Verify that each interview session gets its own dedicated VM
   - Monitor resource usage and VM creation patterns

4. **Deploy WebRTC Functionality to Production**
   - Set up Fly.io VMs for production environment
   - Configure proper API keys and secrets
   - Deploy WebRTC proxy using production configuration
   - Set up monitoring and alerting

5. **Complete Hybrid Architecture Test Migration Plan**
   - Finish Phase 4: Enhanced Hybrid Testing with robust test coverage
   - Implement Phase 5: Test Automation with streamlined commands
   - Create developer guide for testing hybrid architecture components
   - Document common testing patterns and best practices
   - Add troubleshooting guide for hybrid architecture test failures

6. **Deploy edge functions for hybrid architecture support**
   - Update interview-start and transcript-processor edge functions
   - Test with WebRTC integration

7. **Test hybrid architecture with real interview sessions**
   - Conduct end-to-end tests with actual interviews
   - Validate transcript storage and retrieval
   - Monitor resource usage and performance

8. **Implement VM per tenant strategy for isolation**
   - Configure Fly.io for multi-tenant isolation
   - Ensure secure resource allocation
   - Document deployment model

9. **Configure JWT validation for API endpoints**
   - Add JWT validation to WebSocket connections
   - Implement token refresh mechanism
   - Test security model comprehensively

10. **Enhance Interview Room Experience**
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

10. **Testing and Environment Infrastructure**
    - Creating interactive setup scripts for environment variables
    - Implementing verification tools for API connectivity
    - Developing comprehensive testing documentation
    - Separating Edge Function testing from frontend testing
    - Using `--no-verify-jwt` flag for local Edge Function testing to bypass authentication
    - Created `check-env` Edge Function to verify API key access

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

17. **WebRTC Architecture**
    - Implemented both SDP proxy and hybrid OpenAI approaches
    - Created hooks-based architecture for better maintainability
    - Established clear interface between UI components and WebRTC functionality
    - Implemented proper resource management and cleanup
    - Added support for different connection modes (simulation, SDP proxy, direct OpenAI)
    - Created comprehensive testing infrastructure with multiple test routes
    - Enabled ngrok tunneling for local development and testing
    - Documented architectural comparison for future decisions

18. **TestInterview Page Approach**
    - Replacing mock data with real database entities
    - Implementing proper tenant selection for testing
    - Avoiding workarounds by fixing underlying RLS policy issues
    - Adding comprehensive error handling and loading states
    - Providing fallback mechanisms for error recovery
    - Enhanced UI with better layout and visual organization
    - Added simplified sidebar navigation for easier testing access

19. **RLS Policy Architecture**
   - Creating separate policies for each database operation (SELECT, INSERT, UPDATE, DELETE)
   - Creating separate policies for each role (authenticated, anon, service_role)
   - Using proper lookup through users table rather than JWT claims
   - Adding comments to document policy purpose and behavior
   - Following Supabase guidelines for RLS policy creation
   - Using lowercase SQL for better readability and consistency

## Key Technical Decisions

- **WebRTC Architecture**: Implemented both SDP proxy and hybrid OpenAI approaches with hooks-based architecture
- **SDP Exchange Approach**: SDP exchange occurs through Fly.io, but actual audio/video streams go directly between client and OpenAI
- **API Key Security**: API keys are never exposed to the client; all sensitive operations proxied through Fly.io
- **Session Isolation**: One VM per interview session for complete isolation and security
- **Authentication Method**: JWT-based authentication for all API endpoints
- **Turn Detection**: Server-side VAD (Voice Activity Detection) for optimal turn-taking
- **Candidate-Tenant Model**: Junction table for many-to-many relationships between candidates and tenants
- **Invitation System**: Secure function for generating invitation tokens that create candidate-tenant relationships
- **SDP Format Preservation**: Line-by-line processing to maintain exact SDP format compatibility
- **Hooks Architecture**: Specialized hooks for different aspects of WebRTC functionality
- **WebRTC Components Structure**: Core hooks (useConnectionState, useRetry, useAudioVisualization), connection hooks (useWebRTCConnection, useWebSocketConnection, useOpenAIConnection, useSDPProxy, useTranscriptManager), and orchestration hook (useWebRTC)
- **Test Architecture**: Test files for individual hooks, test pages for interactive testing, and simulation tools for local development

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

## WebRTC Implementation Architecture

The platform has two WebRTC implementations:

1. **Original SDP Proxy** (fly-interview-poc):
   - Traditional WebRTC SDP proxy with server-side audio processing
   - Full audio transmission over WebSockets
   - Higher latency and more server resources required
   - **Status: SUSPENDED in production**

2. **Hybrid OpenAI Approach** (fly-interview-hybrid):
   - Uses OpenAI's native WebRTC capabilities
   - Fly.io only serves as a secure SDP exchange proxy
   - Direct WebRTC connection between client and OpenAI
   - Lower latency and more efficient resource usage
   - **Status: Implemented locally, pending production deployment**

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

## Production Infrastructure Status

### WebRTC SDP Proxy
- **Application Name:** `interview-sdp-proxy`
- **Status: SUSPENDED** (Last deployed: May 9, 2025)
- **Primary Region:** `mia` (Miami)
- **Access URLs:**
  - WebSocket: `wss://interview-sdp-proxy.fly.dev/ws`
  - HTTP/Status: `https://interview-sdp-proxy.fly.dev`

### Supabase Edge Functions
- **interview-start**: v5 (ACTIVE)
- **interview-transcript**: v4 (ACTIVE)
- **transcript-processor**: v5 (ACTIVE)

## Production Testing Instructions
1. Start the SDP proxy server (suspended)
2. Use test page: `https://[YOUR_DOMAIN]/simple-webrtc-test`
3. Set server URL to: `wss://interview-sdp-proxy.fly.dev/ws`
4. Turn off simulation mode for real OpenAI testing
5. Verify WebRTC connection and transcript generation 