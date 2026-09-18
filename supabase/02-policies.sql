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
