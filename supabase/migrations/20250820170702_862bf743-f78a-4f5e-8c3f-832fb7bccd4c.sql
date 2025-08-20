-- Enable realtime for weekly contest participants and contest applications
ALTER TABLE public.weekly_contest_participants REPLICA IDENTITY FULL;
ALTER TABLE public.contest_applications REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_contest_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_applications;