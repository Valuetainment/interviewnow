# AI Interview Insights Platform - Active Context

## Current Project Status
The project has made significant progress in establishing the frontend foundation. We have set up the project structure, created layout components, and configured authentication. Most importantly, we've established a local Supabase development environment with the complete database schema and storage buckets in place. We have also completed implementation of all navigation components (Navbar, Sidebar, Header), enhanced the authentication UI with proper Supabase integration, and implemented a comprehensive dashboard overview experience. We've now completed the resume processing flow, enabling users to upload, process, and analyze candidate resumes. We've also implemented the position creation feature with AI-powered description generation and competency management. Most recently, we've implemented the interview session management interface with a comprehensive testing infrastructure, enhanced the candidate management system with People Data Labs integration, established a complete CI/CD pipeline with GitHub, Supabase, and Vercel integration, and fixed critical issues with authentication and tenant association in the production environment. The latest improvements include storage configuration in production, RLS policy fixes, Edge Function optimization to ensure the resume processing workflow works correctly in the production environment, and the implementation of a robust CandidateProfile page with proper data handling and enhanced display based on the MVP implementation patterns. We've also fixed company creation in production by addressing RLS policies and tenant_id handling, improved the UI navigation by removing redundant elements and simplifying the user experience, and fixed position creation by resolving RLS policy issues that were preventing positions from being saved to the database. We've also completed an evaluation of infrastructure platforms for interview processing, comparing E2B and Fly.io, with a recommendation to use Fly.io for its superior multi-tenant isolation, burstable CPU capacity, and better strategic alignment with our needs. Most recently, we've successfully completed a Fly.io proof-of-concept for interview transcription processing, validating the technical approach with WebSockets and real-time data transmission. We've extended our testing by deploying the proof-of-concept to Fly.io, fixing WebSocket connectivity issues, implementing simulation mode, and successfully testing multi-region deployment across Miami (US) and Frankfurt (Europe). We've documented our security findings and created a comprehensive TEST_SUMMARY.md that confirms Fly.io meets our requirements for hosting the real-time interview transcription service. We've also created comprehensive documentation of our authentication and permissions system, including both user and candidate authentication flows, and implemented database schema changes to support a multi-tenant candidate experience. We've now implemented a WebRTC SDP proxy for secure communication between clients and OpenAI's API without exposing sensitive credentials, extensively tested to ensure proper SDP handling and WebRTC connection establishment.

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
   - 🔄 Fixing remaining TypeScript errors

2. 🔄 **Interview Session Management**
   - ✅ Session creation and listing
   - ✅ Interview room with A/V controls
   - ✅ Real-time transcript processing
   - 🔄 Pending production verification
   - ✅ Infrastructure platform evaluation completed
   - ✅ Fly.io proof-of-concept completed
   - ✅ WebRTC SDP proxy implemented and tested

3. 🔄 **Candidate Authentication System**
   - ✅ Database schema with candidate-tenant junction table
   - ✅ Multi-tenant support for candidates
   - ✅ Invitation-based registration flow
   - ✅ Row-level security policies
   - 🔄 Pending production deployment

## Current Work Focus
The immediate focus is on fixing the remaining TypeScript errors in the CandidateProfile component and ensuring proper data handling between the candidates and candidate_profiles tables:

1. ✅ **Resume Processing Flow**
   - ✅ Created resume upload component with file validation
   - ✅ Implemented PDF preview functionality
   - ✅ Connected with Edge Functions for text extraction and AI analysis
   - ✅ Integrated with database for storing structured resume data
   - ✅ Built candidate list display with resume data visualization
   - ✅ **People Data Labs Integration**
     - ✅ Created candidate_profiles table for enriched data
     - ✅ Implemented enrich-candidate Edge Function
     - ✅ Updated frontend to display PDL-enriched candidate data
     - ✅ Built enhanced candidate display components
   - ✅ Created detailed CandidateProfile page with tabbed interface
   - ✅ **CandidateProfile Component Improvements**
     - ✅ Fixed TypeScript errors related to candidates and candidate_profiles tables
     - ✅ Updated interface definitions to properly handle JSON data
     - ✅ Resolved block-scoped variable used before declaration issue
     - ✅ Added proper type definitions for experience and education fields
     - ✅ Enhanced data display with better formatting based on MVP patterns
     - ✅ Added Areas of Specialization and Notable Achievements sections
     - ✅ Improved date formatting and responsibility displays
     - ✅ Implemented blue text styling for visual distinction of important data
     - 🔄 Still need to resolve a few remaining TypeScript errors
     - 🔄 Ensuring candidate_profiles table exists in production

