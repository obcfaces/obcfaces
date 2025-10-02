-- Add old statuses from contest_applications to admin_status enum
ALTER TYPE participant_admin_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE participant_admin_status ADD VALUE IF NOT EXISTS 'under_review';