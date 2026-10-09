-- Real sign-in for the admin app (Burn Club, 2026-10-08).
--
-- Until now admin's login form called preventDefault and showed the dashboard.
-- Any email, any password, and the page is published at
-- burnclub.github.io/burn-club/admin/ — so the gate was decoration. What saved
-- us is that admin holds no member data: it has no backend code at all, and
-- reads workouts from the bundled data.js. The exposure was Chris's programs
-- and settings, not anyone's personal data. That stops being tolerable the day
-- testers exist, because testers poke at URLs.
--
-- Staff are NOT members. A member row is a training profile — program, start
-- date, history — and none of it means anything for a coach. So staff get
-- their own table, keyed to the auth user, and "can this person open admin?"
-- is one question with one answer.
--
-- Chris creates the two accounts himself in Dashboard > Authentication > Add
-- user, then runs the insert at the bottom with their user ids. Passwords
-- never pass through here, or through me.

create table if not exists staff (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  name       text not null,
  -- Everyone is "admin" today; Chris and Kelly both do everything. The column
  -- exists so that adding a limited role later is a value change rather than a
  -- migration, which is the cheap half of doing it now.
  role       text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table staff enable row level security;

-- A signed-in person may read their own staff row and nothing else. That is
-- the whole check the admin app makes: a row comes back, you are staff. It
-- also means a member signing in at the admin URL gets no row and is refused,
-- without admin needing to know anything about members.
drop policy if exists "staff can read their own row" on staff;
create policy "staff can read their own row"
  on staff for select
  using (id = auth.uid());

-- Nobody writes this table from the browser. Adding or removing staff is a
-- deliberate act in the dashboard, which is what it should be while there are
-- two of them.

-- ---------------------------------------------------------------------------
-- After creating the two users in Authentication > Add user, copy their UUIDs
-- and run this, then delete it from the file. Emails below are placeholders.
--
-- insert into staff (id, email, name) values
--   ('PASTE-CHRIS-UUID', 'chris@worthitcandy.com', 'Chris'),
--   ('PASTE-KELLY-UUID', 'kelly@example.com',      'Kelly')
-- on conflict (id) do update set email = excluded.email, name = excluded.name;

-- Check it landed.
select id, email, name, role, created_at from staff order by created_at;