2. ✅ **Position and Competency Management**
   - ✅ Created position management UI with form validation
   - ✅ Implemented AI-powered position description generation 
   - ✅ Added competency suggestion based on position description
   - ✅ Built competency weighting UI with validation
   - ✅ Connected to database for storing positions and competencies

3. ✅ **Interview Session Management**
   - ✅ Created interview session list component with filtering and search
   - ✅ Implemented session creation and management UI
   - ✅ Built interview room UI with video/audio controls
   - ✅ Added real-time transcript panel
   - ✅ Implemented session invitation system
   - ✅ Created comprehensive testing infrastructure
   - ✅ **Infrastructure Platform Evaluation**
     - ✅ Evaluated E2B as a potential platform for interview processing
       - ✅ Identified limitations in multi-tenant isolation capabilities
       - ✅ Noted specialized focus on AI agent infrastructure rather than general compute
       - ✅ Consulted with E2B team about suitability for our use case
     - ✅ Evaluated Fly.io as an alternative platform
       - ✅ Analyzed hierarchical structure (Apps → Machines) for tenant isolation
       - ✅ Assessed burstable CPU characteristics for interview workloads
       - ✅ Reviewed pricing model and scalability options
     - ✅ Completed comparative analysis between platforms
       - ✅ Recommended Fly.io for superior multi-tenant isolation
       - ✅ Noted better strategic alignment with our interview processing needs
       - ✅ Documented performance advantages for intermittent workloads
     - ✅ **Fly.io Proof-of-Concept Implementation**
       - ✅ Created isolated test environment with Node.js/Express
       - ✅ Implemented WebSocket server for real-time communication
       - ✅ Built browser client for audio capture and playback
       - ✅ Added simulated OpenAI integration for transcription
       - ✅ Successfully tested WebSocket communication for data transmission
       - ✅ Validated session management for multiple interview connections
       - ✅ Addressed cross-origin issues and port conflicts
       - ✅ Created comprehensive documentation:
         - ✅ TEST_RESULTS.md detailing findings and technical insights
         - ✅ DEPLOYMENT_GUIDE.md for Fly.io deployment steps
         - ✅ PRODUCTION_INTEGRATION.md for main app integration
     - ✅ **WebRTC SDP Proxy Implementation**
       - ✅ Implemented secure SDP (Session Description Protocol) proxying
       - ✅ Created SDP answer generation with format compatibility
       - ✅ Handled WebRTC connection establishment without exposing API keys
       - ✅ Designed architecture to maintain SDP structure exactly
       - ✅ Successfully tested full WebRTC connectivity
       - ✅ Created comprehensive documentation:
         - ✅ WEBRTC-SDP-PROXY-TEST.md detailing implementation and challenges
         - ✅ Test script for verifying proxy functionality
         - ✅ Updated README with API reference and usage guide

4. ✅ **Authentication & Permissions System**
   - ✅ Tenant and User Authentication
     - ✅ Documented role-based access control approach
     - ✅ Created and verified RLS policies for tenant isolation
     - ✅ Implemented JWT claims with tenant_id and role information
     - ✅ Built UI components that respect user permissions
     - ✅ Added comprehensive error handling for auth failures
   - ✅ Candidate Authentication System
     - ✅ Created candidate_tenants junction table for multi-tenant relationships 
     - ✅ Added auth_id reference to candidates table
     - ✅ Implemented RLS policies for secure candidate data access
     - ✅ Created secure invitation function for account registration
     - ✅ Designed one-to-many tenant relationship system for candidates
     - ✅ Documented complete authentication flow in verified-flows

