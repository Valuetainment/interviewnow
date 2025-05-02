-- Update storage permissions to make resumes bucket publicly accessible

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to resumes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Allow owners to manage their resumes" ON storage.objects;

-- Allow anonymous access to read objects from the resumes bucket
CREATE POLICY "Allow public read access to resumes" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'resumes');

-- Allow authenticated users to upload to resumes bucket
CREATE POLICY "Allow authenticated users to upload resumes" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND auth.uid() = owner);

-- Allow bucket owners to update and delete their files
CREATE POLICY "Allow owners to manage their resumes" ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'resumes' AND auth.uid() = owner);

-- Make sure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO UPDATE SET public = true; 