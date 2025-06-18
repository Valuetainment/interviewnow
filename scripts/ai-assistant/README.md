# AI Assistant Scripts

This directory contains scripts specifically designed for use by the AI coding assistant.

## Purpose
These scripts help ensure consistency and prevent errors when the AI performs certain operations, particularly those that require specific formats or timestamps.

## Scripts

### create-migration.sh
**Usage:** `./scripts/ai-assistant/create-migration.sh "migration name"`

Creates a new Supabase migration file with the correct timestamp format. This is CRITICAL because:
- Supabase applies migrations in chronological order based on the timestamp
- Using incorrect timestamps can break the entire database reset process
- The timestamp must be the actual current time, not an arbitrary date

**Example:**
```bash
./scripts/ai-assistant/create-migration.sh "add user preferences table"
```

This will create a file like: `supabase/migrations/20250617115000_add_user_preferences_table.sql`

## Important Notes
- These scripts are for AI assistant use only
- They help enforce critical project rules that must never be violated
- The AI should ALWAYS use these scripts instead of performing manual operations 