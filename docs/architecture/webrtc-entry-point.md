---
title: WebRTC Implementation Guide - Entry Point
status: Current
last_updated: 2025-05-22
contributors: [Claude]
related_docs: [/docs/architecture/hybrid-webrtc-architecture.md, /docs/architecture/VM_ISOLATION.md]
---

# WebRTC Implementation Guide - Entry Point

## Overview

This document serves as the primary entry point for understanding the AI Interview Insights Platform's WebRTC implementation. It provides a comprehensive overview of the hybrid architecture, key components, and guides you to the appropriate detailed documentation.

## Contents

- [Architecture Overview](#architecture-overview)
- [Current Implementation Status](#current-implementation-status)
- [Key Components](#key-components)
- [Getting Started](#getting-started)
- [Testing and Development](#testing-and-development)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)

## Architecture Overview

The platform uses a **hybrid WebRTC architecture** that combines:

- **Direct OpenAI WebRTC Connection**: Low-latency audio streaming directly between client and OpenAI
- **Fly.io SDP Proxy**: Secure SDP exchange and credential management
- **Per-Session VM Isolation**: Each interview gets its own isolated virtual machine for maximum security
- **Supabase Integration**: Real-time transcript storage and session management

### Why Hybrid Architecture?

1. **Performance**: Direct WebRTC connection eliminates server-side audio processing bottlenecks
2. **Security**: VM isolation ensures complete tenant separation
3. **Scalability**: Reduced server resource requirements for audio processing
4. **Reliability**: OpenAI's robust WebRTC infrastructure handles connection management

## Current Implementation Status

### ✅ Completed Components
- **Hooks-based WebRTC Client**: Modular React hooks for WebRTC functionality
- **SDP Proxy Server**: Fly.io-hosted proxy with OpenAI Realtime API integration
- **Edge Functions**: Supabase functions for session management and transcripts
- **Database Schema**: Multi-tenant RLS policies and session tracking
- **Comprehensive Testing**: Unit tests and integration test framework
- **OpenAI Integration Fix**: Updated to use proper Realtime API endpoints and authentication

### ⚠️ In Progress
- **Production Deployment**: SDP proxy has been fixed and updated, awaiting production deployment verification
- **VM Isolation**: Implementation completed, needs production verification
- **End-to-End Testing**: Real interview session validation pending

### 🔄 Pending
- **Performance Monitoring**: Production metrics and alerting
- **Auto-scaling**: Dynamic VM allocation based on demand

## Key Components

### 1. Client-Side Components

**Location**: `src/hooks/webrtc/`

- **useWebRTC**: Main orchestration hook
- **useOpenAIConnection**: Direct OpenAI WebRTC connection management
- **useSDPProxy**: SDP exchange with Fly.io proxy
- **useTranscriptManager**: Real-time transcript handling
- **useConnectionState**: Connection state management with retry logic

**Test Pages**:
- `/simple-webrtc-test` - Simplified testing interface (recommended)
- `/basic-webrtc-test` - Basic functionality testing
- `/test/openai` - Direct OpenAI connection testing

### 2. Server-Side Infrastructure

**SDP Proxy**: `fly-interview-hybrid/`
- WebSocket server for SDP exchange
- JWT validation for tenant isolation
- Session state tracking and recovery
- **Status**: ACTIVE (Fixed and updated with OpenAI Realtime API support)
- **Recent Updates**:
  - Uses OpenAI Realtime API endpoints (`sessions.openai.com/v1/realtime`)
  - Direct OpenAI API key authentication (not Supabase JWT)
  - Requires `OpenAI-Beta: realtime=v1` header
  - Fixed node-fetch dependency (v2.6.9 for CommonJS compatibility)

**Edge Functions**: `supabase/functions/`
- `interview-start`: Session initialization and OpenAI configuration
- `transcript-processor`: Real-time transcript storage with tenant isolation

### 3. Database Components

**Key Tables**:
- `interview_sessions`: Session metadata and tenant association
- `transcript_entries`: Real-time transcript storage with speaker identification
- `tenants`: Multi-tenant isolation and configuration

## Getting Started

### For Developers

1. **Local Development Setup**:
   ```bash
   npm run dev  # Start React dev server
   cd fly-interview-hybrid && node simple-server.js  # Local simulation server
   ```

2. **Testing WebRTC Locally**:
   - Visit: http://localhost:8080/simple-webrtc-test
   - Use simulation mode for local testing (adds `?simulation=true`)
   - Test direct OpenAI connections require valid API keys

3. **Key Environment Variables**:
   ```
   SIMULATION_MODE=true  # For local testing
   FLY_APP_NAME=interview-sdp-proxy  # For production
   ```

### For System Administrators

1. **Deploy/Verify SDP Proxy** (recently fixed):
   ```bash
   # Deploy the updated SDP proxy with OpenAI Realtime API support
   cd fly-interview-hybrid
   fly deploy --app interview-sdp-proxy
   
   # Verify deployment status
   fly apps status interview-sdp-proxy
   fly logs interview-sdp-proxy
   ```

2. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy interview-start
   supabase functions deploy transcript-processor
   ```

## Testing and Development

### Test Strategy

**Local Testing**: 
- Use simulation server for component testing
- Direct browser WebSocket connections for server verification
- Hooks unit tests for individual component validation

**Production Testing**:
- Real OpenAI WebRTC connections
- End-to-end interview sessions
- Cross-browser compatibility verification

### Available Test Commands

```bash
npm test                    # Run all tests
npm run test:webrtc        # WebRTC-specific tests
npm run test:hooks         # Hooks unit tests
```

### Test Documentation

- [Testing Guide](../guides/testing/TEST_STRUCTURE.md) - Comprehensive test organization
- [WebRTC Testing](../../WEBRTC_TESTING.md) - WebRTC-specific testing procedures
- [Automated Testing](../guides/testing/AUTOMATED_TESTING.md) - Automated test setup

## Production Deployment

### Prerequisites

1. **OpenAI API Access**: GPT-4o Realtime model access required
2. **Fly.io Account**: For SDP proxy hosting
3. **Supabase Project**: Database and edge functions
4. **Domain Configuration**: SSL certificates for WebRTC

### Deployment Checklist

**Critical Priority**:
- [ ] Deploy the updated SDP proxy with OpenAI Realtime API fixes
- [ ] Verify OpenAI API key is set in Fly.io secrets
- [ ] Deploy updated edge functions with VM isolation fixes (v6 for interview-start)
- [ ] Verify RLS policies for multi-tenant security

**High Priority**:
- [ ] Test end-to-end interview flow in production
- [ ] Configure VM isolation per session
- [ ] Set up monitoring and alerting

See: [Production Deployment Guide](../guides/deployment/WEBRTC_PRODUCTION_DEPLOYMENT.md)

## Troubleshooting

### Common Issues

**"SDP Proxy Connection Failed"**
- Check if SDP proxy is running: `fly status interview-sdp-proxy`
- Verify WebSocket URL includes `?simulation=true` for local testing
- Ensure JWT validation is configured correctly

**"WebRTC Connection Timeout"**
- Verify OpenAI API key has Realtime model access
- Check browser console for ICE connection failures
- Test with direct OpenAI connection first

**"Transcript Not Saving"**
- Verify tenant_id is properly set in session
- Check RLS policies allow user access to transcript_entries
- Ensure edge functions are deployed and accessible

### Debug Tools

**Client-Side**:
- Browser console logs for WebRTC connection states
- Test pages include comprehensive debug panels
- React DevTools for hooks state inspection

**Server-Side**:
- Fly.io logs: `fly logs interview-sdp-proxy`
- Supabase logs: Real-time logs in dashboard
- Edge function logs: Function-specific logging

## Related Documentation

### Architecture Documentation
- [Hybrid WebRTC Architecture](hybrid-webrtc-architecture.md) - Detailed architecture specification
- [VM Isolation](VM_ISOLATION.md) - Security model and implementation
- [Architecture Comparison](ARCHITECTURE_COMPARISON.md) - Historical context (reference only)

### Implementation Guides
- [Hybrid Implementation Guide](../development/hybrid-implementation-guide.md) - Step-by-step implementation
- [OpenAI WebRTC Integration](../development/openai-webrtc-integration.md) - OpenAI-specific details
- [WebRTC UI Integration](../guides/setup/WEBRTC_UI_INTEGRATION.md) - UI component integration

### Operational Documentation
- [Production Deployment](../guides/deployment/WEBRTC_PRODUCTION_DEPLOYMENT.md) - Production deployment procedures
- [Testing Procedures](../guides/testing/) - Comprehensive testing documentation
- [CLAUDE.md](../../CLAUDE.md) - Development log and current status

### API References
- [API Endpoints](../development/api-endpoints.md) - REST API documentation
- [Edge Functions](../api/) - Supabase edge function documentation

## Change History

- 2025-05-22: Initial version created as part of documentation reorganization
- 2025-05-22: Added comprehensive sections for all user types
- 2025-05-22: Included current production status and critical action items

---

**Next Steps**: If this is your first time with the WebRTC implementation, start with the [Hybrid WebRTC Architecture](hybrid-webrtc-architecture.md) document for detailed technical specifications, then proceed to the appropriate implementation or testing guide based on your role.