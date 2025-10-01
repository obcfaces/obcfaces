-- Clean up invalid admin_status values
-- Fix participants with application statuses in admin_status

-- 1. Set approved participants to 'this week' status
UPDATE weekly_contest_participants
SET admin_status = 'this week'
WHERE admin_status IN ('approved', 'pending', 'rejected');

-- 2. Fix week interval values that got into admin_status
UPDATE weekly_contest_participants
SET 
  admin_status = 'past',
  week_interval = admin_status
WHERE admin_status LIKE 'week-%';

-- 3. Add a check to prevent invalid admin_status values in the future
-- (We'll use a validation through application logic since CHECK constraints are limited)