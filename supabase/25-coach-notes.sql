-- Coach notes: the notebook's "For my coach" section, delivered (2026-10-26).
--
-- Chris: "i want it to be seperate from messages, somewhere it can be logged
-- and stay there... have it send a notification, so not only does it appear on
-- the member page, but also the dashboard, at least until it is read."
--
-- WHY A NEW TABLE AND NOT A COLUMN ON notebook_notes.
-- That table is keyed (member_id, kind, position) with no ids, and the member
-- app pushes it with pushReplace() — delete every row for the member, reinsert
-- the lot. A staff_read_at column there would be destroyed every time the
-- member edited any note, and positions shift whenever one is deleted, so
-- "note 2" is not a stable thing to point at.
--
-- So a coach note is a SENT ARTEFACT, the way a message is. Writing one
-- appends a row here and that row never moves. The member's notebook keeps its
-- own copy as their living document; editing it later does not rewrite what
-- the coach received, which is the same promise a sent message makes.

create table if not exists coach_notes (
  id            bigint generated always as identity primary key,
  member_id     uuid not null references members(id) on delete cascade,
  -- The member app's own id for the note, so a retry cannot post it twice.
  client_id     text not null,
  body          text not null check (length(body) between 1 and 4000),
  created_at    timestamptz not null default now(),
  -- SHARED across staff, like messages.staff_read_at: Kelly reading a note
  -- clears it from Chris's dashboard too (Chris, 2026-10-08, about the inbox).
  staff_read_at timestamptz,
  unique (member_id, client_id)
);

create index if not exists coach_notes_unread_idx
  on coach_notes (created_at desc) where staff_read_at is null;

alter table coach_notes enable row level security;

-- A member writes their own and can read them back. They cannot update or
-- delete: it is sent. Nothing here lets a member see anyone else's.
drop policy if exists "member writes own" on coach_notes;
create policy "member writes own" on coach_notes
  for insert to authenticated with check (member_id = auth.uid());

drop policy if exists "member reads own" on coach_notes;
create policy "member reads own" on coach_notes
  for select to authenticated using (member_id = auth.uid());

-- Staff read every note and mark them read. Deliberately no delete for anyone:
-- "logged and stays there" is the entire point.
drop policy if exists "staff reads all" on coach_notes;
create policy "staff reads all" on coach_notes
  for select to authenticated using (is_staff());

drop policy if exists "staff marks read" on coach_notes;
create policy "staff marks read" on coach_notes
  for update to authenticated using (is_staff()) with check (is_staff());

grant select, insert on coach_notes to authenticated;
grant update (staff_read_at) on coach_notes to authenticated;

-- Backfill what members have already written. The trial tester's note went in
-- before this table existed, and it is the one that prompted the feature.
-- Marked unread so it shows up, since nobody has actually seen it.
insert into coach_notes (member_id, client_id, body, created_at)
select n.member_id, 'backfill-' || n.kind || '-' || n.position, n.body, now()
  from notebook_notes n
 where n.kind = 'coach'
   and length(trim(n.body)) > 0
on conflict (member_id, client_id) do nothing;

select m.email, c.body, c.created_at, c.staff_read_at
  from coach_notes c join members m on m.id = c.member_id
 order by c.created_at desc;
