-- Storage configuration for AI Interview Insights Platform
-- Creating buckets for resumes, videos, and audio with tenant isolation

-- Create buckets for different file types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('resumes', 'resumes', false, 10485760, ARRAY['application/pdf']),
  ('videos', 'videos', false, 1073741824, ARRAY['video/mp4', 'video/webm']),
  ('audio', 'audio', false, 104857600, ARRAY['audio/webm', 'audio/mp3', 'audio/wav']);

-- Create storage policies for tenant isolation

-- Resumes bucket policies
CREATE POLICY "Tenant can upload own resumes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Tenant can view own resumes"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Tenant can update own resumes"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Tenant can delete own resumes"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Videos bucket policies
CREATE POLICY "Tenant can upload own videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Tenant can view own videos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Tenant can update own videos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Tenant can delete own videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Audio bucket policies
CREATE POLICY "Tenant can upload own audio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'audio' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Tenant can view own audio"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'audio' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Tenant can update own audio"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'audio' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Tenant can delete own audio"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'audio' AND
    (storage.foldername(name))[1] = auth.uid()::text
  ); 