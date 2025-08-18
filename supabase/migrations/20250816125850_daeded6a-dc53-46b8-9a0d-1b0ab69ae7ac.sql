-- Update existing user profile from contest application data
UPDATE profiles SET 
  is_contest_participant = true,
  participant_type = 'candidate',
  first_name = (contest_app.application_data->>'first_name'),
  last_name = (contest_app.application_data->>'last_name'),
  gender = (contest_app.application_data->>'gender'),
  height_cm = (contest_app.application_data->>'height_cm')::integer,
  weight_kg = (contest_app.application_data->>'weight_kg')::numeric,
  marital_status = (contest_app.application_data->>'marital_status'),
  has_children = (contest_app.application_data->>'has_children')::boolean,
  photo_1_url = (contest_app.application_data->>'photo1_url'),
  photo_2_url = (contest_app.application_data->>'photo2_url'),
  birthdate = (contest_app.application_data->>'birth_year' || '-' || 
               lpad(contest_app.application_data->>'birth_month', 2, '0') || '-' || 
               lpad(contest_app.application_data->>'birth_day', 2, '0'))::date,
  city = (contest_app.application_data->>'city'),
  state = (contest_app.application_data->>'state')
FROM contest_applications contest_app
WHERE profiles.id = contest_app.user_id 
  AND profiles.id = '1b5c2751-a820-4767-87e6-d06080219942';