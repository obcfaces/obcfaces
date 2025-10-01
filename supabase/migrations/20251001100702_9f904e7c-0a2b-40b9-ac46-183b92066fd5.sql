-- Update weekly_contest_participants with photo URLs from contest_applications
UPDATE weekly_contest_participants wcp
SET application_data = jsonb_set(
  jsonb_set(
    COALESCE(wcp.application_data, '{}'::jsonb),
    '{photo1_url}',
    to_jsonb(COALESCE(
      ca.application_data->>'photo1_url',
      p.photo_1_url,
      ''
    ))
  ),
  '{photo2_url}',
  to_jsonb(COALESCE(
    ca.application_data->>'photo2_url',
    p.photo_2_url,
    ''
  ))
)
FROM contest_applications ca
JOIN profiles p ON p.id = ca.user_id
WHERE wcp.user_id = ca.user_id
  AND wcp.is_active = true
  AND (
    wcp.application_data IS NULL 
    OR wcp.application_data->>'photo1_url' IS NULL 
    OR wcp.application_data->>'photo2_url' IS NULL
    OR wcp.application_data->>'photo1_url' = ''
    OR wcp.application_data->>'photo2_url' = ''
  );