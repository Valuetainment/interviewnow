# Triangular Architecture: Implementation Steps

This document outlines the step-by-step approach to implement the triangular architecture for the AI Interview Platform.

## 1. Core Infrastructure Setup

### Fly.io Setup
1. Create production Fly.io application
   ```bash
   fly launch --name interview-processor
   ```
2. Configure scaling parameters
   ```bash
   fly scale count 2 --app interview-processor
   ```
3. Deploy to multiple regions
   ```bash
   fly regions add fra mia
   ```
4. Set environment variables
   ```bash
   fly secrets set OPENAI_API_KEY=your_api_key
   ```

### WebSocket Server Implementation
1. Create server.js based on POC implementation
2. Add token validation middleware
3. Implement tenant isolation
4. Set up audio processing pipeline

## 2. Authentication System

### Invitation & Account Creation
1. Create Supabase edge function for invitation generation
   - Generate secure invitation token
   - Associate with interview_invitations record
   - Set expiration time

2. Implement email delivery system
   - Use SendGrid or similar service
   - Include invitation link with token

3. Set up candidate account creation page
   - Create React form with authentication options
   - Implement magic link option via Supabase Auth
   - Add Google OAuth integration
   - Connect to Supabase Auth

### Session Management
1. Create authentication middleware
   - Verify user is authenticated
   - Check invitation access rights
   - Extract tenant/candidate IDs

2. Implement session initialization
   - Create interview_sessions record on authentication
   - Link to user account
   - Set up WebSocket connection to Fly.io
   - Track session status

## 3. Database Schema Updates

### Create Migrations
1. Create tenant_candidates table
   ```sql
   CREATE TABLE tenant_candidates (
     tenant_id UUID REFERENCES tenants(id),
     candidate_id UUID REFERENCES candidates(id),
     external_id TEXT,
     status TEXT,
     PRIMARY KEY (tenant_id, candidate_id)
   );
   ```

2. Update interview_sessions table
   ```sql
   ALTER TABLE interview_sessions
   ADD COLUMN video_recording_id TEXT,
   ADD COLUMN video_recording_url TEXT,
   ADD COLUMN user_id UUID REFERENCES auth.users(id);
   ```

3. Update RLS policies for tenant isolation

## 4. api.video Integration

### Setup and Configuration
1. Register for api.video account
2. Create client-side integration
   ```javascript
   import { createRecorder } from '@api.video/video-recorder';
   
   const recorder = createRecorder({
     apiKey: 'YOUR_API_KEY',
     recordingId: sessionId
   });
   ```

### Recording Implementation
1. Create helper functions for token generation
2. Implement recording initialization
3. Set up recording status callbacks
4. Save recording metadata to session

## 5. Client-Side Implementation

### Audio Streaming Component
1. Adapt WebRTC component to use WebSockets
2. Create audio capture and streaming functions
3. Implement reconnection logic

### Video Recording Component
1. Create video recorder UI
2. Implement api.video SDK integration
3. Add recording controls and status indicators

### Interview Flow
1. Update interview initialization process
2. Create candidate account creation UI
3. Design interview welcome screen
4. Create combined audio/video recording interface

## 6. Testing Strategy

### Component Testing
1. Test WebSocket audio streaming
2. Test account creation flow
3. Test magic link and Google OAuth integrations
4. Test video recording in isolation

### Integration Testing
1. Full end-to-end interview flow
2. Test with simulated latency
3. Verify transcript saving with authenticated sessions
4. Test session resumption after interruption

### Load Testing
1. Simulate multiple concurrent interviews
2. Verify Fly.io scaling capabilities
3. Measure performance metrics

## 7. Deployment Pipeline

### CI/CD Setup
1. Create GitHub Actions workflow
2. Implement testing steps
3. Configure automated deployment to Fly.io

### Monitoring
1. Set up Fly.io metrics dashboard
2. Implement error logging
3. Create alerts for critical issues

## Implementation Timeline

| Phase | Timeframe | Key Deliverables |
|-------|-----------|------------------|
| Infrastructure | Week 1 | Fly.io setup, WebSocket server |
| Authentication | Week 2 | Invitation system, Account creation flow |
| Database | Week 2 | Schema migrations, RLS policies |
| Video Integration | Week 3 | api.video setup, Recording component |
| Client Updates | Week 3-4 | Updated UI, Combined flow |
| Testing | Ongoing | Component, Integration, Load tests |
| Deployment | Week 4 | Production deployment | 