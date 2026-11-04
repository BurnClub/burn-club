-- A member's history must not be destroyable by content integrity (2026-10-27).
--
-- Two days into the trial, the server held ZERO completions for all six
-- testers, while at least two of them had definitely trained.
--
-- `completions.workout_id` was a foreign key to `workouts`, and the trial
-- workouts have never existed in that table — they live in data.js and in
-- admin's localStorage. Only the `programs` rows were ever written server-side
-- (21- and 23-), so the foreign key accepted the member's PROGRAMME and then
-- refused every WORKOUT they did on it. Each completion was rejected on
-- insert, the sync recorded an error nobody sees, and the member's app went on
-- showing the workout as done because it is done — locally.
--
-- `lifts.exercise_id` is the same shape, and worse in one way: lifts push only
-- after their completion lands, so a lift failing marks the whole completions
-- store unsynced. Ten exercise ids were corrected in data.js on 2026-09-24 and
-- the server's `exercises` table still has the old ones, so that path was
-- already primed to fail for those.
--
-- WHY DROPPING THEM IS RIGHT, not a shortcut. Both tables already copy what
-- they need: `completions.title` is copied at the time so editing a workout
-- next month cannot rewrite what somebody did last month, and `lifts`
-- carries `exercise_name` for the same reason. The foreign keys add no
-- information those copies do not already hold — they only add a way to LOSE
-- the record. That is the wrong trade for a member's own history.
--
-- They can come back when admin content lives on the server and a workout id
-- is guaranteed to resolve. Until then the server cannot enforce integrity
-- over content it does not have.

alter table completions drop constraint if exists completions_workout_id_fkey;
alter table lifts       drop constraint if exists lifts_exercise_id_fkey;

-- What should happen next: every tester's app has these completions queued in
-- local storage with the store marked unsynced, so the next time each of them
-- opens the app it retries and they land. Nothing needs re-doing by hand.
--
-- DO NOT clear site data on a tester's phone before they have opened the app
-- once after this runs — that local copy is the only copy.

select m.first_name || ' ' || coalesce(m.last_name, '') as name,
       count(c.id)         as workouts_logged,
       max(c.performed_on) as last_workout
  from members m
  left join completions c on c.member_id = m.id
 where m.program_id is not null
 group by m.id, m.first_name, m.last_name
 order by workouts_logged, name;
