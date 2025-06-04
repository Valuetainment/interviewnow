/**
 * Avatar Integration - Feature Flag Configuration
 * Controls avatar rollout and tenant-specific enablement
 */

export interface AvatarFeatureFlag {
  enabled: boolean
  rolloutPercentage: number
  betaTenants: string[]
  maxConcurrentSessions?: number
  costLimit?: number
}

export const FEATURE_FLAGS = {
  AVATAR: {
    enabled: import.meta.env.VITE_AVATAR_ENABLED === 'true' || import.meta.env.DEV || true,
    rolloutPercentage: parseInt(import.meta.env.VITE_AVATAR_ROLLOUT || '100'),
    betaTenants: [
      '11111111-1111-1111-1111-111111111111',
      ...(import.meta.env.VITE_AVATAR_BETA_TENANTS || '').split(',').filter(Boolean)
    ],
    maxConcurrentSessions: parseInt(import.meta.env.VITE_AVATAR_MAX_SESSIONS || '50'),
    costLimit: parseFloat(import.meta.env.VITE_AVATAR_COST_LIMIT || '100.0')
  } as AvatarFeatureFlag
}

/**
 * Check if avatar feature is enabled for a specific tenant
 */
export function isAvatarEnabledForTenant(tenantId: string): boolean {
  const flag = FEATURE_FLAGS.AVATAR
  
  // Feature disabled globally
  if (!flag.enabled) {
    return false
  }
  
  // Beta tenant access (always enabled)
  if (flag.betaTenants.includes(tenantId)) {
    return true
  }
  
  // Percentage rollout for general users
  if (flag.rolloutPercentage <= 0) {
    return false
  }
  
  // Simple percentage rollout based on tenant ID hash
  const hash = hashTenantId(tenantId)
  return (hash % 100) < flag.rolloutPercentage
}

/**
 * Simple hash function for tenant ID to ensure consistent rollout
 */
function hashTenantId(tenantId: string): number {
  let hash = 0
  for (let i = 0; i < tenantId.length; i++) {
    const char = tenantId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Check if avatar feature should be shown as an option
 */
export function shouldShowAvatarOption(tenantId: string): boolean {
  // Always show to beta testers
  if (FEATURE_FLAGS.AVATAR.betaTenants.includes(tenantId)) {
    return true
  }
  
  // Show if enabled for this tenant or if it's in rollout percentage
  return isAvatarEnabledForTenant(tenantId)
}

/**
 * Get avatar configuration for tenant
 */
export function getAvatarConfig(tenantId: string) {
  return {
    enabled: isAvatarEnabledForTenant(tenantId),
    showOption: shouldShowAvatarOption(tenantId),
    isBetaTenant: FEATURE_FLAGS.AVATAR.betaTenants.includes(tenantId),
    maxSessions: FEATURE_FLAGS.AVATAR.maxConcurrentSessions,
    costLimit: FEATURE_FLAGS.AVATAR.costLimit
  }
}

/**
 * Development/testing utilities
 */
export const avatarFeatureUtils = {
  /**
   * Force enable avatar for development/testing
   */
  forceEnable: () => {
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__AVATAR_FORCE_ENABLED = true
    }
  },
  
  /**
   * Check if avatar is force-enabled for development
   */
  isForceEnabled: () => {
    return import.meta.env.DEV && (window as unknown as Record<string, unknown>).__AVATAR_FORCE_ENABLED === true
  },
  
  /**
   * Get current feature flag status for debugging
   */
  getDebugInfo: () => ({
    ...FEATURE_FLAGS.AVATAR,
    forceEnabled: avatarFeatureUtils.isForceEnabled()
  })
} 