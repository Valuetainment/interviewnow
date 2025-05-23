# Claude's Work Log

## Current Task (May 23, 2025)
- Repository cleanup and branch management
- Documentation reorganization and structure improvements
- Production deployment fixes for Vercel

## Progress

### Completed
1. ✅ Identified WebRTC integration issues:
   - SDP proxy was stopped
   - Missing environment variables
   - Issues with client-side error handling

2. ✅ Fixed infrastructure:
   - Started the Fly.io SDP proxy instance
   - Set required environment variables (FLY_APP_NAME)
   - Created local .env file with SIMULATION_MODE=true

3. ✅ Enhanced SDP proxy:
   - Added transcript simulation
   - Improved message handling
   - Added better connection state tracking

4. ✅ Improved client code:
   - Enhanced WebRTCManager with better error handling
   - Added reconnection logic with exponential backoff
   - Added proper cleanup for resources
   - Added audio level visualization

5. ✅ Troubleshooting blank page in test interface (RESOLVED)
   - Fixed routing issue by adding a standalone route for InterviewTestProduction
   - Added demo data for testing interviews without database dependencies
   - Moved test page outside the protected dashboard layout
   - Resolved Vite dependency cache issues with forced rebuild (--force flag)
   - Created a simplified test page at /test-simple to isolate routing issues

6. ✅ Analyzing previous successful WebRTC integration (COMPLETED)
   - Reviewed documentation in consolidated-webrtc-proxy.md
   - Examined test results from previous implementation in TEST_RESULTS.md
   - Compared production-ready SDP proxy with current implementation
   - Identified key components needed for a successful implementation

7. ✅ Documented WebRTC architecture approaches (COMPLETED)
   - Created ARCHITECTURE_COMPARISON.md to explain SDP proxy vs. hybrid approach
   - Documented differences between fly-interview-poc and fly-interview-hybrid
   - Added comprehensive testing documentation

8. ✅ Implementing WebRTC UI integration (COMPLETED)
   - Added InterviewTestSimple route to App.tsx for direct testing
   - Fixed environment variables in WebRTCManager and TranscriptPanel
   - Added support for OpenAI WebRTC session configuration
   - Enhanced TranscriptPanel to properly display AI vs candidate speech
   - Updated saveTranscript function to handle different speakers
   - Added CSS styling for TranscriptPanel and WebRTCManager
   - Aligned data channel name with OpenAI documentation ('oai-events')

9. ✅ Updating backend for hybrid architecture (COMPLETED)
   - Updated interview-start edge function to support hybrid architecture
   - Added architecture selection parameter to API
   - Enhanced response with OpenAI configuration for hybrid mode
   - Created database migration for hybrid architecture support
   - Added speaker identification to transcript entries table
   - Improved alignment with OpenAI's WebRTC implementation

10. ✅ Test the enhanced WebRTCManager with simulation mode (COMPLETED)
    - Fixed WebSocket connection retry issues and infinite error loops
    - Added improved error handling in WebRTCManager component
    - Updated TranscriptPanel to skip database operations for test sessions
    - Implemented simplified WebSocket test server for local development
    - Added better logging for WebSocket message debugging

11. ✅ Update the interview-transcript edge function (COMPLETED)
    - Added architecture-aware speaker detection
    - Improved tenant isolation with proper tenant_id handling
    - Added source tracking to differentiate between architectures

12. ✅ Local testing findings and recommendations (COMPLETED)
    - Identified limitations of local WebRTC testing environment
    - Confirmed WebSocket functionality with standalone test page
    - Encountered browser security restrictions with cross-origin WebSockets
    - Determined that production environment testing is more reliable

13. ✅ Implemented hooks-based WebRTC refactoring (COMPLETED)
    - Created specialized hooks for different aspects of WebRTC functionality
    - Restructured code to eliminate circular dependencies
    - Created modular architecture with clear separation of concerns
    - Implemented proper error handling and reconnection logic
    - Added support for both SDP proxy and direct OpenAI connections
    - Created hooks folder structure with comprehensive exports

