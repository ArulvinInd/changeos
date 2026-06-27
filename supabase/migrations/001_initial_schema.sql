-- ChangeOS — initial schema
-- Run this in your Supabase SQL editor or via supabase db push

-- ─────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  display_name text,
  avatar_url  text,
  timezone    text not null default 'UTC',
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users manage own profile"
  on public.profiles for all
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on sign up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- GOALS
-- ─────────────────────────────────────────
create table if not exists public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles on delete cascade,
  title       text not null,
  description text,
  category    text not null default 'Custom',
  icon        text not null default '🎯',
  color       text not null default '#6366f1',
  start_date  date not null default current_date,
  target_date date,
  status      text not null default 'active'
                check (status in ('active','paused','completed','archived')),
  created_at  timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "Users manage own goals"
  on public.goals for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- HABITS
-- ─────────────────────────────────────────
create table if not exists public.habits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles on delete cascade,
  goal_id        uuid not null references public.goals on delete cascade,
  title          text not null,
  type           text not null default 'binary'
                   check (type in ('binary','measurable','timed')),
  frequency      text not null default 'daily'
                   check (frequency in ('daily','specific_days','x_per_week')),
  specific_days  text[],
  x_per_week     integer check (x_per_week between 1 and 7),
  target_value   float,
  unit           text,
  difficulty     text not null default 'medium'
                   check (difficulty in ('easy','medium','hard')),
  reminder_time  time,
  why            text,
  status         text not null default 'active'
                   check (status in ('active','paused','archived')),
  created_at     timestamptz not null default now()
);

alter table public.habits enable row level security;

create policy "Users manage own habits"
  on public.habits for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- HABIT_LOGS
-- ─────────────────────────────────────────
create table if not exists public.habit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles on delete cascade,
  habit_id   uuid not null references public.habits on delete cascade,
  log_date   date not null,
  completed  boolean not null default false,
  value      float,
  notes      text,
  logged_at  timestamptz not null default now(),
  -- Enforce one log per (habit, day) — duplicate check-ins handled gracefully in app
  unique (habit_id, log_date)
);

alter table public.habit_logs enable row level security;

create policy "Users manage own habit_logs"
  on public.habit_logs for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index habit_logs_user_date on public.habit_logs (user_id, log_date);

-- ─────────────────────────────────────────
-- ROUTINES
-- ─────────────────────────────────────────
create table if not exists public.routines (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles on delete cascade,
  title          text not null,
  time_of_day    text not null default 'morning'
                   check (time_of_day in ('morning','afternoon','evening','custom')),
  scheduled_time time,
  days           text[] not null default '{}',
  color          text not null default '#6366f1',
  icon           text not null default '⭐',
  created_at     timestamptz not null default now()
);

alter table public.routines enable row level security;

create policy "Users manage own routines"
  on public.routines for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- ROUTINE_HABITS
-- ─────────────────────────────────────────
create table if not exists public.routine_habits (
  id                uuid primary key default gen_random_uuid(),
  routine_id        uuid not null references public.routines on delete cascade,
  habit_id          uuid not null references public.habits on delete cascade,
  "order"           integer not null default 0,
  estimated_minutes integer
);

alter table public.routine_habits enable row level security;

-- Access via join with routines owned by the user
create policy "Users manage own routine_habits"
  on public.routine_habits for all
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- STREAKS
-- ─────────────────────────────────────────
create table if not exists public.streaks (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles on delete cascade,
  habit_id             uuid not null references public.habits on delete cascade,
  current_streak       integer not null default 0,
  longest_streak       integer not null default 0,
  last_completed_date  date,
  grace_used           boolean not null default false,
  updated_at           timestamptz not null default now(),
  unique (habit_id, user_id)
);

alter table public.streaks enable row level security;

create policy "Users manage own streaks"
  on public.streaks for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger: recalculate streak on every habit_log upsert
create or replace function public.recalculate_streak()
returns trigger language plpgsql security definer as $$
declare
  v_streak    integer := 0;
  v_longest   integer := 0;
  v_grace     boolean := false;
  v_prev_date date;
  v_cur_date  date;
  v_check     record;
begin
  -- Walk backwards through completed logs for this habit
  for v_check in
    select log_date
    from public.habit_logs
    where habit_id = new.habit_id and completed = true
    order by log_date desc
  loop
    if v_cur_date is null then
      v_cur_date := v_check.log_date;
      v_streak := 1;
    else
      if v_check.log_date = v_cur_date - 1 then
        v_streak := v_streak + 1;
        v_cur_date := v_check.log_date;
      else
        exit; -- streak broken
      end if;
    end if;
  end loop;

  -- Fetch existing to preserve longest
  select longest_streak into v_longest
  from public.streaks
  where habit_id = new.habit_id and user_id = new.user_id;

  v_longest := greatest(coalesce(v_longest, 0), v_streak);

  insert into public.streaks (user_id, habit_id, current_streak, longest_streak, last_completed_date, updated_at)
  values (new.user_id, new.habit_id, v_streak, v_longest, new.log_date, now())
  on conflict (habit_id, user_id) do update
    set current_streak      = excluded.current_streak,
        longest_streak      = excluded.longest_streak,
        last_completed_date = excluded.last_completed_date,
        updated_at          = excluded.updated_at;

  return new;
end;
$$;

create or replace trigger after_habit_log_upsert
  after insert or update on public.habit_logs
  for each row when (new.completed = true)
  execute procedure public.recalculate_streak();

-- ─────────────────────────────────────────
-- AI_INSIGHTS
-- ─────────────────────────────────────────
create table if not exists public.ai_insights (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles on delete cascade,
  type         text not null
                 check (type in ('weekly_review','pattern','suggestion','nudge')),
  content      text not null,
  dismissed    boolean not null default false,
  generated_at timestamptz not null default now()
);

alter table public.ai_insights enable row level security;

create policy "Users manage own ai_insights"
  on public.ai_insights for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
