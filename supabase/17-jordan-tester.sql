-- Jordan Tester — the one demo member who becomes real (Burn Club, 2026-10-13).
--
-- Chris kept exactly one of the five invented members: "I want to keep this one
-- because it shows what the app would look like if a watch was connected, which
-- is important [for] our visuals". The other four are gone.
--
-- Why he needs a migration at all. Jordan's wearable figures were never data —
-- they were generated in the browser by buildSeedDailyStats(), and loadDailyStats
-- returns an empty array for anyone actually signed in:
--
--     if (!isDemoSession()) return [];
--
-- So a real Jordan account shows a blank Today card and no steps, calories or
-- resting heart rate. The watch visuals only exist if `daily_stats` has rows.
--
-- ---------------------------------------------------------------- BEFORE THIS
-- Create the account first, because every row below hangs off its id and
-- handle_new_user() builds the member row the moment it exists:
--
--   Supabase dashboard → Authentication → Users → Add user
--     Email:    jordan.tester@kellyyager.com   (any address you can receive at)
--     Password: set one, or send an invite — either is fine for a demo account
--
-- Then run this. It finds Jordan by email, so there is no id to copy by hand.
-- Safe to run more than once: every statement either updates in place or
-- upserts, so re-running refreshes the 28 days of wearable data rather than
-- doubling it. Worth re-running every month or two, because the dates below are
-- relative to the day you run it and a demo account that stopped moving three
-- months ago shows the wrong picture.

do $$
declare
  jid uuid;
begin
  select id into jid from members where email = 'jordan.tester@kellyyager.com';
  if jid is null then
    raise exception 'No account for jordan.tester@kellyyager.com — create the auth user first (see the note above).';
  end if;

  -- ------------------------------------------------------------- the account
  -- Fit & Functional because that is the structured programme, and a structured
  -- member is the one whose Calendar, week counter and "Week 2 Day 3" titles
  -- all have something to show. start_date is anchored to the run date so he
  -- lands mid-programme rather than on day one with an empty history.
  update members set
    first_name   = 'Jordan',
    last_name    = 'Tester',
    program_id   = 'fit-functional',
    -- Both variants, so screenshots can show the Home/Gym choice that only a
    -- combo member ever sees.
    access       = 'both',
    start_date   = current_date - 10,
    -- A DATE, not a formatted string. to_char() here returned text and
    -- Postgres refused it outright: "column member_since is of type date but
    -- expression is of type text". The admin modal had the same mistake — a
    -- text box inviting "Jul 2026" into a date column — fixed the same day.
    member_since = current_date - 10,
    badge        = 'Demo Account'
  where id = jid;

  insert into member_private (member_id, coach_notes, status)
  values (jid, 'Demo account — kept for screenshots of the connected-watch view. Not a real client.', 'active')
  on conflict (member_id) do update
    set coach_notes = excluded.coach_notes, status = excluded.status;

  -- --------------------------------------------------------- the watch itself
  -- 28 days, which is what the Progress tab's trend reads back over. The
  -- numbers follow buildSeedDailyStats(): steps around 6k-13k, calories
  -- 1800-2600, resting heart rate 54-69 — plausible rather than flattering, so
  -- the charts look like a person and not a demo.
  --
  -- Deterministic, not random: seeded off the day offset, so re-running gives
  -- the same shape and a screenshot taken today still matches one taken after
  -- the next refresh.
  insert into daily_stats (member_id, stat_date, steps, calories, resting_hr)
  select
    jid,
    current_date - g,
    6000 + ((g * 1373) % 7000),
    1800 + ((g * 577) % 800),
    54 + ((g * 97) % 16)
  from generate_series(0, 27) as g
  on conflict (member_id, stat_date) do update
    set steps = excluded.steps,
        calories = excluded.calories,
        resting_hr = excluded.resting_hr;

  -- The app only draws the Today card and the connected-device row when a
  -- provider is set; without this the figures above exist and nothing shows.
  insert into member_preferences (member_id, wearable)
  values (jid, '{"provider":"apple"}'::jsonb)
  on conflict (member_id) do update
    set wearable = excluded.wearable;

  -- ------------------------------------------------------------------ habits
  -- One automatic habit is the point: it ticks itself off the step count, which
  -- is the behaviour that only exists when a watch is connected.
  insert into member_habits (member_id, habit_id, label, auto, target, position)
  values
    (jid, 'steps-10k',         '10,000 Steps',     'steps', 10000, 0),
    (jid, 'water-100oz',       '100oz Water',      null,    null,  1),
    (jid, 'outdoor-activity',  'Outdoor Activity', null,    null,  2)
  on conflict (member_id, habit_id) do update
    set label = excluded.label, auto = excluded.auto,
        target = excluded.target, position = excluded.position;

  -- ----------------------------------------------------------- health profile
  -- Fills the read-only panel in admin's member modal, which is otherwise the
  -- one part of that screen with nothing to show.
  insert into health_profile (member_id, profile, updated_at)
  values (jid, jsonb_build_object(
    'height', '5''9"', 'weight', '172', 'dob', '1990-04-12',
    'sex', 'prefer-not-to-say', 'activityLevel', 'active',
    'goal', 'build-muscle', 'targetWeight', '165',
    'injuries', 'Left knee — avoid deep lunges'
  ), now())
  on conflict (member_id) do update
    set profile = excluded.profile, updated_at = now();

  raise notice 'Jordan Tester set up: % — 28 days of wearable data, 3 habits, health profile.', jid;
end $$;

-- What this deliberately does NOT create: completions. A workout history has to
-- agree with the programme's own schedule (which slot was due on which day) to
-- read correctly in the Calendar and the week counter, and inventing one that
-- disagrees would make the demo account look broken in a different way. Run a
-- couple of workouts as Jordan on a phone instead — it takes five minutes and
-- produces history that is actually consistent.

select email, first_name, last_name, program_id, access, start_date, badge
from members where email = 'jordan.tester@kellyyager.com';
