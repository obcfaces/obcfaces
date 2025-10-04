
-- Шаг 1: Удаляем голоса для удаленных карточек (29 записей)
DELETE FROM contestant_ratings
WHERE participant_id IN (
  SELECT id FROM weekly_contest_participants WHERE deleted_at IS NOT NULL
);

-- Шаг 2: Удаляем лайки для удаленных карточек (29 записей)
DELETE FROM likes
WHERE participant_id IN (
  SELECT id FROM weekly_contest_participants WHERE deleted_at IS NOT NULL
);

-- Шаг 3: Удаляем комментарии для удаленных карточек (7 записей)
DELETE FROM photo_comments
WHERE participant_id IN (
  SELECT id FROM weekly_contest_participants WHERE deleted_at IS NOT NULL
);

-- Шаг 4: Окончательно удаляем сами удаленные карточки (120 записей)
DELETE FROM weekly_contest_participants
WHERE deleted_at IS NOT NULL;

-- ИТОГО:
-- Удалено 29 голосов
-- Удалено 29 лайков  
-- Удалено 7 комментариев
-- Удалено 120 удаленных карточек
-- 
-- ✅ Все активные карточки на сайте (This Week: 25, Next Week: 18, Past: 20) остались нетронутыми
-- ✅ Удалены только те данные, которые были привязаны к УЖЕ удаленным карточкам
