-- Burn Club — row level security (2026-09-18)
-- Run after 01-schema.sql.
--
-- The point of doing isolation here rather than in application code: the app
-- never has the power to read another member's rows, so no forgotten filter
-- can leak them. Every table below gets RLS enabled; a table with RLS on and
-- no matching policy returns nothing, which is the right direction to fail.

-- ---------------------------------------------------------------- helper
-- security definer so that checking a role does not itself trip the policy on
-- members — that is the classic RLS recursion, and it is worth getting right
-- once here rather than debugging it later inside a dozen policies.
-- search_path is pinned because a security definer function that resolves
-- names through the caller's search_path is a privilege-escalation hole.
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from members
    where id = auth.uid() and role in ('staff','admin')
  );
$$;

revoke execute on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- ---------------------------------------------------------------- grants
-- RLS decides which ROWS a caller sees; a GRANT decides whether it may touch
-- the table at all, and the two are separate. Without these, a signed-in
-- member gets "permission denied for table" before any policy is consulted —
-- which is exactly what an anonymous probe returned against this database
-- before they were added. Supabase sets default privileges for tables made
-- through the dashboard; tables created by a script cannot rely on that, so
-- the grants are explicit here.
--
-- Broad grants to authenticated are correct BECAUSE RLS is on: the policies
-- below are the real gate, and a grant without a matching policy still
-- returns nothing. anon is granted nothing at all — the app requires sign-in.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
-- Identity columns draw from sequences; without this an insert fails on the
-- sequence rather than the table, which is a confusing place to land.
grant usage, select on all sequences in schema public to authenticated;

-- ---------------------------------------------------------------- content
-- Any signed-in member reads. Only staff write. Applied in a loop so that a
-- table added later cannot quietly miss one of the four policies.
do $$
declare t text;
begin
  foreach t in array array[
    'programs','folders','exercises','workouts','workout_blocks',
    'block_exercises','schedule_slots','benchmarks','app_settings',
    'block_format_notes'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "signed-in members read" on %I for select to authenticated using (true)', t);
    execute format(
      'create policy "staff write" on %I for all to authenticated using (is_staff()) with check (is_staff())', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- members
alter table members enable row level security;

create policy "read own profile" on members
  for select to authenticated using (id = auth.uid());

create policy "update own profile" on members
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- That policy is row-level, so on its own it would let a member change ANY
-- column of their own row — role included, which makes them staff and opens
-- every other member's data. This trigger narrows it to what a member may
-- actually edit about themselves: their name. Staff and direct database
-- sessions (auth.uid() is null) pass.
create or replace function public.protect_member_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not is_staff() then
    if new.role         is distinct from old.role
    or new.program_id   is distinct from old.program_id
    or new.start_date   is distinct from old.start_date
    or new.access       is distinct from old.access
    or new.email        is distinct from old.email
    or new.member_since is distinct from old.member_since
    or new.badge        is distinct from old.badge
    or new.data_epoch   is distinct from old.data_epoch
    or new.id           is distinct from old.id then
      raise exception 'Only your coach can change that.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_member_columns
  before update on members
  for each row execute function public.protect_member_columns();

create policy "staff read all members" on members
  for select to authenticated using (is_staff());

create policy "staff manage members" on members
  for all to authenticated using (is_staff()) with check (is_staff());

-- Deliberately no member-facing policy. Coach notes, status and point
-- adjustments are staff-only, and RLS is row-level: had these stayed columns
-- on members, "read own profile" would have handed them back.
alter table member_private enable row level security;

create policy "staff only" on member_private
  for all to authenticated using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------- member-owned
-- The thirteen. Same pair on each: a member reaches their own rows and no
-- others; staff read everything but do not write on a member's behalf.
do $$
declare t text;
begin
  foreach t in array array[
    'completions','lifts','checkins','member_habits','habit_checks',
    'benchmark_results','notebook_notes','session_notes','showcased_prs',
    'daily_stats','in_progress_workout','member_preferences','health_profile'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "own rows" on %I for all to authenticated '
      || 'using (member_id = auth.uid()) with check (member_id = auth.uid())', t);
    execute format(
      'create policy "staff read all" on %I for select to authenticated using (is_staff())', t);
  end loop;
end $$;

-- ------------------------------------------------------------- new members
-- A member row and its satellites are created when the auth user is, so a
-- first sign-in never lands on a half-built account. Runs as definer because
-- the new user cannot yet insert into a table their own policy guards.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into members (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'last_name'
  )
  on conflict (id) do nothing;

  insert into member_private (member_id) values (new.id) on conflict do nothing;
  insert into member_preferences (member_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
