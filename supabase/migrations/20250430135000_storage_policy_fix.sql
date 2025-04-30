-- Drop existing storage policies
DROP POLICY IF EXISTS "Tenant can upload own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Tenant can view own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Tenant can update own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Tenant can delete own resumes" ON storage.objects;

-- Create more permissive policies for testing
CREATE POLICY "Allow authenticated users to upload resumes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Allow authenticated users to view resumes"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes');

CREATE POLICY "Allow authenticated users to update resumes"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes');

CREATE POLICY "Allow authenticated users to delete resumes"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes'); 