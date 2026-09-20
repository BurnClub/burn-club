-- The last four member-owned tables, corrected against what the app writes.
-- (2026-09-19) Run once, after 05. Still no member data, so drop and rebuild.
--
-- Checked this time by running the app and dumping every localStorage key it
-- writes, rather than reading one function at a time. That found four at once
-- where the previous method had been finding one per round.

-- --------------------------------------------------------- notebook_notes
-- Was (member_id, note_date, body) — dated rows. The app has no dates on
-- notes at all: it keeps two ordered lists of plain strings, "coach" and
-- "other", and the member reorders and edits them in place. Position is the
-- only ordering there is, so it has to be stored.
drop table if exists notebook_notes;

create table notebook_notes (
  member_id uuid not null references members(id) on delete cascade,
  kind      text not null check (kind in ('coach','other')),
  position  int not null,
  body      text not null,
  primary key (member_id, kind, position)
);

-- ---------------------------------------------------------- session_notes
-- Was keyed on completions(id), a bigint the server assigns. The app writes
-- these against its OWN completion id ("local-1758…") at the moment the
-- workout finishes — before any server id exists, and often before the
-- completion has synced at all. Keying on the client id means a note can be
-- written offline and still find its workout later.
drop table if exists session_notes;

create table session_notes (
  member_id            uuid not null references members(id) on delete cascade,
  completion_client_id text not null,
  body                 text not null default '',
  primary key (member_id, completion_client_id)
);

-- ---------------------------------------------------------- showcased_prs
-- Was a foreign key to exercises(id). The app stores exercise NAMES, because
-- that is what a workout block names and what a personal best is computed
-- against. Mapping name to id on the way in would be tidier and would fail
-- silently for any name that did not resolve — and the failure mode is a
-- member's pinned PR quietly disappearing. Store what the app has.
drop table if exists showcased_prs;

create table showcased_prs (
  member_id     uuid not null references members(id) on delete cascade,
  exercise_name text not null,
  primary key (member_id, exercise_name)
);

-- ------------------------------------------------------ benchmark_results
-- score was text; the app stores a number for both score types — rounds
-- completed, or a time in seconds. Text would have come back as a string and
-- broken every comparison against a previous attempt, which is the entire
-- point of a benchmark.
alter table benchmark_results
  alter column score type numeric using nullif(score, '')::numeric;

-- ------------------------------------------------------------ re-apply RLS
do $$
declare t text;
begin
  foreach t in array array['notebook_notes','session_notes','showcased_prs'] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "own rows" on %I for all to authenticated '
      || 'using (member_id = auth.uid()) with check (member_id = auth.uid())', t);
    execute format(
      'create policy "staff read all" on %I for select to authenticated using (is_staff())', t);
    execute format('grant select, insert, update, delete on %I to authenticated', t);
  end loop;
end $$;

select tablename,
       rowsecurity as rls_on,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = t.tablename) as policies
from pg_tables t
where schemaname = 'public'
  and tablename in ('notebook_notes','session_notes','showcased_prs','benchmark_results')
order by tablename;
