import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebRTCConnection } from '../useWebRTCConnection';
import { ConnectionState } from '../useConnectionState';

// Mock the hooks used by useWebRTCConnection
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

vi.mock('../useAudioVisualization', () => ({
  useAudioVisualization: vi.fn(() => ({
    audioLevel: 0,
    isRecording: false,
    visualizationData: [],
    startVisualization: vi.fn(),
    stopVisualization: vi.fn()
  }))
}));

describe('useWebRTCConnection', () => {
  // Mock connection state change handler
  const mockConnectionStateChangeHandler = vi.fn();
  // Mock track handler
  const mockTrackHandler = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the RTCPeerConnection mock implementation for each test
    const mockPeerConnection = {
      createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' }),
      createDataChannel: vi.fn(),
      addTrack: vi.fn(),
      close: vi.fn(),
      setLocalDescription: vi.fn().mockResolvedValue(undefined),
      setRemoteDescription: vi.fn().mockResolvedValue(undefined),
      addIceCandidate: vi.fn().mockResolvedValue(undefined),
      iceConnectionState: 'new',
      connectionState: 'new',
      oniceconnectionstatechange: null as any,
      onconnectionstatechange: null as any,
      onicecandidate: null as any,
      ontrack: null as any,
      restartIce: vi.fn(),
      getTransceivers: vi.fn().mockReturnValue([]),
      addTransceiver: vi.fn(),
      getStats: vi.fn().mockResolvedValue(new Map()),
      getSenders: vi.fn().mockReturnValue([]),
      getReceivers: vi.fn().mockReturnValue([]),
      localDescription: { type: 'offer', sdp: 'mock-sdp' }
    };

    global.RTCPeerConnection = vi.fn().mockImplementation(() => mockPeerConnection);
    global.RTCSessionDescription = vi.fn().mockImplementation((desc) => desc);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWebRTCConnection());
    
    expect(result.current.pcRef.current).toBeNull();
    expect(result.current.streamRef.current).toBeNull();
    expect(result.current.dataChannelRef.current).toBeNull();
    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.error).toBeNull();
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isDisconnected).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it('should create a peer connection when initialized', async () => {
    const { result } = renderHook(() => 
      useWebRTCConnection(
        { simulationMode: true },
        mockConnectionStateChangeHandler,
        mockTrackHandler
      )
    );
    
    let initSuccess: boolean = false;
    
    await act(async () => {
      initSuccess = await result.current.initialize();
    });
    
    expect(initSuccess).toBe(true);
    expect(global.RTCPeerConnection).toHaveBeenCalledTimes(1);
    expect(result.current.pcRef.current).not.toBeNull();
    
    // In simulation mode, it should add a transceiver instead of capturing audio
    expect(result.current.pcRef.current?.addTransceiver).toHaveBeenCalledWith(
      'audio', 
      { direction: 'recvonly' }
    );
  });

  it('should handle audio capture in non-simulation mode', async () => {
    const mediaDevicesMock = {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: vi.fn().mockReturnValue([{ kind: 'audio' }]),
        getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
      })
    };
    
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: mediaDevicesMock,
      writable: true
    });
    
    const { result } = renderHook(() => 
      useWebRTCConnection(
        { simulationMode: false },
        mockConnectionStateChangeHandler
      )
    );
    
    let captureSuccess: boolean = false;
    
    await act(async () => {
      captureSuccess = await result.current.setupAudioCapture();
    });
    
    expect(captureSuccess).toBe(true);
    expect(mediaDevicesMock.getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
  });

  it('should create offer correctly', async () => {
    const { result } = renderHook(() => useWebRTCConnection());
    
    // Initialize the connection first
    await act(async () => {
      await result.current.initialize();
    });
    
    let offer: RTCSessionDescriptionInit | null = null;
    
    await act(async () => {
      offer = await result.current.createOffer();
    });
    
    expect(offer).not.toBeNull();
    expect(offer?.type).toBe('offer');
    expect(offer?.sdp).toBe('mock-sdp');
    expect(result.current.pcRef.current?.createOffer).toHaveBeenCalled();
    expect(result.current.pcRef.current?.setLocalDescription).toHaveBeenCalled();
  });

  it('should handle SDP answer correctly', async () => {
    const { result } = renderHook(() => useWebRTCConnection());
    
    // Initialize the connection first
    await act(async () => {
      await result.current.initialize();
    });
    
    const mockAnswer = { type: 'answer', sdp: 'mock-answer-sdp' };
    
    await act(async () => {
      await result.current.handleAnswer(mockAnswer);
    });
    
    expect(result.current.pcRef.current?.setRemoteDescription).toHaveBeenCalled();
  });

  it('should handle ICE candidate correctly', async () => {
    const { result } = renderHook(() => useWebRTCConnection());
    
    // Initialize the connection first
    await act(async () => {
      await result.current.initialize();
    });
    
    const mockCandidate = { candidate: 'mock-candidate', sdpMid: 'mock-mid', sdpMLineIndex: 0 };
    
    await act(async () => {
      await result.current.addIceCandidate(mockCandidate as any);
    });
    
    expect(result.current.pcRef.current?.addIceCandidate).toHaveBeenCalledWith(mockCandidate);
  });

  it('should clean up resources properly', async () => {
    const { result } = renderHook(() => useWebRTCConnection());
    
    // Initialize the connection first
    await act(async () => {
      await result.current.initialize();
    });
    
    const mockPc = result.current.pcRef.current;
    
    act(() => {
      result.current.cleanup();
    });
    
    expect(mockPc?.close).toHaveBeenCalled();
    expect(result.current.pcRef.current).toBeNull();
  });

  it('should handle ICE connection state changes', async () => {
    const { result } = renderHook(() => 
      useWebRTCConnection(
        {},
        mockConnectionStateChangeHandler
      )
    );
    
    // Initialize the connection
    await act(async () => {
      await result.current.initialize();
    });
    
    const mockPc = result.current.pcRef.current;
    
    // Simulate ICE connected state
    act(() => {
      if (mockPc && mockPc.oniceconnectionstatechange) {
        Object.defineProperty(mockPc, 'iceConnectionState', {
          value: 'connected',
          writable: true
        });
        mockPc.oniceconnectionstatechange(new Event('iceconnectionstatechange'));
      }
    });
    
    expect(mockConnectionStateChangeHandler).toHaveBeenCalledWith('connected');
    
    // Simulate ICE failed state
    act(() => {
      if (mockPc && mockPc.oniceconnectionstatechange) {
        Object.defineProperty(mockPc, 'iceConnectionState', {
          value: 'failed',
          writable: true
        });
        mockPc.oniceconnectionstatechange(new Event('iceconnectionstatechange'));
      }
    });
    
    expect(mockConnectionStateChangeHandler).toHaveBeenCalledWith('ice_failed');
    expect(mockPc?.restartIce).toHaveBeenCalled();
  });

  it('should handle connection state changes', async () => {
    const { result } = renderHook(() => 
      useWebRTCConnection(
        {},
        mockConnectionStateChangeHandler
      )
    );
    
    // Initialize the connection
    await act(async () => {
      await result.current.initialize();
    });
    
    const mockPc = result.current.pcRef.current;
    
    // Simulate connection failed state
    act(() => {
      if (mockPc && mockPc.onconnectionstatechange) {
        Object.defineProperty(mockPc, 'connectionState', {
          value: 'failed',
          writable: true
        });
        mockPc.onconnectionstatechange(new Event('connectionstatechange'));
      }
    });
    
    expect(mockConnectionStateChangeHandler).toHaveBeenCalledWith('connection_failed');
  });

  it('should handle incoming tracks', async () => {
    const { result } = renderHook(() => 
      useWebRTCConnection(
        {},
        mockConnectionStateChangeHandler,
        mockTrackHandler
      )
    );
    
    // Initialize the connection
    await act(async () => {
      await result.current.initialize();
    });
    
    const mockPc = result.current.pcRef.current;
    
    // Simulate track event
    act(() => {
      if (mockPc && mockPc.ontrack) {
        const mockTrack = { kind: 'audio' };
        const mockStreams = [{ id: 'mock-stream' }];
        mockPc.ontrack({ track: mockTrack, streams: mockStreams } as any);
      }
    });
    
    expect(mockTrackHandler).toHaveBeenCalled();
  });
});