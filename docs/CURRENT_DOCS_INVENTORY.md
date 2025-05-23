# Current Documentation Inventory (Excluding Memory Bank)

## Root Level Documentation Files

| Document | Status | Category | Action |
|----------|--------|----------|--------|
| README.md | Current | Main | Update for current architecture |
| WEBRTC_TESTING.md | Current | Guide | Update for hybrid architecture only |
| TESTING.md | Current | Guide | Keep |
| EDGE_FUNCTION_TESTING.md | Current | Guide | Keep |
| CRITICAL_PRODUCTION.md | Current | Operations | Keep |

## docs/ Directory Analysis

### Current Structure vs. Proposed Structure

**CURRENT:**
```
docs/
├── architecture/
├── development/
├── verified-flows/
├── project-history/
├── infrastructure/
├── operations/
└── api/
```

**PROPOSED:**
```
docs/
├── architecture/
├── features/
├── guides/
├── api/
├── development/
├── reference/
└── archived/
```

## Documents by Category

### ✅ CURRENT - Keep with Updates
- docs/architecture/VM_ISOLATION.md
- docs/architecture/hybrid-webrtc-architecture.md  
- docs/development/hybrid-architecture-spec.md
- docs/development/WEBRTC_PRODUCTION_DEPLOYMENT.md
- docs/verified-flows/* (all current flows)

### 📦 LEGACY - Move to Archive
- docs/development/triangular-architecture-spec.md
- docs/development/triangular-implementation-steps.md
- docs/development/triangular-technical-flow.md

### 🔄 CONSOLIDATION NEEDED
- docs/architecture/hybrid-webrtc-architecture.md + consolidated-hybrid-architecture.md

### 📁 REORGANIZE BY FEATURE
- docs/verified-flows/ → docs/features/
  - CANDIDATE_* → features/candidates/
  - POSITION_* → features/positions/
  - INTERVIEW_* → features/interviews/
  - COMPANY_* → features/companies/

## Immediate Actions (Phase 1)

1. Create new directory structure
2. Move legacy documents to archived/
3. Reorganize verified-flows by feature
4. Update README.md and WEBRTC_TESTING.md
5. Create redirects for moved documents