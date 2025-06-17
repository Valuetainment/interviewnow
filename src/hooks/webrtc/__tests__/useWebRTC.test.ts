import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebRTC } from '../useWebRTC';
import { ConnectionState } from '../useConnectionState';

/**
 * HYBRID ARCHITECTURE TESTS
 *
 * These tests focus on the WebRTC hook as used in the hybrid architecture approach.
 * The hybrid architecture uses OpenAI's native WebRTC capabilities with secure SDP
 * exchange handled by our proxy.
 */

// Mock Supabase client
const mockSupabaseInvoke = vi.fn().mockResolvedValue({ data: { success: true } });
const mockSupabaseUpdate = vi.fn().mockResolvedValue({ error: null });
const mockSupabaseSelect = vi.fn().mockResolvedValue({
  data: { tenant_id: 'mock-tenant-id' },
  error: null
});

const mockSupabaseClient = {
  functions: {
    invoke: mockSupabaseInvoke
  },
  from: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnValue({
      eq: mockSupabaseUpdate
    }),
    select: vi.fn().mockReturnValue({
      single: mockSupabaseSelect
    })
  })
};

// Mock createClient from @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

// Mock transcript manager
const mockClearTranscript = vi.fn();
vi.mock('../useTranscriptManager', () => ({
  useTranscriptManager: vi.fn(() => ({
    clearTranscript: mockClearTranscript
  }))
}));

// Mock SDP proxy hook (for simulation and SDP exchange)
const mockSdpProxyInitialize = vi.fn().mockResolvedValue(true);
const mockSdpProxyCleanup = vi.fn();
vi.mock('../useSDPProxy', () => ({
  useSDPProxy: vi.fn(() => ({
    initialize: mockSdpProxyInitialize,
    cleanup: mockSdpProxyCleanup,
    connectionState: 'connected',
    error: null,
    isConnecting: false,
    isConnected: true,
    isDisconnected: false,
    isError: false,
    audioLevel: 50,
    isRecording: true
  }))
}));

// Mock OpenAI connection hook (for direct API connection)
const mockOpenAIInitialize = vi.fn().mockResolvedValue(true);
const mockOpenAICleanup = vi.fn();
vi.mock('../useOpenAIConnection', () => ({
  useOpenAIConnection: vi.fn(() => ({
    initialize: mockOpenAIInitialize,
    cleanup: mockOpenAICleanup,
    connectionState: 'connected',
    error: null,
    isConnecting: false,
    isConnected: true,
    audioLevel: 50,
    isRecording: true
  }))
}));

