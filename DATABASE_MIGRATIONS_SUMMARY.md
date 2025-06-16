# Database Migration Summary

I've created 6 migration files to address the issues identified in the database schema review. Here's what each migration does:

## Migration Files Created

### 1. `20250115000001_fix_transcript_entries_consistency.sql` (CRITICAL)
**Purpose**: Fix schema inconsistencies in the transcript_entries table
- Renames `interview_session_id` to `session_id` for consistency
- Removes redundant `tenant_id` column
- Ensures all required columns exist
- Updates RLS policies to use consistent column names
- Adds documentation comments

### 2. `20250115000002_add_missing_indexes.sql` (HIGH PRIORITY)
**Purpose**: Add missing performance indexes
- Adds indexes on frequently queried columns:
  - `candidates.email` (used in RLS policies)
  - `interview_sessions.status` and `scheduled_time`
  - `positions.title` (including trigram index for fuzzy search)
  - Composite indexes for tenant-scoped queries
  - Additional indexes for transcripts, assessments, and usage events
- Enables `pg_trgm` extension for fuzzy text search

### 3. `20250115000003_add_data_validation_constraints.sql` (HIGH PRIORITY)
**Purpose**: Enforce business rules at the database level
- Adds unique constraint for candidate emails per tenant
- Adds check constraints for:
  - Interview and WebRTC status values
  - Competency weights (0-100)
  - Tenant plan tiers
  - User roles
  - Transcript speakers and confidence scores
  - Various other enum-like fields
- Ensures data integrity for time ranges and scores

### 4. `20250115000004_optimize_rls_policies.sql` (MEDIUM PRIORITY)
**Purpose**: Optimize Row Level Security policies for better performance
- Replaces subqueries with JWT claims where possible
- Creates `auth.tenant_id()` helper function
- Optimizes policies for most tables to use JWT claims directly
- Maintains backward compatibility if JWT doesn't contain tenant_id

### 5. `20250115000005_add_table_documentation.sql` (MEDIUM PRIORITY)
**Purpose**: Add comprehensive documentation
- Adds descriptive comments to all tables
- Documents key columns and their purposes
- Explains enum values and constraints
- Improves maintainability for future developers

### 6. `20250115000006_create_audit_log.sql` (MEDIUM PRIORITY)
**Purpose**: Create audit trail for sensitive operations
- Creates `audit_logs` table for tracking changes
- Sets up automatic triggers for:
  - User role changes
  - Interview status changes
  - Assessment creation
- Only admins can view audit logs
- Audit logs cannot be modified or deleted

## How to Apply These Migrations

1. **Test First**: Apply these migrations to a test/staging database first:
   ```bash
   supabase db reset
   supabase migration up
   ```

2. **Review Order**: Apply migrations in numerical order (they're designed to be applied sequentially)

3. **Critical Migration**: The transcript_entries fix (migration 1) is critical and should be applied first as it fixes schema inconsistencies

4. **Performance Impact**: Migration 2 creates several indexes which may take time on large tables

5. **Validation Constraints**: Migration 3 adds constraints that will fail if existing data violates them. You may need to clean data first.

6. **RLS Policy Changes**: Migration 4 assumes JWT contains tenant_id. Verify your auth setup before applying.

## Potential Issues to Watch For

1. **Existing Data Violations**: Check if any existing data would violate the new constraints before applying migration 3

2. **JWT Claims**: Ensure your JWT tokens include `tenant_id` before applying migration 4

3. **Index Creation Time**: On large tables, index creation might lock tables briefly

4. **Audit Log Growth**: The audit log table could grow quickly - consider implementing a retention policy

## Next Steps

1. Review each migration file
2. Test on a staging environment
3. Plan for any data cleanup needed
4. Apply migrations during a maintenance window
5. Monitor performance after applying indexes
6. Consider implementing additional audit triggers as needed

## Notes

- All migrations are idempotent (safe to run multiple times)
- Each migration checks for existing objects before creating/modifying
- The audit log system can be extended to track more operations as needed 