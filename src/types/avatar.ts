/**
 * Avatar Integration - Type Definitions
 * Core types and state machine for avatar functionality
 */

export type AvatarState = 
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'active'
  | 'thinking'     // Visual feedback state when AI is processing
  | 'degraded'     // Performance-limited state
  | 'error'
  | 'disconnected'

export interface AvatarStateTransitions {
  idle: ['connecting', 'error']
  connecting: ['ready', 'error']
  ready: ['active', 'thinking', 'error', 'disconnected']
  active: ['thinking', 'degraded', 'disconnected', 'error']
  thinking: ['active', 'error', 'disconnected']
  degraded: ['active', 'error', 'disconnected']
  error: ['idle']
  disconnected: ['idle']
}

/**
 * Validates if a state transition is allowed
 */
export function isValidTransition(from: AvatarState, to: AvatarState): boolean {
  const validTransitions: Record<AvatarState, AvatarState[]> = {
    idle: ['connecting', 'error'],
    connecting: ['ready', 'error'],
    ready: ['active', 'thinking', 'error', 'disconnected'],
    active: ['thinking', 'degraded', 'disconnected', 'error'],
    thinking: ['active', 'error', 'disconnected'],
    degraded: ['active', 'error', 'disconnected'],
    error: ['idle'],
    disconnected: ['idle']
  }
  
  return validTransitions[from]?.includes(to) ?? false
}

/**
 * Avatar configuration interface
 */
export interface AvatarConfig {
  enabled: boolean
  sessionId: string
  avatarId?: string
  provider?: 'akool'
  onStatusChange?: (status: AvatarState) => void
}

/**
 * Avatar credentials from Akool API
 */
export interface AvatarCredentials {
  agora_app_id: string
  agora_channel: string
  agora_token: string
  agora_uid: number
}

/**
 * Avatar session response from edge function
 */
export interface AvatarSessionResponse {
  credentials: AvatarCredentials
  version: string
  timestamp: string
}

/**
 * Queued message for avatar communication
 */
export interface QueuedMessage {
  text: string
  isPartial: boolean
  timestamp: number
  id?: string
}

/**
 * Avatar performance metrics
 */
export interface AvatarPerformanceMetrics {
  cpuUsage?: number
  bandwidthMbps?: number
  latencyMs?: number
  frameRate?: number
  connectionQuality?: 'excellent' | 'good' | 'poor' | 'disconnected'
}

/**
 * Avatar error types
 */
export type AvatarErrorType = 
  | 'connection_failed'
  | 'session_timeout'
  | 'rate_limit_exceeded'
  | 'performance_degraded'
  | 'api_error'
  | 'network_error'
  | 'unknown'

/**
 * Avatar error interface
 */
export interface AvatarError {
  type: AvatarErrorType
  message: string
  code?: string
  retryable?: boolean
  context?: Record<string, unknown>
}

/**
 * Available avatar options
 */
export interface AvatarOption {
  id: string
  name: string
  preview?: string
  description?: string
  resolution?: '480p' | '720p' | '1080p'
}

/**
 * Default avatar options
 */
export const DEFAULT_AVATARS: AvatarOption[] = [
  {
    id: 'dvp_Tristan_cloth2_1080P',
    name: 'Tristan',
    description: 'Professional male avatar',
    resolution: '1080p'
  },
  {
    id: 'dvp_Sarah_business_1080P', 
    name: 'Sarah',
    description: 'Professional female avatar',
    resolution: '1080p'
  }
] 