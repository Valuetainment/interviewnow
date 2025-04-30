# InterviewAI — Master Product & Technical Spec (Supabase-Native Edition)

# InterviewAI — **Master Product & Technical Spec (Supabase-Native Edition)**

_Version 3.2 · June 2025 ·_

* * *

## 1 · Executive Summary

InterviewAI is a **multi-tenant SaaS** for end-to-end hiring—résumé parsing, AI-driven live interviews, weighted assessments, analytics, and ATS export—running **100 % on Supabase** (Postgres, Auth, Storage, Edge Functions, Realtime).

* * *

## 2 · Core Stack Shift

| Layer | Supabase Component | Notes |
| ---| ---| --- |
| Compute / API | **Edge Functions (Deno)** | All server logic & scheduled jobs |
| Database | **Postgres 16 + pgvector** | Row-level security (RLS) for tenant isolation |
| Object Storage | **Supabase Storage buckets** | Video, audio, résumés (S3-compatible) |
| Events & WS | **Supabase Realtime** | Presence, transcript deltas, audit events |
| Auth | **Supabase Auth** | JWT w/ `tenant_id` & `role` claims |
| Logging | **Logflare + Supabase logs** | Forward to Grafana / Prometheus if needed |
| Secrets | **Supabase** **`secrets set`** | OPENAI\_API\_KEY, PDF\_CO\_API\_KEY, etc. |

