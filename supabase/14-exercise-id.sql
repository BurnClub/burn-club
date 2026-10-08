-- Key a member's training history to the exercise id, not its name
-- (Burn Club, 2026-10-08).
--
-- `lifts` and `showcased_prs` both store `exercise_name`, and the app looks
-- everything up by it: weight history, personal bests, the last-weight
-- pre-fill. So renaming an exercise orphans every set a member has logged
-- against it. Their history does not move with the name, and nothing says so.
--
-- 01-schema.sql argued for the name on purpose: "mapping to an id on the way
-- in would fail silently for anything that did not resolve, and the failure
-- mode is a member's pinned PR quietly disappearing." That was a fair worry
-- about a lookup that can miss. It does not apply to this, because the id is
-- DERIVED, not looked up — slugify the name and you have it, with five
-- exceptions listed below. A derivation cannot fail to resolve.
--
-- `exercise_name` stays, as a readable copy. The id is what joins; the name is
-- what you read in the table and what the app shows if the library has nothing
-- to say about that id any more.
--
-- Run this BEFORE testers log anything. Today `lifts` holds Chris's own test
-- rows, so this is a backfill. After testers it is a migration of real
-- training history.

alter table lifts         add column if not exists exercise_id text;
alter table showcased_prs add column if not exists exercise_id text;

-- The app's own id rule: lowercase, every non-alphanumeric becomes a hyphen,
-- nothing collapsed — which is why "w/ " lands as "w--". Five ids in the
-- library were authored by hand and do not follow it; they are named here.
create or replace function burnclub_exercise_id(exercise_name text)
returns text as $$
  select case exercise_name
    when '1/4 Front Raise to 1/4 Lateral Raise'         then 'quarter-front-raise-to-quarter-lateral-raise'
    when 'Alternating 1/4 Lateral Raise w/ Static Hold' then 'alternating-quarter-lateral-raise-w--static-hold'
    when 'Weighted Sit-Ups'                             then 'weighted-situps'
    when 'Child''s Pose'                                then 'childs-pose'
    when 'Shoulder & Chest Opener'                      then 'shoulder-and-chest-opener'
    else lower(regexp_replace(exercise_name, '[^a-zA-Z0-9]', '-', 'g'))
  end
$$ language sql immutable;

update lifts
   set exercise_id = burnclub_exercise_id(exercise_name)
 where exercise_id is null and exercise_name is not null;

update showcased_prs
   set exercise_id = burnclub_exercise_id(exercise_name)
 where exercise_id is null;

-- Swap the keys over to the id. The old unique constraint is dropped by shape
-- rather than by name, the same way 12-per-set-lifts.sql did it, because it
-- has been created under more than one name across these migrations.
do $$
declare target text;
begin
  select c.conname into target
    from pg_constraint c
   where c.conrelid = 'lifts'::regclass
     and c.contype = 'u'
     and exists (
       select 1 from unnest(c.conkey) k
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k
       where a.attname = 'exercise_name');
  if target is not null then
    execute format('alter table lifts drop constraint %I', target);
  end if;
end $$;

alter table lifts drop constraint if exists lifts_member_completion_exercise_id_set_key;
alter table lifts add constraint lifts_member_completion_exercise_id_set_key
  unique (member_id, completion_client_id, exercise_id, set_number);

alter table showcased_prs drop constraint if exists showcased_prs_pkey;
alter table showcased_prs add primary key (member_id, exercise_id);

-- Check it landed. Every row should have an id, and none should be left
-- keyed only by a name.
select 'lifts' as table_name,
       count(*) as rows,
       count(exercise_id) as with_id,
       count(*) - count(exercise_id) as missing_id
  from lifts
union all
select 'showcased_prs', count(*), count(exercise_id), count(*) - count(exercise_id)
  from showcased_prs;

-- And a look at what the backfill decided, so the mapping can be eyeballed.
select distinct exercise_name, exercise_id from lifts order by exercise_name limit 50;
