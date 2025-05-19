import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSDPProxy } from '../useSDPProxy';
import { ConnectionState } from '../useConnectionState';

/**
 * HYBRID ARCHITECTURE TESTS
 *
 * These tests focus on the SDP proxy functionality as used in the hybrid architecture approach.
 * In the hybrid approach, the SDP proxy serves as a secure intermediary for SDP exchange,
 * while audio flows directly between the client and OpenAI via WebRTC.
 */

// Mock dependencies
const mockWebSocketConnect = vi.fn().mockResolvedValue(true);
const mockWebSocketDisconnect = vi.fn();
const mockWebSocketSendMessage = vi.fn().mockReturnValue(true);
const mockWsRef = { current: { readyState: WebSocket.OPEN } };

vi.mock('../useWebSocketConnection', () => ({
  useWebSocketConnection: vi.fn((config, onStateChange, onMessage) => {
    // Save reference to the message handler for testing
    mockMessageHandler = onMessage;
    return {
      wsRef: mockWsRef,
      connect: mockWebSocketConnect,
      disconnect: mockWebSocketDisconnect,
      sendMessage: mockWebSocketSendMessage,
      connectionState: 'ws_connected' as ConnectionState,
      error: null,
      isConnected: true
    };
  })
}));

const mockCreateOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
const mockHandleAnswer = vi.fn().mockResolvedValue(undefined);
const mockAddIceCandidate = vi.fn().mockResolvedValue(undefined);
const mockInitializeWebRTC = vi.fn().mockResolvedValue(true);
const mockCleanupWebRTC = vi.fn();
const mockPcRef = { current: { onicecandidate: null } };

vi.mock('../useWebRTCConnection', () => ({
  useWebRTCConnection: vi.fn((config, onStateChange) => {
    // Save reference to the state change handler for testing
    mockRtcStateChangeHandler = onStateChange;
    return {
      pcRef: mockPcRef,
      createOffer: mockCreateOffer,
      handleAnswer: mockHandleAnswer,
      addIceCandidate: mockAddIceCandidate,
      initialize: mockInitializeWebRTC,
      cleanup: mockCleanupWebRTC,
      connectionState: 'connecting' as ConnectionState,
      error: null,
      isConnecting: false,
      isConnected: false,
      audioLevel: 0,
      isRecording: false
    };
  })
}));

const mockSaveTranscript = vi.fn().mockResolvedValue(undefined);

vi.mock('../useTranscriptManager', () => ({
  useTranscriptManager: vi.fn(() => ({
    transcript: [],
    saveTranscript: mockSaveTranscript,
    addTranscriptEntry: vi.fn(),
    clearTranscript: vi.fn()
  }))
}));

// Mock createClient from @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    functions: {
      invoke: vi.fn()
    }
  }))
}));

// Mock env variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

// Capture handlers for testing message handling
let mockMessageHandler: ((message: any) => void) | undefined;
let mockRtcStateChangeHandler: ((state: ConnectionState) => void) | undefined;

