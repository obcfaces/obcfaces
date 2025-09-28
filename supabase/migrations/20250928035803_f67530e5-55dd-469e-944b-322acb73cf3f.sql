-- Add new status to the admin_status values
-- No need to modify enum since admin_status is text type

-- Update the weekly status transition logic by updating the existing edge function
-- This will be handled in the edge function update

-- For now, just ensure we can use the new status
-- The admin_status column is already text type, so no schema changes needed