describe('useWebRTC - Hybrid Architecture', () => {
  const mockSessionId = 'test-session-id';
  const mockConnectionStateChangeHandler = vi.fn();
  const mockTranscriptUpdateHandler = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useWebRTC(
        mockSessionId,
        { openAIMode: true, openAIKey: 'test-key' }, // Default to OpenAI direct mode
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    expect(result.current.status.connectionState).toBe('connected');
    expect(result.current.status.error).toBeNull();
    expect(result.current.status.isConnecting).toBe(false);
    expect(result.current.status.isConnected).toBe(true);
    expect(result.current.status.isDisconnected).toBe(false);
    expect(result.current.status.isError).toBe(false);
    expect(result.current.status.isReady).toBe(false);
    expect(result.current.status.audioLevel).toBe(50);
    expect(result.current.status.isRecording).toBe(true);
  });

  it('should initialize direct OpenAI connection for production use', async () => {
    const { result } = renderHook(() =>
      useWebRTC(
        mockSessionId,
        {
          openAIMode: true,
          openAIKey: 'test-openai-key',
          jobDescription: 'Test job',
          resume: 'Test resume'
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
    expect(result.current.status.isReady).toBe(true);
    expect(mockClearTranscript).toHaveBeenCalled();
    expect(mockOpenAIInitialize).toHaveBeenCalled();
    expect(mockSdpProxyInitialize).not.toHaveBeenCalled(); // Should not use SDP proxy in direct mode
  });

  it('should fail initialization if OpenAI API key is missing', async () => {
    const { result } = renderHook(() =>
      useWebRTC(
        mockSessionId,
        {
          openAIMode: true,
          openAIKey: '' // Empty key
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
    expect(result.current.status.isReady).toBe(false);
    expect(result.current.status.error).toContain('OpenAI API key is required');
    expect(mockOpenAIInitialize).not.toHaveBeenCalled();
  });

  it('should use simulation mode for development without OpenAI API', async () => {
    const { result } = renderHook(() =>
      useWebRTC(
        mockSessionId,
        {
          simulationMode: true,
          serverUrl: 'ws://localhost:3001'
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
    expect(result.current.status.isReady).toBe(true);
    expect(mockClearTranscript).toHaveBeenCalled();
    expect(mockSdpProxyInitialize).toHaveBeenCalled();
    expect(mockOpenAIInitialize).not.toHaveBeenCalled();
    expect(mockSupabaseSelect).not.toHaveBeenCalled(); // Should skip database in simulation
    expect(mockSupabaseInvoke).not.toHaveBeenCalled(); // Should skip edge function in simulation
  });

  it('should interact with database for production mode', async () => {
    const { result } = renderHook(() =>
      useWebRTC(
        mockSessionId,
        {
          openAIMode: true,
          openAIKey: 'test-openai-key',
          simulationMode: false // Production mode
        },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    await act(async () => {
      await result.current.initialize();
    });

    // In production, it should use the database
    expect(mockSupabaseSelect).toHaveBeenCalled();

    // Should send hybrid architecture parameter to edge function
    expect(mockSupabaseInvoke).toHaveBeenCalledWith('interview-start', {
      body: expect.stringContaining('tenant_id')
    });

    // Should update session status
    expect(mockSupabaseUpdate).toHaveBeenCalledWith({ status: 'in_progress' });
  });

  it('should handle database errors gracefully', async () => {
    // Mock tenant query error
    mockSupabaseSelect.mockResolvedValueOnce({ data: null, error: new Error('Database error') });

    const { result } = renderHook(() =>
      useWebRTC(
        mockSessionId,
        {
          openAIMode: true,
          openAIKey: 'test-openai-key',
          simulationMode: false
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
    expect(result.current.status.error).toContain('Failed to get tenant ID');
    expect(mockOpenAIInitialize).not.toHaveBeenCalled();
  });

  it('should handle edge function errors gracefully', async () => {
    // Mock tenant query success but edge function error
    mockSupabaseSelect.mockResolvedValueOnce({ data: { tenant_id: 'mock-tenant-id' }, error: null });
    mockSupabaseInvoke.mockResolvedValueOnce({ data: { success: false, error: 'Edge function error' } });

    const { result } = renderHook(() =>
      useWebRTC(
        mockSessionId,
        {
          openAIMode: true,
          openAIKey: 'test-openai-key',
          simulationMode: false
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
    expect(result.current.status.error).toContain('Edge function error');
    expect(mockOpenAIInitialize).not.toHaveBeenCalled();
  });

  it('should properly clean up OpenAI connection resources', () => {
    const { result } = renderHook(() =>
      useWebRTC(
        mockSessionId,
        {
          openAIMode: true,
          openAIKey: 'test-openai-key'
        },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    act(() => {
      result.current.cleanup();
    });

    expect(mockOpenAICleanup).toHaveBeenCalled();
    expect(mockSdpProxyCleanup).not.toHaveBeenCalled();
    expect(result.current.status.isReady).toBe(false);
  });

  it('should properly clean up simulation resources', () => {
    const { result } = renderHook(() =>
      useWebRTC(
        mockSessionId,
        {
          simulationMode: true
        },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    act(() => {
      result.current.cleanup();
    });

    expect(mockSdpProxyCleanup).toHaveBeenCalled();
    expect(mockOpenAICleanup).not.toHaveBeenCalled();
    expect(result.current.status.isReady).toBe(false);
  });

  it('should support various OpenAI configuration options', async () => {
    const openAISettings = {
      voice: 'verse',
      temperature: 0.7,
      maximumLength: 5
    };

    const { result } = renderHook(() =>
      useWebRTC(
        mockSessionId,
        {
          openAIMode: true,
          openAIKey: 'test-openai-key',
          openAISettings
        },
        mockConnectionStateChangeHandler,
        mockTranscriptUpdateHandler
      )
    );

    await act(async () => {
      await result.current.initialize();
    });

    // Should initialize with the provided settings
    expect(mockOpenAIInitialize).toHaveBeenCalled();
  });
});