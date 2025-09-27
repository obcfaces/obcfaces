-- Fix remaining search path security issue
ALTER FUNCTION public.has_role(UUID, app_role) 
SET search_path = public;