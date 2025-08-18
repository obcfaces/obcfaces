-- Drop the existing incorrect policy
DROP POLICY "Users can upload their own contest photos" ON storage.objects;

-- Create correct policy with WITH CHECK
CREATE POLICY "Users can upload their own contest photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'contest-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);