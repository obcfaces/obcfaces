-- Create a table to track partial/incomplete form submissions
CREATE TABLE IF NOT EXISTS public.partial_contest_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For tracking anonymous users
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_updated_field TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted BOOLEAN NOT NULL DEFAULT false
);

-- Create index for faster lookups
CREATE INDEX idx_partial_submissions_user_id ON public.partial_contest_submissions(user_id);
CREATE INDEX idx_partial_submissions_session_id ON public.partial_contest_submissions(session_id);
CREATE INDEX idx_partial_submissions_submitted ON public.partial_contest_submissions(submitted);
CREATE INDEX idx_partial_submissions_updated_at ON public.partial_contest_submissions(updated_at DESC);

-- Enable RLS
ALTER TABLE public.partial_contest_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own partial submissions"
  ON public.partial_contest_submissions
  FOR SELECT
  USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can insert their own partial submissions"
  ON public.partial_contest_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own partial submissions"
  ON public.partial_contest_submissions
  FOR UPDATE
  USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Admins can view all partial submissions"
  ON public.partial_contest_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_partial_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partial_submissions_timestamp
BEFORE UPDATE ON public.partial_contest_submissions
FOR EACH ROW
EXECUTE FUNCTION update_partial_submissions_updated_at();