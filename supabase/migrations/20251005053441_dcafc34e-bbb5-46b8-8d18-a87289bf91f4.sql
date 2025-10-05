-- Создаем таблицу для хранения детальной информации о браузере/устройстве пользователя
CREATE TABLE IF NOT EXISTS public.user_device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint_id TEXT NOT NULL,
  
  -- Информация об устройстве
  screen_resolution TEXT,
  screen_color_depth INTEGER,
  timezone TEXT,
  timezone_offset INTEGER,
  language TEXT,
  languages TEXT[],
  platform TEXT,
  user_agent TEXT,
  
  -- Hardware информация
  hardware_concurrency INTEGER, -- количество ядер CPU
  device_memory INTEGER, -- GB памяти
  
  -- Browser capabilities
  cookies_enabled BOOLEAN,
  do_not_track BOOLEAN,
  touch_support BOOLEAN,
  
  -- Advanced fingerprinting
  canvas_fingerprint TEXT,
  webgl_vendor TEXT,
  webgl_renderer TEXT,
  audio_fingerprint TEXT,
  
  -- Fonts detection (массив установленных шрифтов)
  installed_fonts TEXT[],
  
  -- Дополнительная информация
  ip_address INET,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  visit_count INTEGER NOT NULL DEFAULT 1,
  
  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_fingerprints_user_id ON public.user_device_fingerprints(user_id);
CREATE INDEX idx_fingerprints_fingerprint_id ON public.user_device_fingerprints(fingerprint_id);
CREATE INDEX idx_fingerprints_ip_address ON public.user_device_fingerprints(ip_address);
CREATE INDEX idx_fingerprints_last_seen ON public.user_device_fingerprints(last_seen_at);

-- Добавляем поле fingerprint_id в user_login_logs
ALTER TABLE public.user_login_logs 
ADD COLUMN IF NOT EXISTS fingerprint_id TEXT,
ADD COLUMN IF NOT EXISTS device_fingerprint_id UUID REFERENCES public.user_device_fingerprints(id);

-- RLS политики
ALTER TABLE public.user_device_fingerprints ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть только свои fingerprints
CREATE POLICY "Users can view their own fingerprints"
ON public.user_device_fingerprints
FOR SELECT
USING (auth.uid() = user_id);

-- Админы могут видеть все fingerprints
CREATE POLICY "Admins can view all fingerprints"
ON public.user_device_fingerprints
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Система может вставлять fingerprints
CREATE POLICY "System can insert fingerprints"
ON public.user_device_fingerprints
FOR INSERT
WITH CHECK (true);

-- Система может обновлять fingerprints
CREATE POLICY "System can update fingerprints"
ON public.user_device_fingerprints
FOR UPDATE
USING (true);

-- Комментарии для документации
COMMENT ON TABLE public.user_device_fingerprints IS 'Хранит уникальные fingerprints устройств для обнаружения мультиаккаунтов и накрутки';
COMMENT ON COLUMN public.user_device_fingerprints.fingerprint_id IS 'Уникальный ID браузера/устройства сгенерированный FingerprintJS';
COMMENT ON COLUMN public.user_device_fingerprints.canvas_fingerprint IS 'Canvas fingerprint для дополнительной идентификации';
COMMENT ON COLUMN public.user_device_fingerprints.visit_count IS 'Количество раз когда этот fingerprint был использован';