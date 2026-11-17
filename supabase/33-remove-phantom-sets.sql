-- Remove the phantom "set 1" rows left behind by the weights bug
-- (2026-11-17, tester T-5).
--
-- WHAT THEY ARE. Until today, opening the app twice after a workout sent a
-- flattened copy of the member's weights back up as "set 1, no label". For the
-- FIRST exercise of a workout that landed on top of the real set 1. For every
-- other exercise it added a row that never happened, because set numbers count
-- up across the whole workout - the second exercise's sets are numbered 7 to
-- 12, so a write to "set 1" collided with nothing and simply appeared.
--
-- HOW THE TWO ARE TOLD APART, and why this is safe. A phantom is a blank-label
-- row at set 1 whose exercise's OTHER rows start at 3 or higher - it is
-- disconnected from the sets it claims to belong to. A real-but-overwritten
-- set 1 sits directly below a set 2. Run read-only across the live data first:
-- every phantom had its next set at 3 or beyond, every overwritten one had it
-- at exactly 2. No group fell in between.
--
-- THE GUARD THAT MATTERS: `lowest_other >= 3`. Without it, a first exercise
-- with a single set - one row, numbered 1, its label blanked - would look
-- disconnected too, and deleting it would take the member's only record of
-- that exercise. The condition requires surviving rows to exist AND to start
-- above 2.
--
-- NOT TOUCHED: the overwritten set 1s. Their weight is whatever the flattened
-- copy held, the original is gone from the server and from every phone, and
-- there is nothing to restore it from. Their blank label is left blank on
-- purpose - it is the only remaining mark that the row is damaged, and writing
-- "Set 1" back would make a wrong number look deliberate.
--
-- DELETION IS PERMANENT. These rows hold no member input: the weight in them
-- is a copy of another set's number.

-- What will go, before it goes.
with grp as (
  select member_id, completion_client_id, exercise_id,
         count(*) filter (where set_number <> 1)          as other_rows,
         min(set_number) filter (where set_number <> 1)   as lowest_other
    from lifts
   group by member_id, completion_client_id, exercise_id
)
select count(*) as phantom_rows_to_delete
  from lifts l
  join grp g using (member_id, completion_client_id, exercise_id)
 where l.set_number = 1 and l.set_label is null
   and g.other_rows > 0 and g.lowest_other >= 3;

-- Re-derived here rather than taking a list from the query above, so the two
-- cannot disagree if a member syncs between running them.
with grp as (
  select member_id, completion_client_id, exercise_id,
         count(*) filter (where set_number <> 1)          as other_rows,
         min(set_number) filter (where set_number <> 1)   as lowest_other
    from lifts
   group by member_id, completion_client_id, exercise_id
)
delete from lifts l
 using grp g
 where l.member_id            = g.member_id
   and l.completion_client_id = g.completion_client_id
   and l.exercise_id          = g.exercise_id
   and l.set_number = 1
   and l.set_label is null
   and g.other_rows > 0
   and g.lowest_other >= 3;

-- ============================================================ verify
-- Expect: no group left whose blank set 1 is disconnected from its real sets.
-- Rows still listed are the overwritten ones, which stay.
with grp as (
  select member_id, completion_client_id, exercise_id, exercise_name,
         count(*) filter (where set_number = 1 and set_label is null) as blank_one,
         min(set_number) filter (where set_number <> 1)               as lowest_other
    from lifts
   group by member_id, completion_client_id, exercise_id, exercise_name
)
select m.email, g.exercise_name, g.lowest_other,
       case when g.lowest_other >= 3 then 'STILL PHANTOM - unexpected'
            else 'overwritten set 1 - kept on purpose' end as state
  from grp g join members m on m.id = g.member_id
 where g.blank_one > 0
 order by state, m.email;
