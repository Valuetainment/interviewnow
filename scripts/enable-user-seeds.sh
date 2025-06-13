#!/bin/bash

# Script to uncomment the user inserts in seed.sql after auth users are created

echo "Enabling user inserts in seed.sql..."

# Uncomment the admin user insert
sed -i 's/-- -- Admin user/-- Admin user/g' supabase/seed.sql
sed -i 's/-- INSERT INTO public.users/INSERT INTO public.users/g' supabase/seed.sql
sed -i 's/-- VALUES/VALUES/g' supabase/seed.sql
sed -i "s/--   ('a1a1a1a1/  ('a1a1a1a1/g" supabase/seed.sql
sed -i 's/-- ON CONFLICT/ON CONFLICT/g' supabase/seed.sql

# Uncomment the regular user insert
sed -i 's/-- -- Regular user/-- Regular user/g' supabase/seed.sql
sed -i "s/--   ('b2b2b2b2/  ('b2b2b2b2/g" supabase/seed.sql

echo "✓ User inserts enabled in seed.sql"
echo ""
echo "Now run: npx supabase db reset"
echo "This will recreate the database with all test data including users." 