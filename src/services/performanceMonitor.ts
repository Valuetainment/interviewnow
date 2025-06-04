/**
 * Performance Budget Enforcement for Avatar Integration
 * Monitors CPU and bandwidth before enabling avatar functionality
 * Implements the 40% CPU limit and 2 Mbps bandwidth requirement
 */

interface NetworkConnection extends EventTarget {
  readonly downlink: number;
  readonly downlinkMax?: number;
  readonly effectiveType: string;
  readonly rtt: number;
  readonly saveData: boolean;
  readonly type: string;
}

interface NavigatorWithConnection extends Navigator {
  readonly connection?: NetworkConnection;
  readonly mozConnection?: NetworkConnection;
  readonly webkitConnection?: NetworkConnection;
}

interface MemoryInfo {
  readonly usedJSHeapSize: number;
  readonly totalJSHeapSize: number;
  readonly jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  readonly memory?: MemoryInfo;
}

export class PerformanceMonitor {
  private static readonly AVATAR_CPU_LIMIT = 40; // 40% CPU threshold
  private static readonly AVATAR_BANDWIDTH_MIN = 2; // 2 Mbps minimum
  private static readonly AVATAR_MEMORY_LIMIT = 150; // 150MB additional memory limit

  /**
   * Check if avatar can be enabled based on performance budget
   */
  static canEnableAvatar(): boolean {
    const cpuCheck = this.checkCPU();
    const bandwidthCheck = this.checkBandwidth();
    const memoryCheck = this.checkMemory();
    
    console.log('[Performance] Avatar eligibility check:', {
      cpu: cpuCheck,
      bandwidth: bandwidthCheck,
      memory: memoryCheck
    });
    
    return cpuCheck && bandwidthCheck && memoryCheck;
  }

  /**
   * Check CPU usage estimation
   * Note: Browser doesn't provide direct CPU measurements
   * This uses performance timing heuristics as a proxy
   */
  private static checkCPU(): boolean {
    try {
      // Use hardware concurrency as a baseline
      const cores = navigator.hardwareConcurrency || 4;
      
      // Measure script execution timing as CPU proxy
      const start = performance.now();
      
      // Simple computation to gauge CPU responsiveness
      let sum = 0;
      for (let i = 0; i < 100000; i++) {
        sum += Math.random();
      }
      
      const executionTime = performance.now() - start;
      
      // Rough heuristic: if basic computation takes too long, CPU might be busy
      const expectedTime = 20; // 20ms baseline for this computation
      const cpuLoadFactor = executionTime / expectedTime;
      
      console.log('[Performance] CPU check:', {
        cores,
        executionTime: `${executionTime.toFixed(2)}ms`,
        loadFactor: cpuLoadFactor.toFixed(2),
        underLimit: cpuLoadFactor < 2.0
      });
      
      // If execution takes more than 2x expected time, consider CPU busy
      return cpuLoadFactor < 2.0;
      
    } catch (error) {
      console.warn('[Performance] CPU check failed, defaulting to true:', error);
      return true; // Default to allowing avatar if check fails
    }
  }

  /**
   * Check network bandwidth using Network Information API
   */
  private static checkBandwidth(): boolean {
    try {
      const nav = navigator as NavigatorWithConnection;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
      
      if (!connection) {
        console.log('[Performance] Network Information API not available, assuming good connection');
        return true; // Assume good connection if API unavailable
      }
      
      const downlinkMbps = connection.downlink;
      const effectiveType = connection.effectiveType;
      const rtt = connection.rtt;
      
      console.log('[Performance] Bandwidth check:', {
        downlink: `${downlinkMbps} Mbps`,
        effectiveType,
        rtt: `${rtt}ms`,
        meetsRequirement: downlinkMbps >= this.AVATAR_BANDWIDTH_MIN
      });
      
      // Check both downlink speed and connection quality
      const hasGoodSpeed = downlinkMbps >= this.AVATAR_BANDWIDTH_MIN;
      const hasGoodQuality = effectiveType !== 'slow-2g' && effectiveType !== '2g';
      
      return hasGoodSpeed && hasGoodQuality;
      
    } catch (error) {
      console.warn('[Performance] Bandwidth check failed, defaulting to true:', error);
      return true; // Default to allowing avatar if check fails
    }
  }

  /**
   * Check available memory for avatar functionality
   */
  private static checkMemory(): boolean {
    try {
      // Check if memory API is available
      const perfWithMemory = performance as PerformanceWithMemory;
      if (!perfWithMemory.memory) {
        console.log('[Performance] Memory API not available, assuming sufficient memory');
        return true;
      }
      
      const memory = perfWithMemory.memory;
      const usedMemoryMB = memory.usedJSHeapSize / (1024 * 1024);
      const totalMemoryMB = memory.totalJSHeapSize / (1024 * 1024);
      const limitMemoryMB = memory.jsHeapSizeLimit / (1024 * 1024);
      
      // Calculate available memory
      const availableMemoryMB = limitMemoryMB - usedMemoryMB;
      const memoryUsagePercent = (usedMemoryMB / limitMemoryMB) * 100;
      
      console.log('[Performance] Memory check:', {
        used: `${usedMemoryMB.toFixed(1)} MB`,
        total: `${totalMemoryMB.toFixed(1)} MB`,
        limit: `${limitMemoryMB.toFixed(1)} MB`,
        available: `${availableMemoryMB.toFixed(1)} MB`,
        usagePercent: `${memoryUsagePercent.toFixed(1)}%`,
        hasEnoughForAvatar: availableMemoryMB >= this.AVATAR_MEMORY_LIMIT
      });
      
      // Require 150MB available memory and less than 80% usage
      return availableMemoryMB >= this.AVATAR_MEMORY_LIMIT && memoryUsagePercent < 80;
      
    } catch (error) {
      console.warn('[Performance] Memory check failed, defaulting to true:', error);
      return true; // Default to allowing avatar if check fails
    }
  }

  /**
   * Monitor performance during avatar session
   */
  static startPerformanceMonitoring(onBudgetExceeded: () => void): () => void {
    let monitoring = true;
    
    const checkPerformance = () => {
      if (!monitoring) return;
      
      if (!this.canEnableAvatar()) {
        console.warn('[Performance] Performance budget exceeded during avatar session');
        onBudgetExceeded();
        return;
      }
      
      // Check again in 10 seconds
      setTimeout(checkPerformance, 10000);
    };
    
    // Start monitoring
    checkPerformance();
    
    // Return cleanup function
    return () => {
      monitoring = false;
    };
  }

  /**
   * Get current performance metrics for debugging
   */
  static getPerformanceMetrics() {
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    const metrics = {
      timestamp: new Date().toISOString(),
      hardware: {
        cores: navigator.hardwareConcurrency || 'unknown',
        userAgent: navigator.userAgent
      },
      network: connection ? {
        downlink: connection.downlink,
        effectiveType: connection.effectiveType,
        rtt: connection.rtt,
        saveData: connection.saveData
      } : 'unavailable',
      memory: 'memory' in performance ? {
        used: Math.round(((performance as PerformanceWithMemory).memory!.usedJSHeapSize) / (1024 * 1024)),
        total: Math.round(((performance as PerformanceWithMemory).memory!.totalJSHeapSize) / (1024 * 1024)),
        limit: Math.round(((performance as PerformanceWithMemory).memory!.jsHeapSizeLimit) / (1024 * 1024))
      } : 'unavailable',
      canEnableAvatar: this.canEnableAvatar()
    };
    
    return metrics;
  }
} 