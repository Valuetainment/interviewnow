-- Verify batching for session 0c97aae4-9d21-40d1-a70f-24db6a01d882

-- 1. Count total transcript entries for this session
SELECT COUNT(*) as total_entries
FROM transcript_entries
WHERE session_id = '0c97aae4-9d21-40d1-a70f-24db6a01d882';

-- 2. Check the creation timestamps - batched entries will have very close timestamps
SELECT 
  created_at,
  speaker,
  LEFT(text, 50) as text_preview,
  created_at - LAG(created_at) OVER (ORDER BY created_at) as time_since_previous
FROM transcript_entries
WHERE session_id = '0c97aae4-9d21-40d1-a70f-24db6a01d882'
ORDER BY created_at;

-- 3. Group by minute to see batching pattern
SELECT 
  DATE_TRUNC('minute', created_at) as minute,
  COUNT(*) as entries_in_minute,
  ARRAY_AGG(DISTINCT speaker) as speakers
FROM transcript_entries
WHERE session_id = '0c97aae4-9d21-40d1-a70f-24db6a01d882'
GROUP BY DATE_TRUNC('minute', created_at)
ORDER BY minute;

-- 4. Check if entries were created in batches (multiple rows with identical created_at)
SELECT 
  created_at,
  COUNT(*) as entries_at_this_time
FROM transcript_entries
WHERE session_id = '0c97aae4-9d21-40d1-a70f-24db6a01d882'
GROUP BY created_at
HAVING COUNT(*) > 1
ORDER BY created_at;