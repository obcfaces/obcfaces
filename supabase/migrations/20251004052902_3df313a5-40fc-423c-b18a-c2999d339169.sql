-- Удаление дубликатов (оставляем приоритетные карточки)
-- Всего удаляем 19 дубликатов

-- Список карточек для удаления:
-- 1. Ellaiza Mae Sayson (2 карточки) - удаляем более новую
-- 2. Edjei Mae Castro (3 карточки) - оставляем с 1 голосом, удаляем 2 другие
-- 3. Charmel Cabiles (2 карточки) - удаляем неактивную
-- 4. Jamie Palalon (2 карточки) - удаляем более новую
-- 5. Kryssia Camille Ramirez (2 карточки) - удаляем более новую
-- 6. Mary Joy Balandra (2 карточки) - удаляем более новую
-- 7. judy ann sario (2 карточки) - удаляем более новую
-- 8. Angeline Rebotazo (3 карточки) - оставляем с 1 голосом, удаляем 2 другие
-- 9. Shalymar Oroc (3 карточки) - оставляем с 1 голосом, удаляем 2 другие
-- 10. Julie Perino (3 карточки) - оставляем 'next week on site', удаляем 2 'next week'
-- 11. JANINE GEDORIO (3 карточки) - оставляем с 1 голосом, удаляем 2 другие
-- 12. Ellaiza Mae Sayson (2 карточки) - удаляем более новую

-- Шаг 1: Удаляем голоса для дубликатов
DELETE FROM contestant_ratings
WHERE participant_id IN (
  'a24296fb-0c9d-45e8-8a03-0f8e9879c47c', -- Ellaiza Mae Sayson (новая)
  '1cd61b42-5b71-4c77-821a-95db3a8aace6', -- Edjei Mae Castro
  'bb2b054b-7871-4161-a1aa-97224a75a358', -- Edjei Mae Castro (pending)
  'd592f588-957d-4195-93c4-20d5bab7f24a', -- Charmel Cabiles (неактивная)
  '5b163d73-1bd2-409b-8098-edf2f0ecf254', -- Jamie Palalon (новая)
  '5144fe77-a76f-4879-8f00-4e5a179b7bcb', -- Kryssia Camille Ramirez (новая)
  'ca1485d7-3f0b-4103-8cec-f144b351edae', -- Mary Joy Balandra (новая)
  '6e30835c-a1f5-41ea-8c5b-49be15684ba7', -- judy ann sario (новая)
  '77511b0f-d641-438b-a05c-30904c2c33fe', -- Angeline Rebotazo
  '5ce7da6a-6388-48e1-86b7-347a2846a382', -- Angeline Rebotazo (новая)
  '9c276adb-5ee1-4c37-996f-e786f59c67ad', -- Shalymar Oroc
  'aa4b6b60-f42f-421f-a53a-a9062e04883e', -- Shalymar Oroc (новая)
  '0a42ad08-2350-4c9a-8fa3-e7ec1f12e5eb', -- Julie Perino (next week)
  '14c6dadd-5cef-4bb6-9a5a-23fa8464e091', -- Julie Perino (next week новая)
  'e43a7849-c6df-4555-aaa7-05bb08af2a32', -- JANINE GEDORIO
  '9a90e83f-9de7-48f5-970c-fb3e94bc0c5d', -- JANINE GEDORIO (новая)
  '1a72aa47-7c75-4e26-8d27-22086e1ef797', -- Ellaiza Mae Sayson (новая)
  '4834a39e-6f0c-40d3-9f23-3cf46f72bb87', -- Ellaiza Mae Sayson (pre next week новая)
  '0a71b85d-f748-472f-a8e2-1dc89a6ddcf4'  -- Ellaiza Mae Sayson (pre next week)
);

