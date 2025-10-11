-- Create table for rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address INET NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_rate_limit_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for fast rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint_window 
ON public.rate_limit_log(ip_address, endpoint, window_start DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user_endpoint_window 
ON public.rate_limit_log(user_id, endpoint, window_start DESC) 
WHERE user_id IS NOT NULL;

-- Create table for blocked IPs
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  permanent BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_address 
ON public.blocked_ips(ip_address);

-- Create table for suspicious activity
CREATE TABLE IF NOT EXISTS public.suspicious_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  activity_type TEXT NOT NULL,
  details JSONB,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suspicious_activity_user 
ON public.suspicious_activity_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suspicious_activity_severity 
ON public.suspicious_activity_log(severity, created_at DESC);

-- Create table for 2FA settings
CREATE TABLE IF NOT EXISTS public.user_2fa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  method TEXT CHECK (method IN ('totp', 'sms', 'email')),
  secret TEXT, -- Encrypted TOTP secret
  backup_codes TEXT[], -- Encrypted backup codes
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspicious_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rate_limit_log
CREATE POLICY "System can manage rate limits"
ON public.rate_limit_log FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for blocked_ips
CREATE POLICY "Admins can view blocked IPs"
ON public.blocked_ips FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage blocked IPs"
ON public.blocked_ips FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for suspicious_activity_log
CREATE POLICY "Admins can view suspicious activity"
ON public.suspicious_activity_log FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "System can log suspicious activity"
ON public.suspicious_activity_log FOR INSERT
WITH CHECK (true);

-- RLS Policies for user_2fa_settings
CREATE POLICY "Users can view own 2FA settings"
ON public.user_2fa_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA settings"
ON public.user_2fa_settings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION public.is_ip_blocked(check_ip INET)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_ips
    WHERE ip_address = check_ip
      AND (permanent = true OR blocked_until > now())
  );
$$;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  check_ip INET,
  check_user_id UUID,
  check_endpoint TEXT,
  max_requests INTEGER,
  window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count INTEGER;
  window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start_time := now() - (window_minutes || ' minutes')::INTERVAL;
  
  -- Count requests in current window
  SELECT COUNT(*) INTO request_count
  FROM public.rate_limit_log
  WHERE (ip_address = check_ip OR user_id = check_user_id)
    AND endpoint = check_endpoint
    AND window_start > window_start_time;
  
  -- Return true if within limit
  RETURN request_count < max_requests;
END;
$$;

-- Function to log rate limit attempt
CREATE OR REPLACE FUNCTION public.log_rate_limit_attempt(
  log_ip INET,
  log_user_id UUID,
  log_endpoint TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.rate_limit_log (ip_address, user_id, endpoint)
  VALUES (log_ip, log_user_id, log_endpoint);
END;
$$;

-- Function to clean old rate limit logs (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_logs()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limit_log
  WHERE created_at < now() - INTERVAL '1 hour';
$$;

-- Function to log suspicious activity
CREATE OR REPLACE FUNCTION public.log_suspicious_activity(
  activity_user_id UUID,
  activity_ip INET,
  activity_type TEXT,
  activity_details JSONB,
  activity_severity TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_count INTEGER;
BEGIN
  -- Log the activity
  INSERT INTO public.suspicious_activity_log (
    user_id, ip_address, activity_type, details, severity
  ) VALUES (
    activity_user_id, activity_ip, activity_type, activity_details, activity_severity
  );
  
  -- Check if IP should be auto-blocked
  SELECT COUNT(*) INTO activity_count
  FROM public.suspicious_activity_log
  WHERE ip_address = activity_ip
    AND created_at > now() - INTERVAL '1 hour'
    AND severity IN ('high', 'critical');
  
  -- Auto-block if too many high-severity activities
  IF activity_count >= 5 THEN
    INSERT INTO public.blocked_ips (ip_address, reason, blocked_until)
    VALUES (
      activity_ip, 
      'Auto-blocked due to suspicious activity', 
      now() + INTERVAL '24 hours'
    )
    ON CONFLICT (ip_address) DO NOTHING;
  END IF;
END;
$$;

-- Trigger to update 2FA settings timestamp
CREATE OR REPLACE FUNCTION public.update_2fa_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_2fa_timestamp ON public.user_2fa_settings;
CREATE TRIGGER trigger_update_2fa_timestamp
BEFORE UPDATE ON public.user_2fa_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_2fa_updated_at();