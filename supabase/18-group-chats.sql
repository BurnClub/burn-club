-- Chat for a custom group (Burn Club, 2026-10-15).
--
-- Chris is putting all six testers in one group so they can talk to each
-- other: "people often feel more comfortable talking to a peer, than they
-- would Kelly." The group itself already exists in admin, and the bulk
-- "Add to group" action puts people in it. What is missing is the chat.
--
-- Why it was missing, and why this file is a table rather than a flag.
-- 16-messages.sql backs two thread shapes: a member↔staff DM, and the group
-- chat for a PROGRAMME, where "who is in it" is answered by members.program_id
-- — a column the database already holds. A custom group's membership lived
-- only in admin's localStorage, so RLS had nothing to ask. A policy cannot
-- check a fact the database does not have, and filtering in the browser is not
-- security, it is hiding.
--
-- So the group and its roster move server-side. That is also the first slice
-- of admin's content migration arriving early, which is fine: it is the slice
-- with a reason.

-- ---------------------------------------------------------------- tables
-- Text ids, not uuids, because admin already generates them
-- ("custom-form-check-1792...") and they are referenced in message rows and
-- conversation ids on all three apps. Changing their shape here would mean a
-- translation layer in three places to gain nothing.
create table if not exists member_groups (
  id          text primary key,
  name        text not null,
  description text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists group_members (
  group_id  text not null references member_groups(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  primary key (group_id, member_id)
);

create index if not exists group_members_member_idx on group_members (member_id);

-- ---------------------------------------------------------------- helper
-- security definer for the same reason is_staff() is: a policy on `messages`
-- that sub-selects group_members would otherwise be evaluated under the
-- caller's own RLS on that table, and nesting policy evaluation is how
-- recursion bugs start.
create or replace function public.in_group(gid text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from group_members where group_id = gid and member_id = auth.uid()
  );
$$;

revoke execute on function public.in_group(text) from public;
grant execute on function public.in_group(text) to authenticated;

-- ---------------------------------------------------------------- messages
-- A third thread shape alongside dm and group.
alter table messages add column if not exists group_id text references member_groups(id) on delete cascade;

alter table messages drop constraint if exists messages_kind_check;
alter table messages add constraint messages_kind_check
  check (kind in ('dm', 'group', 'custom'));

-- Exactly one target per row, now across three shapes. Rewritten rather than
-- added to, because the old one asserted that program_id and member_id were
-- the only possibilities and would refuse every custom row.
alter table messages drop constraint if exists messages_target_matches_kind;
alter table messages add constraint messages_target_matches_kind check (
  (kind = 'dm'     and member_id is not null and program_id is null     and group_id is null) or
  (kind = 'group'  and program_id is not null and member_id is null     and group_id is null) or
  (kind = 'custom' and group_id is not null  and member_id is null      and program_id is null)
);

-- ---------------------------------------------------------------- policies
-- Rewritten whole rather than added to: a second permissive policy would be
-- OR'd with the first, and two policies describing one rule is how the rule
-- stops being readable.
drop policy if exists "read own threads" on messages;
create policy "read own threads"
  on messages for select to authenticated
  using (
    is_staff()
    or (kind = 'dm'     and member_id = auth.uid())
    or (kind = 'group'  and program_id = my_program_id())
    or (kind = 'custom' and in_group(group_id))
  );

drop policy if exists "members send to their own threads" on messages;
create policy "members send to their own threads"
  on messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and is_staff = false
    and not is_staff()
    and (
      (kind = 'dm'     and member_id = auth.uid())
      or (kind = 'group'  and program_id = my_program_id())
      or (kind = 'custom' and in_group(group_id))
    )
  );

-- The group and its roster: a member may READ the groups they are in, so the
-- app can offer the thread and name it. Only staff write — a member adding
-- themselves to a group would be adding themselves to its conversation.
alter table member_groups enable row level security;
alter table group_members enable row level security;

drop policy if exists "read groups you are in" on member_groups;
create policy "read groups you are in"
  on member_groups for select to authenticated
  using (is_staff() or in_group(id));

drop policy if exists "staff manage groups" on member_groups;
create policy "staff manage groups"
  on member_groups for all to authenticated
  using (is_staff()) with check (is_staff());

-- Deliberately only your OWN row. A member needs to know they are in a group;
-- they do not need the roster, and handing it over would turn a group chat
-- into a member directory for anyone who opens the console.
drop policy if exists "read your own membership" on group_members;
create policy "read your own membership"
  on group_members for select to authenticated
  using (is_staff() or member_id = auth.uid());

drop policy if exists "staff manage membership" on group_members;
create policy "staff manage membership"
  on group_members for all to authenticated
  using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------- grants
-- A grant decides whether a caller may touch the table at all; RLS only
-- decides which rows. Third time of writing this comment, which is why
-- 16-messages.sql set `alter default privileges` — these two tables inherit
-- it, and the explicit grants below are belt and braces for a database where
-- that default did not apply.
grant select, insert, update, delete on table member_groups to authenticated;
grant select, insert, update, delete on table group_members to authenticated;

select 'member_groups' as table, count(*) from member_groups
union all
select 'group_members', count(*) from group_members;
