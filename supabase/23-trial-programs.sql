-- The two trial programmes (2026-10-26).
--
-- Same single purpose as 21-burn-club-test.sql: `members.program_id` is a
-- foreign key to `programs`, and without a row here every assignment is
-- refused with "violates foreign key constraint members_program_id_fkey".
-- The WORKOUTS live in data.js — the member app still bundles its content.
--
-- Both are STRUCTURED, so each member needs a `start_date` as well as a
-- programme: a structured member with no start date hits a dead-end screen.
-- duration_weeks is 1 — these are single trial weeks.
--
-- The ids are the ones admin generated and are deliberately NOT tidied. They
-- are the keys the circuits in data.js reference and that every member row
-- will carry.

insert into programs (id, name, schedule_type, status, duration_weeks, description, color) values
  ('fit-functional-test-week-1792947605130', 'FIT & FUNCTIONAL TEST WEEK', 'structured', 'active', 1, 'Trial week for app testing.', 'green'),
  ('30-minute-burn-test-1792976073830',      '30 MINUTE BURN TEST',        'structured', 'active', 1, 'Trial week for app testing.', 'blue')
on conflict (id) do update
  set name           = excluded.name,
      schedule_type  = excluded.schedule_type,
      status         = excluded.status,
      duration_weeks = excluded.duration_weeks,
      description    = excluded.description,
      color          = excluded.color;

-- No schedule_slots rows on purpose. Every day of both programmes is still a
-- Rest Day in admin, and writing seven rest rows here would record a decision
-- nobody made. They go in when Kelly fills the schedule.

select id, name, schedule_type, status, duration_weeks from programs order by name;
