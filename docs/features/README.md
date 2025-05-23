---
title: Feature Documentation Overview
status: Current
last_updated: 2025-05-22
contributors: [Claude]
related_docs: [/docs/index.md, /docs/architecture/webrtc-entry-point.md]
---

# Feature Documentation

This directory contains detailed documentation for each major feature of the AI Interview Insights Platform.

## Directory Structure

- **[candidates/](candidates/)** - Candidate management and authentication flows
- **[companies/](companies/)** - Company creation and tenant management
- **[interviews/](interviews/)** - Interview execution and WebRTC implementation
- **[positions/](positions/)** - Position creation and management
- **[transcripts/](transcripts/)** - Transcript processing and storage (planned)
- **[assessments/](assessments/)** - Assessment engine and competency evaluation (planned)

## Available Feature Documentation

### 👤 Candidate Management
- [Candidate Authentication Flow](candidates/CANDIDATE_AUTH_FLOW.md) - How candidates authenticate and access interviews
- [Candidate Flow](candidates/CANDIDATE_FLOW.md) - Complete candidate journey through the platform

### 🏢 Company & Tenant Management  
- [Company API Flow](companies/COMPANY_API_FLOW.md) - Company creation and management APIs
- [Company Creation Fix](companies/COMPANY_CREATION_FIX.md) - Resolved issues with company creation
- [Tenant Company Flow](companies/TENANT_COMPANY_FLOW.md) - Multi-tenant company management

### 🎤 Interview System
- [Interview Execution Flow](interviews/INTERVIEW_EXECUTION_FLOW.md) - Complete interview process flow
- **Related**: [WebRTC Entry Point](../architecture/webrtc-entry-point.md) - Technical WebRTC implementation
- **Related**: [VM Isolation Guide](../architecture/vm-isolation-guide.md) - Security model for interviews

### 📝 Position Management
- [Position Creation Flow](positions/POSITION_CREATION_FLOW.md) - How positions are created and configured

## Integration with Core Platform

### Database Integration
All features integrate with the multi-tenant database schema:
- **RLS Policies**: Ensure tenant isolation across all features
- **Audit Logging**: Track all feature operations for compliance
- **Real-time Updates**: Use Supabase real-time subscriptions

### Authentication Integration
Features leverage the platform's authentication system:
- **JWT Validation**: All feature APIs validate session tokens
- **Role-based Access**: Different permissions for different user types
- **Tenant Context**: All operations include tenant validation

### WebRTC Integration
Interview features specifically integrate with the WebRTC system:
- **Session Management**: Interview sessions managed through WebRTC flows
- **Transcript Integration**: Real-time transcripts stored and processed
- **Security**: VM isolation ensures interview privacy

## Feature Development Status

### ✅ Production-Ready
- **Candidate Management**: Authentication and profile management
- **Company Management**: Multi-tenant company creation and management
- **Position Management**: Position creation with competency weighting
- **Interview Sessions**: Database schema and session tracking

### 🔄 In Development
- **Live Interview Execution**: WebRTC implementation ([current status](../architecture/webrtc-entry-point.md#current-implementation-status))
- **Real-time Transcription**: Integration with WebRTC audio streams
- **Assessment Generation**: AI-powered interview assessment

### 📋 Planned
- **Advanced Analytics**: Interview performance metrics and insights
- **Candidate Scoring**: Automated competency-based scoring
- **Integration APIs**: Third-party ATS and HRIS integrations

## Cross-Feature Dependencies

### Interview → Candidate
- Candidates must be authenticated before starting interviews
- Candidate profiles inform interview configuration
- Interview results update candidate assessment scores

### Interview → Position  
- Interviews are configured based on position requirements
- Position competencies determine interview focus areas
- Interview results contribute to position-specific analytics

### Company → All Features
- All features operate within company/tenant context
- Company settings influence feature behavior
- Company admins have oversight across all features

## Security Considerations

### Data Isolation
- **Tenant-level**: All feature data isolated by tenant_id
- **Session-level**: Interview data isolated by session_id  
- **User-level**: Access controls based on user roles

### Compliance
- **GDPR**: Candidate data handling and deletion capabilities
- **SOC 2**: Audit trails and access logging for all features
- **Enterprise**: Role-based access controls and data governance

## Related Documentation

### Architecture
- [Main Documentation Index](../index.md) - Complete platform overview
- [WebRTC Entry Point](../architecture/webrtc-entry-point.md) - Core interview functionality
- [VM Isolation Guide](../architecture/vm-isolation-guide.md) - Security architecture

### Development  
- [Development Overview](../development/README.md) - Developer resources
- [API Endpoints](../development/api-endpoints.md) - Feature API specifications
- [Database Schema](../verified-flows/USER_AUTH_PERMISSIONS_FLOW.md) - Authentication and permissions

### Operations
- [Production Deployment](../guides/deployment/production-deployment-checklist.md) - Feature deployment procedures
- [Testing Procedures](../guides/testing/) - Feature testing approaches

## Change History

- 2025-05-22: Created comprehensive feature overview with cross-references
- 2025-05-22: Added integration details and development status
- 2025-05-22: Included security considerations and compliance notes

---

**Navigation**: [← Documentation Home](../index.md) | [Architecture →](../architecture/) | [Development →](../development/)