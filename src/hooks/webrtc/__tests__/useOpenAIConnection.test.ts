import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOpenAIConnection } from '../useOpenAIConnection';

/**
 * HYBRID ARCHITECTURE TESTS
 *
 * These tests focus on the OpenAI WebRTC connection as used in the hybrid architecture approach.
 * The hybrid architecture establishes a direct WebRTC connection with OpenAI,
 * using the SDP proxy only for secure connection negotiation.
 */

// Mock dependencies
vi.mock('../useWebRTCConnection', () => ({
  useWebRTCConnection: vi.fn(() => ({
    pcRef: { current: mockPeerConnection },
    dataChannelRef: { current: null },
    initialize: vi.fn().mockResolvedValue(true),
    cleanup: vi.fn(),
    connectionState: 'disconnected',
    error: null,
    isConnecting: false,
    isConnected: false,
    isDisconnected: true,
    isError: false,
    audioLevel: 0,
    isRecording: false
  }))
}));

vi.mock('../useTranscriptManager', () => ({
  useTranscriptManager: vi.fn(() => ({
    transcript: [],
    saveTranscript: vi.fn().mockResolvedValue(undefined),
    addTranscriptEntry: vi.fn(),
    clearTranscript: vi.fn()
  }))
}));

// Mock fetch for OpenAI API calls
global.fetch = vi.fn();

// Mock WebRTC peer connection
const mockDataChannel = {
  onopen: null as any,
  onmessage: null as any,
  onerror: null as any,
  onclose: null as any,
  send: vi.fn(),
  readyState: 'open'
};

const mockPeerConnection = {
  createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' }),
  createDataChannel: vi.fn().mockReturnValue(mockDataChannel),
  setLocalDescription: vi.fn().mockResolvedValue(undefined),
  setRemoteDescription: vi.fn().mockResolvedValue(undefined),
  close: vi.fn(),
  localDescription: { type: 'offer', sdp: 'mock-sdp' },
  iceGatheringState: 'complete',
  onicegatheringstatechange: null as any
};

