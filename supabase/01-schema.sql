-- Burn Club — schema (2026-09-18)
-- Run once, in the Supabase SQL editor, before 02-policies.sql.
--
-- Phase 1: what the member app needs. Messaging, groups and challenge teams
-- are phase 2 and deliberately absent — testers can break the training app
-- without them, and they are the one area where a wrong policy leaks a
-- conversation rather than a preference.
--
-- Two conventions worth knowing before reading:
--   * Content ids are the text slugs the apps already use ('goblet-squat',
--     'tmb-w3-d2-home'), not uuids. They are authored, stable, and in the
--     exercises' case the id IS the video filename.
--   * Anything a member owns carries member_id and is covered by RLS in
--     02-policies.sql. Nothing here is readable without a policy.

-- ============================================================ content
-- Authored in admin, read by every signed-in member.

create table programs (
  id                text primary key,
  name              text not null,
  schedule_type     text not null check (schedule_type in ('rolling','structured')),
  status            text not null default 'active',
  duration_weeks    int,                    -- structured only
  workouts_per_week int,                    -- structured only
  circuits_per_week int,                    -- rolling only
  description       text,
  color             text
);

create table folders (
  id         text primary key,
  name       text not null,
  program_id text references programs(id) on delete cascade,
  is_live    boolean not null default false
);

create table exercises (
  id           text primary key,
  name         text not null,
  body_parts   text[] not null default '{}',
  equipment    text[] not null default '{}',
  modality     text not null default 'Strength',
  technique    text not null default '',
  track_weight boolean not null default false,
  -- The file is <id>.mp4 by convention, so this is generated rather than
  -- stored: one less thing to keep in sync, and it cannot drift from the id.
  video_path   text generated always as (id || '.mp4') stored
);

create table workouts (
  id            text primary key,
  -- Nullable on purpose: a draft sitting in the shared Working Folder belongs
  -- to no program yet, and foundations-intro is exactly that today. Requiring
  -- a program here would make an ordinary authoring state unrepresentable.
  program_id    text references programs(id) on delete cascade,
  folder_id     text references folders(id) on delete set null,
  -- Structured: slot_id is the session both variants share.
  slot_id       text,
  variant       text check (variant in ('home','gym')),
  -- Rolling: availability is a date instead.
  available_from date,
  is_always     boolean not null default false,
  category      text not null,
  tag           text,
  title         text not null,
  focus         text,
  difficulty    text,
  description   text,
  is_benchmark  boolean not null default false,
  benchmark_id  text,
  -- One Home and one Gym per session, enforced here rather than hoped for.
  unique (slot_id, variant)
);
create index on workouts (program_id);
create index on workouts (folder_id);

create table workout_blocks (
  id           bigint generated always as identity primary key,
  workout_id   text not null references workouts(id) on delete cascade,
  position     int not null,
  type         text not null check (type in ('straight','superset','interval','amrap','emom','ladder')),
  label        text,
  rounds       int,
  work_sec     int,
  rest_sec     int,
  duration_sec int,
  interval_sec int,
  scheme       int[],
  unique (workout_id, position)
);

create table block_exercises (
  id          bigint generated always as identity primary key,
  block_id    bigint not null references workout_blocks(id) on delete cascade,
  position    int not null,
  -- A real foreign key. Today a workout names its exercise as a string, which
  -- is exactly how an exercise silently loses its technique text and video.
  -- The database can simply refuse a name that isn't in the library.
  exercise_id text not null references exercises(id),
  sets        int,
  reps        int,
  unique (block_id, position)
);

create table schedule_slots (
  program_id      text not null references programs(id) on delete cascade,
  day             int not null,               -- absolute: 1 .. weeks * 7
  type            text not null check (type in ('workout','rest')),
  workout_slot_id text,                       -- null on rest days
  primary key (program_id, day)
);

create table benchmarks (
  id         text primary key,
  program_id text not null references programs(id) on delete cascade,
  name       text not null,
  subtitle   text,
  score_type text not null check (score_type in ('rounds','time','reps','weight'))
);

create table app_settings   ( key text primary key, value jsonb not null );
create table block_format_notes ( block_type text primary key, body text not null );

-- ============================================================ people

create table members (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  first_name   text not null,
  last_name    text,
  program_id   text references programs(id),
  access       text check (access in ('home','gym','both')),
  start_date   date,                          -- structured only
  member_since date,
  badge        text,
  -- Default is the least privileged value on purpose: a row created by any
  -- path that forgets to set this is a member, never staff.
  role         text not null default 'member' check (role in ('member','staff','admin')),
  created_at   timestamptz not null default now()
);

