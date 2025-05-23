# Documentation Migration Map

This document tracks all file moves and reorganization changes made during the documentation restructuring process.

## Phase 2 File Moves Completed

### Archived Documents (Phase 2.3 ✅)
**Source**: `docs/development/` → **Destination**: `docs/archived/triangular-architecture/`

| Original Path | New Path | Status |
|---------------|----------|--------|
| `docs/development/triangular-architecture-spec.md` | `docs/archived/triangular-architecture/triangular-architecture-spec.md` | ✅ Moved + Deprecation Banner Added |
| `docs/development/triangular-implementation-steps.md` | `docs/archived/triangular-architecture/triangular-implementation-steps.md` | ✅ Moved + Deprecation Banner Added |
| `docs/development/triangular-technical-flow.md` | `docs/archived/triangular-architecture/triangular-technical-flow.md` | ✅ Moved + Deprecation Banner Added |

### Feature Documentation (Phase 2.1 ✅)
**Source**: `docs/verified-flows/` → **Destination**: `docs/features/`

| Original Path | New Path | Status |
|---------------|----------|--------|
| `docs/verified-flows/CANDIDATE_AUTH_FLOW.md` | `docs/features/candidates/CANDIDATE_AUTH_FLOW.md` | ✅ Moved |
| `docs/verified-flows/CANDIDATE_FLOW.md` | `docs/features/candidates/CANDIDATE_FLOW.md` | ✅ Moved |
| `docs/verified-flows/POSITION_CREATION_FLOW.md` | `docs/features/positions/POSITION_CREATION_FLOW.md` | ✅ Moved |
| `docs/verified-flows/INTERVIEW_EXECUTION_FLOW.md` | `docs/features/interviews/INTERVIEW_EXECUTION_FLOW.md` | ✅ Moved |
| `docs/verified-flows/COMPANY_API_FLOW.md` | `docs/features/companies/COMPANY_API_FLOW.md` | ✅ Moved |
| `docs/verified-flows/COMPANY_CREATION_FIX.md` | `docs/features/companies/COMPANY_CREATION_FIX.md` | ✅ Moved |
| `docs/verified-flows/TENANT_COMPANY_FLOW.md` | `docs/features/companies/TENANT_COMPANY_FLOW.md` | ✅ Moved |

### Guide Documentation (Phase 2.2 ✅)
**Source**: `docs/development/` → **Destination**: `docs/guides/`

| Original Path | New Path | Status |
|---------------|----------|--------|
| `docs/development/WEBRTC_PRODUCTION_DEPLOYMENT.md` | `docs/guides/deployment/WEBRTC_PRODUCTION_DEPLOYMENT.md` | ✅ Moved |
| `docs/development/WEBRTC_UI_INTEGRATION.md` | `docs/guides/setup/WEBRTC_UI_INTEGRATION.md` | ✅ Moved |
| `docs/development/AUTOMATED_TESTING.md` | `docs/guides/testing/AUTOMATED_TESTING.md` | ✅ Moved |
| `docs/development/TEST_STRUCTURE.md` | `docs/guides/testing/TEST_STRUCTURE.md` | ✅ Moved |

## Files Remaining in Original Locations

### Development Documentation (Staying)
These files remain in `docs/development/` as they are core development references:

- `README.md` - Development section overview
- `api-endpoints.md` - API reference documentation
- `consolidated-implementation-checklist.md` - Implementation tracking
- `consolidated-integration-guide.md` - Integration procedures
- `consolidated-webrtc-proxy.md` - WebRTC proxy documentation
- `hybrid-architecture-spec.md` - Current architecture specification
- `hybrid-implementation-guide.md` - Implementation guide for hybrid approach
- `hybrid-technical-flow.md` - Technical flow documentation
- `openai-webrtc-integration.md` - OpenAI integration specifics
- `supabase-branching-guide.md` - Database branching procedures
- `typescript-configuration.md` - TypeScript setup documentation

### Verified Flows (Staying)
These files remain in `docs/verified-flows/`:
- `README.md` - Section overview
- `USER_AUTH_PERMISSIONS_FLOW.md` - Authentication flow documentation

## Directory Structure Created

### New Directories Added
```
docs/
├── archived/
│   └── triangular-architecture/     # ✅ Created, populated
├── features/
│   ├── candidates/                  # ✅ Created, populated  
│   ├── companies/                   # ✅ Created, populated
│   ├── interviews/                  # ✅ Created, populated
│   ├── positions/                   # ✅ Created, populated
│   ├── transcripts/                 # ✅ Created, empty
│   └── assessments/                 # ✅ Created, empty
└── guides/
    ├── deployment/                  # ✅ Created, populated
    ├── setup/                       # ✅ Created, populated
    ├── testing/                     # ✅ Created, populated
    ├── administration/              # ✅ Created, empty
    ├── quickstart/                  # ✅ Created, empty
    └── troubleshooting/             # ✅ Created, empty
```

## Required Link Updates

Based on the file moves, these documents need their internal links updated:

### High Priority
1. **CLAUDE.md** - Contains references to moved development guides
2. **README.md** - May reference moved documentation
3. **docs/development/README.md** - May reference moved files

### Medium Priority  
1. **docs/verified-flows/README.md** - Needs updating for moved files
2. **Cross-references within moved documents** - Internal links between features

## Redirect Strategy

### For Moved Files
**Recommendation**: Create placeholder files at original locations with redirect notices.

**Template for redirects**:
```markdown
# Document Moved

This document has been moved to [New Location](new-path.md) as part of our documentation reorganization.

**New Location**: [Document Title](new-path.md)

This page will be removed in a future update. Please update your bookmarks.
```

### For Archived Files
**Status**: ✅ **Already Implemented** - Deprecation banners added to all archived files

## Verification Checklist

### Completed ✅
- [x] All planned file moves executed successfully
- [x] New directory structure created
- [x] Deprecation banners added to archived documents
- [x] Migration map documented
- [x] Link analysis completed

### Pending
- [ ] Update internal links in CLAUDE.md
- [ ] Update internal links in README.md
- [ ] Create README files for new directories
- [ ] Create redirect placeholders for moved files
- [ ] Update cross-references in moved documents

## Impact Assessment

### Minimal Risk
The file moves have minimal risk because:
1. **No hardcoded paths in source code** - All documentation references are in markdown files
2. **Relative path usage** - Most internal links use relative paths
3. **Clear archival process** - Legacy documents properly marked and redirected

### Next Phase Dependencies
Phase 3 (new documentation creation) can proceed independently, but Phase 2.4 (link updates) should be completed first for full consistency.

---

**Last Updated**: 2025-05-22  
**Phase Status**: Phase 1 Complete, Phase 2 (2.1-2.3) Complete, Phase 2.4 In Progress