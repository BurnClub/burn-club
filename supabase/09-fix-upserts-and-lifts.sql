-- Two fixes, both exposed by the first real member data (2026-09-19).
-- Run after 08.

-- ------------------------------------------------- 1. upserts had no target
-- completions and benchmark_results were given PARTIAL unique indexes
-- ("... where client_id is not null"). Postgres can only infer a partial index
-- for ON CONFLICT when the statement carries a matching WHERE clause, and the
-- client never sends one — so every upsert failed with "no unique or exclusion
-- constraint matching the ON CONFLICT specification".
--
-- The failure was invisible: the push returned false, the queue re-armed, and
-- the member's completion sat on their phone looking saved. A real unique
-- constraint is what ON CONFLICT can actually use. Nulls stay distinct under
-- a unique constraint, so rows without a client_id are still allowed.
drop index if exists completions_member_client;
drop index if exists benchmark_results_member_client;

alter table completions
  add constraint completions_member_client unique (member_id, client_id);
alter table benchmark_results
  add constraint benchmark_results_member_client unique (member_id, client_id);

-- --------------------------------------------------- 2. lifts can now sync
-- A completion carries its weights as { exerciseName: weight }, written the
-- moment the workout ends — before any server id exists. Keyed on the client's
-- completion id for the same reason session_notes is.
alter table lifts add column if not exists completion_client_id text;

-- The app works in exercise NAMES: that is what a workout block carries and
-- what a personal best is computed against. Resolving to exercises(id) on the
-- way in would fail silently for anything unresolvable, and that failure looks
-- like a member's personal best disappearing — the same reasoning as
-- showcased_prs.
alter table lifts add column if not exists exercise_name text;
alter table lifts alter column exercise_id drop not null;

-- One weight per exercise per completion.
alter table lifts
  add constraint lifts_member_completion_exercise
  unique (member_id, completion_client_id, exercise_name);

select conname, contype
from pg_constraint
where conrelid in ('completions'::regclass, 'benchmark_results'::regclass, 'lifts'::regclass)
  and contype = 'u'
order by conname;
