-- Update the RPC functions to use age from application data instead of calculating from birth_year

CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_public(weeks_offset integer DEFAULT 0)
 RETURNS TABLE(participant_id uuid, user_id uuid, contest_id uuid, first_name text, last_name text, display_name text, photo_1_url text, photo_2_url text, avatar_url text, age integer, country text, state text, city text, height_cm integer, weight_kg numeric, gender text, marital_status text, has_children boolean, average_rating numeric, total_votes integer, final_rank integer, participant_type text, contest_start_date date, contest_end_date date, contest_title text, contest_status text)
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
        -- Use age from application data if available, otherwise use profile age, otherwise calculate from birth_year
        COALESCE(
            (wcp.application_data->>'age')::INTEGER,
            p.age,
            (date_part('year', now()) - (wcp.application_data->>'birth_year')::integer)::integer
        ) as age,
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
    -- Add condition to exclude users with rejected applications
    WHERE target_date BETWEEN wc.week_start_date AND wc.week_end_date
      AND NOT EXISTS (
        SELECT 1 FROM contest_applications ca 
        WHERE ca.user_id = wcp.user_id 
        AND ca.status = 'rejected'
      )
    ORDER BY 
        -- 1. Higher average rating = higher place
        wcp.average_rating DESC,
        -- 2. More total votes = higher place (when rating is same)
        wcp.total_votes DESC,
        -- 3. Latest rating time = higher place (when votes count is same)
        COALESCE(
            (SELECT MAX(created_at) FROM contestant_ratings cr WHERE cr.contestant_user_id = wcp.user_id),
            wcp.created_at
        ) DESC,
        -- 4. Fallback to participant creation time
        wcp.created_at ASC;
END;
$$;