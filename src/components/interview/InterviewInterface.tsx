import React, { useState } from 'react';
import { useOpenAIConnection } from '../../hooks/useOpenAIConnection';
import { useAvatarConnection } from '../../hooks/useAvatarConnection';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

// Avatar state
const [avatarEnabled, setAvatarEnabled] = useState(false);
const [avatarUnavailable, setAvatarUnavailable] = useState(false);
const [avatarStatus, setAvatarStatus] = useState<'idle' | 'connecting' | 'ready' | 'active' | 'error' | 'degraded' | 'disconnected'>('idle');

// Initialize WebRTC connections
const { 
  status: openAIStatus,
  startConnection: startOpenAIConnection,
  stopConnection: stopOpenAIConnection,
  sendAudio: sendAudioToOpenAI,
  isVADActive,
  transcripts,
  conversationHistory
} = useOpenAIConnection({
  enabled: isWebRTCActive,
  sessionId: sessionId || '',
  onStatusChange: (status) => {
    console.log('[Interview] OpenAI status:', status);
  }
});

const { 
  status: avatarConnectionStatus,
  sendToAvatar,
  cleanup: cleanupAvatar
} = useAvatarConnection({
  enabled: avatarEnabled && !avatarUnavailable,
  sessionId: sessionId || '',
  avatarId: selectedAvatar,
  onStatusChange: (status) => {
    console.log('[Interview] Avatar status:', status);
    setAvatarStatus(status);
    
    // If avatar connection fails due to all avatars being busy
    if (status === 'error') {
      // Check if it's because all avatars are busy
      setTimeout(() => {
        if (avatarConnectionStatus === 'error') {
          console.warn('[Interview] Avatar service unavailable - disabling avatar');
          setAvatarUnavailable(true);
          setAvatarEnabled(false);
        }
      }, 1000);
    }
  }
});

        {/* Avatar Toggle - show unavailable message if needed */}
        <div className="flex items-center gap-2">
          <Switch
            id="avatar-toggle"
            checked={avatarEnabled}
            onCheckedChange={(checked) => {
              if (avatarUnavailable) {
                toast.error('Avatar service is currently unavailable. All avatars are busy.');
                return;
              }
              setAvatarEnabled(checked);
            }}
            disabled={!isWebRTCActive || avatarUnavailable}
            className="data-[state=checked]:bg-primary"
          />
          <Label 
            htmlFor="avatar-toggle" 
            className={cn(
              "text-sm font-medium cursor-pointer",
              (!isWebRTCActive || avatarUnavailable) && "opacity-50 cursor-not-allowed"
            )}
          >
            {avatarUnavailable ? 'Avatar Unavailable' : 'Enable Avatar'}
          </Label>
        </div> 