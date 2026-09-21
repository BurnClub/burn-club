-- Two changes to members (2026-09-21). Run after 09.

-- ========================================================= 1. SECURITY FIX
-- The "update own profile" policy let a member change ANY column of their own
-- row, role included. From the browser console, with the publishable key that
-- ships in the app and their own session, a member could set role = 'admin'.
-- RLS allowed it — the row was theirs — and from then on is_staff() was true
-- and they could read every member's completions, check-ins, health profile
-- and coach notes. program_id was open too: a member could move themselves
-- onto any program.
--
-- A trigger rather than column-level grants, because members and staff share
-- the `authenticated` role: revoking UPDATE on `role` for authenticated would
-- stop staff changing it as well.
--
-- auth.uid() is null for a direct database session — the SQL editor, the
-- service role, the reset script — so those pass. An API call from a member
-- always carries one.
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

-- ==================================================== 2. RESET COUNTER
-- A reset on the server has to reach every device the member has used, or the
-- first one to sign in uploads its old copy and quietly undoes it — which
-- happened twice while clearing a phone by hand. Each device remembers the last
-- value it saw; when the server's is higher, the device discards its local copy
-- instead of uploading it. Starts at 0 and only moves when a reset runs.
alter table members add column if not exists data_epoch int not null default 0;

drop trigger if exists protect_member_columns on members;
create trigger protect_member_columns
  before update on members
  for each row execute function public.protect_member_columns();

select column_name, data_type, column_default
from information_schema.columns
where table_name = 'members' and column_name = 'data_epoch';

select tgname from pg_trigger where tgrelid = 'members'::regclass and not tgisinternal;
