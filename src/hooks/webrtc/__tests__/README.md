# WebRTC Hooks Testing Structure

This directory contains tests for the WebRTC hooks implementation, focusing exclusively on the **hybrid architecture**. The hybrid architecture establishes a direct WebRTC connection between the client and OpenAI, using our proxy server only for secure SDP exchange.

## Hybrid Architecture Focus

> **IMPORTANT:** As of May 2025, we've migrated exclusively to the hybrid architecture approach and no longer support the original SDP proxy architecture (where audio was fully transmitted through our proxy server).

All tests in this directory have been refactored to test only the hybrid architecture functionality, removing any test cases specific to the original SDP proxy approach.

## Test Files Organization

The test files are organized into two categories:

### Core Hook Tests

These test files verify the utility hooks that are used across different parts of the system:

- **useConnectionState.test.ts** - Tests for connection state management
- **useRetry.test.ts** - Tests for retry logic and exponential backoff
- **useAudioVisualization.test.ts** - Tests for audio capture and visualization

### Hybrid Architecture Hook Tests

These test files verify the specialized hooks for the hybrid WebRTC approach:

- **useWebRTCConnection.test.ts** - Tests for WebRTC peer connection management
- **useWebSocketConnection.test.ts** - Tests for WebSocket connections used in SDP exchange
- **useOpenAIConnection.test.ts** - Tests for direct OpenAI WebRTC connections
- **useSDPProxy.test.ts** - Tests for secure SDP exchange (but not audio proxy)
- **useTranscriptManager.test.ts** - Tests for transcript management with hybrid source
- **useWebRTC.test.ts** - Tests for the main orchestration hook

## Test Mocks

Each test file uses mocks to simulate external dependencies:

- **WebRTC APIs** - `RTCPeerConnection`, `MediaStream`, `RTCDataChannel`
- **WebSocket** - For SDP exchange
- **Supabase client** - For transcript storage
- **OpenAI API** - For direct WebRTC connections

## Running Tests

You can run tests using the specialized hybrid architecture test script:

```bash
# Run from project root
npm run test:hybrid
```

This script provides detailed reporting on the test results, categorized by hook type.

Alternatively, you can run the tests directly with Vitest:

```bash
# Run all WebRTC hook tests
npm test -- --run src/hooks/webrtc/__tests__

# Run a specific test file
npm test -- --run src/hooks/webrtc/__tests__/useOpenAIConnection.test.ts
```

## Test Coverage

The current test suite covers:

- Connection establishment and cleanup
- Error handling and recovery
- Message processing and routing
- Transcript management
- State transitions
- Simulation mode functionality
- Direct OpenAI connection configuration
- SDP exchange security
- Audio visualization

## Adding New Tests

When adding new tests, keep these guidelines in mind:

1. Focus **exclusively** on the hybrid architecture
2. Do not add tests for the original SDP proxy approach
3. Ensure proper mocking of external dependencies
4. Test both successful and error scenarios
5. Verify proper cleanup of resources

For more information on the hybrid architecture testing approach, see the main [WEBRTC_TESTING.md](/WEBRTC_TESTING.md) file.