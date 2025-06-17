-- Add profiles storage bucket for user avatars

-- Create profiles bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profiles', 'profiles', true, 2097152, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']);

-- Create storage policies for profiles bucket
-- Users can upload their own profile pictures
CREATE POLICY "Users can upload own profile picture"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profiles' AND
    name = CONCAT('avatars/', auth.uid()::text, '.', SPLIT_PART(name, '.', 2))
  );

-- Users can view all profile pictures (public bucket)
CREATE POLICY "Anyone can view profile pictures"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profiles');

-- Users can update their own profile pictures
CREATE POLICY "Users can update own profile picture"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profiles' AND
    name LIKE CONCAT('avatars/', auth.uid()::text, '.%')
  );

-- Users can delete their own profile pictures
CREATE POLICY "Users can delete own profile picture"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profiles' AND
    name LIKE CONCAT('avatars/', auth.uid()::text, '.%')
  ); 