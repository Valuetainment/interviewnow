# AI Interview Context Enhancement Plan

## Overview
This document outlines the implementation plan for enhancing the AI interviewer's context to provide more targeted, competency-focused interviews based on position requirements, candidate background, and company context.

## Problem Statement
Currently, the AI interviewer receives minimal context:
- Position title and description only
- Candidate name only
- No company context
- No competency weights
- No candidate background/resume

This results in generic interviews that don't properly evaluate the specific competencies required for each position.

## Solution Architecture

### Learning from Lovable AI MVP
The Lovable AI implementation demonstrates a pattern where candidate and position IDs flow through the entire system, maintaining context at every step. We'll adopt this approach while leveraging our existing architecture.

### Key Enhancement: Weight-Based Evaluation

The most critical improvement is making the AI understand and use competency weights:

```
Example for Senior Frontend Developer:
- Technical Knowledge (30%) → ~14 minutes of interview time
- Problem Solving (25%) → ~11 minutes
- Communication (20%) → ~9 minutes
- UI/UX Design (15%) → ~7 minutes
- Teamwork (10%) → ~4 minutes
```

## Implementation Details

### Phase 1: Core Enhancement (2-3 hours)

#### 1. Enhanced Data Fetching in `interview-start` Edge Function

```typescript
// Current query (minimal)
.select('id, status, tenant_id, positions(id, title, description)')

// Enhanced query (comprehensive)
.select(`
  id,
  status,
  tenant_id,
  candidate_id,
  position_id,
  company_id,
  positions(
    id,
    title,
    description,
    position_competencies(
      weight,
      competencies(
        id,
        name,
        description
      )
    )
  ),
  candidates(
    id,
    first_name,
    last_name,
    email,
    skills,
    resume_text,
    resume_analysis,
    experience,
    education,
    candidate_profiles(
      job_title,
      job_company_name,
      linkedin_url,
      skills,
      experience
    )
  ),
  companies(
    id,
    name,
    description,
    industry,
    size
  )
`)
```

#### 2. Weight-Based Instruction Builder

```typescript
function buildEnhancedInstructions(sessionData: any): string {
  // Group competencies by weight tier
  const criticalCompetencies = competencies.filter(pc => pc.weight >= 25);
  const importantCompetencies = competencies.filter(pc => pc.weight >= 15 && pc.weight < 25);
  const supportingCompetencies = competencies.filter(pc => pc.weight < 15);
  
  // Calculate time allocation
  const timeAllocation = competencies.map(pc => 
    `- ${pc.competencies.name}: ~${Math.round((pc.weight / 100) * 45)} minutes`
  );
  
  // Build comprehensive instructions with:
  // - Company context
  // - Position details
  // - Candidate background
  // - Weight-based evaluation framework
  // - Time allocation guidance
  // - Scoring rubric
}
```

### Phase 2: Frontend Enhancements (Optional, 2-3 hours)

1. **Display Context in Pre-Interview Screen**
   - Show competencies with weights
   - Display candidate skills
   - Show company context

2. **Enhanced Session Fetching**
   - Fetch full relationship data
   - Pass explicit IDs to components

3. **Context Provider Pattern**
   - Create InterviewContext for shared state
   - Maintain IDs throughout component tree

### Phase 3: Transcript Enhancement (Optional, 1-2 hours)

1. **Metadata Tracking**
   - Store which competencies were evaluated
   - Track time spent on each competency
   - Link questions to competency areas

## Success Metrics

1. **Weight Adherence**: AI spends time proportional to competency weights (±10%)
2. **Question Relevance**: 80%+ of questions relate to defined competencies
3. **Context Usage**: AI mentions company/position specifics at least 3x per interview
4. **Skill Targeting**: 70%+ of technical questions relate to candidate's stated skills

## Risk Mitigation

1. **Backward Compatibility**: Graceful fallbacks for missing data
2. **Performance**: Single comprehensive query vs multiple queries
3. **Security**: No changes to RLS policies or authentication
4. **Testing**: Gradual rollout with monitoring

## Quick Win Implementation

For immediate improvement (1 hour):
1. Update only the `interview-start` edge function
2. Deploy with `npx supabase functions deploy interview-start`
3. Test with existing frontend - no UI changes needed
4. Immediate improvement in interview quality

## Architecture Alignment

This enhancement:
- ✅ Uses existing database schema
- ✅ Follows established patterns
- ✅ Maintains security model
- ✅ No breaking changes
- ✅ Progressive enhancement approach

## Next Steps

1. Implement Phase 1 (Core Enhancement)
2. Test with various weight distributions
3. Monitor AI behavior and adjust prompts
4. Consider frontend enhancements based on results
5. Document learnings for future improvements 