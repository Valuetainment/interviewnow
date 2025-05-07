# Supabase Branching Workflow Guide

This document outlines our approach to using Supabase branching for isolated, testable changes to both frontend and backend code.

## Branching Benefits

- Isolated test environments for database schema changes
- Preview deployments with proper environment variables
- Ability to test migrations before applying to production
- Safe environment for experimentation

## Workflow Steps

### 1. Create a Feature Branch

```bash
# Create and switch to a new branch
git checkout -b feat/feature-name

# Or for bugfixes
git checkout -b fix/issue-name
```

### 2. Make Code Changes

- Frontend changes in `src/`
- Database migrations in `supabase/migrations/`
- Edge Functions in `supabase/functions/`

### 3. Commit and Push

```bash
git add .
git commit -m "feat: description of changes"
git push -u origin feat/feature-name
```

### 4. Create Pull Request

- Open GitHub and create a pull request
- Supabase automatically creates a database branch
- Vercel automatically creates a frontend preview

### 5. Test in Isolation

- Test frontend functionality on the Vercel preview URL
- Database changes are applied to the Supabase preview branch
- Environment variables are automatically synchronized

### 6. Merge When Ready

- Once tested, merge the PR into main
- Vercel deploys to production
- Supabase applies migrations to production database

## Migration Best Practices

Based on our experience, follow these practices to avoid common issues:

### 1. Use Schema-Qualified References

Always fully qualify table and column names in SQL statements:

```sql
-- Good
CREATE POLICY ... 
  WHERE s.id = public.table_name.column_name;

-- Bad
CREATE POLICY ... 
  WHERE s.id = column_name;
```

### 2. Create Tables Before Policies

Ensure tables exist before creating policies that reference them. Use appropriate timestamped migration files:

```sql
-- 20250507144000_create_tables.sql
CREATE TABLE public.my_table (...);

-- 20250507144100_create_policies.sql
CREATE POLICY ... ON public.my_table ...;
```

### 3. Use Conditional Creation

Use IF EXISTS/IF NOT EXISTS clauses for safer migrations:

```sql
CREATE TABLE IF NOT EXISTS public.my_table (...);
DROP POLICY IF EXISTS "My policy" ON public.my_table;
```

### 4. Use SELECT for Auth Functions

Wrap auth functions in SELECT statements for better performance:

```sql
-- Good
WHERE user_id = (SELECT auth.uid())

-- Less efficient
WHERE user_id = auth.uid()
```

### 5. Atomic Migrations for Complex Changes

For complex changes, use a single atomic migration that:
- Drops dependent objects first
- Creates tables in dependency order
- Recreates policies after tables exist

### 6. Document Migrations

Include clear comments in migration files:

```sql
-- Migration: Create transcript system
-- Purpose: Add support for real-time transcription
-- Date: YYYY-MM-DD
--
-- This migration creates tables and policies for...
```

## Troubleshooting

If a branch preview fails:
1. Check Supabase dashboard → Project → Branches → Activity logs
2. Fix issues in a new commit
3. If needed, delete the preview branch in Supabase and recreate it by pushing again

## Additional Resources

- [Supabase Branching Documentation](https://supabase.com/docs/guides/deployment/branching)
- [Postgres Migration Best Practices](https://supabase.com/docs/guides/database/migrations) 