describe('useSDPProxy in Hybrid Architecture', () => {
  const mockSessionId = 'test-session-id';
  const mockServerUrl = 'wss://test-sdp-proxy.dev/ws';
  const mockConnectionStateChangeHandler = vi.fn();
  const mockTranscriptUpdateHandler = vi.fn();
  const mockSupabaseClient = { functions: { invoke: vi.fn() } };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMessageHandler = undefined;
    mockRtcStateChangeHandler = undefined;
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useSDPProxy(
        mockSessionId,
        {
          serverUrl: mockServerUrl,
          supabaseClient: mockSupabaseClient as any
        },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    expect(result.current.connectionState).toBe('connecting');
    expect(result.current.error).toBeNull();
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isConnected).toBe(false);
  });

  it('should initialize in simulation mode for local development', async () => {
    const { result } = renderHook(() =>
      useSDPProxy(
        mockSessionId,
        {
          serverUrl: mockServerUrl,
          simulationMode: true,
          supabaseClient: mockSupabaseClient as any
        },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    let success: boolean = false;

    await act(async () => {
      success = await result.current.initialize();
    });

    expect(success).toBe(true);
    expect(mockWebSocketConnect).toHaveBeenCalledWith(mockServerUrl);
    expect(mockWebSocketSendMessage).toHaveBeenCalledWith({
      type: 'init',
      sessionId: mockSessionId,
      simulationMode: true,
      client: 'webrtc-hooks',
      timestamp: expect.any(String)
    });

    // In simulation mode, we should not initialize WebRTC
    expect(mockInitializeWebRTC).not.toHaveBeenCalled();
  });

  it('should handle secure SDP exchange with server', async () => {
    const { result } = renderHook(() =>
      useSDPProxy(
        mockSessionId,
        {
          serverUrl: mockServerUrl,
          supabaseClient: mockSupabaseClient as any
        },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    let success: boolean = false;

    await act(async () => {
      success = await result.current.initialize();
    });

    expect(success).toBe(true);
    expect(mockWebSocketConnect).toHaveBeenCalledWith(mockServerUrl);
    expect(mockInitializeWebRTC).toHaveBeenCalled();
    expect(mockCreateOffer).toHaveBeenCalled();
    expect(mockWebSocketSendMessage).toHaveBeenCalledWith({
      type: 'sdp_offer',
      offer: { type: 'offer', sdp: 'mock-sdp' }
    });

    // Simulate SDP answer from server
    await act(async () => {
      if (mockMessageHandler) {
        mockMessageHandler({
          type: 'sdp_answer',
          answer: { type: 'answer', sdp: 'mock-answer-sdp' }
        });
      }
    });

    expect(mockHandleAnswer).toHaveBeenCalledWith({
      type: 'answer',
      sdp: 'mock-answer-sdp'
    });
  });

  it('should handle ICE candidate exchange for direct connection', async () => {
    const { result } = renderHook(() =>
      useSDPProxy(
        mockSessionId,
        {
          serverUrl: mockServerUrl,
          supabaseClient: mockSupabaseClient as any
        },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    await act(async () => {
      await result.current.initialize();
    });

    const mockCandidate = {
      candidate: 'mock-candidate',
      sdpMid: 'mock-mid',
      sdpMLineIndex: 0
    };

    // Simulate ICE candidate from server
    await act(async () => {
      if (mockMessageHandler) {
        mockMessageHandler({
          type: 'ice_candidate',
          candidate: mockCandidate
        });
      }
    });

    expect(mockAddIceCandidate).toHaveBeenCalled();
    const candidateArg = mockAddIceCandidate.mock.calls[0][0];
    expect(candidateArg.candidate).toBe('mock-candidate');
    expect(candidateArg.sdpMid).toBe('mock-mid');
    expect(candidateArg.sdpMLineIndex).toBe(0);
  });

  it('should handle OpenAI transcript messages correctly', async () => {
    const { result } = renderHook(() =>
      useSDPProxy(
        mockSessionId,
        {
          serverUrl: mockServerUrl,
          supabaseClient: mockSupabaseClient as any
        },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    await act(async () => {
      await result.current.initialize();
    });

    // Simulate OpenAI user transcript message
    await act(async () => {
      if (mockMessageHandler) {
        mockMessageHandler({
          type: 'conversation.item.input_audio_transcription.completed',
          transcript: 'User speech transcript'
        });
      }
    });

    expect(mockSaveTranscript).toHaveBeenCalledWith(
      'User speech transcript',
      'candidate'
    );

    // Simulate OpenAI AI transcript message
    await act(async () => {
      if (mockMessageHandler) {
        mockMessageHandler({
          type: 'response.audio_transcript.delta',
          text: 'AI speech transcript'
        });
      }
    });

    expect(mockSaveTranscript).toHaveBeenCalledWith(
      'AI speech transcript',
      'ai'
    );
  });

  it('should properly clean up resources when session ends', async () => {
    const { result } = renderHook(() =>
      useSDPProxy(
        mockSessionId,
        {
          serverUrl: mockServerUrl,
          supabaseClient: mockSupabaseClient as any
        },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    await act(async () => {
      await result.current.initialize();
    });

    act(() => {
      result.current.cleanup();
    });

    expect(mockCleanupWebRTC).toHaveBeenCalled();
    expect(mockWebSocketDisconnect).toHaveBeenCalled();
  });

  it('should handle connection failures gracefully', async () => {
    // Mock WebSocket connection failure
    mockWebSocketConnect.mockResolvedValueOnce(false);

    const { result } = renderHook(() =>
      useSDPProxy(
        mockSessionId,
        {
          serverUrl: mockServerUrl,
          supabaseClient: mockSupabaseClient as any
        },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    let success: boolean = false;

    await act(async () => {
      success = await result.current.initialize();
    });

    expect(success).toBe(false);
    expect(mockInitializeWebRTC).not.toHaveBeenCalled();
    expect(result.current.error).not.toBeNull();
  });
});