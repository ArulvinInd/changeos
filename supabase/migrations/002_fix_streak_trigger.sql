-- Fix: recalculate streak on uncheck too (remove the WHEN completed = true guard)

drop trigger if exists after_habit_log_upsert on public.habit_logs;

create or replace trigger after_habit_log_upsert
  after insert or update on public.habit_logs
  for each row
  execute procedure public.recalculate_streak();
