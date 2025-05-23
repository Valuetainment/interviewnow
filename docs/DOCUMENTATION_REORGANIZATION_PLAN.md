# Documentation Reorganization Plan

This document outlines a comprehensive plan for reorganizing the AI Interview Insights Platform documentation to improve clarity, accuracy, and maintainability.

## Objectives

- Organize documentation into a clear, logical structure
- Archive or update legacy documentation
- Ensure all documentation reflects the current architecture
- Implement proper cross-referencing and navigation
- Create standardized document formats and templates
- Improve documentation findability and usefulness

## Phase 1: Assessment and Planning

- [ ] **1.1 Inventory Current Documentation**
  - [ ] List all documentation files in `/docs`, `memory-bank`, and other locations
  - [ ] Categorize each document (Current, Legacy, Reference, Tutorial, etc.)
  - [ ] Identify ownership and last-modified dates
  - [ ] Record current document locations for transition mapping

- [ ] **1.2 Analyze Documentation Links**
  - [ ] Run link extraction to identify all internal documentation links
  - [ ] Check for documentation references in code comments
  - [ ] Identify documentation links in UI components
  - [ ] Create a link map showing document interconnections

- [ ] **1.3 Define New Documentation Structure**
  - [ ] Design folder hierarchy based on logical groupings
  - [ ] Create naming conventions for files and folders
  - [ ] Define metadata format for document headers
  - [ ] Create templates for each document type

- [ ] **1.4 Create Documentation Map**
  - [ ] Map each existing document to its new location
  - [ ] Identify documents to be archived
  - [ ] Plan redirects or placeholders for moved documents
  - [ ] Document merge strategies for overlapping content

## Phase 2: Content Migration

- [ ] **2.1 Create New Directory Structure**
  - [ ] Set up main directory categories
  - [ ] Create index documents for each section
  - [ ] Add README files with section overviews
  - [ ] Establish archival directory

- [ ] **2.2 Update Current Documentation**
  - [ ] Revise README.md with current project status
  - [ ] Update WebRTC testing guide for hybrid architecture
  - [ ] Create new comprehensive WebRTC documentation
  - [ ] Update architectural diagrams for current approach
  - [ ] Document reusable React components with examples
  - [ ] Create visual component library documentation

- [ ] **2.3 Handle Legacy Content**
  - [ ] Create `docs/archived` directory
  - [ ] Move legacy architecture documents to archive:
    - [ ] `/docs/development/triangular-architecture-spec.md`
    - [ ] `/docs/development/triangular-implementation-steps.md`
    - [ ] `/docs/development/triangular-technical-flow.md`
    - [ ] Original SDP proxy documentation
  - [ ] Add "DEPRECATED" banners to archived documents
  - [ ] Create legacy reference guide explaining historical approaches

- [ ] **2.4 Update Document Links**
  - [ ] Fix internal links in updated documents
  - [ ] Create redirection notices in moved documents
  - [ ] Update references in code comments if any
  - [ ] Verify all links are functioning

## Phase 3: New Documentation Creation

- [ ] **3.1 Create Core Documentation**
  - [ ] WebRTC Entry Point Document (main reference)
  - [ ] VM Isolation Architecture Guide
  - [ ] Hybrid Architecture Implementation Details
  - [ ] TestInterview Component Guide

- [ ] **3.2 Develop New Reference Material**
  - [ ] Edge Function Version Reference
  - [ ] WebRTC Message Format Specification
  - [ ] VM Security Model Documentation
  - [ ] RLS Policy Reference Guide

- [ ] **3.3 Create Operational Guides**
  - [ ] Production Deployment Checklist
  - [ ] WebRTC Troubleshooting Guide
  - [ ] Interview Session Management Guide
  - [ ] Performance Monitoring Guide
  - [ ] Common Issues Resolution Guide
  - [ ] Quickstart Guide for New Developers

- [ ] **3.4 Develop User-Facing Documentation**
  - [ ] End-User Interview Guide
  - [ ] Browser Compatibility Information
  - [ ] Common User Issues FAQ
  - [ ] Visual Interface Guide

## Phase 4: Verification and Organization

- [ ] **4.1 Implement Documentation Navigation**
  - [ ] Create main documentation index
  - [ ] Add cross-references between related documents
  - [ ] Implement breadcrumb navigation
  - [ ] Add search functionality if possible

- [ ] **4.2 Verify Functionality**
  - [ ] Test application after documentation changes
  - [ ] Run the test suite
  - [ ] Check build process
  - [ ] Verify no console errors related to missing files

- [ ] **4.3 Conduct Documentation Review**
  - [ ] Verify technical accuracy of updated documents
  - [ ] Check consistency in terminology and formatting
  - [ ] Ensure all diagrams are current
  - [ ] Validate cross-document references

- [ ] **4.4 Final Organization**
  - [ ] Add version and last-updated information to all docs
  - [ ] Standardize document headers
  - [ ] Update documentation-related scripts
  - [ ] Create documentation maintenance guide

## Phase 5: Publishing and Maintenance