-- Coach-only fields live here rather than on members, because Postgres RLS is
-- ROW-level: a policy letting a member read their own row returns every column
-- of it. No member policy touches this table at all.
create table member_private (
  member_id        uuid primary key references members(id) on delete cascade,
  coach_notes      text not null default '',
  status           text not null default 'active',
  point_adjustment int not null default 0
);

-- ============================================================ member-owned
-- Thirteen tables, holding what were fifteen browser-local stores
-- (member_preferences absorbs four of them). Every one carries member_id and
-- gets the same policy pair. This is the surface a security review reviews.

create table completions (
  id             bigint generated always as identity primary key,
  member_id      uuid not null references members(id) on delete cascade,
  workout_id     text references workouts(id) on delete set null,
  slot_id        text,
  -- Copied at the time, deliberately. Editing a workout next month must not
  -- rewrite what somebody did last month.
  title          text not null,
  category       text,
  performed_on   date not null,
  minutes        int,
  calories       int,
  avg_heart_rate int,
  rpe            int check (rpe between 1 and 10),
  created_at     timestamptz not null default now()
);
create index on completions (member_id, performed_on desc);
create index on completions (workout_id) where rpe is not null;  -- the RPE median

create table lifts (
  id            bigint generated always as identity primary key,
  member_id     uuid not null references members(id) on delete cascade,
  completion_id bigint references completions(id) on delete cascade,
  exercise_id   text not null references exercises(id),
  weight        numeric(6,2) not null,
  reps          int,
  performed_on  date not null
);
-- Personal bests and the progress chart are queries over this, not a second
-- stored copy that can disagree with it.
create index on lifts (member_id, exercise_id, performed_on desc);

create table checkins (
  member_id     uuid not null references members(id) on delete cascade,
  performed_on  date not null,
  energy        int check (energy between 1 and 10),
  soreness      int check (soreness between 1 and 10),
  mood          int check (mood between 1 and 10),
  sleep_hours   numeric(3,1) check (sleep_hours between 0 and 10),
  sleep_quality text check (sleep_quality in ('Bad','OK','Good','Great')),
  note          text,
  primary key (member_id, performed_on)       -- one per member per day
);

create table member_habits (
  member_id uuid not null references members(id) on delete cascade,
  label     text not null,
  primary key (member_id, label)
);

create table habit_checks (
  member_id  uuid not null references members(id) on delete cascade,
  label      text not null,
  checked_on date not null,
  primary key (member_id, label, checked_on)
);

create table benchmark_results (
  id           bigint generated always as identity primary key,
  member_id    uuid not null references members(id) on delete cascade,
  benchmark_id text not null references benchmarks(id) on delete cascade,
  performed_on date not null,
  score        text not null
);
create index on benchmark_results (member_id, benchmark_id, performed_on desc);

create table notebook_notes (
  member_id uuid not null references members(id) on delete cascade,
  note_date date not null,
  body      text not null default '',
  primary key (member_id, note_date)
);

create table session_notes (
  completion_id bigint primary key references completions(id) on delete cascade,
  member_id     uuid not null references members(id) on delete cascade,
  body          text not null default ''
);

create table showcased_prs (
  member_id   uuid not null references members(id) on delete cascade,
  exercise_id text not null references exercises(id) on delete cascade,
  primary key (member_id, exercise_id)
);

create table daily_stats (
  member_id  uuid not null references members(id) on delete cascade,
  stat_date  date not null,
  steps      int,
  calories   int,
  resting_hr int,
  primary key (member_id, stat_date)
);

create table in_progress_workout (
  member_id  uuid primary key references members(id) on delete cascade,
  workout_id text references workouts(id) on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Four browser-local keys in one row: theme, tour flag, check-in switch and
-- notification toggles were all per-browser, so a reinstall replayed the tour
-- for someone who had finished it and re-asked about check-ins after they had
-- turned them off.
create table member_preferences (
  member_id            uuid primary key references members(id) on delete cascade,
  theme                text not null default 'system' check (theme in ('system','light','dark')),
  tour_seen            boolean not null default false,
  checkin_enabled      boolean not null default true,
  checkin_dismissed_on date,
  notification_prefs   jsonb not null default '{}'::jsonb,
  wearable             jsonb not null default '{}'::jsonb
);

create table health_profile (
  member_id  uuid primary key references members(id) on delete cascade,
  profile    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
