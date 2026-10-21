-- Burn Club Test, the trial programme (2026-10-20).
--
-- The first real content Chris built in admin, exported and migrated across.
-- The WORKOUTS live in data.js — the member app still bundles its content —
-- so this file exists for one reason only: `members.program_id` is a foreign
-- key to `programs`, and without a row here the member modal refuses every
-- assignment with "violates foreign key constraint members_program_id_fkey".
-- That is the error Chris hit on 2026-10-13.
--
-- The id is the one admin generated and is deliberately NOT tidied up. It is
-- the key the workouts in data.js reference and the key every member row will
-- carry; renaming it here would desync this from admin, which still holds the
-- long id and would hand it back on the next export.

insert into programs (id, name, schedule_type, status, circuits_per_week, description, color)
values (
  'burn-club-test-1791470187441',
  'Burn Club Test',
  'rolling',
  'active',
  3,
  'Program to be used to for real members to test app with Burn Club Program',
  'green'
)
on conflict (id) do update
  set name              = excluded.name,
      schedule_type     = excluded.schedule_type,
      status            = excluded.status,
      circuits_per_week = excluded.circuits_per_week,
      description       = excluded.description,
      color             = excluded.color;

-- Rolling, so no duration_weeks and no schedule_slots: a rolling programme has
-- no day-by-day template. Its workouts surface from `availableFrom` instead,
-- which is why the three circuits are dated to Monday 2026-10-26.

select id, name, schedule_type, status, circuits_per_week from programs order by name;
