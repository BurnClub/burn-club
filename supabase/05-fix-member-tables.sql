-- Correct the member-owned tables against what the app actually stores.
-- (2026-09-19) Run once. No member data exists yet, so the two wrong tables
-- are dropped and rebuilt rather than migrated.
--
-- These were written from a design document instead of from the code, and the
-- code is the thing that has to match. Found while mapping the app's objects
-- onto rows for the storage swap — before any member data existed, which is
-- the only reason this is a rewrite and not a migration.

-- ---------------------------------------------------------------- checkins
-- Was: energy, soreness, mood — three columns the app never writes, and
-- missing the two it does. The app asks exactly two scales, "Mentally" and
-- "Physically", and admin can retitle them but cannot add a third, so fixed
-- columns are right. sharedAt records a check-in the member chose to share
-- with their coach; without it that choice was silently dropped.
--
-- The check constraint was wrong too, and would have rejected every insert:
-- sleep quality values are stored lowercase ('bad','ok','good','great'), not
-- capitalised.
drop table if exists checkins;

create table checkins (
  member_id     uuid not null references members(id) on delete cascade,
  performed_on  date not null,
  mental        int check (mental between 1 and 10),
  physical      int check (physical between 1 and 10),
  sleep_hours   numeric(3,1) check (sleep_hours between 0 and 10),
  sleep_quality text check (sleep_quality in ('bad','ok','good','great')),
  note          text,
  shared_at     timestamptz,
  primary key (member_id, performed_on)
);

-- ----------------------------------------------------------- member_habits
-- Was member_id + label only, which silently dropped `auto` and `target`.
-- Those are not decoration: `auto` ties a habit to a wearable metric so it
-- ticks itself, and `target` is the threshold that counts as done. A habit
-- imported without them stops being automatic and quietly becomes manual.
drop table if exists member_habits;

create table member_habits (
  member_id uuid not null references members(id) on delete cascade,
  habit_id  text not null,
  label     text not null,
  auto      text,          -- e.g. 'steps'; null for a manual habit
  target    int,           -- threshold that counts as done
  position  int not null default 0,
  primary key (member_id, habit_id)
);

-- habit_checks referenced habits by label, which breaks the moment a habit is
-- renamed. Keyed on habit_id now, matching the table above.
drop table if exists habit_checks;

create table habit_checks (
  member_id  uuid not null references members(id) on delete cascade,
  habit_id   text not null,
  checked_on date not null,
  primary key (member_id, habit_id, checked_on)
);

-- ------------------------------------------------------- idempotent writes
-- The app generates its own id for a completion ("local-1758…") before it
-- reaches the server. Carrying it lets a retried sync recognise a row it has
-- already written instead of inserting it twice — which is exactly what a
-- flaky gym connection produces.
alter table completions add column if not exists client_id text;
create unique index if not exists completions_member_client
  on completions (member_id, client_id) where client_id is not null;

alter table benchmark_results add column if not exists client_id text;
create unique index if not exists benchmark_results_member_client
  on benchmark_results (member_id, client_id) where client_id is not null;

-- ------------------------------------------------------------ re-apply RLS
-- A dropped table takes its policies and grants with it. Without this the
-- rebuilt tables would be readable by any signed-in member, which is the
-- opposite of the point.
do $$
declare t text;
begin
  foreach t in array array['checkins','member_habits','habit_checks'] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "own rows" on %I for all to authenticated '
      || 'using (member_id = auth.uid()) with check (member_id = auth.uid())', t);
    execute format(
      'create policy "staff read all" on %I for select to authenticated using (is_staff())', t);
    execute format('grant select, insert, update, delete on %I to authenticated', t);
  end loop;
end $$;

-- Prove it rather than assume it: every one of these must come back with RLS
-- on and two policies.
select tablename,
       rowsecurity as rls_on,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = t.tablename) as policies
from pg_tables t
where schemaname = 'public'
  and tablename in ('checkins','member_habits','habit_checks','completions','benchmark_results')
order by tablename;
