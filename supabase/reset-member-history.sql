-- Wipe one member's training history and start them fresh.
-- Keeps the account itself: sign-in, program, start date, role, preferences.
--
-- IMPORTANT: clear the app's data on every device this member has used
-- BEFORE they sign in again. Sign-in pushes local data up before pulling, so
-- a device that still holds the old history will re-upload it and quietly
-- undo this.

do $$
declare
  target uuid := (select id from members where email = 'chris@worthitcandy.com');
begin
  if target is null then
    raise exception 'no member with that email';
  end if;

  -- Lifts first: they key on the client's completion id rather than a foreign
  -- key to completions, so deleting completions would not cascade to them.
  delete from lifts               where member_id = target;
  delete from session_notes       where member_id = target;
  delete from completions         where member_id = target;
  delete from checkins            where member_id = target;
  delete from benchmark_results   where member_id = target;
  delete from showcased_prs       where member_id = target;
  delete from member_habits       where member_id = target;
  delete from habit_checks        where member_id = target;
  delete from notebook_notes      where member_id = target;
  delete from scheduled_items     where member_id = target;
  delete from daily_stats         where member_id = target;
  delete from in_progress_workout where member_id = target;
  delete from health_profile      where member_id = target;
end $$;

-- Every count should be zero. The member row and preferences are kept.
select 'completions' as t, count(*) from completions c join members m on m.id = c.member_id where m.email = 'chris@worthitcandy.com'
union all select 'lifts',          count(*) from lifts          l join members m on m.id = l.member_id where m.email = 'chris@worthitcandy.com'
union all select 'checkins',       count(*) from checkins       x join members m on m.id = x.member_id where m.email = 'chris@worthitcandy.com'
union all select 'showcased_prs',  count(*) from showcased_prs  x join members m on m.id = x.member_id where m.email = 'chris@worthitcandy.com'
union all select 'member_habits',  count(*) from member_habits  x join members m on m.id = x.member_id where m.email = 'chris@worthitcandy.com'
union all select 'notebook_notes', count(*) from notebook_notes x join members m on m.id = x.member_id where m.email = 'chris@worthitcandy.com'
union all select 'account kept',   count(*) from members where email = 'chris@worthitcandy.com';
