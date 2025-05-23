> **DEPRECATED**: This document describes the legacy triangular architecture which has been replaced by the hybrid OpenAI approach. See [Hybrid WebRTC Architecture](/docs/architecture/hybrid-webrtc-architecture.md) for the current implementation.

# AI Interview Platform - Triangular Architecture Specification [ARCHIVED]

## Architecture Overview

The AI Interview Platform is shifting from a client-heavy architecture to a "triangular architecture" with the following components:

```
[Client Browser] ← WebSockets → [Fly.io] ← API → [OpenAI]
        ↓                           ↓
 [api.video API]              [Supabase Backend]
 (Video Recording)         (Data & Authentication)
```

### Core Components

1. **Fly.io Services**:
   - Audio processing and streaming
   - OpenAI API communication
   - Transcription processing

2. **api.video Integration**:
   - Video capture and storage
   - Encoding and streaming 
   - Playback URL generation

3. **Supabase Backend**:
   - Authentication and token management
   - Session data persistence
   - Candidate and tenant management

## Interview Flows

### Admin-Initiated Interview
1. Admin selects candidate and position
2. System creates session record
3. Admin starts interview
4. Fly.io processes audio, api.video records
5. Transcript saved to Supabase

### Invitation Flow (Account Creation)
1. Admin generates interview invitation
2. Secure invitation link sent to candidate
3. Candidate clicks link and creates account (magic link or Google auth)
4. Candidate authenticates and accesses interview
5. Same processing flow as admin interview
6. Transcript and recording linked to session and candidate account

## Authentication Approach

The system will use a secure account-based authentication approach for invitations:

- Invitation links contain secure tokens for initial access
- Upon clicking link, candidate creates an account via:
  - Magic link email authentication
  - Google OAuth sign-in
- Account creation ensures:
  - Better session persistence
  - Ability to resume interrupted interviews
  - More secure authentication
  - Proper transcript saving
- User accounts linked to candidate profile
- Sessions tracked with authenticated user context

## Candidate-Tenant Relationship Model

Candidates can be associated with multiple tenants (companies):

```sql
-- Candidates table (core candidate info)
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant-Candidate relationship table
CREATE TABLE tenant_candidates (
  tenant_id UUID REFERENCES tenants(id),
  candidate_id UUID REFERENCES candidates(id),
  external_id TEXT, -- Optional tenant-specific candidate ID
  status TEXT,
  PRIMARY KEY (tenant_id, candidate_id)
);
```

This structure allows:
- One candidate to interview with multiple companies
- Each tenant to maintain isolated data
- Reuse of candidate profile across tenants

## Technical Process Flows

### Audio Processing Flow
1. Client captures audio via browser APIs
2. WebSocket streams audio to Fly.io
3. Fly.io processes and encodes audio (16kHz, 16-bit PCM)
4. Encoded audio sent to OpenAI
5. Transcription results returned
6. Results saved to Supabase

### Video Recording Flow
1. Client initializes api.video recorder with token
2. Video stream sent directly to api.video
3. Recording ID linked to interview session
4. Post-interview processing by api.video
5. Playback URL saved to session record

## Performance Considerations

The triangular architecture introduces slightly higher latency compared to pure client-side processing:

- Added network hop through Fly.io: ~100-300ms additional latency
- Benefits outweigh costs: consistent performance, better security
- No API keys exposed to client
- Processing not dependent on client device capabilities

## Security Measures

- API keys only stored server-side
- Account-based authentication for secure sessions
- Tenant isolation for all data
- Encrypted communication between all components

## Implementation Priority

1. Core interview flow with Fly.io integration
2. Candidate account creation system
3. api.video recording integration
4. Candidate-tenant relationship model
5. Post-interview analysis and reporting 