- [ ] **5.1 Implement Document Versioning**
  - [ ] Add version tags to documentation
  - [ ] Create change log for documentation
  - [ ] Implement "Last Updated" timestamps
  - [ ] Document version history procedure

- [ ] **5.2 Establish Documentation CI/CD**
  - [ ] Add link checking to CI process
  - [ ] Implement markdown linting
  - [ ] Add automatic table of contents generation
  - [ ] Set up documentation preview environment

- [ ] **5.3 Create Documentation Contribution Guide**
  - [ ] Document process for updating documentation
  - [ ] Create templates for new documentation
  - [ ] Define documentation review process
  - [ ] Establish documentation ownership model

- [ ] **5.4 Publish and Announce**
  - [ ] Commit all documentation changes
  - [ ] Update project README with new documentation structure
  - [ ] Notify team of documentation reorganization
  - [ ] Create walk-through guide for finding information

## Proposed Directory Structure

```
docs/
├── index.md                     # Main documentation index
│
├── architecture/                # System architecture docs
│   ├── overview.md
│   ├── database-schema.md
│   ├── multi-tenant-model.md
│   ├── webrtc-hybrid-architecture.md
│   └── vm-isolation.md
│
├── features/                    # Feature-specific documentation
│   ├── candidates/
│   ├── positions/
│   ├── interviews/
│   ├── transcripts/
│   └── assessments/
│
├── guides/                      # Step-by-step guides
│   ├── quickstart/              # Fast path for new developers
│   ├── setup/
│   ├── deployment/
│   ├── testing/
│   ├── troubleshooting/         # Common issues and solutions
│   └── administration/
│
├── api/                         # API documentation
│   ├── edge-functions/
│   ├── database-schema/
│   ├── webrtc-endpoints/
│   └── client-sdks/
│
├── development/                 # For developers
│   ├── onboarding.md
│   ├── environment-setup.md
│   ├── coding-standards.md
│   ├── branching-strategy.md
│   └── components/              # Reusable React components
│
├── reference/                   # Technical references
│   ├── authentication-flow.md
│   ├── webrtc-message-format.md
│   ├── error-codes.md
│   └── configuration-options.md
│
└── archived/                    # Legacy documentation
    ├── triangular-architecture/
    ├── sdp-proxy-original/
    └── legacy-index.md
```

## Key Documents to Create or Update

1. **New Main Documentation**
   - [ ] WebRTC Hybrid Architecture Guide
   - [ ] VM Isolation Implementation Guide
   - [ ] Interview Session Flow Documentation
   - [ ] TestInterview Component Guide
   - [ ] Production Deployment Guide
   - [ ] Troubleshooting Guide
   - [ ] RLS Policy Reference

2. **Legacy Documents to Archive**
   - [ ] Original SDP Proxy Architecture Documentation
   - [ ] Triangle Architecture Specification
   - [ ] Triangle Implementation Steps
   - [ ] Triangle Technical Flow
   - [ ] Original WebRTC Testing Guide

3. **Essential References to Update**
   - [ ] README.md
   - [ ] WEBRTC_TESTING.md
   - [ ] Tech Stack Documentation
   - [ ] Core Features List
   - [ ] Current Status Section
   - [ ] Development Setup Guide
   - [ ] Component Documentation
   - [ ] Troubleshooting Guide
   - [ ] Quickstart Guide

## Document Template

For consistency, all new and updated documents should follow this template:

```markdown
---
title: Document Title
status: [Current|Draft|Deprecated]
last_updated: YYYY-MM-DD
contributors: [Name1, Name2]
related_docs: [/path/to/related.md]
---

# Document Title

## Overview
Brief description of what this document covers.

## Contents
- [Section 1](#section-1)
- [Section 2](#section-2)
- [Section 3](#section-3)

## Section 1
Content...

## Section 2
Content...

## Section 3
Content...

## Related Documentation
- [Document 1](/path/to/doc1.md)
- [Document 2](/path/to/doc2.md)

## Change History
- YYYY-MM-DD: Initial version
- YYYY-MM-DD: Updated section X
```

## Link Management

When moving or archiving documents:

1. **For archived documents:**
   - Add a prominent banner at the top:
   ```markdown
   > **DEPRECATED**: This document describes the legacy approach which has been replaced.
   > See [Current Documentation](/path/to/current.md) for the current implementation.
   ```

2. **For redirected documents:**
   - Leave a placeholder file at the original location:
   ```markdown
   # Document Moved
   
   This document has been moved to [New Location](/docs/current/new-file.md) as part of 
   our documentation reorganization.
   
   You will be automatically redirected in 5 seconds.
   
   <meta http-equiv="refresh" content="5;url=/docs/current/new-file.md" />
   ```

## Implementation Timeline

- **Week 1**: Phases 1-2 (Assessment, Planning, and Migration)
- **Week 2**: Phase 3 (New Documentation Creation)
- **Week 3**: Phases 4-5 (Verification, Organization, and Publishing)

## Success Criteria

- All documentation accurately reflects the current architecture
- No broken links in documentation
- Legacy approaches are clearly marked as such
- Documentation is logically organized and easy to navigate
- Standard format is applied consistently across all documents
- Application functionality is unaffected by documentation changes