-- Шаг 2: Удаляем лайки для дубликатов
DELETE FROM likes
WHERE participant_id IN (
  'a24296fb-0c9d-45e8-8a03-0f8e9879c47c',
  '1cd61b42-5b71-4c77-821a-95db3a8aace6',
  'bb2b054b-7871-4161-a1aa-97224a75a358',
  'd592f588-957d-4195-93c4-20d5bab7f24a',
  '5b163d73-1bd2-409b-8098-edf2f0ecf254',
  '5144fe77-a76f-4879-8f00-4e5a179b7bcb',
  'ca1485d7-3f0b-4103-8cec-f144b351edae',
  '6e30835c-a1f5-41ea-8c5b-49be15684ba7',
  '77511b0f-d641-438b-a05c-30904c2c33fe',
  '5ce7da6a-6388-48e1-86b7-347a2846a382',
  '9c276adb-5ee1-4c37-996f-e786f59c67ad',
  'aa4b6b60-f42f-421f-a53a-a9062e04883e',
  '0a42ad08-2350-4c9a-8fa3-e7ec1f12e5eb',
  '14c6dadd-5cef-4bb6-9a5a-23fa8464e091',
  'e43a7849-c6df-4555-aaa7-05bb08af2a32',
  '9a90e83f-9de7-48f5-970c-fb3e94bc0c5d',
  '1a72aa47-7c75-4e26-8d27-22086e1ef797',
  '4834a39e-6f0c-40d3-9f23-3cf46f72bb87',
  '0a71b85d-f748-472f-a8e2-1dc89a6ddcf4'
);

-- Шаг 3: Удаляем комментарии для дубликатов
DELETE FROM photo_comments
WHERE participant_id IN (
  'a24296fb-0c9d-45e8-8a03-0f8e9879c47c',
  '1cd61b42-5b71-4c77-821a-95db3a8aace6',
  'bb2b054b-7871-4161-a1aa-97224a75a358',
  'd592f588-957d-4195-93c4-20d5bab7f24a',
  '5b163d73-1bd2-409b-8098-edf2f0ecf254',
  '5144fe77-a76f-4879-8f00-4e5a179b7bcb',
  'ca1485d7-3f0b-4103-8cec-f144b351edae',
  '6e30835c-a1f5-41ea-8c5b-49be15684ba7',
  '77511b0f-d641-438b-a05c-30904c2c33fe',
  '5ce7da6a-6388-48e1-86b7-347a2846a382',
  '9c276adb-5ee1-4c37-996f-e786f59c67ad',
  'aa4b6b60-f42f-421f-a53a-a9062e04883e',
  '0a42ad08-2350-4c9a-8fa3-e7ec1f12e5eb',
  '14c6dadd-5cef-4bb6-9a5a-23fa8464e091',
  'e43a7849-c6df-4555-aaa7-05bb08af2a32',
  '9a90e83f-9de7-48f5-970c-fb3e94bc0c5d',
  '1a72aa47-7c75-4e26-8d27-22086e1ef797',
  '4834a39e-6f0c-40d3-9f23-3cf46f72bb87',
  '0a71b85d-f748-472f-a8e2-1dc89a6ddcf4'
);

-- Шаг 4: Soft delete дубликатов
UPDATE weekly_contest_participants
SET 
  deleted_at = NOW(),
  is_active = false
WHERE id IN (
  'a24296fb-0c9d-45e8-8a03-0f8e9879c47c',
  '1cd61b42-5b71-4c77-821a-95db3a8aace6',
  'bb2b054b-7871-4161-a1aa-97224a75a358',
  'd592f588-957d-4195-93c4-20d5bab7f24a',
  '5b163d73-1bd2-409b-8098-edf2f0ecf254',
  '5144fe77-a76f-4879-8f00-4e5a179b7bcb',
  'ca1485d7-3f0b-4103-8cec-f144b351edae',
  '6e30835c-a1f5-41ea-8c5b-49be15684ba7',
  '77511b0f-d641-438b-a05c-30904c2c33fe',
  '5ce7da6a-6388-48e1-86b7-347a2846a382',
  '9c276adb-5ee1-4c37-996f-e786f59c67ad',
  'aa4b6b60-f42f-421f-a53a-a9062e04883e',
  '0a42ad08-2350-4c9a-8fa3-e7ec1f12e5eb',
  '14c6dadd-5cef-4bb6-9a5a-23fa8464e091',
  'e43a7849-c6df-4555-aaa7-05bb08af2a32',
  '9a90e83f-9de7-48f5-970c-fb3e94bc0c5d',
  '1a72aa47-7c75-4e26-8d27-22086e1ef797',
  '4834a39e-6f0c-40d3-9f23-3cf46f72bb87',
  '0a71b85d-f748-472f-a8e2-1dc89a6ddcf4'
);

-- РЕЗУЛЬТАТ:
-- ✅ Удалено 19 дубликатов
-- ✅ У каждого пользователя осталась только одна приоритетная карточка
-- ✅ Удалены все связанные голоса, лайки и комментарии