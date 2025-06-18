# Scripts Directory Structure

This directory contains scripts for managing the InterviewNow local development environment.

## Main Entry Point

### reset-and-setup.sh
**This is the ONLY script you need to run to set up your local environment.**

```bash
./scripts/reset-and-setup.sh
```

This script:
1. Resets the local Supabase database
2. Applies all migrations
3. Seeds the database with test data
4. Creates test auth users

## Subdirectories

### helpers/
Contains auxiliary scripts that are called by the main script:
- `setup-local-test-data.sh` - Creates test auth users (called automatically by reset-and-setup.sh)

### ai-assistant/
Contains scripts specifically for AI assistant use:
- `create-migration.sh` - Creates migration files with proper timestamps
- These scripts help enforce critical project rules

## Important Notes
- **Always use `reset-and-setup.sh`** to set up your local environment
- Don't run helper scripts directly unless you know what you're doing
- The AI assistant has its own tools to prevent errors (like incorrect migration timestamps) 