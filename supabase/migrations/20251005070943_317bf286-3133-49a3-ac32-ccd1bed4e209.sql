-- Add 'usual' and 'moderator' to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'usual';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'moderator';