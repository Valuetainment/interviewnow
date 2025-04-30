# AI Interview Insights Platform - Project Brief

## Overview
The AI Interview Insights Platform is a multi-tenant SaaS application for end-to-end hiring processes. It streamlines resume parsing, conducts AI-driven live interviews, provides weighted assessments, analytics, and ATS export capabilities - all running on Supabase infrastructure.

## Core Business Goals
- Shorten technical hiring from resume to decision in ≤ 1 hour
- Deliver live transcripts with < 200ms latency and ≥ 95% accuracy
- Provide weighted AI assessments and audit-ready artifacts
- Eliminate client installations and vendor lock-in
- Support multi-tenant organizations with proper data isolation

## Key Metrics for Success
- Transcript latency < 200ms
- Transcript accuracy ≥ 95%
- Interview reliability ≥ 99.9% session completion
- Zero cross-tenant data breaches (enforced by Row-Level Security)
- Weighted score variance ≤ 0.1 (UI vs. calculation)

## Technical Foundation
- Built on Supabase components (Postgres, Auth, Storage, Edge Functions, Realtime)
- Next.js frontend with shadcn/ui components
- JWT-based authentication with tenant isolation
- WebRTC for real-time video/audio communication
- OpenAI/Anthropic for AI processing

## Project Scope
1. Resume parsing and candidate profiling
2. Position and competency management with weighted scoring
3. Live interview system with real-time transcription
4. Assessment engine with weighted scoring
5. Recording and playback capabilities
6. Reporting and ATS integrations
7. Multi-tenant support with billing

## Non-Functional Requirements
- Support for 10,000+ concurrent interviews
- SOC 2 Type II compliance
- GDPR/CCPA compliance
- WCAG 2.1 AA accessibility standards 