5. ✅ **Testing and Environment Setup**
   - ✅ Established standardized environment configuration
   - ✅ Implemented Edge Function environment variable handling
   - ✅ Created check-env function to verify API key accessibility
   - ✅ Set up local environment with proper env file configuration
   - ✅ Documented environment variable requirements in testing guides

6. ✅ **CI/CD Pipeline Setup**
   - ✅ Created new GitHub repository (thelabvenice/triangularai)
   - ✅ Migrated codebase to the new repository
   - ✅ Updated project README with comprehensive documentation
   - ✅ Connected Supabase to GitHub repository with branching enabled
   - ✅ Configured Vercel deployment integration
   - ✅ Established automated deployment workflow
   - ✅ Fixed Git author configuration for proper deployments

7. ✅ **Production Environment Fixes**
   - ✅ Fixed Supabase client to properly detect environment (development vs production)
   - ✅ Implemented tenant creation and association for new users
   - ✅ Created default tenants (Acme Corp and Stark Industries)
   - ✅ Set up RLS policies to allow user registration and tenant access
   - ✅ Added database functions and triggers for user-tenant association
   - ✅ Verified authentication flow with email confirmation
   - ✅ Created storage buckets (resumes, videos, audio) in production
   - ✅ Fixed RLS policies for users and candidates tables
   - ✅ Made resumes bucket public for PDF.co access
   - ✅ Added policy to allow storage objects to be publicly readable
   - ✅ Fixed Edge Function authentication with JWT verification disabled
   - ✅ Updated Edge Function environment variables for production
   - ✅ Modified frontend to use direct fetch for Edge Function calls
   - ✅ Created and deployed migration for storage permissions
   - ✅ Successfully tested end-to-end resume processing in production
   - ✅ Fixed routing after candidate creation with proper navigation

8. ✅ **Detailed Candidate Profile**
   - ✅ Created comprehensive CandidateProfile component
   - ✅ Implemented proper database schema for candidate_profiles
   - ✅ Added fail-safe handling for missing candidate_profiles table
   - ✅ Created proper data extraction from both resume_analysis and enriched profile
   - ✅ Built tabbed interface for different types of information
   - ✅ Added visual indicators for PDL-enriched data
   - ✅ Implemented resume PDF viewer in dedicated tab
   - ✅ Enhanced display with improved formatting for dates, responsibilities, and achievements
   - ✅ Implemented styling patterns from MVP (blue text for highlighting, better spacing)
   - ✅ Added better structured display of education data from string format
   - ✅ Enhanced experience section with better date handling and responsibility lists
   - ✅ Added areas of specialization and notable achievements sections
   - 🔄 **Current Issues to Fix**
     - 🔄 Remaining TypeScript errors in CandidateProfile.tsx
     - 🔄 Deployment of candidate_profiles table to production

9. ✅ **Company Creation and UI Navigation Improvements**
   - ✅ Fixed company creation in production with new migration
   - ✅ Made tenant_id column nullable to support initial user flow
   - ✅ Simplified RLS policies with more permissive approach
   - ✅ Enhanced database trigger for handling tenant_id
   - ✅ Improved UI navigation by removing redundant elements
   - ✅ Modified Navbar.tsx to hide on dashboard routes
   - ✅ Updated MobileNav.tsx to match dashboard behavior
   - ✅ Removed horizontal navigation bar that duplicated sidebar links
   - ✅ Created cleaner UI hierarchy with sidebar for main navigation
   - ✅ Integrated resume functionality into Candidates section
   - ✅ Removed the "Resumes" entry from the sidebar on the main branch