_External services kept:_ OpenAI / Anthropic (LLM & STT), [VideoSDK.live](http://VideoSDK.live) (cloud recording), optional mediasoup SFU on [Fly.io/Railway](http://Fly.io/Railway) for custom relay.

* * *

## 3 · High-Level Architecture

```java
pgsql
CopyEdit
 Client (Next.js + shadcn/ui)
        │  WebRTC / Supabase Realtime WS
        ▼
┌────────────────────────────────────────────┐
│          Supabase Project                  │
│  • Postgres 16 + pgvector (RLS)            │
│  • Storage buckets (/videos /resumes …)    │
│  • Auth (email, OIDC, SAML via GoTrue)     │
│  • Edge Functions (Deno):                  │
│      rtc-proxy             resume-pipeline │
│      transcript-processor   assessment-gen │
│      session-manager        video-analyzer │
│  • Realtime channels:                      │
│      interview:<session_id>                │
└───────────────────┬────────────────────────┘
                    │ HTTP / WS
┌───────────────────▼────────────────────────┐
│  External Workers & AI vendors             │
│  • Mediasoup SFU (Fly.io container)        │
│  • OpenAI / Anthropic realtime endpoints   │
│  • PDF.co, People Data Labs                │
└────────────────────────────────────────────┘
```

* * *

## 4 · SaaS Database Schema (unchanged + `tenant_id` on every table)

_See previous schema block; now lives_ **_inside Supabase Postgres_** _with RLS enabled._

– Bucket paths mirror table names

```gherkin
php-template
CopyEdit
storage/
  resumes/<tenant_id>/<candidate_id>.pdf
  videos/<tenant_id>/<session_id>.mp4
  audio/<tenant_id>/<session_id>.webm
```

* * *

## 5 · DevOps & Observability (Supabase-centric)

| Area | Tooling |
| ---| --- |
| CI/CD | GitHub Actions → `supabase db push` + `supabase functions deploy` |
| Migrations | SQL & Prisma or Supabase CLI |
| Jobs / Schedules | Supabase **Scheduled Functions** (cron in edge runtime) |
| Realtime Dashboards | Supabase Realtime → Grafana (optional) |
| Error Tracking | Logflare dashboard + Sentry (frontend) |
| SFU Deploy | [Fly.io](http://Fly.io) `fly deploy` (mediasoup container image) |

* * *

## 6 · Security & Compliance on Supabase

*   **Auth JWT** → Postgres RLS (`current_setting('request.jwt.claim.tenant_id')`).
*   Storage bucket policies restrict path to matching `tenant_id`.
*   All secrets managed via `supabase secrets set/get`.
*   Audit events (`insert/update/delete`) published to `audit_events` Realtime channel → persisted to `audit_log` table.
*   Data-retention jobs run as Scheduled Functions per tenant plan.

* * *

## 7 · Key Workflows (Supabase components highlighted)

| Flow | Supabase Piece | External Piece |
| ---| ---| --- |
| Résumé upload → Storage | `storage.from('resumes').upload()` | — |
| Text extraction | Edge `process-resume` function | [PDF.co](http://PDF.co) API |
| Parse résumé | Edge `parse-resume` function | OpenAI GPT-4o |
| Invite link | Edge `create-interview-invitation` → email via Resend | — |
| Live session | Realtime presence + rtc-proxy Edge func | Mediasoup SFU |
| Transcript | Edge `transcript-processor` stores rows, broadcasts deltas on `interview:<id>` channel | OpenAI STT |
| Assessment | Edge `assessment-generator` (cron if async) | OpenAI |
| Billing usage | Edge `record-usage` (global after-each) → `usage_events` | — |

* * *

## 8 · Non-Functional Targets (unchanged)

Latency < 200 ms • Accuracy ≥ 95 % • 10 k concurrent • 99.9 % uptime • SOC 2 / GDPR

* * *

## 9 · Roadmap (Supabase Milestones)

| Month | Supabase Deliverables |
| ---| --- |
| M1-M2 | Org/tenant schema, RLS policies, Auth roles, Storage buckets |
| M3-M4 | Edge funcs: rtc-proxy, transcript-processor, invite flow |
| M5-M6 | Assessment-generator, behavioural analytics, code sandbox |
| M7-M8 | SSO via Supabase Enterprise Auth, metered billing via `usage_events` |
| M9-M12 | ATS/webhook functions, mobile PWA, SOC 2 audit evidence export |

* * *

## 10 · Acceptance Criteria (GA)

1. **Invite → assessment → ATS export** ≤ 60 min, 0 manual steps.
2. ≥ 200 interviews across 5 tenants with **zero cross-tenant reads** (RLS tests).
3. Transcript accuracy ≥ 95 %, latency ≤ 200 ms via Realtime channel.
4. SOC 2 Type I controls verified using Supabase audit logs.

* * *

### Appendix A – Edge Function Contracts (Supabase Deno)

```awk
ts
CopyEdit
// /functions/assessment-generator/index.tsexport const handler: Handler = async (req, ctx) => {
  const { session_id } = await req.json();

  // 1. fetch transcript + weightsconst { data: session } = await ctx.supabase
     .from('interview_sessions')
     .select('*, position:positions (*, position_competencies!inner (*)), transcript:transcript_entries (*)')
     .eq('id', session_id)
     .single();

  // 2. build promptconst prompt = buildAssessmentPrompt(session);

  // 3. call OpenAIconst completion = await openai.chat.completions.create({...});

  // 4. store resultsawait ctx.supabase.from('candidate_assessments').insert({
     tenant_id: ctx.jwt.claims.tenant_id,
     session_id,
     details: completion.structured,
     weighted_score: calcWeighted(completion.structured, session.position.position_competencies)
  });

  // 5. emit Realtime eventawait ctx.supabase.channel('assessment').send({type:'broadcast', event:'assessment.generated', payload:{session_id}});

  return new Response(JSON.stringify({status:'ok'}), {status:200});
};
```

_(Similar contracts exist for_ _`process-resume`__,_ _`rtc-proxy`__, etc.)_

* * *

**This Supabase-native spec replaces the AWS variant and is ready for engineering kickoff.**

Need ER diagrams, bucket policy JSON, or deployment scripts? Just ask.

2/2

o3

##### You said:

I just need the hybred PRD and Tech roadmap from the combination of the main set of features I shared and then the 2nd document which was the triangular archtecure layerinjg -- no time i.e months years -- this doc will be used in cursor

  

###### ChatGPT said:

# InterviewAI — Hybrid PRD + Technical Roadmap

_(Supabase-native, Triangular Architecture Edition)_

* * *

### 1 · Purpose & Vision

Build a multi-tenant SaaS that shortens technical hiring from résumé to decision in **≤ 1 hour**, delivering live transcripts (< 200 ms), weighted AI assessments, and audit-ready artefacts—without client installs or vendor lock-in.

* * *

### 2 · Success Criteria

| Metric | Target |
| ---| --- |
| Transcript latency | < 200 ms |
| Transcript accuracy | ≥ 95 % |
| Interview reliability | ≥ 99.9 % session completion |
| Cross-tenant data bleed | 0 incidents (RLS enforced) |
| Weighted score variance (UI vs calc) | ≤ 0.1 |

* * *

### 3 · Core Feature Set

| Pillar | Capabilities |
| ---| --- |
| **Live Interview** | HD [VideoSDK.live](http://VideoSDK.live), mediasoup SFU fallback, panel mode, audio-only fallback, real-time STT, AI follow-up prompts |
| **Position Competencies** | ≤ 5 competencies, weights sum to 100 %, drives question routing & scoring |
| **Résumé Pipeline** | [PDF.co](http://PDF.co) text extraction → OpenAI structuring → optional PDL enrichment |
| **Code Sandbox** | In-browser IDE, language tests, AI hints, metrics (pass-rate, time-to-solve) |
| **Behavioural Analytics** | Speech sentiment & clarity, talk-time split, video posture & attention heat-map |
| **Recording & Playback** | Encrypted cloud video, chapter markers, engagement overlay, composite export |
| **Assessment Engine** | Per-competency + behavioural + code scores → weighted aggregate via `calculateWeightedScore` util |
| **Reporting & Integrations** | Dashboards, CSV/api, webhooks, Greenhouse/Lever/Workday, calendar sync |
| **Multi-Tenant & Billing** | Org hierarchy, custom roles, SSO/SAML, white-label, metered seats / minutes / storage |

* * *

### 4 · Non-Functional Requirements

Latency < 200 ms • 10 k concurrent interviews • SOC 2 Type II • GDPR/CCPA • WCAG 2.1 AA

* * *

### 5 · Triangular System Architecture

```pgsql
pgsql
CopyEdit
Client (Next.js + shadcn/ui)
  ├─ WebRTC (mediasoup)          • video / audio
  └─ Supabase Realtime WS        • transcript deltas / presence

Supabase Project (Orchestration Layer)
  • Postgres + pgvector   – RLS tenant isolation
  • Storage buckets       – /resumes /videos /audio
  • Auth (JWT, OIDC/SAML)
  • Edge Functions (Deno)
      · rtc-proxy            · transcript-processor
      · session-manager      · assessment-generator
      · process-resume       · enrich-candidate
      · video-analyzer       · record-usage
  • Realtime channels
      interview:<session_id>  |  audit:<tenant_id>

External Services
  • OpenAI / Anthropic realtime STT & LLM
  • VideoSDK.live cloud recorder
  • PDF.co, People Data Labs
```

* * *

### 6 · SaaS-Ready Schema Highlights

```reasonml
sql
CopyEdit
tenants(id, name, plan_tier)

users(id, tenant_id, role)                      -- Supabase Auth
usage_events(id, tenant_id, event_type, qty)    -- metering

candidates(id, tenant_id, full_name, email, resume_url, resume_analysis jsonb)
candidate_profiles(candidate_id pk, enriched_data jsonb)

positions(id, tenant_id, title, company_id)
competencies(id, name)
position_competencies(position_id, competency_id, weight) -- trigger enforces SUM=100

interview_sessions(id, tenant_id, position_id, candidate_id, start_time, status, video_url)
transcript_entries(id, tenant_id, session_id, speaker, text, start_ms, confidence)
candidate_assessments(id, tenant_id, session_id, details jsonb, weighted_score float)

interview_invitations(token pk, tenant_id, session_id, candidate_id, expires_at, status)
```

_RLS policy template_

```pgsql
sql
CopyEdit
alter table <tbl> enable row level security;
create policy tenant_iso_<tbl> on <tbl>using (tenant_id = current_setting('request.jwt.claim.tenant_id')::uuid);
```

* * *

### 7 · Key Workflows

1. **Position Setup** → weights validated (must equal 100 %).
2. **Résumé Upload** → Storage → `process-resume` → `parse-resume` → optional `enrich-candidate`.
3. **Invitation** → `create-interview-invitation` → secure email token.
4. **Live Session** → rtc-proxy (signalling) + transcript-processor → Realtime WS updates.
5. **Assessment** → `assessment-generator` combines transcript, competency weights, behavioural metrics, code stats → stores JSON + weighted score.
6. **Reporting & Billing** → `record-usage` writes `usage_events`; webhooks push assessments to ATS.

* * *

### 8 · Technical Roadmap (stage-based, no dates)

| Stage | Deliverables |
| ---| --- |
| **Foundation** | Multi-tenant schema & RLS · Auth roles & SSO · Storage buckets · Edge functions: rtc-proxy, transcript-processor |
| **Interview Core** | Live video & STT >95 % accuracy · Recording pipeline · Invitation flow · Position competency UI & validation |
| **Assessment Engine** | Résumé pipeline · assessment-generator · behavioural & code metrics · weighted scoring visualisation |
| **Ecosystem** | Webhooks & ATS connectors · metered billing via `usage_events` · admin dashboards · white-labelling |
| **Compliance & Scale** | SOC 2 evidence (Supabase audit) · data-retention jobs · load-test to 10 k sessions · mobile PWA companion |

* * *

### 9 · Open Items

| Topic | Decision Needed |
| ---| --- |
| AI vendor abstraction layer (OpenAI vs Anthropic fallback) |  |
| Hosted mediasoup vs pure VideoSDK paths |  |
| Code sandbox provider vs in-house WASM VM |  |
| Data warehouse choice for advanced analytics |  |