describe('useOpenAIConnection in Hybrid Architecture', () => {
  const mockSessionId = 'test-session-id';
  const mockOpenAIKey = 'test-openai-key';
  const mockConnectionStateChangeHandler = vi.fn();
  const mockTranscriptUpdateHandler = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the mock fetch implementation
    global.fetch.mockReset();
    global.fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('mock-sdp-answer')
    });
  });

  it('should initialize direct OpenAI connection with default settings', () => {
    const { result } = renderHook(() =>
      useOpenAIConnection(
        mockSessionId,
        { openAIKey: mockOpenAIKey },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.error).toBeNull();
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isConnected).toBe(false);
  });

  it('should require OpenAI API key for direct OpenAI connection', async () => {
    const { result } = renderHook(() =>
      useOpenAIConnection(
        mockSessionId,
        { openAIKey: '' }, // Empty API key
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    let success: boolean = false;

    await act(async () => {
      success = await result.current.initialize();
    });

    expect(success).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockConnectionStateChangeHandler).toHaveBeenCalledWith('error');
  });

  it('should establish direct WebRTC connection with OpenAI API', async () => {
    const { result } = renderHook(() =>
      useOpenAIConnection(
        mockSessionId,
        { openAIKey: mockOpenAIKey },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    let success: boolean = false;

    await act(async () => {
      success = await result.current.initialize();
    });

    expect(success).toBe(true);

    // Should create a data channel with OpenAI's expected name
    expect(mockPeerConnection.createDataChannel).toHaveBeenCalledWith('oai-events');

    // Should create and set local SDP offer
    expect(mockPeerConnection.createOffer).toHaveBeenCalled();
    expect(mockPeerConnection.setLocalDescription).toHaveBeenCalled();

    // Should call OpenAI API with correct parameters for direct connection
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockOpenAIKey}`,
          'Content-Type': 'application/sdp'
        },
        body: 'mock-sdp'
      }
    );

    // Should set remote description with SDP answer
    expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalledWith({
      type: 'answer',
      sdp: 'mock-sdp-answer'
    });
  });

  it('should handle OpenAI API errors gracefully with appropriate error state', async () => {
    // Mock API error response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized')
    });

    const { result } = renderHook(() =>
      useOpenAIConnection(
        mockSessionId,
        { openAIKey: mockOpenAIKey },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    let success: boolean = false;

    await act(async () => {
      success = await result.current.initialize();
    });

    expect(success).toBe(false);
    expect(global.fetch).toHaveBeenCalled();
    expect(mockConnectionStateChangeHandler).toHaveBeenCalledWith('error');
    expect(result.current.error).not.toBeNull();
  });

  it('should configure the interview with job details when data channel opens', async () => {
    const { result } = renderHook(() =>
      useOpenAIConnection(
        mockSessionId,
        {
          openAIKey: mockOpenAIKey,
          jobDescription: 'Senior React Developer',
          resume: 'Experienced developer with React and TypeScript skills',
          openAISettings: {
            voice: 'nova',
            temperature: 0.8,
            maximumLength: 10
          }
        },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    await act(async () => {
      await result.current.initialize();
    });

    // Simulate data channel open event
    await act(async () => {
      mockDataChannel.onopen && mockDataChannel.onopen(new Event('open'));
    });

    // Should send session.update message with correct interview configuration
    expect(mockDataChannel.send).toHaveBeenCalledTimes(1);

    const sentMessage = JSON.parse(mockDataChannel.send.mock.calls[0][0]);
    expect(sentMessage.type).toBe('session.update');
    expect(sentMessage.session.voice).toBe('nova');
    expect(sentMessage.session.temperature).toBe(0.8);
    expect(sentMessage.session.instructions).toContain('Senior React Developer');
    expect(sentMessage.session.instructions).toContain('Experienced developer with React and TypeScript skills');

    // Advance timers to trigger interview start message
    vi.useFakeTimers();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    vi.useRealTimers();

    // Should send response.create message to start the interview
    expect(mockDataChannel.send).toHaveBeenCalledTimes(2);

    const startMessage = JSON.parse(mockDataChannel.send.mock.calls[1][0]);
    expect(startMessage.type).toBe('response.create');
    expect(startMessage.response.modalities).toContain('text');
    expect(startMessage.response.modalities).toContain('audio');
  });

  it('should process audio transcription messages from OpenAI WebRTC data channel', async () => {
    // Get reference to the mocked saveTranscript function
    const { saveTranscript } = require('../useTranscriptManager').useTranscriptManager();

    const { result } = renderHook(() =>
      useOpenAIConnection(
        mockSessionId,
        { openAIKey: mockOpenAIKey },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    await act(async () => {
      await result.current.initialize();
    });

    // Simulate OpenAI data channel message for user transcript
    await act(async () => {
      mockDataChannel.onmessage && mockDataChannel.onmessage({
        data: JSON.stringify({
          type: 'conversation.item.input_audio_transcription.completed',
          transcript: 'This is a user transcript'
        })
      });
    });

    // Should save transcript with 'candidate' speaker
    expect(saveTranscript).toHaveBeenCalledWith('This is a user transcript', 'candidate');

    // Simulate OpenAI data channel message for AI transcript
    await act(async () => {
      mockDataChannel.onmessage && mockDataChannel.onmessage({
        data: JSON.stringify({
          type: 'response.audio_transcript.delta',
          text: 'This is an AI response'
        })
      });
    });

    // Should save transcript with 'ai' speaker
    expect(saveTranscript).toHaveBeenCalledWith('This is an AI response', 'ai');
  });

  it('should handle interviewer function calls in data channel messages', async () => {
    // Get reference to the mocked saveTranscript function
    const { saveTranscript } = require('../useTranscriptManager').useTranscriptManager();

    const { result } = renderHook(() =>
      useOpenAIConnection(
        mockSessionId,
        { openAIKey: mockOpenAIKey },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    await act(async () => {
      await result.current.initialize();
    });

    // Simulate function call message
    await act(async () => {
      mockDataChannel.onmessage && mockDataChannel.onmessage({
        data: JSON.stringify({
          type: 'response.function_call_arguments.done',
          name: 'end_session'
        })
      });
    });

    // Should not save function call messages as transcripts
    expect(saveTranscript).not.toHaveBeenCalled();
  });

  it('should recover gracefully from malformed data channel messages', async () => {
    const { result } = renderHook(() =>
      useOpenAIConnection(
        mockSessionId,
        { openAIKey: mockOpenAIKey },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    await act(async () => {
      await result.current.initialize();
    });

    // Mock console.error to prevent test output noise
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Simulate invalid JSON message
    await act(async () => {
      mockDataChannel.onmessage && mockDataChannel.onmessage({
        data: 'This is not valid JSON'
      });
    });

    // Should handle error gracefully (test passing means no exception thrown)
    expect(console.error).toHaveBeenCalled();

    // Restore console.error
    console.error = originalConsoleError;

    // Connection state should not change to error
    expect(result.current.error).toBeNull();
  });

  it('should wait for ICE gathering to complete before sending SDP offer', async () => {
    // Modify mock to simulate incomplete ICE gathering
    mockPeerConnection.iceGatheringState = 'gathering';

    const { result } = renderHook(() =>
      useOpenAIConnection(
        mockSessionId,
        { openAIKey: mockOpenAIKey },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    // Start initialization but don't await yet
    const initPromise = result.current.initialize();

    // Simulate ICE gathering state change after delay
    setTimeout(() => {
      mockPeerConnection.iceGatheringState = 'complete';
      mockPeerConnection.onicegatheringstatechange &&
        mockPeerConnection.onicegatheringstatechange();
    }, 100);

    // Now await the initialization
    const success = await initPromise;

    expect(success).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should use OpenAI default voice and temperature settings when not specified', async () => {
    const { result } = renderHook(() =>
      useOpenAIConnection(
        mockSessionId,
        { openAIKey: mockOpenAIKey },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    await act(async () => {
      await result.current.initialize();
    });

    // Simulate data channel open event
    await act(async () => {
      mockDataChannel.onopen && mockDataChannel.onopen(new Event('open'));
    });

    // Should use default settings specific to the hybrid architecture
    const sentMessage = JSON.parse(mockDataChannel.send.mock.calls[0][0]);
    expect(sentMessage.session.voice).toBe('alloy');
    expect(sentMessage.session.temperature).toBe(0.7);
  });

  it('should support custom voice settings for the AI interviewer', async () => {
    const { result } = renderHook(() =>
      useOpenAIConnection(
        mockSessionId,
        {
          openAIKey: mockOpenAIKey,
          openAISettings: {
            voice: 'shimmer',
            temperature: 0.5
          }
        },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    await act(async () => {
      await result.current.initialize();
    });

    // Simulate data channel open event
    await act(async () => {
      mockDataChannel.onopen && mockDataChannel.onopen(new Event('open'));
    });

    // Should use custom settings
    const sentMessage = JSON.parse(mockDataChannel.send.mock.calls[0][0]);
    expect(sentMessage.session.voice).toBe('shimmer');
    expect(sentMessage.session.temperature).toBe(0.5);
  });

  it('should update connection state appropriately throughout WebRTC lifecycle', async () => {
    const { result } = renderHook(() =>
      useOpenAIConnection(
        mockSessionId,
        { openAIKey: mockOpenAIKey },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    // Should start in disconnected state
    expect(mockConnectionStateChangeHandler).not.toHaveBeenCalled();

    // During initialization
    await act(async () => {
      const initPromise = result.current.initialize();

      // Should transition to connecting state
      expect(mockConnectionStateChangeHandler).toHaveBeenCalledWith('connecting');

      await initPromise;
    });

    // After successful initialization but before data channel open
    expect(mockConnectionStateChangeHandler).not.toHaveBeenCalledWith('connected');

    // When data channel opens
    await act(async () => {
      mockDataChannel.onopen && mockDataChannel.onopen(new Event('open'));
    });

    // Should transition to connected state
    expect(mockConnectionStateChangeHandler).toHaveBeenCalledWith('connected');
  });
});