10. ✅ **Position Creation Fixes**
   - ✅ Identified issue with positions not being saved to database
   - ✅ Discovered RLS policy using non-existent JWT claim
   - ✅ Created migration 20250514131500_fix_positions_rls_policy.sql
   - ✅ Implemented proper RLS policies using user tenant lookup
   - ✅ Applied more granular policies (select, insert, update, delete)
   - ✅ Successfully deployed migration to production
   - ✅ Verified position creation working correctly
   - ✅ Added debugging code to better identify database issues
   - ✅ Created test scripts for troubleshooting RLS policies
   - ✅ Fixed competencies table RLS policies with a similar approach
   - ✅ Updated positions listing page to fetch real database records
   - ✅ Completed end-to-end position creation, saving, and viewing workflow

11. ✅ **Infrastructure Platform Evaluation**
    - ✅ Evaluated E2B and Fly.io as potential platforms
    - ✅ Selected Fly.io for stronger isolation capabilities
    - ✅ Leveraging Fly.io's Apps → Machines structure for tenant isolation
    - ✅ Taking advantage of burstable CPU for interview transcription workloads
    - ✅ Planning API interfaces for frontend to communicate with Fly.io services
    - ✅ Completed Fly.io proof-of-concept:
      - ✅ Created isolated test environment separate from main codebase
      - ✅ Implemented WebSocket-based communication for real-time data
      - ✅ Successfully tested session management and transcript accumulation
      - ✅ Validated technical approach for integration with main application
      - ✅ Created comprehensive documentation for deployment and integration

## Recent Changes
- Implemented WebRTC SDP proxy for secure communication:
  - Created an SDP proxy to handle WebRTC connection establishment between clients and OpenAI API
  - Implemented sophisticated SDP answer generation that maintains exact media line order from client offers
  - Successfully overcame the "m-lines in answer doesn't match order in offer" challenge
  - Created test utility for verifying SDP proxy functionality
  - Added comprehensive documentation in WEBRTC-SDP-PROXY-TEST.md detailing the implementation
  - Updated project README with API reference and usage information
  - Created sample environment configuration file
- Implemented and documented complete authentication and permissions system:
  - Created USER_AUTH_PERMISSIONS_FLOW.md with comprehensive documentation of role-based access
  - Enhanced CANDIDATE_AUTH_FLOW.md with multi-tenant support details
  - Implemented database schema changes for candidate-tenant relationships
  - Created candidate_tenants junction table for many-to-many relationships
  - Added secure invitation function for candidate account creation
  - Implemented RLS policies for candidate data access across tenants
  - Updated README.md in verified-flows to include the new documentation
- Extended Fly.io proof-of-concept testing with multi-region deployment:
  - Successfully deployed to both Miami (US) and Frankfurt (Europe) regions
  - Fixed WebSocket connectivity issues by updating connection URL to use dynamic host detection
  - Implemented simulation mode to test without a real OpenAI API key
  - Confirmed all machines are showing "started" status with passing health checks
  - Validated consistent behavior across regions for global distribution
  - Created comprehensive TEST_SUMMARY.md documenting findings
  - Updated fly-security.md with security findings from our implementation
  - Confirmed Fly.io meets our requirements for hosting the real-time transcription service

## Current Issues to Fix
1. **Remaining TypeScript Errors in CandidateProfile.tsx**
   - Several TypeScript errors still need to be fixed in the CandidateProfile component:
     - Type '{}' is missing the following properties from type 'JobPosition[]': length, pop, push, concat, and 29 more
     - Property 'length' does not exist on type 'unknown'
     - Type 'unknown' is not assignable to type 'ReactNode'

2. **Database Type Definitions**
   - The database type definitions need further updates:
     - Need to fix remaining type issues with array properties
     - Need to handle JSON object structures more robustly

3. **Missing Table in Production**
   - The candidate_profiles table needs to be deployed to production:
     - Migration file exists but needs to be applied to production
     - RLS policies need to be verified for proper access control
     - Need to test the full workflow in production after deployment

4. **Candidate Authentication Implementation**
   - The candidate-tenant relationship schema needs to be deployed:
     - Deploy the candidate_tenants table to production
     - Verify RLS policies for proper tenant isolation
     - Test invitation-based registration flow

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