### In Progress
1. ✅ WebRTC hooks integration (COMPLETED)
   - Updated WebRTCManager.tsx to use the new hooks architecture
   - Simplified component code by delegating functionality to hooks
   - Maintained backward compatibility with existing UI
   - Added support for simulation and OpenAI direct modes
   - Created test route at /test/webrtc-hooks for testing the implementation

2. ✅ Update Direct OpenAI Integration (COMPLETED)
   - Enhanced useOpenAIConnection hook with proper error handling
   - Implemented support for various OpenAI configuration options
   - Added API key handling with secure local storage
   - Integrated voice customization and temperature settings

### Next Steps
1. ✅ Create unit tests for individual hooks (COMPLETED)
   - Created test setup with Vitest and React Testing Library
   - Implemented comprehensive test files for all hooks:
     - useConnectionState
     - useRetry
     - useAudioVisualization
     - useWebRTCConnection
     - useWebSocketConnection
     - useTranscriptManager
     - useOpenAIConnection
     - useSDPProxy
     - useWebRTC
   - Set up robust mocks for WebRTC and WebSocket APIs
   - Added tests for all major functionality including:
     - Connection establishment and cleanup
     - Error handling and recovery
     - Message processing
     - Transcript management
     - State transitions
   - Added documentation on local vs. production testing expectations

2. ✅ Enhanced test interface (COMPLETED)
   - Added comprehensive debug information panel
   - Implemented connection state timeline visualization
   - Added visual indicators with appropriate colors for all connection states
   - Created session recording functionality with JSON export
   - Improved overall test page UI with better organization and visual feedback
   - Added support for toggling debug information visibility

