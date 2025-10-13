-- Исправить v_past_archive: week_index должен быть >= 1 (количество полных недель назад)
CREATE OR REPLACE VIEW public.v_past_archive AS
SELECT
  p.*,
  -- Считаем разницу в неделях: текущий понедельник - week_start карточки
  -- Делим на 7 дней и округляем вверх, чтобы 6 дней назад = week_index 1
  GREATEST(
    CEIL(EXTRACT(EPOCH FROM (public.week_start_wita(now()) - p.week_start)) / (7*24*3600))::int,
    1
  ) AS week_index
FROM public.weekly_contest_participants p
WHERE p.admin_status = 'past';