17. **WebRTC SDP Proxy Architecture**
    - Implemented Node.js Express server with WebSocket support
    - Created secure SDP exchange mechanism without exposing API keys
    - Used a line-by-line approach to maintain exact SDP format compatibility
    - Implemented proper session management for concurrent connections
    - Added ICE candidate handling for connection establishment
    - Created comprehensive testing and documentation
    - Designed API for both WebSocket and HTTP-based communication

## Next Steps
1. **Fix Remaining TypeScript Errors in CandidateProfile**
   - Fix the type issues with JobPosition[] and unknown arrays
   - Resolve the 'ReactNode' assignment issues
   - Ensure all places using properties like 'length' have proper type guards

2. **Deploy Candidate Profiles Table to Production**
   - Apply migration to create candidate_profiles table in production
   - Verify RLS policies for proper tenant isolation
   - Test full workflow with PDL enrichment in production
   - Monitor for any performance issues

3. **Deploy Candidate Authentication Schema**
   - Apply migration to create candidate_tenants table in production
   - Deploy and test the invitation-based registration flow
   - Verify RLS policies for proper tenant isolation
   - Test multi-tenant candidate access

4. **Integrate WebRTC SDP Proxy into Main Application**
   - Apply lessons from WebRTC SDP proxy testing to main application
   - Create React component for WebRTC communication
   - Implement proper API integration with Fly.io proxying service
   - Ensure secure API key management
   - Add proper error handling and reconnection logic

5. **Finalize Production Environment**
   - Complete end-to-end testing of all features in production
   - Monitor application performance and error rates
   - Set up logging and monitoring tools
   - Create proper error handling for all edge cases
   - Document production deployment and maintenance procedures

6. **Assessment Engine**
   - Design assessment generation UI
   - Implement weighted scoring algorithm
   - Create assessment results visualization
   - Build comparative analysis tools

7. **Transcription Improvements**
   - Optimize transcript processor for performance
   - Implement caching mechanism for audio chunks
   - Add speaker diarization for multi-participant interviews
   - Improve real-time performance

8. **Reporting and Analytics**
   - Design reporting dashboard UI
   - Implement data visualization components
   - Create export functionality
   - Build analytics based on interview data

9. **Database Migration Management**
   - Document database evolution and changes
   - Implement proper schema versioning
   - Create comprehensive migration scripts for future changes

## Dependencies and Blockers
- ✅ PDF.co integration issues in local environment (RESOLVED)
- ✅ Tenant ID association in authentication flow (RESOLVED)
- ✅ Storage buckets missing in production (RESOLVED)
- ✅ RLS policy issues with users and candidates tables (RESOLVED)
- ✅ Resume processing issues with Edge Functions (RESOLVED)
- ✅ Missing enrich-candidate function in production (RESOLVED)
- ✅ Edge Function authentication issues (RESOLVED)
- ✅ OpenAI API key configuration in production (RESOLVED)
- ✅ Navigation routing issues after candidate creation (RESOLVED)
- ✅ Many TypeScript errors in CandidateProfile component resolved
- ✅ Position creation RLS policy issues (RESOLVED)
- ✅ Proof-of-concept for Fly.io interview processing (COMPLETED)
- ✅ WebRTC SDP proxy implementation (COMPLETED)
- 🔄 Some remaining TypeScript errors in CandidateProfile component
- 🔄 Deployment of candidate_profiles table to production
- 🔄 Deployment of candidate_tenants table to production
- Need to optimize Edge Functions for better scalability
- Need to implement fallback mechanisms for API failures

## Open Questions
- Should we implement a staging environment before making more production changes?
- What monitoring and logging tools should we implement for production?
- How should we handle database migrations in production vs. development?
- How should we handle cases where PDL doesn't return data for a candidate?
- How should we implement caching for transcript processing to reduce OpenAI API calls?
- What metrics should be included in the assessment engine's weighted scoring? 
- How should we integrate the Fly.io WebSocket server with our authentication system?
- What database schema modifications are needed to store transcription data?
- How should we implement invitation-based email authentication for candidates?
- Should we add social login options (Google, LinkedIn) for candidate sign up?
- How should we handle WebRTC connection failures in poor network conditions?

