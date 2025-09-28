-- Change status of test21-09-03 test from 'past week 1' to 'pending'
UPDATE weekly_contest_participants 
SET admin_status = 'pending'
WHERE id = 'bda81832-ca83-49ac-8ddf-f282b7230916';