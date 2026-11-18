-- Clear the T-23 debris (2026-11-17).
--
-- The T-5 fix numbered a completion's sets 1, 2, 3... from the ORDER of the
-- keys it was handed rather than from the server's own set numbers, so any
-- workout whose numbers were not already exactly 1..n was renumbered onto its
-- neighbours' slots on every app open. Nothing was deleted, so the next pull
-- read the bigger set back: 26 rows became 113 over a handful of reloads,
-- accelerating. sync.js now numbers per exercise, which makes push(pull(x))
-- land on x, so this stops happening as soon as v64 reaches a device.
--
-- Only the tester's account reached the runaway state (checked 2026-11-17:
-- every other member's lifts are still exactly 1..n). Those two workouts are
-- not recoverable - the rows are shifted copies of each other - so they go.
--
-- data_epoch matters here. Deleting the rows alone would not hold: the
-- browser still holds the inflated copy and pushes before it pulls, which is
-- how the phantoms the last cleanup removed were back the same day. Bumping
-- the epoch makes the device discard its local copy at sign-in instead.

do $$
declare
  v_member uuid := (select id from members where email = 'jordan.tester@kellyyager.com');
begin
  if v_member is null then
    raise exception 'no member with that email';
  end if;

  delete from lifts
   where member_id = v_member
     and completion_client_id in ('local-1794933636252', 'local-1794933502726');

  update members set data_epoch = data_epoch + 1 where id = v_member;
end $$;

-- Should return no rows: every workout numbered exactly 1..n per exercise.
select m.email, l.completion_client_id, l.exercise_name,
       count(*) as rows, max(l.set_number) as highest
from lifts l join members m on m.id = l.member_id
group by 1, 2, 3
having count(*) <> max(l.set_number)
    or count(distinct l.set_number) <> count(*)
order by rows desc;
