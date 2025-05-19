import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocketConnection, WebSocketMessage } from '../useWebSocketConnection';
import { ConnectionState } from '../useConnectionState';

/**
 * HYBRID ARCHITECTURE TESTS
 *
 * These tests focus on the WebSocket connection functionality as used in the hybrid architecture approach.
 * In the hybrid approach, WebSockets are used for secure SDP exchange between the client and OpenAI,
 * serving as a signaling channel for WebRTC negotiation.
 */

// Mock the hooks used by useWebSocketConnection
vi.mock('../useConnectionState', () => ({
  useConnectionState: vi.fn((handler) => ({
    connectionState: 'disconnected' as ConnectionState,
    setConnectionState: vi.fn((state: ConnectionState) => {
      if (handler) handler(state);
    }),
    error: null,
    setError: vi.fn(),
    isConnecting: false,
    setIsConnecting: vi.fn(),
    isConnected: false,
    isDisconnected: true,
    isError: false
  }))
}));

vi.mock('../useRetry', () => ({
  useRetry: vi.fn(() => ({
    retryCount: 0,
    scheduleRetry: vi.fn((callback) => setTimeout(callback, 0)),
    resetRetryCount: vi.fn(),
    hasExceededMaxRetries: false,
    setAutoReconnectDisabled: vi.fn(),
    autoReconnectDisabled: false
  }))
}));

