-- Remove duplicate fingerprints, keeping only the most recent one for each fingerprint_id/user_id combination
DELETE FROM public.user_device_fingerprints a
USING public.user_device_fingerprints b
WHERE a.id < b.id 
  AND a.fingerprint_id = b.fingerprint_id 
  AND a.user_id = b.user_id;

-- Now add the unique constraint
ALTER TABLE public.user_device_fingerprints
ADD CONSTRAINT user_device_fingerprints_fingerprint_user_unique 
UNIQUE (fingerprint_id, user_id);