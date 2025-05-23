# WebRTC Production Deployment Guide

This document provides detailed instructions for deploying and testing the hybrid WebRTC architecture in production.

## Overview

The hybrid WebRTC architecture combines:
1. **Fly.io SDP Proxy**: Securely handles SDP exchange and signaling
2. **OpenAI WebRTC**: Provides direct client-to-OpenAI connection for audio streaming
3. **Supabase Edge Functions**: Handle session initialization and transcript processing

## Deployment Checklist

### 1. Prerequisites

- Fly.io CLI installed and authenticated
- Supabase CLI installed and authenticated
- Access to OpenAI API credentials
- Access to production database

### 2. Deploy SDP Proxy to Fly.io

```bash
# Navigate to the Fly.io proxy directory
cd fly-interview-hybrid

# Edit the fly.toml configuration if needed
# Ensure environment variables are properly set

# Deploy to Fly.io
fly deploy

# Verify deployment status
fly status

# Check logs to ensure successful startup
fly logs
```

### 3. Deploy Edge Functions

```bash
# Deploy interview-start edge function
supabase functions deploy interview-start

# Deploy transcript-processor edge function
supabase functions deploy transcript-processor

# Verify deployments in Supabase dashboard
echo "Check functions at: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions"
```

### 4. Apply Database Migrations

```bash
# Review the migration script
cat supabase/migrations/20250513000000_update_for_hybrid_architecture.sql

# Apply migration
supabase migration up

# Verify schema changes
supabase db lint
```

## Testing in Production

### 1. Preliminary Checks

- Verify SDP proxy is running: `fly status`
- Check edge function logs in Supabase dashboard
- Ensure OpenAI API keys are valid

### 2. Test Production Connectivity

1. Visit http://YOUR_DOMAIN/interview-test-simple
2. Set server URL to the production endpoint: `wss://interview-sdp-proxy.fly.dev/ws`
3. Check browser console for connection status and errors
4. Verify successful WebRTC negotiation

### 3. Test Transcript Generation

1. Ensure you're connected to the production WebRTC server
2. Speak into the microphone or wait for simulation messages
3. Verify transcripts appear in the UI
4. Check transcript entries in the database

### 4. Full Interview Test

1. Set up a real interview session in the application
2. Navigate to the interview room
3. Test the entire interview flow from start to finish
4. Verify transcript storage and retrieval

## Monitoring and Maintenance

### Regular Checks

- Monitor Fly.io logs for SDP proxy errors
- Check Supabase edge function logs for issues
- Watch for increased error rates in browser logs
- Regularly test the interview flow to catch regressions

### Troubleshooting

1. **Connection Issues**:
   - Check Fly.io status and logs
   - Verify network connectivity
   - Check for browser console errors

2. **Audio Problems**:
   - Verify microphone permissions
   - Check audio track initialization in WebRTCManager
   - Test with different browsers

3. **Transcript Issues**:
   - Check edge function logs
   - Verify OpenAI API access
   - Ensure database connections are working

## Security Considerations

1. **API Key Protection**:
   - Store OpenAI API key securely in Supabase environment
   - Never expose API keys in client-side code
   - Rotate keys regularly

2. **Multi-tenant Isolation**:
   - Always verify tenant_id for all database operations
   - Enforce RLS policies for transcript data
   - Prevent cross-tenant data access

3. **WebRTC Security**:
   - Use secure WebSocket connections (wss://)
   - Implement proper session authentication
   - Validate SDP messages on server-side

## Monitoring and Analytics

Consider implementing:
1. Error tracking for WebRTC connections
2. Session success rate monitoring
3. Audio quality metrics collection
4. API usage tracking to optimize costs

## Rollback Plan

If issues occur post-deployment:
1. Revert to previous Fly.io deployment
2. Roll back Supabase edge functions
3. Revert database schema changes if possible
4. Switch client code to use original SDP proxy while debugging