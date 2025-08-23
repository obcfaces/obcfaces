-- Fix security issues by setting search_path for the new functions
CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_public(weeks_offset INTEGER DEFAULT 0)
 RETURNS TABLE(
    participant_id UUID,
    user_id UUID,
    contest_id UUID,
    first_name TEXT,
    last_name TEXT,
    display_name TEXT,
    photo_1_url TEXT,
    photo_2_url TEXT,
    avatar_url TEXT,
    age INTEGER,
    country TEXT,
    state TEXT,
    city TEXT,
    height_cm INTEGER,
    weight_kg NUMERIC,
    gender TEXT,
    marital_status TEXT,
    has_children BOOLEAN,
    average_rating NUMERIC,
    total_votes INTEGER,
    final_rank INTEGER,
    participant_type TEXT,
    contest_start_date DATE,
    contest_end_date DATE,
    contest_title TEXT,
    contest_status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    target_date DATE;
BEGIN
    -- Calculate the target date based on weeks offset
    target_date := CURRENT_DATE + (weeks_offset * INTERVAL '7 days');
    
    RETURN QUERY
    SELECT 
        wcp.id as participant_id,
        wcp.user_id,
        wcp.contest_id,
        COALESCE((wcp.application_data->>'first_name')::TEXT, p.first_name) as first_name,
        COALESCE((wcp.application_data->>'last_name')::TEXT, p.last_name) as last_name,
        p.display_name,
        COALESCE((wcp.application_data->>'photo1_url')::TEXT, p.photo_1_url) as photo_1_url,
        COALESCE((wcp.application_data->>'photo2_url')::TEXT, p.photo_2_url) as photo_2_url,
        p.avatar_url,
        COALESCE((wcp.application_data->>'age')::INTEGER, p.age) as age,
        COALESCE((wcp.application_data->>'country')::TEXT, p.country) as country,
        COALESCE((wcp.application_data->>'state')::TEXT, p.state) as state,
        COALESCE((wcp.application_data->>'city')::TEXT, p.city) as city,
        COALESCE((wcp.application_data->>'height_cm')::INTEGER, p.height_cm) as height_cm,
        COALESCE((wcp.application_data->>'weight_kg')::NUMERIC, p.weight_kg) as weight_kg,
        COALESCE((wcp.application_data->>'gender')::TEXT, p.gender) as gender,
        COALESCE((wcp.application_data->>'marital_status')::TEXT, p.marital_status) as marital_status,
        COALESCE((wcp.application_data->>'has_children')::BOOLEAN, p.has_children) as has_children,
        wcp.average_rating,
        wcp.total_votes,
        wcp.final_rank,
        p.participant_type,
        wc.week_start_date as contest_start_date,
        wc.week_end_date as contest_end_date,
        wc.title as contest_title,
        wc.status as contest_status
    FROM weekly_contest_participants wcp
    JOIN weekly_contests wc ON wcp.contest_id = wc.id
    LEFT JOIN profiles p ON wcp.user_id = p.id
    WHERE target_date BETWEEN wc.week_start_date AND wc.week_end_date
    ORDER BY wcp.final_rank ASC NULLS LAST, wcp.average_rating DESC, wcp.total_votes DESC;
END;
$$;

-- Also fix the admin version
CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_admin(weeks_offset INTEGER DEFAULT 0)
 RETURNS TABLE(
    participant_id UUID,
    user_id UUID,
    contest_id UUID,
    first_name TEXT,
    last_name TEXT,
    display_name TEXT,
    photo_1_url TEXT,
    photo_2_url TEXT,
    avatar_url TEXT,
    age INTEGER,
    country TEXT,
    state TEXT,
    city TEXT,
    height_cm INTEGER,
    weight_kg NUMERIC,
    gender TEXT,
    marital_status TEXT,
    has_children BOOLEAN,
    average_rating NUMERIC,
    total_votes INTEGER,
    final_rank INTEGER,
    participant_type TEXT,
    contest_start_date DATE,
    contest_end_date DATE,
    contest_title TEXT,
    contest_status TEXT,
    application_data JSONB,
    phone_data JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    target_date DATE;
BEGIN
    -- Calculate the target date based on weeks offset
    target_date := CURRENT_DATE + (weeks_offset * INTERVAL '7 days');
    
    RETURN QUERY
    SELECT 
        wcp.id as participant_id,
        wcp.user_id,
        wcp.contest_id,
        COALESCE((wcp.application_data->>'first_name')::TEXT, p.first_name) as first_name,
        COALESCE((wcp.application_data->>'last_name')::TEXT, p.last_name) as last_name,
        p.display_name,
        COALESCE((wcp.application_data->>'photo1_url')::TEXT, p.photo_1_url) as photo_1_url,
        COALESCE((wcp.application_data->>'photo2_url')::TEXT, p.photo_2_url) as photo_2_url,
        p.avatar_url,
        COALESCE((wcp.application_data->>'age')::INTEGER, p.age) as age,
        COALESCE((wcp.application_data->>'country')::TEXT, p.country) as country,
        COALESCE((wcp.application_data->>'state')::TEXT, p.state) as state,
        COALESCE((wcp.application_data->>'city')::TEXT, p.city) as city,
        COALESCE((wcp.application_data->>'height_cm')::INTEGER, p.height_cm) as height_cm,
        COALESCE((wcp.application_data->>'weight_kg')::NUMERIC, p.weight_kg) as weight_kg,
        COALESCE((wcp.application_data->>'gender')::TEXT, p.gender) as gender,
        COALESCE((wcp.application_data->>'marital_status')::TEXT, p.marital_status) as marital_status,
        COALESCE((wcp.application_data->>'has_children')::BOOLEAN, p.has_children) as has_children,
        wcp.average_rating,
        wcp.total_votes,
        wcp.final_rank,
        p.participant_type,
        wc.week_start_date as contest_start_date,
        wc.week_end_date as contest_end_date,
        wc.title as contest_title,
        wc.status as contest_status,
        wcp.application_data,
        (wcp.application_data->'phone') as phone_data
    FROM weekly_contest_participants wcp
    JOIN weekly_contests wc ON wcp.contest_id = wc.id
    LEFT JOIN profiles p ON wcp.user_id = p.id
    WHERE target_date BETWEEN wc.week_start_date AND wc.week_end_date
    ORDER BY wcp.final_rank ASC NULLS LAST, wcp.average_rating DESC, wcp.total_votes DESC;
END;
$$;