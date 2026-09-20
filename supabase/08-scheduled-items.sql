-- Scheduled cardio (2026-09-19). Run after 07.
--
-- Member-owned and missed in the first pass: the calendar lets a member plan
-- a cardio session on a future date, and that plan had nowhere to live. It is
-- the kind of data whose loss is quiet — a member schedules three runs, gets a
-- new phone, and simply finds an empty calendar with nothing to explain it.
create table if not exists scheduled_items (
  member_id  uuid not null references members(id) on delete cascade,
  client_id  text not null,
  item_date  date not null,
  kind       text not null default 'cardio',
  payload    jsonb not null default '{}'::jsonb,
  primary key (member_id, client_id)
);

alter table scheduled_items enable row level security;
create policy "own rows" on scheduled_items for all to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());
create policy "staff read all" on scheduled_items for select to authenticated
  using (is_staff());
grant select, insert, update, delete on scheduled_items to authenticated;

select tablename, rowsecurity as rls_on,
       (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=t.tablename) as policies
from pg_tables t where schemaname='public' and tablename='scheduled_items';
