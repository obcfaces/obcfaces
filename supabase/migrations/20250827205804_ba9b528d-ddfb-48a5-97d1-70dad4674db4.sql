-- Create function to add approved applications to weekly contest
CREATE OR REPLACE FUNCTION add_approved_application_to_weekly_contest()
RETURNS TRIGGER AS $$
DECLARE
    current_week_start DATE;
    current_week_end DATE;
    contest_record RECORD;
    profile_record RECORD;
BEGIN
    -- Only process if status changed to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Calculate current week (Monday to Sunday)
        current_week_start := date_trunc('week', CURRENT_DATE)::DATE + 1; -- Monday
        current_week_end := current_week_start + 6; -- Sunday
        
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add approved applications to weekly contest
DROP TRIGGER IF EXISTS trigger_add_approved_to_weekly_contest ON contest_applications;
CREATE TRIGGER trigger_add_approved_to_weekly_contest
    AFTER UPDATE ON contest_applications
    FOR EACH ROW
    EXECUTE FUNCTION add_approved_application_to_weekly_contest();

-- Also add existing approved applications to current week's contest
DO $$
DECLARE
    current_week_start DATE;
    current_week_end DATE;
    contest_record RECORD;
    app_record RECORD;
    profile_record RECORD;
BEGIN
    -- Calculate current week (Monday to Sunday)
    current_week_start := date_trunc('week', CURRENT_DATE)::DATE + 1; -- Monday
    current_week_end := current_week_start + 6; -- Sunday
    
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
    
    -- Add all approved applications to current week's contest
    FOR app_record IN 
        SELECT * FROM contest_applications 
        WHERE status = 'approved' 
        AND created_at >= current_week_start 
    LOOP
        -- Get profile data for the user
        SELECT * INTO profile_record
        FROM profiles
        WHERE id = app_record.user_id;
        
        -- Add to weekly contest participants if not already added
        INSERT INTO weekly_contest_participants (
            contest_id,
            user_id,
            application_data
        ) 
        SELECT 
            contest_record.id,
            app_record.user_id,
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
                'application_id', app_record.id
            )
        WHERE NOT EXISTS (
            SELECT 1 FROM weekly_contest_participants 
            WHERE contest_id = contest_record.id 
            AND user_id = app_record.user_id
        );
    END LOOP;
END;
$$;