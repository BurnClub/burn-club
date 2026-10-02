-- Weights, per set rather than per exercise (Burn Club, 2026-10-02).
--
-- Chris programs descending schemes — Barbell Bench Press 10, 8, 8, 6 — where
-- the weight usually changes with the reps. The app now asks for a number per
-- set on a screen at the end of each block, so a workout produces four rows
-- for that exercise instead of one.
--
-- The old table could only hold one: unique (member, completion, exercise).
-- This widens the key with a set number and keeps a label, so what a member
-- sees ("Round 2") is what is stored, rather than an index to be decoded later.
--
-- Existing rows become set 1, which is what they are.

alter table lifts add column if not exists set_number int not null default 1;
alter table lifts add column if not exists set_label text;

-- Drop the old unique constraint whatever Postgres called it.
do $$
declare
  conname text;
begin
  select c.conname into conname
  from pg_constraint c
  where c.conrelid = 'lifts'::regclass
    and c.contype = 'u'
    and array_length(c.conkey, 1) = 3;
  if conname is not null then
    execute format('alter table lifts drop constraint %I', conname);
  end if;
end $$;

alter table lifts drop constraint if exists lifts_member_completion_exercise_set_key;
alter table lifts add constraint lifts_member_completion_exercise_set_key
  unique (member_id, completion_client_id, exercise_name, set_number);

-- Check it landed: the new columns, and a unique key of four columns.
select column_name, data_type
from information_schema.columns
where table_name = 'lifts' and column_name in ('set_number', 'set_label');

select conname, array_length(conkey, 1) as columns_in_key
from pg_constraint
where conrelid = 'lifts'::regclass and contype = 'u';
