-- ============================================================
-- STORAGE POLICIES: Безопасные политики для фото
-- ============================================================

-- 1. Создаем публичный bucket для фото участников (если не существует)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'participant-photos',
  'participant-photos',
  true, -- публичное чтение
  5242880, -- 5MB лимит
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. Политики для participant-photos bucket

-- Публичное чтение всех фото
DROP POLICY IF EXISTS "Public read access to participant photos" ON storage.objects;
CREATE POLICY "Public read access to participant photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'participant-photos');

-- Загрузка только для авторизованных пользователей
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'participant-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text -- только в свою папку
);

-- Обновление только своих фото
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
CREATE POLICY "Users can update own photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'participant-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Удаление только своих фото
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
CREATE POLICY "Users can delete own photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'participant-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Админы могут всё
DROP POLICY IF EXISTS "Admins full access to photos" ON storage.objects;
CREATE POLICY "Admins full access to photos"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'participant-photos'
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'participant-photos'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Функция для безопасного получения URL фото (если нужен server-side доступ)
CREATE OR REPLACE FUNCTION public.get_participant_photo_url(
  participant_id_param uuid,
  photo_number integer DEFAULT 1
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  photo_path text;
BEGIN
  -- Получаем путь к фото из профиля
  SELECT 
    CASE 
      WHEN photo_number = 1 THEN photo_1_url
      WHEN photo_number = 2 THEN photo_2_url
      ELSE NULL
    END INTO photo_path
  FROM profiles
  WHERE id = participant_id_param;
  
  -- Если путь пустой, возвращаем placeholder
  IF photo_path IS NULL OR photo_path = '' THEN
    RETURN '/placeholder-avatar.png';
  END IF;
  
  -- Возвращаем публичный URL
  RETURN photo_path;
END;
$$;

COMMENT ON FUNCTION public.get_participant_photo_url IS 
  'Safely retrieve participant photo URL with fallback to placeholder';

-- 4. Создаем bucket для платежных доказательств (приватный)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false, -- НЕ публичный
  10485760, -- 10MB лимит
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

-- Политики для payment-proofs (только админы)
DROP POLICY IF EXISTS "Only admins can read payment proofs" ON storage.objects;
CREATE POLICY "Only admins can read payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-proofs'
  AND has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Only admins can upload payment proofs" ON storage.objects;
CREATE POLICY "Only admins can upload payment proofs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Only admins can manage payment proofs" ON storage.objects;
CREATE POLICY "Only admins can manage payment proofs"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'payment-proofs'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- 5. Мониторинг размера storage
CREATE OR REPLACE VIEW public.storage_usage_stats AS
SELECT
  bucket_id,
  COUNT(*) as file_count,
  SUM(CAST(metadata->>'size' AS bigint)) as total_bytes,
  ROUND(SUM(CAST(metadata->>'size' AS bigint))::numeric / 1024 / 1024, 2) as total_mb,
  MAX(created_at) as last_upload
FROM storage.objects
GROUP BY bucket_id;

COMMENT ON VIEW public.storage_usage_stats IS 
  'Monitor storage usage by bucket for capacity planning';