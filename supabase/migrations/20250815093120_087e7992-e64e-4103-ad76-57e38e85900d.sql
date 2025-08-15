-- Add participant_type column to profiles table to track contest status
ALTER TABLE public.profiles 
ADD COLUMN participant_type text CHECK (participant_type IN ('candidate', 'finalist', 'winner'));