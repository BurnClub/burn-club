-- Workouts a member saved for themselves (2026-11-04).
--
-- Chris: "Members being able to 'save workouts'. The ask was to be able to
-- mark a workout as a favorite which allows them to access it from their
-- account whenever they want to do a workout."
--
-- NO FOREIGN KEY ON workout_id, and this is the third time that decision has
-- had to be made deliberately. completions.workout_id -> workouts rejected
-- every completion for six testers for two days, silently, because the trial
-- workouts only ever existed in data.js and were never inserted server-side.
-- lifts.exercise_id was the same shape. Circuit ids live in the bundled
-- content, not in a server table, so an FK here would mean a member tapping
-- the heart and nothing happening - with the failure landing in a log nobody
-- reads rather than on their screen.
--
-- The title is carried for the same reason showcased_prs carries a name: a
-- saved workout has to still be readable if the content it points at is
-- renamed or retired. A row pointing at a circuit that no longer exists shows
-- as unavailable rather than disappearing without explanation.
create table if not exists saved_workouts (
  member_id  uuid not null references members(id) on delete cascade,
  workout_id text not null check (length(workout_id) <= 120),
  title      text check (title is null or length(title) <= 200),
  saved_at   timestamptz not null default now(),
  primary key (member_id, workout_id)
);

create index if not exists saved_workouts_member_idx
  on saved_workouts (member_id, saved_at desc);

alter table saved_workouts enable row level security;

-- A member's own list, and nobody else's. Staff can read it - a coach seeing
-- what someone keeps going back to is useful - but cannot write it: this is
-- the member's shelf, not a programming tool.
drop policy if exists "member manages own" on saved_workouts;
create policy "member manages own" on saved_workouts
  for all to authenticated using (member_id = auth.uid()) with check (member_id = auth.uid());

drop policy if exists "staff reads all" on saved_workouts;
create policy "staff reads all" on saved_workouts
  for select to authenticated using (is_staff());

grant select, insert, update, delete on saved_workouts to authenticated;

select policyname, cmd from pg_policies where tablename = 'saved_workouts' order by policyname;
