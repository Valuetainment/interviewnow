#!/bin/bash

# Helper script to create a new migration file with the correct timestamp
# Usage: ./scripts/create-migration.sh migration_name

if [ -z "$1" ]; then
    echo "Error: Please provide a migration name"
    echo "Usage: ./scripts/create-migration.sh migration_name"
    exit 1
fi

# Get the current timestamp
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Sanitize the migration name (replace spaces with underscores, lowercase)
MIGRATION_NAME=$(echo "$1" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')

# Create the full filename
FILENAME="supabase/migrations/${TIMESTAMP}_${MIGRATION_NAME}.sql"

# Create the file with a basic template
cat > "$FILENAME" << EOF
-- Migration: ${MIGRATION_NAME}
-- Created: $(date)
-- 
-- Description: [Add description here]

-- Add your SQL here

EOF

echo "✅ Created migration file: $FILENAME"
echo "📝 Timestamp used: $TIMESTAMP"
echo ""
echo "IMPORTANT: This timestamp is critical for Supabase migration order."
echo "Never rename this file or change the timestamp!" 