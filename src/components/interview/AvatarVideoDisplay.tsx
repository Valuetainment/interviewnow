/**
 * Avatar Video Display Component
 * Handles avatar video display with status overlays and audio management
 * Designed to work with Akool/Agora avatar streams
 */

import React from 'react';
import { cn } from '../../lib/utils';
import type { AvatarState } from '../../types/avatar';

interface AvatarVideoDisplayProps {
  status: AvatarState;
  className?: string;
}

export function AvatarVideoDisplay({ status, className }: AvatarVideoDisplayProps) {
  const getStatusOverlay = () => {
    switch (status) {
      case 'connecting':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <div className="text-sm">Connecting avatar...</div>
            </div>
          </div>
        );
      
      case 'thinking':
        return (
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <div className="animate-pulse bg-blue-500 rounded-full w-3 h-3"></div>
            <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
              AI thinking...
            </span>
          </div>
        );
      
      case 'degraded':
        return (
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <div className="bg-yellow-500 rounded-full w-3 h-3"></div>
            <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
              Low quality
            </span>
          </div>
        );
      
      case 'error':
      case 'disconnected':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center text-white">
              <div className="text-red-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm">
                {status === 'error' ? 'Avatar unavailable' : 'Avatar disconnected'}
              </div>
              <div className="text-xs text-gray-300 mt-1">
                Continuing with audio only
              </div>
            </div>
          </div>
        );
      
      case 'idle':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">👤</div>
              <div className="text-sm">Avatar ready</div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getStatusIndicator = () => {
    if (status === 'active') {
      return (
        <div className="absolute bottom-4 right-4 flex items-center space-x-2">
          <div className="bg-green-500 rounded-full w-2 h-2 animate-pulse"></div>
          <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
            Live
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn(
      'relative aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-700',
      'shadow-lg transition-all duration-300',
      status === 'active' && 'border-green-500/50 shadow-green-500/20',
      status === 'thinking' && 'border-blue-500/50 shadow-blue-500/20',
      status === 'degraded' && 'border-yellow-500/50 shadow-yellow-500/20',
      status === 'error' && 'border-red-500/50 shadow-red-500/20',
      className
    )}>
      {/* Video container - Agora will render video here */}
      <div 
        id="avatar-video-container" 
        className="w-full h-full"
        role="img"
        aria-label={`Avatar video stream - ${status}`}
      />
      
      {/* Status overlays */}
      {getStatusOverlay()}
      {getStatusIndicator()}
      
      {/* Quality indicator for degraded state */}
      {status === 'degraded' && (
        <div className="absolute bottom-4 left-4">
          <div className="bg-yellow-500/80 text-black text-xs px-2 py-1 rounded">
            Adjusting quality...
          </div>
        </div>
      )}
      
      {/* Hidden audio element for avatar audio - separate from OpenAI audio */}
      <audio 
        id="avatar-audio" 
        className="hidden"
        autoPlay
        playsInline
        aria-label="Avatar audio stream"
      />
    </div>
  );
}

/**
 * CSS-in-JS styles for avatar animations
 * Can be moved to a separate CSS file if preferred
 */
export const avatarStyles = `
  .avatar-video {
    max-width: 480px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .avatar-thinking {
    animation: thinking-pulse 2s ease-in-out infinite;
  }
  
  @keyframes thinking-pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  
  .avatar-video-container {
    background: linear-gradient(45deg, #1f2937, #374151);
  }
  
  /* Ensure video fills container properly */
  #avatar-video-container video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export default AvatarVideoDisplay; 