# Interview Prepper Architecture

## Overview
The interview-prepper edge function is a sophisticated pre-interview analysis system that enhances the AI interviewer's ability to conduct targeted, personalized interviews.

## Architecture Flow

```
Interview Start Request
    ↓
interview-start edge function
    ↓
Fetches comprehensive session data
    ↓
Calls interview-prepper with IDs
    ↓
interview-prepper fetches:
  - Candidate data (resume, skills, experience)
  - Position data (title, competencies, weights)
  - Company data (name, culture, values)
    ↓
GPT-4o-mini analyzes fit
    ↓
Returns comprehensive strategy
    ↓
Strategy integrated into AI instructions
    ↓
AI conducts targeted interview
```

## Key Components

### 1. Interview-Prepper Edge Function

**Purpose**: Pre-analyze candidates to generate targeted interview strategies

**Input Parameters**:
- `candidate_id`: UUID of the candidate
- `position_id`: UUID of the position
- `company_id`: UUID of the company
- `tenant_id`: UUID for multi-tenant isolation

**Output Structure**:
```typescript
{
  success: boolean;
  analysis?: {
    candidate_summary: string;
    skill_matches: string[];
    skill_gaps: string[];
    experience_highlights: string[];
    red_flags: string[];
    green_flags: string[];
    competency_evidence: {
      [competency_name]: {
        evidence_level: 'strong' | 'moderate' | 'limited' | 'none';
        specific_examples: string[];
        suggested_questions: string[];
        estimated_score: number;
      };
    };
    interview_strategy: {
      focus_areas: string[];
      skip_areas: string[];
      time_allocation: { [competency]: percentage };
      opening_approach: string;
      must_ask_questions: string[];
      conversation_bridges: string[];
    };
    cultural_fit_indicators: {
      alignment_factors: string[];
      potential_concerns: string[];
      values_match_score: number;
    };
    overall_fit_score: number;
    key_talking_points: string[];
  };
}
```

### 2. Integration with Interview-Start

The `interview-start` edge function:
1. Fetches complete session data with joins
2. Calls interview-prepper for analysis
3. Receives comprehensive strategy
4. Builds enhanced AI instructions using `buildEnhancedInstructions()`
5. Passes instructions to OpenAI configuration

### 3. AI Instruction Enhancement

The `buildEnhancedInstructions()` function now incorporates:
- Pre-interview analysis results
- Personalized greeting with candidate's name
- Company and position context
- Competency weights for time allocation
- Must-ask questions from analysis
- Focus areas and skill gaps
- Conversation bridges for smooth transitions

## Benefits

1. **Token Efficiency**: Analysis done once, not repeatedly during interview
2. **Targeted Questions**: AI focuses on areas needing validation
3. **Better Experience**: Candidates get relevant, personalized questions
4. **Objective Assessment**: Structured evaluation based on evidence
5. **Time Optimization**: Interview time allocated by competency importance

## Implementation Details

### Database Queries
The function performs parallel queries to fetch:
- Candidate data with all fields
- Position data with competencies and weights
- Company data for context

### AI Analysis
Uses GPT-4o-mini with:
- Temperature: 0.3 (for consistency)
- Response format: JSON object
- Detailed prompt engineering for structured output

### Error Handling
- Validates all required IDs
- Handles missing data gracefully
- Returns success: false with error messages
- Logs detailed information for debugging

## Testing the System

To verify the interview-prepper is working:

1. **Check Browser Console**:
   - Look for "Interview prep analysis received"
   - Should show overall_fit score and focus areas

2. **Monitor Edge Function Logs**:
   - Supabase Dashboard → Functions → interview-prepper
   - Check for successful executions and timing

3. **Verify AI Behavior**:
   - AI should greet by name
   - Questions should target identified gaps
   - Time should be allocated by weights

## Future Enhancements

1. **Caching Layer**: Cache analyses for repeated interviews
2. **Batch Analysis**: Analyze multiple candidates at once
3. **Learning System**: Track which questions yield best insights
4. **Custom Prompts**: Allow per-company analysis customization
5. **Multi-language**: Support analysis in different languages 