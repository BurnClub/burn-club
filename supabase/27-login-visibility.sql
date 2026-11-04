-- Knowing whether a member actually got in (2026-11-03).
--
-- The first tester trial ran three days on a broken sign-in and the system's
-- total output was nothing. No last_seen, no log, no error surfaced anywhere.
-- Chris found out by email, days later, from the two people who bothered to
-- write. Half the testers never finished setup and we still do not know why.
--
-- Chris: "I want to be better prepared for this situation. What can we do to
-- make sure logging in, and then coming back the next day, and being able to
-- log in again is not an issue?"
--
-- Part of the answer is the sign-in fix that shipped before this. The rest is
-- that a trial has to be WATCHABLE. These two things are what turn "nobody can
-- log in" from an email thread into a screen Chris can look at on Tuesday
-- morning.

-- ========================================================== 1. last_seen
-- One column, written every time a member reaches the app. A blank cell is a
-- member who never got in, and that is the whole point of it.
--
-- Safe for a member to write themselves: protect_member_columns() (10-) names
-- the columns a member may not touch, and this is not one of them. No
-- SECURITY DEFINER needed — "update own profile" already covers it.
alter table members add column if not exists last_seen timestamptz;

-- What they got in ON. The trial's unanswered question was whether people were
-- being bounced because the session lived in one browser and they came back in
-- another — an email in-app browser on day one, the home screen on day two.
-- That is a guess, and an Android tester already dents it. This makes it a
-- fact next time instead of a theory.
alter table members add column if not exists last_seen_agent text;

-- ======================================================= 2. auth_events
-- Every sign-in attempt, successful or not, and every way the app can fail to
-- let someone in afterwards.
--
-- DELIBERATELY NO FOREIGN KEY on member_id. Twice now an FK from member data
-- to another table has silently rejected every insert behind it — completions
-- to workouts, lifts to exercises — and cost days. A log that refuses to write
-- is worse than no log, because it looks like silence rather than failure.
-- member_id is a plain uuid here and may be null: a failed sign-in has no
-- member to point at, which is exactly the case worth recording.
create table if not exists auth_events (
  id          bigint generated always as identity primary key,
  member_id   uuid,
  -- Typed into the form, so it survives the case where no account matched.
  email       text check (email is null or length(email) <= 320),
  event       text not null check (length(event) <= 40),
  detail      text check (detail is null or length(detail) <= 500),
  user_agent  text check (user_agent is null or length(user_agent) <= 400),
  app_version text check (app_version is null or length(app_version) <= 40),
  created_at  timestamptz not null default now()
);

create index if not exists auth_events_recent_idx on auth_events (created_at desc);
create index if not exists auth_events_email_idx  on auth_events (lower(email), created_at desc);

alter table auth_events enable row level security;

-- Insert is open to anon, and it has to be. The event most worth having is a
-- sign-in that FAILED, and there is no session at that moment — the member is
-- still sitting on the login form. An authenticated-only policy would log
-- exactly the cases nobody needs.
--
-- The trade is that the publishable key is public, so this table can be
-- written by anyone who reads the app's source. For a six-person private trial
-- that is an acceptable price for being able to see what happened. The length
-- caps above are the limit on what a nuisance write can cost. Revisit before
-- this is a public app.
drop policy if exists "anyone may log an attempt" on auth_events;
create policy "anyone may log an attempt" on auth_events
  for insert to anon, authenticated with check (true);

-- Reading is staff only. Nobody may update or delete: a log that can be edited
-- is not evidence.
drop policy if exists "staff read all" on auth_events;
create policy "staff read all" on auth_events
  for select to authenticated using (is_staff());

grant insert on auth_events to anon, authenticated;
grant select on auth_events to authenticated;

-- ============================================================ verify
select column_name, data_type
  from information_schema.columns
 where table_name = 'members' and column_name in ('last_seen', 'last_seen_agent');

select policyname, cmd, roles
  from pg_policies where tablename = 'auth_events' order by policyname;

-- Who has ever reached the app. Blank last_seen = never got in.
select email, first_name, last_seen, last_seen_agent
  from members where role is distinct from 'admin'
 order by last_seen desc nulls first;