describe('useWebSocketConnection for Hybrid Architecture', () => {
  const mockConnectionStateChangeHandler = vi.fn();
  const mockMessageHandler = vi.fn();
  const mockUrl = 'ws://localhost:3000';

  let mockWebSocket: {
    url: string;
    readyState: number;
    send: jest.Mock;
    close: jest.Mock;
    onopen: ((event: Event) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onclose: ((event: CloseEvent) => void) | null;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Set up mock WebSocket implementation
    mockWebSocket = {
      url: mockUrl,
      readyState: WebSocket.OPEN,
      send: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null
    };

    global.WebSocket = vi.fn().mockImplementation((url) => {
      mockWebSocket.url = url;
      return mockWebSocket;
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWebSocketConnection());

    expect(result.current.wsRef.current).toBeNull();
    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.error).toBeNull();
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isDisconnected).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it('should connect to WebSocket server successfully for SDP exchange', async () => {
    const { result } = renderHook(() =>
      useWebSocketConnection(
        {},
        mockConnectionStateChangeHandler,
        mockMessageHandler
      )
    );

    let connectPromise: Promise<boolean>;

    await act(async () => {
      connectPromise = result.current.connect(mockUrl);

      // Simulate WebSocket connection success
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      await connectPromise;
    });

    expect(global.WebSocket).toHaveBeenCalledWith(mockUrl);
    expect(mockConnectionStateChangeHandler).toHaveBeenCalledWith('ws_connected');
  });

  it('should handle WebSocket connection errors gracefully', async () => {
    const { result } = renderHook(() =>
      useWebSocketConnection(
        {},
        mockConnectionStateChangeHandler,
        mockMessageHandler
      )
    );

    // Connection should fail
    await act(async () => {
      const connectPromise = result.current.connect(mockUrl);

      // Simulate WebSocket error
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Event('error'));
      }

      try {
        await connectPromise;
      } catch (e) {
        // Expected error
      }
    });

    expect(mockConnectionStateChangeHandler).toHaveBeenCalledWith('error');
  });

  it('should process SDP exchange messages correctly', async () => {
    const { result } = renderHook(() =>
      useWebSocketConnection(
        {},
        mockConnectionStateChangeHandler,
        mockMessageHandler
      )
    );

    await act(async () => {
      const connectPromise = result.current.connect(mockUrl);

      // Simulate WebSocket connection success
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      await connectPromise;
    });

    // Simulate receiving an SDP answer message
    act(() => {
      const mockMessage: WebSocketMessage = {
        type: 'sdp_answer',
        answer: { type: 'answer', sdp: 'mock-sdp-answer' }
      };
      const mockEvent = new MessageEvent('message', {
        data: JSON.stringify(mockMessage)
      });

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(mockEvent);
      }
    });

    expect(mockMessageHandler).toHaveBeenCalledWith({
      type: 'sdp_answer',
      answer: { type: 'answer', sdp: 'mock-sdp-answer' }
    });
  });

  it('should send heartbeat messages to maintain WebSocket connection', async () => {
    const { result } = renderHook(() =>
      useWebSocketConnection(
        { heartbeatInterval: 1000 },
        mockConnectionStateChangeHandler,
        mockMessageHandler
      )
    );

    await act(async () => {
      const connectPromise = result.current.connect(mockUrl);

      // Simulate WebSocket connection success
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      await connectPromise;
    });

    // Advance timers to trigger heartbeat
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should send a ping message
    expect(mockWebSocket.send).toHaveBeenCalled();
    const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
    expect(sentMessage.type).toBe('ping');
  });

  it('should send SDP offers correctly when WebRTC negotiation starts', async () => {
    const { result } = renderHook(() => useWebSocketConnection());

    await act(async () => {
      const connectPromise = result.current.connect(mockUrl);

      // Simulate WebSocket connection success
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      await connectPromise;
    });

    // Reset mock to clear any heartbeat messages
    mockWebSocket.send.mockClear();

    // Send an SDP offer
    act(() => {
      result.current.sendMessage({
        type: 'sdp_offer',
        offer: { type: 'offer', sdp: 'mock-offer-sdp' }
      });
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
      type: 'sdp_offer',
      offer: { type: 'offer', sdp: 'mock-offer-sdp' }
    }));
  });

  it('should send ICE candidates for WebRTC negotiation', async () => {
    const { result } = renderHook(() => useWebSocketConnection());

    await act(async () => {
      const connectPromise = result.current.connect(mockUrl);

      // Simulate WebSocket connection success
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      await connectPromise;
    });

    // Reset mock to clear any heartbeat messages
    mockWebSocket.send.mockClear();

    // Send an ICE candidate
    const mockCandidate = {
      candidate: 'candidate:0 1 UDP 2122252543 192.168.1.100 51356 typ host',
      sdpMid: '0',
      sdpMLineIndex: 0
    };

    act(() => {
      result.current.sendMessage({
        type: 'ice_candidate',
        candidate: mockCandidate
      });
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
      type: 'ice_candidate',
      candidate: mockCandidate
    }));
  });

  it('should clean up WebSocket connection when session ends', async () => {
    const { result } = renderHook(() => useWebSocketConnection());

    await act(async () => {
      const connectPromise = result.current.connect(mockUrl);

      // Simulate WebSocket connection success
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      await connectPromise;
    });

    // Disconnect WebSocket
    act(() => {
      result.current.disconnect();
    });

    expect(mockWebSocket.close).toHaveBeenCalledWith(1000, "Intentional disconnect");
    expect(result.current.wsRef.current).toBeNull();
    expect(mockConnectionStateChangeHandler).toHaveBeenCalledWith('disconnected');
  });

  it('should automatically reconnect when connection is lost unexpectedly', async () => {
    const { result } = renderHook(() =>
      useWebSocketConnection(
        {},
        mockConnectionStateChangeHandler
      )
    );

    await act(async () => {
      const connectPromise = result.current.connect(mockUrl);

      // Simulate WebSocket connection success
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      await connectPromise;
    });

    // Reset to clear previous WebSocket creation
    global.WebSocket.mockClear();

    // Simulate unexpected closure (code !== 1000)
    act(() => {
      const closeEvent = new CloseEvent('close', {
        code: 1006,
        reason: 'Connection lost',
        wasClean: false
      });

      if (mockWebSocket.onclose) {
        mockWebSocket.onclose(closeEvent);
      }
    });

    // Advance timer to trigger reconnection
    await act(async () => {
      vi.runAllTimers();
    });

    // Should attempt to reconnect
    expect(global.WebSocket).toHaveBeenCalledWith(mockUrl);
  });

  it('should initialize hybrid mode with correct parameters', async () => {
    const { result } = renderHook(() =>
      useWebSocketConnection(
        {
          simulationMode: false,
          heartbeatInterval: 15000
        },
        mockConnectionStateChangeHandler
      )
    );

    await act(async () => {
      const connectPromise = result.current.connect(mockUrl);

      // Simulate WebSocket connection success
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      await connectPromise;
    });

    // Send initialization message for hybrid mode
    mockWebSocket.send.mockClear();

    act(() => {
      result.current.sendMessage({
        type: 'init',
        sessionId: 'test-session-id',
        simulationMode: false,
        client: 'webrtc-hooks',
        architecture: 'hybrid',
        timestamp: expect.any(String)
      });
    });

    // Verify the initialization message was sent with the correct parameters
    expect(mockWebSocket.send).toHaveBeenCalled();
    const sentData = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
    expect(sentData.type).toBe('init');
    expect(sentData.simulationMode).toBe(false);
    expect(sentData.architecture).toBe('hybrid');
  });
});