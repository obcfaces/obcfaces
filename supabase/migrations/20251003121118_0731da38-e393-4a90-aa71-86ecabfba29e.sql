-- Create table for user login logs with IP addresses
CREATE TABLE IF NOT EXISTS public.user_login_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  ip_address inet,
  user_agent text,
  login_method text NOT NULL DEFAULT 'email',
  success boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_login_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own login logs
CREATE POLICY "Users can view own login logs"
  ON public.user_login_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all login logs
CREATE POLICY "Admins can view all login logs"
  ON public.user_login_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert login logs
CREATE POLICY "System can insert login logs"
  ON public.user_login_logs
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_login_logs_user_id ON public.user_login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_created_at ON public.user_login_logs(created_at DESC);