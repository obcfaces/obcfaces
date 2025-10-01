-- Add 'pre next week' status to participant_admin_status enum
ALTER TYPE participant_admin_status ADD VALUE IF NOT EXISTS 'pre next week';