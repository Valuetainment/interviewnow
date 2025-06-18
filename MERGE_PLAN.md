# Merge Plan: Main → Merge-Test
Date: 2025-06-17

## Current State
- **main**: Has 11 critical backend/AI commits not in merge-test
- **merge-test**: Has 40 frontend cleanup commits not in main
- **Divergence Point**: Around 2 weeks ago

## Pre-Merge Checklist
- [ ] Backup current work (commit/stash changes)
- [ ] Ensure both branches are up to date
- [ ] Create a backup branch from merge-test
- [ ] Review potential conflict areas

## Step-by-Step Merge Process

### 1. Prepare Environment
```bash
# Save current work on main
git add CLAUDE.md
git commit -m "Update CLAUDE.md with current state"

# Create backup branch
git checkout -b backup-merge-test-$(date +%Y%m%d) origin/merge-test
git push -u origin backup-merge-test-$(date +%Y%m%d)
```

### 2. Switch to merge-test
```bash
# Checkout merge-test branch
git checkout -b merge-test origin/merge-test
```

### 3. Merge main into merge-test
```bash
# Perform the merge
git merge origin/main -m "Merge main into merge-test: AI enhancements and model updates"
```

### 4. Expected Conflict Areas
Based on the commits, potential conflicts in:
- Edge functions (if frontend touched these)
- Configuration files (model settings)
- Any shared components between frontend/backend

### 5. Conflict Resolution Strategy
- **AI/Backend changes**: Favor main's version (critical updates)
- **UI/Frontend changes**: Favor merge-test's version (cleanup work)
- **Configuration**: Carefully merge both sets of changes

### 6. Post-Merge Testing
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Test critical features:
# - Interview sessions
# - AI responses with new model
# - Transcript saving
# - Dashboard functionality
```

### 7. Verification Checklist
- [ ] AI interviews work with new model
- [ ] Transcripts save correctly (batching)
- [ ] Interview-prepper function works
- [ ] Dashboard and UI improvements intact
- [ ] No console errors
- [ ] All tests pass

### 8. Push and Communicate
```bash
# Push merged branch
git push origin merge-test

# Create PR for review
# Document all changes and testing done
```

## Rollback Plan
If issues arise:
```bash
git checkout merge-test
git reset --hard origin/backup-merge-test-$(date +%Y%m%d)
git push --force origin merge-test
```

## Key Files to Watch
- `supabase/functions/interview-start/index.ts`
- `supabase/functions/interview-prepper/index.ts`
- `src/hooks/webrtc/useOpenAIConnection.ts`
- `src/components/WebRTCManager.tsx`
- Any dashboard/UI components modified by senior dev