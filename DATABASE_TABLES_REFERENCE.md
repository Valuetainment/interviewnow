# Database Tables Quick Reference

## Table Relationships Overview

```
tenants (root)
├── users (auth integration)
│   └── tenant_users (mapping)
├── companies
│   └── interview_sessions
├── tenant_preferences
├── candidates
│   ├── candidate_profiles (enrichment)
│   ├── interview_sessions
│   ├── candidate_assessments
│   └── interview_invitations
├── positions
│   ├── position_competencies
│   └── interview_sessions
├── competencies
│   └── position_competencies
└── usage_events (billing)

interview_sessions (central)
├── transcript_entries
├── video_segments
├── candidate_assessments
└── interview_invitations
```

## Tables by Category

### 🏢 Organization & Users
- **tenants**: Organizations using the platform
- **users**: User accounts (linked to Supabase Auth)
- **tenant_users**: Maps users to tenants
- **companies**: Companies within a tenant
- **tenant_preferences**: Tenant-specific settings (avatar configs, etc.)

### 👥 Candidates
- **candidates**: Basic candidate information
- **candidate_profiles**: Enriched candidate data from People Data Labs

### 💼 Jobs & Skills
- **positions**: Job positions/roles
- **competencies**: Skills/competencies definitions
- **position_competencies**: Links positions to required competencies with weights

### 🎥 Interviews
- **interview_sessions**: Interview scheduling and WebRTC data
- **transcript_entries**: Interview transcript segments
- **video_segments**: Video recording segments
- **interview_invitations**: Invitation tokens for candidates

### 📊 Analytics & Billing
- **candidate_assessments**: AI-generated interview assessments
- **usage_events**: Usage tracking for billing

## Key Foreign Key Relationships

1. **tenant_id** appears in almost all tables for multi-tenant isolation
2. **interview_sessions** is the central table connecting:
   - candidates
   - positions
   - companies
   - transcripts
   - videos
   - assessments
3. **position_competencies** creates a weighted many-to-many between positions and competencies

## Important Notes

- All tables use UUID primary keys
- Most tables have `created_at` and `updated_at` timestamps
- Row Level Security (RLS) is enabled on all tables
- The `tenant_users` table may be redundant if users only belong to one tenant
- WebRTC fields in `interview_sessions` support real-time video interviews 