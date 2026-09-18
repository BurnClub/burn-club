# Supabase setup

Run these in order, in the Supabase SQL editor.

| File | What | Re-runnable |
|---|---|---|
| `01-schema.sql` | 25 tables | No — run once on an empty database |
| `02-policies.sql` | RLS on every table, the `is_staff()` helper, new-user trigger | No |
| `03-seed-content.sql` | 663 exercises, 185 workouts, 3 programs | **Yes** — every insert upserts |

`03-seed-content.sql` is **generated**. Don't hand-edit it — change `admin/data.js`
and re-run:

```bash
python3 supabase/generate-seed.py
```

It reads the apps' own `data.js` through `jsc`, so the database can't disagree
with the app about what an exercise is. It refuses to generate if any workout
names an exercise the library doesn't have.

## What's in the seed

```
programs          3      folders           17
exercises       663      workouts         185
blocks          348      block_exercises  655
schedule_slots  112      benchmarks         3
```

## Before you run it

**Create the project yourself** — account creation and credentials aren't
something to hand off. Note the project URL and the `anon` key; those are the
two values the member app needs, and both are safe to ship in client code
(RLS is what protects the data, not key secrecy). The `service_role` key is
different: it bypasses RLS entirely and must never reach the browser.

## After you run it

Check RLS is actually doing its job, rather than assuming. Sign in as two test
members and confirm the second cannot see the first's rows:

```sql
-- as member A, after signing in through the app
select count(*) from completions;          -- their own rows only
select count(*) from member_private;       -- must be 0
```

A table with RLS enabled and no matching policy returns nothing, which is the
right direction to fail — but a table where RLS was never enabled returns
everything, so the check worth running is:

```sql
select tablename from pg_tables
where schemaname = 'public'
  and tablename not in (select tablename from pg_policies where schemaname = 'public');
-- should return no rows
```

## Not here yet

Messaging, groups and challenge teams — phase 2. Testers can break the
training app without them, and they're the one area where a wrong policy
leaks a conversation rather than a preference.
