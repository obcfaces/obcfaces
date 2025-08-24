-- Check existing policies for contest-photos bucket
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%contest%';

-- If no policies exist, create them
-- Create policies for contest-photos bucket
CREATE POLICY IF NOT EXISTS "Users can upload their own contest photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'contest-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can update their own contest photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'contest-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can view their own contest photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'contest-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Contest photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'contest-photos');