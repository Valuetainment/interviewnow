# WebRTC VM Isolation Architecture

## Overview

This document describes the isolation model used for WebRTC interview sessions in the AI Interview Insights Platform. Proper isolation is critical for security, performance, and tenant separation in our multi-tenant SaaS architecture.

## Per-Session VM Isolation Model

Our platform uses a strict **one VM per interview session** model for all WebRTC connections, regardless of architecture type. This ensures:

1. **Complete separation between interviews**
2. **No cross-contamination of audio/transcript data**
3. **Proper resource allocation and performance optimization**
4. **Enhanced security through isolation**

## Implementation Details

### VM Naming Convention

Each VM is named using a combination of architecture type, tenant ID, and session ID:

```
interview-{architecture}-{tenantId}-{sessionShortId}
```

Where:
- `architecture` is either `hybrid` or `proxy` (SDP proxy)
- `tenantId` is the UUID of the tenant
- `sessionShortId` is a shortened form of the interview session ID

Example: `interview-hybrid-550e8400-e29b-41d4-a716-446655440000-a1b2c3d4`

### VM Creation Process

1. The `interview-start` edge function initializes a session with:
   ```typescript
   const vmName = architecture === 'hybrid'
     ? `interview-hybrid-${tenantId}-${sessionShortId}`
     : `interview-proxy-${tenantId}-${sessionShortId}`;
   ```

2. The WebSocket connection URL is constructed with security tokens:
   ```typescript
   const vmUrl = `wss://${vmName}.fly.dev/${wsPath}?token=${secureToken}&session=${sessionId}&tenant=${tenantId}`;
   ```

3. This URL is returned to the client and used for establishing the WebRTC connection

### VM Lifecycle

1. **Initialization**: VM is activated when the interview session starts
2. **Active Session**: VM processes WebRTC connections and handles SDP exchange
3. **Termination**: VM is terminated when the interview completes or times out
4. **Resource Cleanup**: All data specific to the interview is removed

## Architecture Comparison

### Hybrid Architecture (New Approach)

In the hybrid architecture, the VM serves only as a secure SDP proxy:

1. The VM handles secure SDP exchange without exposing API keys
2. Audio streams are transmitted directly between the browser and OpenAI
3. The VM doesn't process or store audio data
4. Each interview gets its own VM for complete isolation

### SDP Proxy Architecture (Legacy Approach)

In the SDP proxy architecture, the VM handles more responsibilities:

1. The VM manages the WebRTC connection 
2. Audio is processed on the server side
3. WebSockets are used for full audio transmission
4. One VM per interview session is still maintained for isolation

## Security Benefits

Using per-session VMs provides several security benefits:

1. **Tenant Isolation**: Data from different tenants is physically separated
2. **Session Isolation**: Each interview session runs in its own isolated environment
3. **Resource Limits**: Per-VM resource limits prevent DoS attacks
4. **Credential Isolation**: API keys and secrets are kept separate for each session
5. **Data Separation**: No shared memory or disk space between sessions
6. **Reduced Attack Surface**: Compromising one VM doesn't expose other sessions

## Monitoring and Scaling

The per-session isolation model also facilitates:

1. **Fine-grained monitoring** of resource usage per interview
2. **Predictable scaling** based on the number of concurrent interviews
3. **Reliable troubleshooting** with session-specific logs
4. **Performance optimization** based on individual session needs

## Implementation Considerations

When working with this isolation model:

1. Ensure WebRTC connections are properly initialized with the correct VM URL
2. Verify that per-session URLs are used rather than hardcoded endpoints
3. Implement proper VM cleanup after session completion
4. Monitor resource usage to optimize VM sizing for different interview types

## Conclusion

The per-session VM isolation model is a core security feature of our platform. It ensures proper multi-tenant isolation and provides a secure environment for conducting interviews. Both the hybrid and SDP proxy architectures maintain this strict isolation model, with each interview running in its own dedicated VM. 