-- Update Jin Carrida's application data to include the correct age (22) as specified in admin panel
UPDATE weekly_contest_participants 
SET application_data = application_data || '{"age": 22}'::jsonb
WHERE user_id = '1b5c2751-a820-4767-87e6-d06080219942';

-- Also update the contest application
UPDATE contest_applications 
SET application_data = application_data || '{"age": 22}'::jsonb
WHERE user_id = '1b5c2751-a820-4767-87e6-d06080219942';