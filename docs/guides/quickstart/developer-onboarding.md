---
title: Developer Onboarding Guide
status: Current
last_updated: 2025-05-22
contributors: [Claude]
related_docs: [/docs/index.md, /docs/development/README.md, /CLAUDE.md]
---

# Developer Onboarding Guide

Welcome to the AI Interview Insights Platform! This guide serves both AI coders and human developers with different paths through the same comprehensive content.

## 🤖 For AI Coders
**Fast track**: Read items **1, 2, 6, 7** for immediate technical context. Skip environment setup unless doing code execution.
- Focus on: Architecture, current status, API specs, security model
- Skip: Environment setup, workflow explanations, team processes

## 👨‍💻 For Human Developers  
**Complete onboarding**: Follow the full sequence including setup and workflow sections.
- Focus on: Complete understanding, environment setup, team integration
- Follow: All phases in order for comprehensive onboarding

---

## 🎯 Reading Order & Content

### **Phase 1: Essential Context** ⏱️ *30 minutes*

**Goal**: Understand what the platform does and its current state

1. **[📖 Main Documentation Index](../../index.md)**
   - **Why first**: Role-based navigation, highlights critical issues
   - **What you'll learn**: Platform overview, architecture, current status
   - **Focus on**: Quick Start section, Emergency Procedures, your role section
   - **AI focus**: Current status, architecture overview
   - **Human focus**: Role-based navigation, getting started section

2. **[🎯 WebRTC Entry Point](../../architecture/webrtc-entry-point.md)**
   - **Why second**: Core system understanding, current implementation status
   - **What you'll learn**: Hybrid architecture, what's working vs. blocked
   - **Focus on**: Current Implementation Status, Getting Started section
   - **AI focus**: Architecture overview, technical status
   - **Human focus**: Getting started, troubleshooting sections

**✅ After Phase 1**: You understand the platform and know about the critical SDP proxy issue

### **Phase 2: Development Setup** ⏱️ *45 minutes* 
*Human developers: Complete this phase | AI coders: Skip to Phase 3*

**Goal**: Get your development environment working and understand the codebase

3. **[🛠️ Development Overview](../../development/README.md)**
   - **Why third**: Development environment setup and workflow
   - **What you'll learn**: Tech stack, setup procedures, development patterns
   - **Action items**: Follow environment setup steps

4. **[📝 Development Log (CLAUDE.md)](../../../CLAUDE.md)**
   - **Why fourth**: Recent development context and current priorities
   - **What you'll learn**: Current work, known issues, commands to run
   - **Focus on**: Commands to Run section, Current Task section, Test URLs

5. **[🧪 Testing Structure](../testing/TEST_STRUCTURE.md)**
   - **Why fifth**: How to run tests and add new ones
   - **What you'll learn**: Testing patterns, test organization, how to verify changes
   - **Action items**: Run the test suite to verify your setup

**✅ After Phase 2**: You have a working dev environment and understand current priorities

### **Phase 3: Technical Deep Dive** ⏱️ *As needed*
*AI coders: Start here after Phase 1 | Human developers: Use as reference*

**Goal**: Understand technical details for the features you'll work on

6. **[🏗️ Hybrid Implementation Details](../../architecture/hybrid-implementation-details.md)** ⭐ **AI Priority**
   - **When to read**: Working on WebRTC, hooks, or API features  
   - **What you'll learn**: Technical specifications, API details, implementation patterns
   - **AI focus**: API specifications, data flow, implementation patterns
   - **Human focus**: Code examples, integration guidance
   - **Best for**: Frontend developers, full-stack developers

7. **[🔒 VM Isolation Guide](../../architecture/vm-isolation-guide.md)** ⭐ **AI Priority**
   - **When to read**: Working on security, infrastructure, or deployment features
   - **What you'll learn**: Security model, VM isolation, operational procedures
   - **AI focus**: Technical security specifications, constraints
   - **Human focus**: Operational procedures, compliance requirements
   - **Best for**: DevOps, security-focused developers, infrastructure work

**✅ After Phase 3**: You have deep technical context for your specific work area

## 🤖 AI Coder Quick Reference

### **Essential Reading** (Skip the rest)
1. [Main Documentation Index](../../index.md) - Current status
2. [WebRTC Entry Point](../../architecture/webrtc-entry-point.md) - Architecture overview
3. [Implementation Details](../../architecture/hybrid-implementation-details.md) - API specs & patterns
4. [VM Isolation Guide](../../architecture/vm-isolation-guide.md) - Security constraints

