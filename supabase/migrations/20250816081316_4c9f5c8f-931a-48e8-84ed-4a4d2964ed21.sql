-- Create storage policies for contest-photos bucket
CREATE POLICY "Users can upload their own contest photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'contest-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own contest photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'contest-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own contest photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'contest-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own contest photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'contest-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);