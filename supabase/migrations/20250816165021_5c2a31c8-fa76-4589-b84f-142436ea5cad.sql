-- Fix security issue: Restrict personal information access in database functions

-- Drop and recreate get_public_profile_summary to only expose minimal safe information
DROP FUNCTION IF EXISTS public.get_public_profile_summary(uuid);

CREATE OR REPLACE FUNCTION public.get_public_profile_summary(profile_user_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = profile_user_id
    AND p.is_approved = true
    AND p.privacy_level = 'public';
$function$;

-- Create a new function for friend-level access that requires friendship relationship
CREATE OR REPLACE FUNCTION public.get_friend_profile_summary(profile_user_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text, country text, city text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.country,
    p.city
  FROM public.profiles p
  WHERE p.id = profile_user_id
    AND p.is_approved = true
    AND (
      p.privacy_level = 'public' OR 
      (p.privacy_level = 'friends' AND EXISTS(
        SELECT 1 FROM public.follows 
        WHERE follower_id = auth.uid() AND followee_id = profile_user_id
      ))
    );
$function$;

-- Update contest participant function to only show minimal safe information
DROP FUNCTION IF EXISTS public.get_contest_participant_info();

CREATE OR REPLACE FUNCTION public.get_contest_participant_info()
RETURNS TABLE(id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.is_contest_participant = true 
    AND p.is_approved = true
    AND p.privacy_level IN ('public', 'friends');
$function$;

-- Update the overloaded version as well
DROP FUNCTION IF EXISTS public.get_contest_participant_info(uuid);

CREATE OR REPLACE FUNCTION public.get_contest_participant_info(participant_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = participant_id
    AND p.is_contest_participant = true 
    AND p.is_approved = true
    AND p.privacy_level IN ('public', 'friends');
$function$;

-- Add a new function for detailed profile access (only for profile owner, friends, or admins)
CREATE OR REPLACE FUNCTION public.get_detailed_profile(profile_user_id uuid)
RETURNS TABLE(
  id uuid, 
  display_name text, 
  avatar_url text, 
  country text, 
  city text, 
  age integer,
  bio text,
  is_contest_participant boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    CASE 
      WHEN auth.uid() = p.id OR 
           has_role(auth.uid(), 'admin'::app_role) OR 
           has_role(auth.uid(), 'moderator'::app_role) OR
           (p.privacy_level = 'friends' AND EXISTS(
             SELECT 1 FROM public.follows 
             WHERE follower_id = auth.uid() AND followee_id = profile_user_id
           ))
      THEN p.country
      ELSE NULL
    END as country,
    CASE 
      WHEN auth.uid() = p.id OR 
           has_role(auth.uid(), 'admin'::app_role) OR 
           has_role(auth.uid(), 'moderator'::app_role) OR
           (p.privacy_level = 'friends' AND EXISTS(
             SELECT 1 FROM public.follows 
             WHERE follower_id = auth.uid() AND followee_id = profile_user_id
           ))
      THEN p.city
      ELSE NULL
    END as city,
    CASE 
      WHEN auth.uid() = p.id OR 
           has_role(auth.uid(), 'admin'::app_role) OR 
           has_role(auth.uid(), 'moderator'::app_role) OR
           (p.privacy_level = 'friends' AND EXISTS(
             SELECT 1 FROM public.follows 
             WHERE follower_id = auth.uid() AND followee_id = profile_user_id
           ))
      THEN p.age
      ELSE NULL
    END as age,
    CASE 
      WHEN auth.uid() = p.id OR 
           has_role(auth.uid(), 'admin'::app_role) OR 
           has_role(auth.uid(), 'moderator'::app_role) OR
           p.privacy_level = 'public' OR
           (p.privacy_level = 'friends' AND EXISTS(
             SELECT 1 FROM public.follows 
             WHERE follower_id = auth.uid() AND followee_id = profile_user_id
           ))
      THEN p.bio
      ELSE NULL
    END as bio,
    p.is_contest_participant
  FROM public.profiles p
  WHERE p.id = profile_user_id
    AND p.is_approved = true;
$function$;