### **Key Technical Contexts**
- **Architecture**: Hybrid WebRTC with VM isolation per session
- **Critical Issue**: SDP proxy suspended, blocks WebRTC interviews
- **Tech Stack**: React/TypeScript + Supabase + Fly.io + OpenAI
- **Current Priority**: WebRTC production deployment completion

### **Code Patterns**
- **WebRTC**: Hooks-based architecture in `src/hooks/webrtc/`
- **State Management**: React Context + hooks patterns
- **Testing**: Vitest + React Testing Library
- **Security**: JWT validation + RLS policies + tenant isolation

## 🛠️ Human Developer Environment Setup

### Prerequisites
- Node.js 18+ installed
- Git configured
- Code editor with TypeScript support

### Quick Setup
```bash
# 1. Clone and install
git clone <repository-url>
cd ai-interview-insights-platform
npm install

# 2. Start development server
npm run dev

# 3. Verify build works
npm run build

# 4. Run tests to verify setup
npm test
```

### Environment Configuration
- Copy `.env.example` to `.env.local` (if exists)
- Configure required environment variables (see Development Guide)
- Verify local development server runs at http://localhost:8080

## 🚨 Critical Platform Issues (Must Know for Both)

### **SDP Proxy Suspended** ⚠️
- **Impact**: All WebRTC interviews are currently blocked
- **Status**: Production infrastructure suspended, needs restart
- **Who can fix**: System administrators with Fly.io access
- **Restart command**: `fly apps start interview-sdp-proxy`

### **Current Architecture Status**
- ✅ **Working**: Resume processing, candidate management, position creation
- ⚠️ **Blocked**: Live WebRTC interviews (due to SDP proxy)
- 🔄 **In Progress**: Production deployment of WebRTC system

## 🎯 Your First Contribution

### **AI Coders**: 
- Review the codebase patterns in `src/hooks/webrtc/`
- Understand the hybrid architecture constraints
- Check current implementation against specifications

### **Human Developers**:
1. **Test the WebRTC functionality**:
   - Visit: http://localhost:8080/simple-webrtc-test  
   - **Expected**: Connection issues due to suspended SDP proxy
   - **This is normal**: Documented in WebRTC Entry Point guide

2. **Explore the codebase**:
   - `src/hooks/webrtc/` - WebRTC implementation (recently refactored)
   - `src/pages/` - Main application pages
   - `docs/` - All platform documentation

## 🤝 Getting Help

### For Quick Questions
- **Architecture**: [WebRTC Entry Point](../../architecture/webrtc-entry-point.md)
- **Development Setup**: [Development Guide](../../development/README.md)
- **Testing Issues**: [Testing Structure](../testing/TEST_STRUCTURE.md)

### For Technical Details  
- **Implementation Specs**: [Hybrid Implementation Details](../../architecture/hybrid-implementation-details.md)
- **Security Model**: [VM Isolation Guide](../../architecture/vm-isolation-guide.md)
- **Production Issues**: [Production Deployment Checklist](../deployment/production-deployment-checklist.md)

### Navigation Strategy
- **Use the [main documentation index](../../index.md)** - organized by role and task
- **Search by keywords** - documentation is well cross-referenced
- **Follow the breadcrumbs** - each document links to related documentation

## 📋 Key Knowledge Areas

### **AI Coders** - Reference Points
- **Context**: Phase 1 documents provide platform overview and current status
- **Technical Specs**: Phase 3 documents contain implementation details and constraints
- **Critical Issue**: SDP proxy suspension blocks WebRTC interviews
- **Architecture**: Hybrid WebRTC with per-session VM isolation

### **Human Developers** - Onboarding Milestones
- **Setup Complete**: Development environment working and tests passing
- **Context Acquired**: Understanding of platform, current issues, and priorities
- **Ready to Contribute**: Know your focus area and where to find help
- **Reference Skills**: Can navigate documentation independently

## 🎉 Welcome!

You're now ready to contribute effectively. The documentation supports you throughout development - use the [main index](../../index.md) as your navigation hub.

**Remember**: The platform is sophisticated and well-architected. Most core functionality works perfectly - the main focus is completing WebRTC production deployment.

---

**Quick Links**:
- [📖 Main Documentation](../../index.md) | [🎯 WebRTC Entry Point](../../architecture/webrtc-entry-point.md) | [🛠️ Development Guide](../../development/README.md)

**Navigation**: [← Guides Home](../README.md) | [← Documentation Home](../../index.md)