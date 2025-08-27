-- Update function to handle both approval and removal from weekly contest
CREATE OR REPLACE FUNCTION add_approved_application_to_weekly_contest()
RETURNS TRIGGER AS $$
DECLARE
    current_week_start DATE;
    current_week_end DATE;
    contest_record RECORD;
    profile_record RECORD;
BEGIN
    -- Calculate current week (Monday to Sunday)
    current_week_start := date_trunc('week', CURRENT_DATE)::DATE + 1; -- Monday
    current_week_end := current_week_start + 6; -- Sunday
    
    -- If status changed TO 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Get or create current week's contest
        SELECT * INTO contest_record 
        FROM weekly_contests 
        WHERE week_start_date = current_week_start 
        AND week_end_date = current_week_end;
        
        IF NOT FOUND THEN
            -- Create new weekly contest for current week
            INSERT INTO weekly_contests (
                title,
                week_start_date,
                week_end_date,
                status
            ) VALUES (
                'Contest ' || to_char(current_week_start, 'DD Mon') || ' - ' || to_char(current_week_end, 'DD Mon YYYY'),
                current_week_start,
                current_week_end,
                'active'
            ) RETURNING * INTO contest_record;
        END IF;
        
        -- Get profile data for the user
        SELECT * INTO profile_record
        FROM profiles
        WHERE id = NEW.user_id;
        
        -- Add user to weekly contest participants (if not already added)
        INSERT INTO weekly_contest_participants (
            contest_id,
            user_id,
            application_data
        ) 
        SELECT 
            contest_record.id,
            NEW.user_id,
            jsonb_build_object(
                'first_name', profile_record.first_name,
                'last_name', profile_record.last_name,
                'country', profile_record.country,
                'city', profile_record.city,
                'age', profile_record.age,
                'weight_kg', profile_record.weight_kg,
                'height_cm', profile_record.height_cm,
                'photo_1_url', profile_record.photo_1_url,
                'photo_2_url', profile_record.photo_2_url,
                'application_id', NEW.id
            )
        WHERE NOT EXISTS (
            SELECT 1 FROM weekly_contest_participants 
            WHERE contest_id = contest_record.id 
            AND user_id = NEW.user_id
        );
        
    -- If status changed FROM 'approved' to something else
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
        -- Remove user from current week's contest
        DELETE FROM weekly_contest_participants
        WHERE user_id = NEW.user_id
        AND contest_id IN (
            SELECT id FROM weekly_contests
            WHERE week_start_date = current_week_start
            AND week_end_date = current_week_end
        );
        
        -- Also remove related ratings for this user in current week
        DELETE FROM contestant_ratings
        WHERE contestant_user_id = NEW.user_id
        AND created_at >= current_week_start
        AND created_at <= current_week_end + INTERVAL '1 day';
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create function to update application status (for admin use)
CREATE OR REPLACE FUNCTION update_application_status(
    application_id_param UUID,
    new_status_param TEXT,
    notes_param TEXT DEFAULT NULL,
    reviewer_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    application_record RECORD;
BEGIN
    -- Get the application record
    SELECT * INTO application_record
    FROM contest_applications
    WHERE id = application_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found';
    END IF;
    
    -- Update the application
    UPDATE contest_applications
    SET 
        status = new_status_param,
        notes = COALESCE(notes_param, notes),
        reviewed_by = COALESCE(reviewer_id_param, auth.uid()),
        reviewed_at = CASE 
            WHEN new_status_param IN ('approved', 'rejected') THEN NOW()
            ELSE reviewed_at 
        END,
        updated_at = NOW()
    WHERE id = application_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Grant execute permission to authenticated users (admins will be checked via RLS)
GRANT EXECUTE ON FUNCTION update_application_status(UUID, TEXT, TEXT, UUID) TO authenticated;