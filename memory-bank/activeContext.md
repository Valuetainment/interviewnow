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
- Fixed CandidateProfile TypeScript errors:
  - Verified the component builds successfully with no TypeScript errors
  - Ensured proper typing for arrays with nullable/optional data
  - Implemented proper handling of JSON data from Supabase
- Implemented robust database migrations for interview transcript system:
  - Created a single atomic migration strategy to ensure tables exist before policies
  - Used fully-qualified schema references (`public.table_name.column_name`) in SQL policies
  - Properly sequenced migrations to avoid dependency errors
  - Enhanced RLS policies with `(SELECT auth.uid())` pattern for better performance
  - Added detailed documentation within migrations
- Established a proper Git branching workflow with Supabase:
  - Used feature branches with automated preview environments
  - Properly tested schema changes in isolation before merging
  - Confirmed Supabase-Vercel integration properly sets environment variables
  - Documented branch-based workflow for future development

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

## Next Steps
1. **Integrate WebRTC SDP Proxy into Main Application**
   - Create a new feature branch for the implementation
   - Build React components for WebRTC communication
   - Connect to the Fly.io SDP proxy service
   - Implement proper error handling and reconnection logic
   - Add visual indicators of connection status

2. **Design Interview Room Interface**
   - Create dedicated layout for the interview experience
   - Implement video/audio controls
   - Design real-time transcript display
   - Add interviewer AI persona selection
   - Implement responsive design for mobile compatibility

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
1. **Integrate WebRTC SDP Proxy into Main Application**
   - Create a new feature branch for the implementation
   - Build React components for WebRTC communication
   - Connect to the Fly.io SDP proxy service
   - Implement proper error handling and reconnection logic
   - Add visual indicators of connection status

2. **Design Interview Room Interface**
   - Create dedicated layout for the interview experience
   - Implement video/audio controls
   - Design real-time transcript display
   - Add interviewer AI persona selection
   - Implement responsive design for mobile compatibility

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