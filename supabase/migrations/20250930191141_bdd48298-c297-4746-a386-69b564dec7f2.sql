
-- Update profiles for all next week participants to make them viewable
-- This ensures they appear in the Next Week section on the site

UPDATE profiles p
SET 
  is_approved = true,
  privacy_level = 'public',
  is_contest_participant = true
WHERE p.id IN (
  SELECT wcp.user_id
  FROM weekly_contest_participants wcp
  JOIN contest_applications ca ON ca.user_id = wcp.user_id
  WHERE wcp.admin_status IN ('next week', 'next week on site')
    AND wcp.is_active = true
    AND ca.status = 'approved'
    AND ca.is_active = true
    AND ca.deleted_at IS NULL
)
AND (
  p.is_approved IS NULL 
  OR p.is_approved = false 
  OR p.privacy_level != 'public'
  OR p.is_contest_participant != true
);
