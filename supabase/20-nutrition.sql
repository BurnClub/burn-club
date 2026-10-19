-- Macro targets, and whether the member tracked (Burn Club, 2026-10-19).
--
-- Chris: "I do not want to be a food tracker whatsoever. I want the member to
-- see targets, and if we can influence people to track, just to help build
-- the discipline/habit — but more importantly, when they are tracking, they
-- are at the same time learning more about food, serving sizes, where
-- calories come from."
--
-- So there is no food here. No meals, no entries, no database of foods. Two
-- tables: what the coach set, and a daily yes/no about whether the member
-- tracked somewhere else. The logging keeps happening in MyFitnessPal, which
-- is the right place for it and the place they already are.

-- ---------------------------------------------------------------- targets
-- COACH-OWNED on purpose. These do not live in health_profile, which is the
-- member's own jsonb and which a member may edit — targets a member can
-- change are not targets. One row per member; nulls mean "not set yet", which
-- is how the app knows to hide the card rather than show four zeros.
create table if not exists member_nutrition (
  member_id   uuid primary key references members(id) on delete cascade,
  calories    int,
  protein_g   int,
  carbs_g     int,
  fat_g       int,
  -- A line from the coach beside the numbers: "protein first, carbs around
  -- training". This is where the teaching Chris is actually after lives —
  -- four numbers on their own explain nothing.
  note        text not null default '',
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------- log
-- One row per member per day, and only ever two booleans.
--
-- `hit_targets` is nullable rather than false-by-default, and the difference
-- matters: null is "didn't say", false is "said no". A member who never
-- tracked cannot answer whether they hit their numbers, so the app only asks
-- the second question once the first is yes. Defaulting it to false would
-- quietly record a failed day every time someone forgot to open the app.
create table if not exists nutrition_log (
  member_id   uuid not null references members(id) on delete cascade,
  log_date    date not null,
  tracked     boolean not null default false,
  hit_targets boolean,
  updated_at  timestamptz not null default now(),
  primary key (member_id, log_date)
);

create index if not exists nutrition_log_member_date_idx
  on nutrition_log (member_id, log_date desc);

-- --------------------------------------------------------------- policies
alter table member_nutrition enable row level security;
alter table nutrition_log   enable row level security;

-- Targets: the member reads their own and cannot write them at all. No
-- member update policy exists, which is the whole point of the table.
drop policy if exists "read own targets" on member_nutrition;
create policy "read own targets"
  on member_nutrition for select to authenticated
  using (member_id = auth.uid() or is_staff());

drop policy if exists "staff set targets" on member_nutrition;
create policy "staff set targets"
  on member_nutrition for all to authenticated
  using (is_staff()) with check (is_staff());

-- The log is the other way round: the member owns it, staff may read it so a
-- coach can see adherence before a check-in call, and staff do NOT write it —
-- nobody should be able to mark someone else's day as tracked.
drop policy if exists "read own log" on nutrition_log;
create policy "read own log"
  on nutrition_log for select to authenticated
  using (member_id = auth.uid() or is_staff());

drop policy if exists "write own log" on nutrition_log;
create policy "write own log"
  on nutrition_log for insert to authenticated
  with check (member_id = auth.uid());

drop policy if exists "update own log" on nutrition_log;
create policy "update own log"
  on nutrition_log for update to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());

-- ----------------------------------------------------------------- grants
-- A grant decides whether a caller may touch the table at all; RLS only
-- decides which rows. 16-messages.sql set `alter default privileges` for
-- exactly this, so these two inherit it — the explicit grants are belt and
-- braces for a database where that default did not apply.
grant select, insert, update, delete on table member_nutrition to authenticated;
grant select, insert, update, delete on table nutrition_log    to authenticated;

-- Give the demo account something to show.
insert into member_nutrition (member_id, calories, protein_g, carbs_g, fat_g, note)
select id, 2100, 165, 190, 65,
       'Protein first — hit that number every day. Carbs around training, fat fills the rest.'
from members where email = 'jordan.tester@kellyyager.com'
on conflict (member_id) do update
  set calories = excluded.calories, protein_g = excluded.protein_g,
      carbs_g = excluded.carbs_g, fat_g = excluded.fat_g,
      note = excluded.note, updated_at = now();

-- `tbl`, not `table` — the latter is a reserved word and the editor refuses it.
select 'member_nutrition' as tbl, count(*) from member_nutrition
union all
select 'nutrition_log', count(*) from nutrition_log;
