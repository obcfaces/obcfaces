-- ===============================
-- FINAL TOUCHES: Performance Indexes
-- ===============================

-- 1) Индекс для быстрых выборок победителя
CREATE INDEX IF NOT EXISTS idx_participants_contest_winner
ON weekly_contest_participants(contest_id, final_rank)
WHERE final_rank IS NOT NULL AND deleted_at IS NULL;

-- 2) Индекс для оптимизации поиска по admin_status
CREATE INDEX IF NOT EXISTS idx_participants_admin_status_active
ON weekly_contest_participants(admin_status)
WHERE deleted_at IS NULL AND is_active = true;

-- 3) Индекс для weekly_contests по статусу
CREATE INDEX IF NOT EXISTS idx_weekly_contests_status
ON weekly_contests(status, week_start_date);