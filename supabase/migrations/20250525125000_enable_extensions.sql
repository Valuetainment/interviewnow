-- Migration: Enable required PostgreSQL extensions
-- Purpose: Ensure UUID and other required extensions are available
-- Date: 2025-05-25

-- Enable extensions needed for various functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- For UUID functions like uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- For gen_random_uuid() function
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- For text similarity searches 