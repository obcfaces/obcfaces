-- Fix search path security issues for functions
ALTER FUNCTION public.get_weekly_contest_participants_public(INTEGER) 
SET search_path = public;

ALTER FUNCTION public.get_weekly_contest_participants_next(INTEGER) 
SET search_path = public;