-- Add new fields to profiles table for contest participation
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS marital_status TEXT,
ADD COLUMN IF NOT EXISTS has_children BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS photo_1_url TEXT,
ADD COLUMN IF NOT EXISTS photo_2_url TEXT;

-- Create storage bucket for contest photos if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contest-photos', 'contest-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for contest photos
CREATE POLICY "Users can upload their own contest photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'contest-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own contest photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'contest-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Contest photos are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'contest-photos');

CREATE POLICY "Users can update their own contest photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'contest-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own contest photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'contest-photos' AND auth.uid()::text = (storage.foldername(name))[1]);