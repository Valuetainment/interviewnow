// Main orchestration hook
export { useWebRTC } from './useWebRTC';
export type { WebRTCConfig, WebRTCStatus, WebRTCHandlers } from './useWebRTC';

// Connection state management
export { useConnectionState } from './useConnectionState';
export type { ConnectionState, ConnectionStateHandlers } from './useConnectionState';

// Retry logic
export { useRetry } from './useRetry';
export type { RetryConfig, RetryHandlers } from './useRetry';

// Audio visualization
export { useAudioVisualization } from './useAudioVisualization';
export type { AudioVisualizationState, AudioVisualizationHandlers } from './useAudioVisualization';

// WebRTC connection management
export { useWebRTCConnection } from './useWebRTCConnection';
export type { WebRTCConfig as WebRTCConnectionConfig, WebRTCConnectionHandlers } from './useWebRTCConnection';

// WebSocket connection management
export { useWebSocketConnection } from './useWebSocketConnection';
export type { WebSocketConfig, WebSocketMessage, WebSocketConnectionHandlers } from './useWebSocketConnection';

// Transcript management
export { useTranscriptManager } from './useTranscriptManager';
export type { TranscriptEntry, TranscriptManagerConfig, TranscriptManagerHandlers } from './useTranscriptManager';

// OpenAI connection management
export { useOpenAIConnection } from './useOpenAIConnection';
export type { OpenAIConnectionConfig, OpenAIConnectionHandlers } from './useOpenAIConnection';

// SDP Proxy connection management
export { useSDPProxy } from './useSDPProxy';
export type { SDPProxyConfig, SDPProxyHandlers } from './useSDPProxy';