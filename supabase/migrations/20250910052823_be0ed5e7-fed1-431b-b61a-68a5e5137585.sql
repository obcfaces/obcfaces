-- Изменить rejection_reason_type для поддержки массива причин
ALTER TABLE public.contest_applications 
DROP COLUMN IF EXISTS rejection_reason_type;

-- Добавить новую колонку для массива причин отказа
ALTER TABLE public.contest_applications 
ADD COLUMN rejection_reason_types TEXT[] DEFAULT NULL;

-- Также обновить историю заявок
ALTER TABLE public.contest_application_history 
DROP COLUMN IF EXISTS rejection_reason_type;

ALTER TABLE public.contest_application_history 
ADD COLUMN rejection_reason_types TEXT[] DEFAULT NULL;