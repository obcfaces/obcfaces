-- Create storage bucket for winner content
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'winner-content',
  'winner-content',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo']
);

-- RLS policies for winner-content bucket
-- Only admins can upload
CREATE POLICY "Admins can upload winner content"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'winner-content' AND
  (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
);

-- Only admins can update
CREATE POLICY "Admins can update winner content"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'winner-content' AND
  (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
);

-- Only admins can delete
CREATE POLICY "Admins can delete winner content"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'winner-content' AND
  (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
);

-- Everyone can view (public bucket)
CREATE POLICY "Anyone can view winner content"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'winner-content');