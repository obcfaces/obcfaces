-- Create weekly contests table
CREATE TABLE public.weekly_contests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'closed')),
  winner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly contest participants table
CREATE TABLE public.weekly_contest_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID NOT NULL REFERENCES public.weekly_contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  application_data JSONB,
  final_rank INTEGER,
  total_votes INTEGER DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_contest_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for weekly_contests
CREATE POLICY "Weekly contests are viewable by everyone" 
ON public.weekly_contests 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage weekly contests" 
ON public.weekly_contests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for weekly_contest_participants
CREATE POLICY "Weekly contest participants are viewable by everyone" 
ON public.weekly_contest_participants 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage weekly contest participants" 
ON public.weekly_contest_participants 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to get current week's Monday
CREATE OR REPLACE FUNCTION public.get_week_monday(input_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT 
    CASE 
      WHEN EXTRACT(DOW FROM input_date) = 0 THEN input_date - INTERVAL '6 days'
      ELSE input_date - INTERVAL '1 day' * (EXTRACT(DOW FROM input_date) - 1)
    END::DATE;
$$;

-- Function to create new weekly contest
CREATE OR REPLACE FUNCTION public.create_weekly_contest(contest_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  week_monday DATE;
  week_sunday DATE;
  contest_id UUID;
  contest_title TEXT;
BEGIN
  week_monday := get_week_monday(contest_date);
  week_sunday := week_monday + INTERVAL '6 days';
  
  -- Generate title based on date
  contest_title := 'Contest ' || TO_CHAR(week_monday, 'DD.MM') || '-' || TO_CHAR(week_sunday, 'DD.MM.YYYY');
  
  -- Check if contest already exists for this week
  SELECT id INTO contest_id 
  FROM public.weekly_contests 
  WHERE week_start_date = week_monday;
  
  IF contest_id IS NULL THEN
    INSERT INTO public.weekly_contests (week_start_date, week_end_date, title, status)
    VALUES (week_monday, week_sunday, contest_title, 'active')
    RETURNING id INTO contest_id;
  END IF;
  
  RETURN contest_id;
END;
$$;

-- Function to rotate contests (close current, create new)
CREATE OR REPLACE FUNCTION public.rotate_weekly_contests()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_monday DATE;
  current_contest_id UUID;
BEGIN
  current_monday := get_week_monday(CURRENT_DATE);
  
  -- Close previous week's contest
  UPDATE public.weekly_contests 
  SET status = 'closed', updated_at = now()
  WHERE status = 'active' AND week_start_date < current_monday;
  
  -- Create or activate current week's contest
  SELECT id INTO current_contest_id 
  FROM public.weekly_contests 
  WHERE week_start_date = current_monday;
  
  IF current_contest_id IS NULL THEN
    PERFORM create_weekly_contest(CURRENT_DATE);
  ELSE
    UPDATE public.weekly_contests 
    SET status = 'active', updated_at = now()
    WHERE id = current_contest_id;
  END IF;
  
  -- Move approved contest applications to current week
  INSERT INTO public.weekly_contest_participants (contest_id, user_id, application_data)
  SELECT 
    (SELECT id FROM public.weekly_contests WHERE status = 'active' AND week_start_date = current_monday),
    ca.user_id,
    ca.application_data
  FROM public.contest_applications ca
  WHERE ca.status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM public.weekly_contest_participants wcp
      WHERE wcp.user_id = ca.user_id 
        AND wcp.contest_id = (
          SELECT id FROM public.weekly_contests 
          WHERE status = 'active' AND week_start_date = current_monday
        )
    );
END;
$$;

-- Function to get weekly contest participants by week offset
CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants(weeks_offset INTEGER DEFAULT 0)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  first_name text, 
  last_name text, 
  age integer, 
  city text, 
  country text, 
  photo1_url text, 
  photo2_url text, 
  height_cm integer, 
  weight_kg numeric,
  final_rank integer,
  contest_status text,
  week_start_date date,
  week_end_date date
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    wcp.id,
    wcp.user_id,
    (wcp.application_data->>'first_name')::text as first_name,
    (wcp.application_data->>'last_name')::text as last_name,
    (date_part('year', now()) - (wcp.application_data->>'birth_year')::integer)::integer as age,
    (wcp.application_data->>'city')::text as city,
    CASE 
      WHEN wcp.application_data->>'country' = 'PH' THEN 'Philippines'
      ELSE (wcp.application_data->>'country')::text
    END as country,
    (wcp.application_data->>'photo1_url')::text as photo1_url,
    (wcp.application_data->>'photo2_url')::text as photo2_url,
    (wcp.application_data->>'height_cm')::integer as height_cm,
    (wcp.application_data->>'weight_kg')::numeric as weight_kg,
    wcp.final_rank,
    wc.status as contest_status,
    wc.week_start_date,
    wc.week_end_date
  FROM public.weekly_contest_participants wcp
  JOIN public.weekly_contests wc ON wcp.contest_id = wc.id
  WHERE wc.week_start_date = get_week_monday(CURRENT_DATE) + (weeks_offset * INTERVAL '7 days')
  ORDER BY COALESCE(wcp.final_rank, 999), wcp.created_at;
$$;

-- Create initial current week contest
SELECT create_weekly_contest(CURRENT_DATE);

-- Add triggers for updated_at
CREATE TRIGGER update_weekly_contests_updated_at
  BEFORE UPDATE ON public.weekly_contests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_weekly_contests_week_start ON public.weekly_contests(week_start_date);
CREATE INDEX idx_weekly_contests_status ON public.weekly_contests(status);
CREATE INDEX idx_weekly_contest_participants_contest_id ON public.weekly_contest_participants(contest_id);
CREATE INDEX idx_weekly_contest_participants_user_id ON public.weekly_contest_participants(user_id);