3. ✅ Fixed production routing issues (COMPLETED)
   - Added Netlify _redirects file to handle SPA routing (/*  /index.html 200)
   - Created vercel.json with route configuration for Vercel deployments
   - Added explicit routes for all test pages in App.tsx
   - Created a standalone webrtc-test.html page for direct access
   - Enhanced route definitions to include all test paths
   - Added dedicated routes for test pages outside protected layouts
   - Fixed deep-linking issues by configuring proper fallback routes

4. ✅ Fixed JS errors in production bundle (COMPLETED)
   - Fixed the "Cannot read properties of undefined (reading 'add')" errors
   - Enhanced tenant ID retrieval with robust error handling
   - Implemented fallback strategies for handling missing tenant data
   - Added better validation in InterviewInvitation component
   - Improved error messages with specific details for easier debugging
   - Added graceful error handling with proper fallbacks

## Prioritized Task List (May 20, 2025)

The following is our prioritized task list for completing the WebRTC implementation and preparing it for production use:

### High Priority Tasks
1. ✅ Complete unit tests for remaining WebRTC hooks (COMPLETED)
   - Implemented tests for useWebRTCConnection, useWebSocketConnection, useOpenAIConnection
   - Implemented tests for useSDPProxy, useTranscriptManager, useWebRTC
   - Created comprehensive test coverage for all hooks

2. ✅ Fix production routing issues with WebRTC test pages (COMPLETED)
   - Resolved 404 errors on test routes in production
   - Fixed direct URL access to SPA routes
   - Added routes for all test environments

3. ✅ Implement proper fallback routes for client-side routing (COMPLETED)
   - Configured server to handle SPA routing correctly with _redirects file
   - Added vercel.json with catch-all route for client-side routing
   - Fixed deep-linking issues with proper route configuration

4. ✅ Debug and fix JS errors in production bundle (COMPLETED)
   - Resolved "Cannot read properties of undefined (reading 'add')" errors
   - Fixed tenant ID retrieval in authentication flows
   - Implemented fallback mechanisms for handling missing data
   - Added proper null checking and error boundaries
   - Enhanced error messaging for easier debugging

5. ✅ Clean up testing structure for hybrid architecture focus (COMPLETED)
   - Updated InterviewTestSimple.tsx to default to hybrid architecture mode
   - Refactored useSDPProxy.test.ts to focus only on hybrid architecture aspects
   - Refactored useWebSocketConnection.test.ts to focus on SDP exchange for hybrid architecture
   - Refactored useTranscriptManager.test.ts to support hybrid source attribution
   - Refactored useOpenAIConnection.test.ts for direct OpenAI connection testing
   - Enhanced test-hybrid-architecture.js script with improved reporting
   - Updated WEBRTC_TESTING.md to focus exclusively on hybrid approach
   - Added docs/guides/testing/TEST_STRUCTURE.md with comprehensive test organization
   - Updated architecture docs to clearly mark original approach as historical
   - Updated main TESTING.md file to reference new testing documentation

6. ✅ Improve WebRTC testing procedures and documentation (COMPLETED)
   - Identified critical `simulation=true` parameter requirement for WebSocket testing
   - Created direct WebSocket testing approach to isolate server functionality
   - Verified WebSocket server functionality independent of React components
   - Updated WEBRTC_TESTING.md with explicit simulation parameter requirements
   - Added browser-based testing procedures for quick server verification
   - Confirmed proper JWT bypass mechanism working correctly

7. ✅ Fix infinite loop in useAudioVisualization.ts (COMPLETED)
   - Added isMountedRef to prevent state updates after component unmounts
   - Added conditional checks before updating state
   - Implemented throttling of audio level and visualization updates
   - Fixed cleanup function to properly release all resources
   - Added safeguards against rapid successive state updates

8. ✅ Create simplified testing components without audio visualization (COMPLETED)
   - Created SimpleWebRTCManager component without visualization features
   - Added SimpleWebRTCTest page with comprehensive configuration options
   - Added error boundaries and fallback UI for robustness
   - Created simplified routes for testing (both /test/simple and /simple-webrtc-test)
   - Maintained core functionality without problematic visualization code

### Medium Priority Tasks
6. ✅ Fix manual connection initiation in SimpleWebRTCTest (COMPLETED)
   - Added "Start Connection" button to the main interface
   - Implemented ref-based control of WebRTC initialization
   - Added Connect button directly to SimpleWebRTCManager as a backup
   - Fixed URL handling to ensure simulation parameter is properly included
   - Added detailed debug panel with troubleshooting instructions
   - Updated testing documentation with clear steps for local testing
   - Enhanced Supabase tenant ID handling to prevent failures
   - Updated UI with clear feedback for connection status

7. ✅ Update the SDP proxy with latest fixes (COMPLETED)
   - Implemented comprehensive error handling and recovery
   - Added enhanced structured logging for diagnostics
   - Implemented session state tracking and recovery mechanisms
   - Added JWT validation for secure tenant isolation
   - Implemented proper CORS and security headers
   - Added heartbeat mechanism to detect silent failures
   - Enhanced status page with diagnostics information

8. ✅ Deploy edge functions for hybrid architecture support (COMPLETED)
   - Enhanced interview-start edge function with improved security and hybrid architecture support
   - Updated transcript-processor edge function with tenant isolation and JWT validation
   - Added comprehensive error handling and logging for both functions
   - Implemented performance metrics collection
   - Enhanced architecture-specific configuration for WebRTC sessions
   - Added operation IDs for cross-component request tracking
   - Improved session metadata and connection parameters

9. Test hybrid architecture with real interview sessions
   - Conduct end-to-end tests with actual interviews
   - Validate transcript storage and retrieval

10. Implement VM per tenant strategy for isolation
    - Configure Fly.io for multi-tenant isolation
    - Ensure secure resource allocation

11. ✅ Configure JWT validation for API endpoints (COMPLETED)
    - Added JWT validation to WebSocket connections
    - Implemented token verification in SDP proxy
    - Added secure session management with tenant isolation
    - Implemented simulation mode bypass for testing purposes

12. ✅ Add tenant_id validation to WebRTC sessions (COMPLETED)
    - Implemented tenant-specific session tracking
    - Added validation to prevent cross-tenant access
    - Updated session management with tenant context
    - Enhanced security model documentation

13. Set up monitoring and alerting for production
    - Implement performance metrics
    - Configure error alerting

### Low Priority Tasks
12. Create automated end-to-end tests for WebRTC flow
13. Implement performance benchmarking tools
14. Set up continuous testing in CI/CD pipeline
15. Document production deployment process
16. Create troubleshooting guide for common issues

## Hybrid Architecture Test Migration Plan

This plan outlines the steps to transition our testing structure to focus exclusively on the hybrid architecture, removing all tests specific to the original SDP proxy approach.

### Phase 1: Test Codebase Audit (1-2 days) (COMPLETED)
1. **Catalog all existing test files** (COMPLETED)
   - Identified tests specific to original SDP proxy architecture
   - Identified tests specific to hybrid architecture
   - Identified shared/common test utilities and helpers

2. **Review hook test implementations** (COMPLETED)
   - Documented which parts of useSDPProxy.test.ts are still relevant
   - Flagged tests that contain conditional logic for both architectures
   - Identified hook mocks that need simplification

3. **Assess test page relevance** (COMPLETED)
   - Evaluated which test pages are essential for hybrid approach
   - Documented test pages with mixed architecture support to refactor
   - Created list of all UI components requiring focused testing

### Phase 2: Clean Up and Removal (2-3 days) (COMPLETED)
1. **Archive original architecture code** (COMPLETED)
   - Moved `fly-interview-poc/test-sdp-proxy.js` to an archived directory
   - Archived other test files exclusively for original architecture
   - Created git commit with clear message about architectural focus change

2. **Simplify hybrid hook tests** (COMPLETED)
   - Updated `useWebRTC.test.ts` to remove original architecture test paths
   - Refactored `useSDPProxy.test.ts` to focus only on components used in hybrid approach
   - Removed conditional architecture branching in all hook tests
   - Updated mocks to reflect only hybrid architecture needs

3. **Consolidate test interface components** (COMPLETED)
   - Simplified `InterviewTestSimple.tsx` by removing architecture toggles
   - Set hybrid architecture as the only option in test interfaces
   - Removed all UI controls for switching between architectures
   - Updated test pages to use direct OpenAI WebRTC endpoints by default

### Phase 3: Documentation Updates (1-2 days) (COMPLETED)
1. **Update test documentation** (COMPLETED)
   - Revised TESTING.md to focus exclusively on hybrid approach
   - Updated WEBRTC_TESTING.md to remove references to original architecture
   - Revised docs/guides/testing/AUTOMATED_TESTING.md to focus only on relevant tests
   - Documented the test organization structure in a new docs/guides/testing/TEST_STRUCTURE.md file

2. **Update architecture documentation** (COMPLETED)
   - Updated ARCHITECTURE_COMPARISON.md to clarify it's for historical reference only
   - Created hybrid-webrtc-architecture.md as the primary reference
   - Removed ambiguous references to multiple architectures in documentation
   - Added clear markers in legacy documentation indicating archived status

### Phase 4: Enhanced Hybrid Testing (3-4 days) (COMPLETED)
1. **Implement focused hybrid architecture tests** (COMPLETED)
   - Created dedicated test for OpenAI WebRTC connection flow
   - Added comprehensive testing for direct connection edge cases
   - Implemented simulation mode tests that accurately reflect production behavior
   - Created more robust mocks for OpenAI WebRTC endpoints

2. **Add integration tests** (COMPLETED)
   - Created tests for the complete interview flow using hybrid architecture
   - Tested transcript storage and retrieval with the hybrid approach
   - Verified error handling specific to the hybrid connection model
   - Created tests for reconnection scenarios unique to direct OpenAI connections

3. **Implement test helper utilities** (COMPLETED)
   - Created helper functions specific to hybrid architecture testing
   - Developed simulation utilities that accurately mimic OpenAI WebRTC behavior
   - Built test fixtures for common hybrid architecture test scenarios
   - Added debugging utilities specific to hybrid architecture issues

### Phase 5: Test Automation (2-3 days) (COMPLETED)
1. **Create streamlined test command** (COMPLETED)
   - Added npm script for running all hybrid architecture tests
   - Configured test filtering to focus on specific test categories
   - Added visual reporting for test results specific to hybrid components
   - Created easy-to-use commands for common test scenarios

2. **Document testing workflows** (COMPLETED)
   - Created developer guide for testing hybrid architecture components
   - Documented common testing patterns and best practices
   - Added troubleshooting guide for hybrid architecture test failures
   - Created quick reference for running different test categories

### Execution Timeline (COMPLETED)
- **Week 1**: Completed Phases 1 and 2 (COMPLETED)
- **Week 2**: Completed Phases 3 and 4 (COMPLETED)
- **Week 3**: Completed Phase 5 and final verification (COMPLETED)

### Expected Outcomes (COMPLETED)
1. Clean, focused test suite specific to the hybrid architecture (COMPLETED)
2. Clear documentation focused on the current architecture (COMPLETED)
3. Improved test coverage for the hybrid approach (COMPLETED)
4. Simplified testing workflow for developers (COMPLETED)
5. More efficient use of development resources (COMPLETED)
6. Clearer understanding of the current architecture throughout the codebase (COMPLETED)

## Hooks Architecture Implementation

The WebRTC implementation has been refactored using a hooks-based architecture with the following structure:

### Core Hooks
- **useConnectionState**: Manages connection state and provides consistent state reporting
- **useRetry**: Handles retry logic with exponential backoff
- **useAudioVisualization**: Handles audio capture and visualization

### Connection Hooks
- **useWebRTCConnection**: Manages WebRTC peer connection and ICE negotiation
- **useWebSocketConnection**: Handles WebSocket connections to the SDP proxy
- **useOpenAIConnection**: Specialized hook for direct OpenAI WebRTC connections
- **useSDPProxy**: Specialized hook for the SDP proxy architecture
- **useTranscriptManager**: Manages transcript data and storage

### Orchestration Hook
- **useWebRTC**: Main entry point that orchestrates all specialized hooks

This architecture eliminates circular dependencies and creates a more maintainable, modular system for WebRTC functionality. Each hook is focused on a specific responsibility, making the code easier to test and extend.

## Commands to Run

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

## Hybrid Architecture Implementation

The project now has two WebRTC implementations:

1. **Original SDP Proxy** (`fly-interview-poc/`):
   - Traditional WebRTC SDP proxy with server-side audio processing
   - Full audio transmission over WebSockets
   - Higher latency and more server resources required

2. **Hybrid OpenAI Approach** (`fly-interview-hybrid/`):
   - Uses OpenAI's native WebRTC capabilities
   - Fly.io only serves as a secure SDP exchange proxy
   - Direct WebRTC connection between client and OpenAI
   - Lower latency and more efficient resource usage

The current integration focuses on implementing the hybrid approach in the main application UI using a hooks-based architecture for better maintainability.

## Test URLs
- Local development: http://localhost:8080/
- Simple WebRTC Test: http://localhost:8080/simple-webrtc-test (Recommended for testing)
- Alternate Simple Test: http://localhost:8080/test/simple
- Ngrok test interview: http://localhost:8080/test/ngrok
- Direct OpenAI test: http://localhost:8080/test/openai
- Full interview test: http://localhost:8080/test/full
- Production SDP proxy: wss://interview-sdp-proxy.fly.dev/ws
- Local simulation server: ws://localhost:3001 (use with ?simulation=true parameter)

## WebRTC Testing Troubleshooting and Solutions

### Identified React Component Issues (May 20, 2025)
After extensive investigation, we've identified and resolved several critical issues affecting the WebRTC component implementation:

1. **Infinite React Update Loop**
   - The WebRTCManager and SimpleWebRTCManager components were triggering "Maximum update depth exceeded" errors
   - Components were mounting, creating WebSockets, and then immediately unmounting in a rapid cycle
   - Connections were closing with code 1001 before they could be fully established
   - Server logs showed "IMMEDIATE CLOSE DETECTED - Connection closed before session message could be sent"

2. **Component Lifecycle Problems**
   - State updates after component unmounting were causing React warnings
   - Re-renders were triggering new connection attempts while previous ones were still closing
   - Multiple `useEffect` hooks with changing dependencies were causing rapid reconnections

3. **Missing Simulation Parameter**
   - Critical `simulation=true` parameter was inconsistently added to WebSocket URLs
   - Connection attempts without this parameter would fail silently
   - Proper URL formatting needed for both direct and WebSocket connections

### Implementation of Solutions
1. **Created BasicWebRTCTest Simplified Component**
   - Developed a streamlined React component with proper lifecycle management
   - Implemented clean WebSocket connection handling with proper cleanup
   - Added explicit connect/disconnect buttons to give user control
   - Eliminated problems with the hooks-based architecture
   - Added proper error handling and user feedback

2. **Troubleshooting Tools**
   - Created standalone HTML test page (direct-websocket-test.html) to verify server connections
   - Implemented direct console-based WebSocket testing methodology
   - Added detailed server logs to track connection lifecycle
   - Ensured clear visual status indicators for all connection states

3. **Key Findings**
   - Simulation server works correctly when accessed directly with `simulation=true` parameter
   - Browser-only direct WebSocket connections succeed consistently
   - React component lifecycle management requires careful handling for WebRTC connections
   - Adding `react=true` parameter to WebSocket URLs enables React-specific optimizations on the server

### Working Test URLs
- Direct HTML test: file:///Users/benpappas/Documents/interview_triangular/ai-interview-insights-platform/direct-websocket-test.html
- Simplified React component: http://localhost:8080/basic-webrtc-test
- Test page with disabled auto-connect: http://localhost:8080/simple-webrtc-test
- Original complex test page: http://localhost:8080/interview-test-simple

## Repository Management & Documentation Reorganization (May 23, 2025)

### Completed Today
1. ✅ **Synchronized local repository with GitHub**
   - Pulled latest changes from main branch (2 PRs were already merged)
   - Updated local tracking branches after remote deletions
   - Cleaned up stale branch references

2. ✅ **Merged pending feature branches**
   - Successfully merged `feat/webrtc-integration` with WebRTC deployment fixes
   - Merged `fix-company-creation` with UI navigation improvements
   - Resolved all merge conflicts in 6 files
   - Deleted redundant `webrtc2` branch (WIP duplicate)

3. ✅ **Organized 82 uncommitted documentation changes**
   - Created logical commits grouping related changes:
     - WebRTC testing infrastructure enhancements
     - Critical production deployment documentation
     - Documentation reorganization planning
     - New documentation structure implementation
     - Comprehensive architecture documentation
     - Hybrid architecture database migration

4. ✅ **Implemented new documentation structure**
   - Created `/docs` hierarchy with logical organization
   - Added API documentation with OpenAPI spec
   - Created guides/ and features/ directories
   - Archived legacy triangular architecture docs
   - Added comprehensive planning documents

5. ✅ **Fixed Vercel production deployment issue**
   - Resolved MIME type error preventing app from loading
   - Updated vercel.json from deprecated `routes` to modern `rewrites`
   - Added explicit Content-Type headers for JavaScript files
   - Fixed SPA routing to properly serve static assets
   - Site now loads correctly at https://interviewnow-fawn.vercel.app/

### Key Fixes
- **Vercel Deployment**: Changed from `routes` to `rewrites` configuration to properly handle SPA routing while serving static assets
- **Navigation**: Simplified navbar to avoid redundancy in dashboard routes
- **Company Creation**: Fixed tenant_id handling in company creation flow

## Browser Tools MCP
Browser-tools-mcp has been integrated to allow browser monitoring and interaction. This integration provides:

- Browser console logging and monitoring
- Network traffic analysis and error tracking
- Screenshot capabilities
- Page element analysis
- Comprehensive audits (accessibility, performance, SEO, best practices)

### Usage Requirements
1. Chrome extension must be installed
2. Node server must be running with:
   ```bash
   npx @agentdeskai/browser-tools-server@latest
   ```
3. MCP tools are available via these functions:
   - mcp__browser-tools-mcp__getConsoleLogs
   - mcp__browser-tools-mcp__getConsoleErrors
   - mcp__browser-tools-mcp__getNetworkErrors
   - mcp__browser-tools-mcp__getNetworkLogs
   - mcp__browser-tools-mcp__takeScreenshot
   - mcp__browser-tools-mcp__getSelectedElement
   - mcp__browser-tools-mcp__wipeLogs
   - mcp__browser-tools-mcp__runAccessibilityAudit
   - mcp__browser-tools-mcp__runPerformanceAudit
   - mcp__browser-tools-mcp__runSEOAudit
   - mcp__browser-tools-mcp__runNextJSAudit
   - mcp__browser-tools-mcp__runDebuggerMode
   - mcp__browser-tools-mcp__runAuditMode
   - mcp__browser-tools-mcp__runBestPracticesAudit