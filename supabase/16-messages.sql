-- Messaging, for real (Burn Club, 2026-10-12).
--
-- The member app's messaging UI has been finished for months — inbox, threads,
-- bubbles, unread badges, compose, send. What it never had was storage. A sent
-- message went into localStorage under burnClubLiveMessages, which reaches
-- admin only if admin happens to be open in the same browser on the same
-- machine. For a tester on their phone it goes nowhere at all.
--
-- Two conversation shapes, both already used by all three apps:
--
--   dm-<member uuid>     one member and staff. The member's line to a coach.
--   group-<program id>   everyone on that program, plus staff. Chris's ask
--                        (2026-10-12): "people often feel more comfortable
--                        talking to a peer, than they would Kelly".
--
-- NOTE ON THE GROUP'S SCOPE. It is keyed to the PROGRAM, which is the
-- convention the member, admin and staff apps already share. If the six
-- testers are all on one program, that is exactly the one group Chris asked
-- for. If they are split across two programs they get a room each — which is
-- the safer default anyway, since nobody expects Burn Club and Fit & Functional
-- members to land in one room by accident. Say so if a single cross-program
-- room is wanted instead; that needs a group concept of its own, not a
-- program id.

-- ---------------------------------------------------------------- is_staff
-- is_staff() has been asking the WRONG TABLE since 15-staff-accounts.sql.
-- It reads members.role, but that migration's whole point was that staff are
-- not members — Chris and Kelly have rows in `staff`, and none in `members`.
-- So today nothing on this database passes is_staff(), and every "staff read
-- all" / "staff write" policy on all 25 tables is dead code.
--
-- That has been harmless only because admin has no backend code: it reads
-- content from the bundled data.js. It stops being harmless here, because
-- the whole point of messaging is that a coach can read what a member sent.
--
-- Widened rather than replaced: a members row with role staff/admin still
-- counts, so nothing that works today stops working. This is a deliberate
-- security change — it moves is_staff() from "nobody" to "whoever is in the
-- staff table", which is what every policy already meant to ask.
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from staff   where id = auth.uid())
      or exists (select 1 from members where id = auth.uid()
                   and role in ('staff','admin'));
$$;

revoke execute on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- Which program the caller is on. security definer for the same reason
-- is_staff() is: a policy on `messages` that sub-selects `members` would
-- otherwise be evaluated under the caller's own RLS, and nesting policy
-- evaluation like that is how recursion bugs start. Returns null for staff,
-- who are not on a program — and null never equals a program id, so the group
-- policy below leans on is_staff() for them rather than on this.
create or replace function public.my_program_id()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select program_id from members where id = auth.uid();
$$;

revoke execute on function public.my_program_id() from public;
grant execute on function public.my_program_id() to authenticated;

-- ---------------------------------------------------------------- table
create table if not exists messages (
  id              bigint generated always as identity primary key,
  -- The thread, in the app's own vocabulary. Kept as the literal string the
  -- three apps already build so nothing has to translate.
  conversation_id text not null,
  -- Denormalised from conversation_id so a policy can decide with a column
  -- comparison instead of parsing a string. A policy that depends on string
  -- parsing is a policy nobody can read.
  kind            text not null check (kind in ('dm','group')),
  -- Exactly one of these is set, enforced below.
  member_id       uuid references members(id) on delete cascade,
  program_id      text references programs(id) on delete cascade,
  -- auth.uid() of the sender. Not a members reference: staff send too, and
  -- staff have no members row.
  sender_id       uuid not null,
  -- Denormalised so a thread renders without joining three tables, and so a
  -- message still reads correctly after someone's name changes or their
  -- account is deleted.
  sender_name     text not null,
  is_staff        boolean not null default false,
  body            text not null check (length(body) between 1 and 4000),
  created_at      timestamptz not null default now(),
  -- SHARED staff read state (Chris, 2026-10-08: "when a message is read, it
  -- clears for both"). One timestamp on the row, not one per staff member —
  -- Kelly reading a message clears it from Chris's inbox too, which is the
  -- behaviour a shared inbox means.
  --
  -- The member side is deliberately NOT here. A DM has one member, but a group
  -- has six, and per-member read state would be a join table for something the
  -- member app can answer locally from "when did I last open this thread".
  staff_read_at   timestamptz,

  constraint messages_target_matches_kind check (
    (kind = 'dm'    and member_id is not null and program_id is null) or
    (kind = 'group' and program_id is not null and member_id is null)
  )
);

-- Every read is "this thread, newest last".
create index if not exists messages_conversation_idx
  on messages (conversation_id, created_at);
-- The staff inbox asks "what is unread anywhere", which would otherwise be a
-- full scan of every message ever sent.
create index if not exists messages_unread_idx
  on messages (staff_read_at) where staff_read_at is null;

alter table messages enable row level security;

-- ---------------------------------------------------------------- policies
-- Read. A member sees their own DM and the group for the program they are on;
-- staff see everything.
drop policy if exists "read own threads" on messages;
create policy "read own threads"
  on messages for select to authenticated
  using (
    is_staff()
    or (kind = 'dm'    and member_id = auth.uid())
    or (kind = 'group' and program_id = my_program_id())
  );

-- Write. Same reach, plus two things the predicate must pin down or a member
-- can forge:
--   sender_id = auth.uid()  — otherwise they can post as someone else.
--   is_staff = false        — otherwise they can post a message that renders
--                             with the coach's styling and authority.
drop policy if exists "members send to their own threads" on messages;
create policy "members send to their own threads"
  on messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and is_staff = false
    and not is_staff()
    and (
      (kind = 'dm'    and member_id = auth.uid())
      or (kind = 'group' and program_id = my_program_id())
    )
  );

drop policy if exists "staff send anywhere" on messages;
create policy "staff send anywhere"
  on messages for insert to authenticated
  with check (is_staff() and sender_id = auth.uid());

-- Update exists for ONE purpose: marking read. Members get no update policy at
-- all, so nobody can edit a message after sending — including their own. That
-- is a deliberate limit, not an oversight: an editable message in a group of
-- peers is a message that can be changed after someone replies to it.
drop policy if exists "staff mark read" on messages;
create policy "staff mark read"
  on messages for update to authenticated
  using (is_staff()) with check (is_staff());

-- No delete policy for anyone. Removing a message is a staff action through
-- the dashboard until there is a reason for it to be a product feature.

-- ---------------------------------------------------------------- grants
-- A grant decides whether a caller may touch the table at all; RLS only
-- decides which rows. 02b-grants.sql granted "all tables in schema public",
-- which was a snapshot of the tables existing that day — a table created
-- afterwards gets nothing, and the symptom is "permission denied for table
-- messages" on a correct password, before any policy above is consulted.
-- This is the second time that has nearly bitten (see 15-staff-accounts.sql).
grant select, insert, update on table messages to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- And so the NEXT table added does not repeat it a third time.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
