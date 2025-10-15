-- Create error_logs table for centralized error logging
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  stack text,
  url text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own errors
CREATE POLICY "Users can insert their own errors"
ON public.error_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Only admins can view error logs
CREATE POLICY "Admins can view error logs"
ON public.error_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);