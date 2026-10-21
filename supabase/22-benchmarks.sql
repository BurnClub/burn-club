-- Benchmarks: survive deletion, and add the trial's one (2026-10-21).
--
-- Three separate things, all small, all decided by Chris on 2026-10-21:
--
--   1. Deleting a benchmark must NOT delete members' results. Today
--      benchmark_results.benchmark_id is `not null references benchmarks(id)
--      on delete cascade`, so removing a benchmark in admin would wipe every
--      member's history for it. Chris: "Keep the workout data. only thing
--      that gets deleted should be the view of that specific benchmark from
--      the progress page, and likely replaced by another one."
--
--      This is the same decision already made for workouts, where
--      completions.workout_id is ON DELETE SET NULL with the title copied
--      onto the completion so history survives. Benchmarks now match.
--
--   2. A result has to be able to say what it was a result FOR once its
--      benchmark is gone, so the name is copied onto the row at save time —
--      again, exactly how completions carry the workout title.
--
--   3. The trial program needs its one benchmark on the server, because
--      benchmark_results.benchmark_id is a foreign key: without the row, a
--      tester's self-logged 500m time is REJECTED by the database and sync
--      records an error the member never sees.

-- ---------------------------------------------------------------- 1 and 2
alter table benchmark_results
  add column if not exists benchmark_name text;

alter table benchmark_results
  alter column benchmark_id drop not null;

alter table benchmark_results
  drop constraint if exists benchmark_results_benchmark_id_fkey;

alter table benchmark_results
  add constraint benchmark_results_benchmark_id_fkey
  foreign key (benchmark_id) references benchmarks(id) on delete set null;

-- Backfill the name on results that pre-date the column, while their
-- benchmarks still exist to read it from.
update benchmark_results r
   set benchmark_name = b.name
  from benchmarks b
 where b.id = r.benchmark_id
   and r.benchmark_name is null;

-- ---------------------------------------------------------------------- 3
-- Self-logged, so no workout is tagged with it: tapping the card opens a
-- time entry rather than a workout. Scored by time, faster is better.
insert into benchmarks (id, program_id, name, subtitle, score_type) values
  ('bct-500m-sprint', 'burn-club-test-1791470187441', '500m Sprint', 'For Time', 'time')
on conflict (id) do update
  set program_id = excluded.program_id,
      name       = excluded.name,
      subtitle   = excluded.subtitle,
      score_type = excluded.score_type;

-- ------------------------------------------------------------------ tidy
-- The three seeded Burn Club rows were named "Benchmark A/B/C" with the real
-- name buried in the subtitle, while the member app has always shown "The
-- Gauntlet / 12-Minute AMRAP". Harmless while the app bundles its own copy;
-- wrong the moment it reads these. Aligned now so the two can't disagree.
update benchmarks set name = 'The Gauntlet',   subtitle = '12-Minute AMRAP' where id = 'benchmark-a';
update benchmarks set name = 'Sprint 500m',    subtitle = 'For Time'        where id = 'benchmark-b';
update benchmarks set name = 'Endurance Test', subtitle = '15-Minute AMRAP' where id = 'benchmark-c';

select b.id, b.program_id, b.name, b.subtitle, b.score_type,
       (select count(*) from benchmark_results r where r.benchmark_id = b.id) as results
  from benchmarks b
 order by b.program_id, b.name;
