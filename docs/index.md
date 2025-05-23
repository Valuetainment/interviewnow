---
title: AI Interview Insights Platform Documentation
status: Current
last_updated: 2025-05-22
contributors: [Claude]
---

# AI Interview Insights Platform Documentation

Welcome to the comprehensive documentation for the AI Interview Insights Platform - a multi-tenant SaaS platform for AI-driven hiring processes.

## 🚀 Quick Start

**New to the Platform?** Start here:
- **[👨‍💻 Developer Onboarding Guide](guides/quickstart/developer-onboarding.md)** - **🎯 Start here** for AI coders & human developers
- [WebRTC Entry Point Guide](architecture/webrtc-entry-point.md) - Main implementation overview
- [Production Deployment Checklist](guides/deployment/production-deployment-checklist.md) - For system administrators

**Critical Production Issue**: ⚠️ [SDP Proxy is currently suspended](architecture/webrtc-entry-point.md#current-implementation-status) - requires immediate restart for WebRTC functionality.

## 📋 Documentation Structure

### 🏗️ Architecture Documentation
Core system architecture and design decisions

- **[WebRTC Entry Point](architecture/webrtc-entry-point.md)** - 🎯 **START HERE** - Main WebRTC implementation guide
- **[Hybrid WebRTC Architecture](architecture/hybrid-webrtc-architecture.md)** - High-level architecture overview
- **[VM Isolation Guide](architecture/vm-isolation-guide.md)** - Security model and per-session isolation
- **[Hybrid Implementation Details](architecture/hybrid-implementation-details.md)** - Technical specifications and API details
- **[Architecture Comparison](architecture/ARCHITECTURE_COMPARISON.md)** - Historical reference (legacy approaches)
- **[VM Isolation Spec](architecture/VM_ISOLATION.md)** - Technical VM isolation specifications

### 🎯 Feature Documentation
Detailed documentation for each platform feature

#### Candidates
- [Candidate Authentication Flow](features/candidates/CANDIDATE_AUTH_FLOW.md)
- [Candidate Flow](features/candidates/CANDIDATE_FLOW.md)

#### Companies
- [Company API Flow](features/companies/COMPANY_API_FLOW.md)
- [Company Creation Fix](features/companies/COMPANY_CREATION_FIX.md)
- [Tenant Company Flow](features/companies/TENANT_COMPANY_FLOW.md)

#### Interviews
- [Interview Execution Flow](features/interviews/INTERVIEW_EXECUTION_FLOW.md)

#### Positions
- [Position Creation Flow](features/positions/POSITION_CREATION_FLOW.md)

### 📖 User Guides
Step-by-step guides for different aspects of the platform

#### Setup & Configuration
- [WebRTC UI Integration](guides/setup/WEBRTC_UI_INTEGRATION.md) - Integrating WebRTC components

#### Deployment
- **[Production Deployment Checklist](guides/deployment/production-deployment-checklist.md)** - 🎯 **CRITICAL** - Complete deployment verification
- [WebRTC Production Deployment](guides/deployment/WEBRTC_PRODUCTION_DEPLOYMENT.md) - Production deployment procedures

#### Testing
- [Automated Testing](guides/testing/AUTOMATED_TESTING.md) - Automated testing setup and procedures
- [Test Structure](guides/testing/TEST_STRUCTURE.md) - Organization of test files and procedures

### 🛠️ Development Documentation
Resources for developers working on the platform

- **[Development Overview](development/README.md)** - Development section overview
- [API Endpoints](development/api-endpoints.md) - REST API documentation
- [Hybrid Architecture Spec](development/hybrid-architecture-spec.md) - Current architecture specification
- [Hybrid Implementation Guide](development/hybrid-implementation-guide.md) - Step-by-step implementation
- [OpenAI WebRTC Integration](development/openai-webrtc-integration.md) - OpenAI-specific integration details
- [Supabase Branching Guide](development/supabase-branching-guide.md) - Database branching procedures
- [TypeScript Configuration](development/typescript-configuration.md) - TypeScript setup

### 🏢 Infrastructure Documentation

- [Deployment Security Improvements](infrastructure/DEPLOYMENT_SECURITY_IMPROVEMENTS.md)
- [Infrastructure Overview](infrastructure/README.md)

### 📚 Reference Documentation
Technical references and specifications

- [User Authentication & Permissions Flow](verified-flows/USER_AUTH_PERMISSIONS_FLOW.md)
- [Verified Flows Overview](verified-flows/README.md)

### 📦 API Documentation

- [API Overview](api/README.md)

### 🗃️ Archived Documentation
Legacy documentation maintained for historical reference

- [Triangular Architecture](archived/triangular-architecture/) - Legacy architecture approach (deprecated)

## 🔧 Current Development Status

### ✅ Production-Ready Components
- Resume processing and AI analysis
- Candidate profile management
- Position creation and management
- Company and tenant management
- Database schema and RLS policies
- WebRTC client implementation (hooks-based)

### ⚠️ Critical Issues
- **SDP Proxy Suspended**: WebRTC interviews currently blocked ([restart instructions](architecture/webrtc-entry-point.md#for-system-administrators))
- **VM Isolation**: Implementation complete, needs production verification
- **Edge Functions**: Latest versions need deployment verification

### 🔄 In Progress
- Production WebRTC deployment
- End-to-end interview flow testing
- Performance monitoring and alerting

## 🚨 Emergency Procedures

### Critical WebRTC Issues
1. **SDP Proxy Down**: 
   ```bash
   fly apps start interview-sdp-proxy
   fly apps status interview-sdp-proxy
   ```

2. **Edge Function Failures**:
   ```bash
   supabase functions deploy interview-start
   supabase functions deploy transcript-processor
   ```

3. **Database Issues**: Check [RLS Policy Reference](features/) for tenant isolation problems

## 🔍 Finding Information

### By Role

**System Administrators**:
- [Production Deployment Checklist](guides/deployment/production-deployment-checklist.md)
- [WebRTC Entry Point - For Administrators](architecture/webrtc-entry-point.md#for-system-administrators)
- [VM Isolation Operations](architecture/vm-isolation-guide.md#operational-procedures)

**Developers**:
- [WebRTC Entry Point - For Developers](architecture/webrtc-entry-point.md#for-developers)
- [Hybrid Implementation Details](architecture/hybrid-implementation-details.md)
- [Development Documentation](development/)

**Product/Business Users**:
- [Feature Documentation](features/)
- [Current Development Status](#current-development-status)

### By Task

**Setting Up Development Environment**:
1. [Development Overview](development/README.md)
2. [WebRTC Entry Point - Getting Started](architecture/webrtc-entry-point.md#getting-started)
3. [Testing Procedures](guides/testing/)

**Deploying to Production**:
1. [Production Deployment Checklist](guides/deployment/production-deployment-checklist.md) ⭐ **Start Here**
2. [WebRTC Production Deployment](guides/deployment/WEBRTC_PRODUCTION_DEPLOYMENT.md)
3. [VM Isolation Guide](architecture/vm-isolation-guide.md)

**Troubleshooting Issues**:
1. [WebRTC Entry Point - Troubleshooting](architecture/webrtc-entry-point.md#troubleshooting)
2. [Current Development Status](#current-development-status)
3. [Emergency Procedures](#emergency-procedures)

**Understanding Architecture**:
1. [WebRTC Entry Point](architecture/webrtc-entry-point.md) ⭐ **Start Here**
2. [Hybrid WebRTC Architecture](architecture/hybrid-webrtc-architecture.md)
3. [VM Isolation Guide](architecture/vm-isolation-guide.md)

## 📊 Project Context

### Technology Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **WebRTC**: Hybrid architecture with OpenAI integration
- **Infrastructure**: Fly.io for VM isolation and SDP proxy
- **Real-time**: WebRTC + WebSockets for interview audio
- **Database**: Multi-tenant PostgreSQL with RLS policies

### Key Features
- Multi-tenant SaaS architecture with complete data isolation
- AI-powered resume analysis and candidate enrichment
- Real-time WebRTC interviews with AI interviewers
- Live transcription and assessment generation
- Per-session VM isolation for maximum security
- Comprehensive testing framework with hooks architecture

## 📋 Documentation Maintenance

### Contributing to Documentation
- Follow the [document template](DOCUMENTATION_REORGANIZATION_PLAN.md#document-template) for consistency
- Update the `last_updated` field when making changes
- Add yourself to the `contributors` list
- Ensure all internal links use relative paths

### Reporting Issues
- Documentation bugs: Create issue with "docs" label
- Missing documentation: Reference this index for gaps
- Broken links: Check [Link Analysis](DOCUMENTATION_LINK_ANALYSIS.md) first

## 🔗 External Resources

- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime)
- [Supabase Documentation](https://supabase.com/docs)
- [Fly.io Documentation](https://fly.io/docs/)
- [WebRTC Standards](https://webrtc.org/getting-started/overview)

---

**Last Updated**: 2025-05-22  
**Version**: 1.0 (Post-Documentation Reorganization)  
**Maintained By**: Development Team

> 💡 **Tip**: Use your browser's search function (Ctrl+F / Cmd+F) to quickly find specific topics in this index.