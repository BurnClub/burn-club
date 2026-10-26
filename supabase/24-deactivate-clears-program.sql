-- Deactivating a member takes them off their programme (2026-10-26).
--
-- Chris: "when a member is deactivated, it automatically takes them off the
-- program they were on."
--
-- WHY A TRIGGER AND NOT ADMIN CODE. Status lives in `member_private.status`
-- and the programme lives in `members.program_id` — two different tables, with
-- nothing joining them. Doing it in admin's save handler would cover exactly
-- one path; every other way a member can be deactivated (a SQL fix, a future
-- Shopify cancellation hook, the member import) would quietly leave them on a
-- programme. A trigger holds whatever the path.
--
-- WHY IT STASHES RATHER THAN JUST NULLING. Clearing program_id on its own
-- destroys the record of what they were on, and reactivating then cannot
-- restore it. Two columns keep it, so deactivation is reversible and the
-- member's history stays legible.
--
-- start_date goes with it: a structured member's start date is meaningless
-- without a programme, and leaving it behind means a reactivation months later
-- silently resurrects a date from the old enrolment.
--
-- Reactivating does NOT put them back automatically. The stash is there to be
-- read, not replayed — someone returning may belong on a different programme,
-- and guessing is worse than asking.

alter table member_private
  add column if not exists last_program_id text references programs(id) on delete set null,
  add column if not exists last_start_date date;

create or replace function public.clear_program_on_deactivate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prev_program text;
  prev_start   date;
begin
  -- Only on the transition INTO a non-active status. Without this guard, every
  -- save of an already-inactive member re-runs the stash and overwrites the
  -- remembered programme with the null it wrote last time.
  if new.status is distinct from 'active'
     and (tg_op = 'INSERT' or old.status is not distinct from 'active') then

    -- Read BEFORE the update. `update ... returning` hands back the new row,
    -- so returning program_id after nulling it returns the null.
    select m.program_id, m.start_date
      into prev_program, prev_start
      from members m
     where m.id = new.member_id;

    if prev_program is not null or prev_start is not null then
      new.last_program_id := prev_program;
      new.last_start_date := prev_start;

      update members
         set program_id = null,
             start_date = null
       where id = new.member_id;
    end if;
  end if;
  return new;
end;
$$;

-- BEFORE, so assigning to `new` is what gets stored. `of status` so an edit to
-- coach notes or a point adjustment doesn't re-run it.
drop trigger if exists on_member_deactivated on member_private;
create trigger on_member_deactivated
  before insert or update of status on member_private
  for each row execute function public.clear_program_on_deactivate();

-- Check: nobody inactive should still hold a programme.
select m.email, p.status, m.program_id, p.last_program_id, p.last_start_date
  from member_private p
  join members m on m.id = p.member_id
 order by p.status, m.email;
