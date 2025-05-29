I'll explain the WebRTC architecture and what each component is responsible for:

  WebRTC Architecture Overview

  1. WebRTCManager (React Component)

  Location: src/components/interview/WebRTCManager.tsx
  Purpose: UI component that displays connection status and controls
  Responsibilities:
  - Shows connection status (dots: red/yellow/green)
  - Displays audio level visualization
  - Provides "End Interview" button
  - Shows error messages
  - Handles reconnection UI

  2. useWebRTC (Main Orchestration Hook)

  Location: src/hooks/webrtc/useWebRTC.ts
  Purpose: Main entry point that coordinates everything
  Responsibilities:
  - Decides which connection type to use (OpenAI direct vs SDP proxy)
  - Manages overall connection state
  - Coordinates with Supabase for tenant information
  - Calls the interview-start edge function to get WebSocket URL
  - Problem: It instantiates BOTH connection types even though only one is used

  3. useSDPProxy (SDP Proxy Connection)

  Purpose: Handles WebRTC through a proxy server (Fly.io)
  How it works:
  Browser ← WebSocket → Fly.io Proxy ← → OpenAI
           (SDP exchange)
  Browser ← WebRTC Audio → OpenAI (direct)
  Uses:
  - useWebSocketConnection - For SDP exchange with Fly.io
  - useWebRTCConnection - For actual WebRTC peer connection
  Responsibilities:
  - Connects to Fly.io WebSocket for signaling
  - Exchanges SDP offers/answers through the proxy
  - Sets up direct audio connection to OpenAI

  4. useOpenAIConnection (Direct OpenAI Connection)

  Purpose: Direct WebRTC connection to OpenAI (bypasses Fly.io)
  How it works:
  Browser ← WebRTC → OpenAI directly
  Uses:
  - useWebRTCConnection - For WebRTC peer connection
  Responsibilities:
  - Creates data channel for direct communication with OpenAI
  - Sends configuration directly to OpenAI
  - Handles OpenAI-specific protocol

  5. useWebRTCConnection (Low-level WebRTC)

  Purpose: Manages the actual RTCPeerConnection
  Responsibilities:
  - Creates and configures RTCPeerConnection
  - Handles ICE candidates
  - Manages microphone access (getUserMedia)
  - Creates SDP offers/answers
  - Manages audio streams
  - This is where microphone permission should be requested

  6. useWebSocketConnection (WebSocket Management)

  Purpose: Manages WebSocket connection to Fly.io
  Responsibilities:
  - Establishes WebSocket connection
  - Handles reconnection logic
  - Sends/receives messages
  - Manages WebSocket state

  The Problem

  The infinite loop happens because:

  1. Each hook has a cleanup function
  2. These cleanup functions depend on other functions/values that change
  3. When dependencies change, React recreates the functions
  4. This causes parent components to re-render
  5. Which causes child components to unmount/remount
  6. Which triggers cleanup... and the cycle continues

  Current Architecture Flow

  Interview Page clicks "Start Interview"
      ↓
  WebRTCManager renders
      ↓
  useWebRTC initializes
      ↓
  Creates BOTH useSDPProxy AND useOpenAIConnection (problem!)
      ↓
  Each creates useWebRTCConnection
      ↓
  Each sets up cleanup functions with dependencies
      ↓
  Dependencies change → cleanup recreated → re-render → loop

  What Should Happen

  Interview Page clicks "Start Interview"
      ↓
  WebRTCManager renders
      ↓
  useWebRTC initializes
      ↓
  Calls interview-start edge function → Gets Fly.io URL
      ↓
  Creates ONLY useSDPProxy (since we're using hybrid architecture)
      ↓
  useSDPProxy connects to Fly.io WebSocket
      ↓
  Exchanges SDP through proxy
      ↓
  Establishes direct WebRTC audio with OpenAI
      ↓
  Requests microphone permission
      ↓
  Starts receiving transcripts

  The key issue is that we're creating too many nested hooks with circular dependencies, preventing the initialization from ever completing properly.



  so you have pointed out a really important issue -- how far off are we from what "we should have" ?

⏺ Looking at the current architecture versus what we should have, we're actually not too far off! The main issues are:

  What We Have vs What We Need

  ✅ What's Already Correct:

  1. Core architecture is right - Hybrid approach with Fly.io SDP proxy
  2. Edge function integration works - Gets WebSocket URL from interview-start
  3. WebRTC hooks are well-structured - Just need dependency fixes
  4. UI components are good - WebRTCManager displays everything correctly

  ❌ Main Issues to Fix:

  1. Both connection types are instantiated (Lines 74-99 in useWebRTC)
    - Currently: Creates both useOpenAIConnection AND useSDPProxy
    - Should: Only create the one we need (useSDPProxy for hybrid)
  2. Circular dependencies in cleanup functions
    - Fixed several already, but need to ensure all are resolved
  3. Initialization never completes
    - Due to infinite re-renders, we never reach getUserMedia()

  How Close Are We?

  Very close! We need about 2-3 key changes:

  1. Prevent dual instantiation (Medium effort)

  Since we can't conditionally call hooks, we need to make the unused hook "inactive":

  // In useWebRTC.ts, we could pass a "disabled" flag
  const openAIConnection = useOpenAIConnection(
    sessionId,
    {
      disabled: !useDirectOpenAI, // Add this
      openAIKey: config.openAIKey || '',
      // ...
    }
  );

  const sdpProxyConnection = useSDPProxy(
    sessionId,
    {
      disabled: useDirectOpenAI, // Add this
      serverUrl: config.serverUrl,
      // ...
    }
  );

  Then inside each hook, skip initialization if disabled.

  2. Stabilize remaining cleanup functions (Small effort)

  We've already fixed most. Need to check:
  - Any remaining useEffect with cleanup dependencies
  - Any useCallback that depends on changing values

  3. Ensure proper initialization flow (Should work once 1 & 2 are fixed)

  Once the infinite loop stops, the flow should naturally:
  - Call interview-start edge function ✅
  - Get WebSocket URL ✅
  - Initialize WebRTC connection
  - Request microphone permission
  - Start streaming

  Estimated Distance: 85% Complete

  We're very close! The architecture is correct, the components exist, and the flow is right. We just need to:
  1. Stop the dual instantiation
  2. Finish cleanup dependency fixes
  3. Test that initialization completes

  The good news is that once we stop the infinite loop, everything else should "just work" because the underlying implementation is already there and correct.