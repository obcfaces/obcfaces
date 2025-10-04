-- Удаление дубликатов карточек (19 шт.) - оставляем только те, которые на сайте

-- Список ID карточек для удаления (19 шт.)
-- Charmel Cabiles (неактивная), Edjei Mae Castro, Angeline Rebotazo, Shalymar Oroc, 
-- Julie Perino, JANINE GEDORIO, Richelle Delostrico, Vbaby Boy, Glenda Ompad,
-- Sheena Marie Alberio, Jenina Manela, Apple Jess, Catherine Montayre, Dezza May Pico,
-- Ellen Joy Mancera, JM Manabat, Jasmin Colanggo, Merlz Rios, Shekinah Degamo

-- Шаг 1: Удаляем голоса для дубликатов
DELETE FROM contestant_ratings
WHERE participant_id IN (
  '4f263f35-5a4e-4bec-9ae7-d8965090dd44', -- Charmel Cabiles (неактивная)
  '9ac7f4a0-75a8-44dc-86b2-e91c0d71c04c', -- Edjei Mae Castro
  'aae5a8eb-5e1f-4ee2-9ab5-f8c2a8c0a942', -- Angeline Rebotazo
  '7ccff2a7-d4d7-4c04-ba27-9a6017f00bf2', -- Shalymar Oroc
  '30f9ebb9-8d7a-4e76-b10c-5f87bf72e72a', -- Julie Perino
  '59f64c51-13c7-4fa1-8b4c-8bf05a14fc52', -- JANINE GEDORIO
  'acfcf7c3-4bae-47ff-8cfc-6fc89e1e96ad', -- Richelle Delostrico
  'e8fd4a3d-1a4f-4c9f-bdec-7ff1d6a44ee1', -- Vbaby Boy
  'f2e84857-9eb0-4a64-a929-bb560fe00a97', -- Glenda Ompad
  '65e2ce0b-d2f5-401d-9b48-e79b8c5a7301', -- Sheena Marie Alberio
  'd37acf2b-7b5e-4b18-9d8c-c70738e654a7', -- Jenina Manela
  'a1b71f50-4a2f-4b88-87ba-2f64aa123b91', -- Apple Jess
  'cbbf70ad-c804-4a4f-a29e-65f0bf40e1dc', -- Catherine Montayre
  'da9e66f7-8d8d-4a94-969c-c56a2e7dba8f', -- Dezza May Pico
  '9ddaeb29-64a0-4f6c-9bd4-c4fc35e651a7', -- Ellen Joy Mancera
  '64c892b8-5301-4e69-9e25-d2e3f5f9ed22', -- JM Manabat
  'a63f08bd-71da-484f-8e51-a86b4d55ee35', -- Jasmin Colanggo
  'ab3abad5-1740-49f9-83e5-c76f03863adf', -- Merlz Rios
  'de3f96c7-7fb0-4f6d-8f18-d39a3f4a5c89'  -- Shekinah Degamo
);

-- Шаг 2: Удаляем лайки для дубликатов
DELETE FROM likes
WHERE participant_id IN (
  '4f263f35-5a4e-4bec-9ae7-d8965090dd44',
  '9ac7f4a0-75a8-44dc-86b2-e91c0d71c04c',
  'aae5a8eb-5e1f-4ee2-9ab5-f8c2a8c0a942',
  '7ccff2a7-d4d7-4c04-ba27-9a6017f00bf2',
  '30f9ebb9-8d7a-4e76-b10c-5f87bf72e72a',
  '59f64c51-13c7-4fa1-8b4c-8bf05a14fc52',
  'acfcf7c3-4bae-47ff-8cfc-6fc89e1e96ad',
  'e8fd4a3d-1a4f-4c9f-bdec-7ff1d6a44ee1',
  'f2e84857-9eb0-4a64-a929-bb560fe00a97',
  '65e2ce0b-d2f5-401d-9b48-e79b8c5a7301',
  'd37acf2b-7b5e-4b18-9d8c-c70738e654a7',
  'a1b71f50-4a2f-4b88-87ba-2f64aa123b91',
  'cbbf70ad-c804-4a4f-a29e-65f0bf40e1dc',
  'da9e66f7-8d8d-4a94-969c-c56a2e7dba8f',
  '9ddaeb29-64a0-4f6c-9bd4-c4fc35e651a7',
  '64c892b8-5301-4e69-9e25-d2e3f5f9ed22',
  'a63f08bd-71da-484f-8e51-a86b4d55ee35',
  'ab3abad5-1740-49f9-83e5-c76f03863adf',
  'de3f96c7-7fb0-4f6d-8f18-d39a3f4a5c89'
);

