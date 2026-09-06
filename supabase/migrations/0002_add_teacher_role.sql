-- =============================================================================
-- إضافة دور "الأستاذ" إلى user_role
-- Add the 'teacher' value to the user_role enum.
--
-- NOTE: this must live in its own migration. Postgres allows ALTER TYPE ... ADD
-- VALUE inside a transaction, but the new value cannot be *used* until that
-- transaction commits — so later migrations reference 'teacher' safely, this
-- one must not.
-- =============================================================================
alter type public.user_role add value if not exists 'teacher';
