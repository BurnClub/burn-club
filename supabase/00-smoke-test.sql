-- Smoke test for the two literal patterns the seed depends on.
-- Temp tables only: touches nothing, and vanishes when the session ends.
-- Run this before a 262KB paste, so a type fault costs a second not a retry.

-- 1. a jsonb column fed an array value (this failed on app_settings.teamNames)
create temp table probe_json (k text primary key, v jsonb);
insert into probe_json (k, v) values
  ($s$teamNames$s$, $s$["Red", "Blue", "Green"]$s$::jsonb),
  ($s$scoring$s$,   $s${"cardioPoints": 5}$s$::jsonb);

-- 2. a VALUES subquery joined back for a generated id, where the first row's
--    numeric columns are null (this failed on block_exercises.sets)
create temp table probe_blocks (
  id bigint generated always as identity primary key,
  workout_id text, position int, unique (workout_id, position));
create temp table probe_ex (
  block_id bigint, position int, exercise_id text, sets int, reps int);

insert into probe_blocks (workout_id, position) values ('w1', 1), ('w1', 2);

insert into probe_ex (block_id, position, exercise_id, sets, reps)
select b.id, v.position, v.exercise_id, v.sets, v.reps from (values
  ($s$w1$s$::text, 1::int, 1::int, $s$jump-squats$s$::text, null::int, null::int),
  ($s$w1$s$,       1,      2,      $s$push-ups$s$,          null,      null),
  ($s$w1$s$,       2,      1,      $s$goblet-squat$s$,      4,         10)
) as v(workout_id, block_position, position, exercise_id, sets, reps)
join probe_blocks b on b.workout_id = v.workout_id and b.position = v.block_position;

-- 3. the array and text-array literals the seed uses elsewhere
create temp table probe_arrays (tags text[], scheme int[]);
insert into probe_arrays (tags, scheme) values
  (array[$s$Chest$s$, $s$Back$s$]::text[], '{10,8,6,4,2}');

select 'all patterns ok'              as result,
       (select count(*) from probe_json)   as jsonb_rows,
       (select count(*) from probe_ex)     as joined_rows,
       (select count(*) from probe_arrays) as array_rows;