# Active Development Context

## Current Focus

The project is transitioning to a hybrid architecture for improved performance, security, and reliability. This architecture integrates:

1. **Fly.io** for tenant isolation, connection brokering, and secure credential management
2. **OpenAI's WebRTC API** for direct client-to-OpenAI audio streaming and real-time interactions
3. **api.video** for video recording capabilities
4. **Supabase** for database, authentication, and edge functions

We're also enhancing the authentication system to support both tenant users and candidates with different access patterns:
1. **Tenant Users**: One-to-one relationship with tenants, role-based permissions
2. **Candidates**: Many-to-many relationship with tenants, invitation-based onboarding

We've successfully implemented and tested a WebRTC SDP proxy that handles secure communication between clients and OpenAI's API without exposing sensitive credentials.

## Recent Decisions

- **Hybrid Architecture Selection**: After evaluating both the triangular and hybrid architectural approaches, we've decided to move forward with the hybrid architecture that leverages OpenAI's WebRTC capabilities for direct audio streaming while maintaining security through Fly.io's SDP proxying.
- **Account-Based Authentication**: Using invitation links that lead to account creation (magic link or Google auth) to support candidates interviewing with multiple companies
- **One-to-Many Candidate-Tenant Relationship**: Implementing database schema to support candidates interviewing with multiple companies
- **Parallel Processing**: Audio processing through OpenAI WebRTC while video recording through api.video
- **Implementation Checklist Created**: Developed a comprehensive implementation checklist (see memory-bank/hybrid-implementation-checklist.md) to guide the development process
- **Authentication Documentation**: Created comprehensive documentation for both user and candidate authentication flows
- **Multi-Tenant Candidate Model**: Implemented database schema with candidate_tenants junction table to support candidates connecting with multiple companies
- **SDP Proxy Implementation**: Successfully implemented a WebRTC SDP proxy that maintains exact format compatibility while ensuring secure API key management

## Current Challenges

- **Connection Security**: Ensuring secure authentication without exposing API keys while still enabling direct WebRTC connections
- **Integration Complexity**: Coordinating multiple services (Fly.io, OpenAI, api.video, Supabase) in a cohesive architecture
- **Tenant Isolation**: Ensuring proper multi-tenant security through Fly.io while maintaining performance
- **WebRTC Reliability**: Handling connection issues, timeouts, and reconnection in WebRTC connections
- **Cross-Tenant Authentication**: Implementing secure authentication for candidates across multiple tenants
- **Permission Management**: Ensuring proper permission enforcement across the application
- **SDP Format Compatibility**: Maintaining exact format compatibility in SDP exchanges to ensure WebRTC connections work properly

## Next Steps

1. ✅ Modify the existing fly-interview-poc to implement SDP proxying instead of full audio processing
2. Integrate the WebRTC SDP proxy with the main application
3. Create database schema updates for the new architecture
4. Develop a React WebRTC component for testing
5. Implement secure API key management on Fly.io VMs
6. Deploy the candidate authentication schema changes to production
7. Add proper error handling and reconnection logic for WebRTC connections

## Key Technical Decisions

- **SDP Exchange Approach**: SDP exchange occurs through Fly.io, but actual audio/video streams go directly between client and OpenAI
- **API Key Security**: API keys are never exposed to the client; all sensitive operations proxied through Fly.io
- **Session Isolation**: One VM per interview session for complete isolation and security
- **Authentication Method**: JWT-based authentication for all API endpoints
- **Turn Detection**: Server-side VAD (Voice Activity Detection) for optimal turn-taking
- **Candidate-Tenant Model**: Junction table for many-to-many relationships between candidates and tenants
- **Invitation System**: Secure function for generating invitation tokens that create candidate-tenant relationships
- **SDP Format Preservation**: Line-by-line processing to maintain exact SDP format compatibility

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
- **Authentication and Permissions Flow**: docs/verified-flows/USER_AUTH_PERMISSIONS_FLOW.md
- **Candidate Authentication Flow**: docs/verified-flows/CANDIDATE_AUTH_FLOW.md 