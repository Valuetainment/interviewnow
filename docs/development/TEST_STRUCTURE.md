# WebRTC Testing Structure

This document outlines the testing structure for the WebRTC hybrid architecture implementation. All tests are focused on the hybrid architecture using OpenAI's native WebRTC capabilities.

## Overview

Our testing approach is structured into several categories:

1. **Unit Tests** - Testing individual hooks and components in isolation
2. **Integration Tests** - Testing interaction between hooks and components
3. **Manual Test Pages** - Interactive interfaces for testing the WebRTC functionality
4. **Simulation Tools** - Utilities for testing without OpenAI API keys

## Test Files Structure

### Core Hook Tests

Located in: `src/hooks/webrtc/__tests__/`

These tests focus on the core hooks that form the building blocks of our WebRTC implementation:

| File | Purpose |
|------|---------|
| `useConnectionState.test.ts` | Tests connection state management |
| `useRetry.test.ts` | Tests retry logic with exponential backoff |
| `useAudioVisualization.test.ts` | Tests audio capture and visualization |
| `useWebRTCConnection.test.ts` | Tests WebRTC peer connection and ICE negotiation |
| `useWebSocketConnection.test.ts` | Tests WebSocket connection for SDP exchange |
| `useOpenAIConnection.test.ts` | Tests direct OpenAI WebRTC connections |
| `useSDPProxy.test.ts` | Tests SDP proxy for hybrid architecture |
| `useTranscriptManager.test.ts` | Tests transcript data and storage |
| `useWebRTC.test.ts` | Tests the main orchestration hook |

### Test Pages

Located in: `src/pages/`

These pages provide interactive testing interfaces:

| File | Purpose |
|------|---------|
| `InterviewTestSimple.tsx` | Main test page for WebRTC hybrid architecture |
| `OpenAITestPage.tsx` | Dedicated test page for direct OpenAI integration |
| `FullInterviewTest.tsx` | Comprehensive end-to-end test with full interview flow |

### Simulation Tools

Located in: `fly-interview-hybrid/`

These tools provide a simulation environment for local testing:

| File | Purpose |
|------|---------|
| `simple-server.js` | WebSocket server for simulating WebRTC SDP exchange |
| `combined-server.js` | Enhanced server with transcript simulation |
| `test-server.js` | Advanced test server with debugging capabilities |
| `public/test.html` | Standalone HTML test page for server testing |
| `public/websocket-test.html` | Standalone HTML for WebSocket connection testing |

## Running Tests

### Unit Tests

```bash
# Run all WebRTC-related tests
npm test -- --run src/hooks/webrtc/__tests__

# Run a specific test file
npm test -- --run src/hooks/webrtc/__tests__/useOpenAIConnection.test.ts

# Run with coverage reporting
npm test -- --run src/hooks/webrtc/__tests__ --coverage
```

### Manual Tests

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the appropriate test page:
   - Main test page: http://localhost:8080/interview-test-simple
   - OpenAI-specific test: http://localhost:8080/test/openai
   - Full interview test: http://localhost:8080/test/full

3. For simulation mode testing, start the simulation server:
   ```bash
   cd fly-interview-hybrid
   node simple-server.js
   ```

## Test Mocks

The tests use a comprehensive set of mocks for WebRTC, WebSocket, and Audio APIs in `src/test/setup.ts`:

- RTCPeerConnection with all required methods
- MediaStream for audio handling
- WebSocket for server communication
- AudioContext for audio processing
- navigator.mediaDevices for device access

These mocks allow for thorough testing without requiring actual browser APIs or backend services.

## Best Practices

When developing new WebRTC functionality:

1. **Start with hooks**: Add or update hook implementations first
2. **Write unit tests**: Create tests for any new or modified hooks
3. **Update hook documentation**: Keep JSDoc comments current
4. **Manual testing**: Verify using one of the test pages
5. **Run test suite**: Ensure all tests pass before committing changes

## Connection Testing Workflow

For testing WebRTC connections, follow this workflow:

1. **Simulation Mode**: First test in simulation mode to validate connection flow
2. **Direct OpenAI**: Then test with a direct connection to OpenAI
3. **Production Environment**: Finally test in the actual production environment

This progressive approach helps isolate issues across the testing pyramid.

## Architecture-Specific Test Notes

The hybrid architecture requires specific testing considerations:

1. **SDP Exchange Testing**: Verify proper SDP offer/answer exchange
2. **ICE Candidate Handling**: Test proper ICE candidate processing
3. **OpenAI Message Types**: Test handling of OpenAI-specific message formats
4. **Transcript Processing**: Verify proper speaker and content identification

Each of these areas has dedicated test coverage in the appropriate test files.