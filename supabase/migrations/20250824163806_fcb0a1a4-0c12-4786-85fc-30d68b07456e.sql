-- Create RLS policies for contest-photos bucket to allow users to upload their own photos

-- Allow users to upload their own photos to contest-photos bucket
CREATE POLICY "Users can upload their own contest photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'contest-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own photos
CREATE POLICY "Users can update their own contest photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'contest-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own contest photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'contest-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to contest photos (since bucket is public)
CREATE POLICY "Contest photos are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'contest-photos');