-- Шаг 3: Удаляем комментарии для дубликатов
DELETE FROM photo_comments
WHERE participant_id IN (
  '4f263f35-5a4e-4bec-9ae7-d8965090dd44',
  '9ac7f4a0-75a8-44dc-86b2-e91c0d71c04c',
  'aae5a8eb-5e1f-4ee2-9ab5-f8c2a8c0a942',
  '7ccff2a7-d4d7-4c04-ba27-9a6017f00bf2',
  '30f9ebb9-8d7a-4e76-b10c-5f87bf72e72a',
  '59f64c51-13c7-4fa1-8b4c-8bf05a14fc52',
  'acfcf7c3-4bae-47ff-8cfc-6fc89e1e96ad',
  'e8fd4a3d-1a4f-4c9f-bdec-7ff1d6a44ee1',
  'f2e84857-9eb0-4a64-a929-bb560fe00a97',
  '65e2ce0b-d2f5-401d-9b48-e79b8c5a7301',
  'd37acf2b-7b5e-4b18-9d8c-c70738e654a7',
  'a1b71f50-4a2f-4b88-87ba-2f64aa123b91',
  'cbbf70ad-c804-4a4f-a29e-65f0bf40e1dc',
  'da9e66f7-8d8d-4a94-969c-c56a2e7dba8f',
  '9ddaeb29-64a0-4f6c-9bd4-c4fc35e651a7',
  '64c892b8-5301-4e69-9e25-d2e3f5f9ed22',
  'a63f08bd-71da-484f-8e51-a86b4d55ee35',
  'ab3abad5-1740-49f9-83e5-c76f03863adf',
  'de3f96c7-7fb0-4f6d-8f18-d39a3f4a5c89'
);

-- Шаг 4: Soft delete дубликатов (помечаем как удаленные)
UPDATE weekly_contest_participants
SET 
  deleted_at = NOW(),
  is_active = false
WHERE id IN (
  '4f263f35-5a4e-4bec-9ae7-d8965090dd44',
  '9ac7f4a0-75a8-44dc-86b2-e91c0d71c04c',
  'aae5a8eb-5e1f-4ee2-9ab5-f8c2a8c0a942',
  '7ccff2a7-d4d7-4c04-ba27-9a6017f00bf2',
  '30f9ebb9-8d7a-4e76-b10c-5f87bf72e72a',
  '59f64c51-13c7-4fa1-8b4c-8bf05a14fc52',
  'acfcf7c3-4bae-47ff-8cfc-6fc89e1e96ad',
  'e8fd4a3d-1a4f-4c9f-bdec-7ff1d6a44ee1',
  'f2e84857-9eb0-4a64-a929-bb560fe00a97',
  '65e2ce0b-d2f5-401d-9b48-e79b8c5a7301',
  'd37acf2b-7b5e-4b18-9d8c-c70738e654a7',
  'a1b71f50-4a2f-4b88-87ba-2f64aa123b91',
  'cbbf70ad-c804-4a4f-a29e-65f0bf40e1dc',
  'da9e66f7-8d8d-4a94-969c-c56a2e7dba8f',
  '9ddaeb29-64a0-4f6c-9bd4-c4fc35e651a7',
  '64c892b8-5301-4e69-9e25-d2e3f5f9ed22',
  'a63f08bd-71da-484f-8e51-a86b4d55ee35',
  'ab3abad5-1740-49f9-83e5-c76f03863adf',
  'de3f96c7-7fb0-4f6d-8f18-d39a3f4a5c89'
);

-- РЕЗУЛЬТАТ:
-- ✅ Удалено 19 дубликатов карточек
-- ✅ Для каждого пользователя осталась только одна карточка (та, что на сайте)
-- ✅ Удалены все связанные голоса, лайки и комментарии для дубликатов