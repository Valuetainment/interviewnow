#!/bin/bash

# Test script for interview-transcript edge function

# Get the anon key from .env file
ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2)

# Remove any quotes if present
ANON_KEY="${ANON_KEY//\"/}"

echo "Testing interview-transcript edge function..."
echo "Using anon key: ${ANON_KEY:0:20}..."

# Test 1: Simple test with fake session ID
echo -e "\n1. Testing with fake session ID (should fail with 404):"
curl -X POST https://gypnutyegqxelvsqjedu.supabase.co/functions/v1/interview-transcript \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "interview_session_id": "test-session-123",
    "text": "Test transcript entry",
    "speaker": "candidate"
  }' | jq .

# Test 2: Test with missing required fields (should fail with 400)
echo -e "\n2. Testing with missing text field (should fail with 400):"
curl -X POST https://gypnutyegqxelvsqjedu.supabase.co/functions/v1/interview-transcript \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "interview_session_id": "test-session-123",
    "speaker": "candidate"
  }' | jq .

# Test 3: Get a real session ID from the database (if you have one)
echo -e "\n3. To test with a real session, you need a valid interview_session_id from your database."
echo "You can get one by running:"
echo "SELECT id, status FROM interview_sessions ORDER BY created_at DESC LIMIT 5;"

# If you have a real session ID, uncomment and update this:
# REAL_SESSION_ID="your-real-session-id-here"
# echo -e "\n4. Testing with real session ID:"
# curl -X POST https://gypnutyegqxelvsqjedu.supabase.co/functions/v1/interview-transcript \
#   -H "Authorization: Bearer $ANON_KEY" \
#   -H "Content-Type: application/json" \
#   -d "{
#     \"interview_session_id\": \"$REAL_SESSION_ID\",
#     \"text\": \"This is a test transcript from the edge function test script\",
#     \"speaker\": \"candidate\",
#     \"source\": \"hybrid\"
#   }" | jq . 