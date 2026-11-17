-- Stop the avatars bucket being enumerable by anyone (2026-11-17, tester T-9).
--
-- A signed-out request carrying the publishable key - which ships in the app's
-- source - could LIST the bucket and get back one folder per member who has a
-- photo, each named with their account id. Confirmed still live today: two
-- entries returned to a signed-out caller. The photos themselves are public by
-- design and that is fine; the roster of who exists is the part nobody decided.
--
-- `19-avatars.sql` granted `select` on storage.objects for this bucket to
-- everyone. For a PUBLIC bucket that grant is not what serves the images -
-- /object/public/... does that on its own, without consulting RLS. What the
-- grant adds is the ability to enumerate.
--
-- WHY THIS NARROWS SELECT RATHER THAN DROPPING IT, which was the first draft.
-- The app uploads with `upsert: true` (app.js:7660). A replace is an UPDATE,
-- and an upsert has to be able to SEE the existing object to replace it - so
-- removing select outright risked a member being unable to change their photo
-- after the first upload. Narrowing it to the member's own folder stops the
-- enumeration and leaves that path working. Same idiom as the insert, update
-- and delete policies already in 19-avatars.sql, so all four agree.
--
-- Checked before writing: nothing in app.js, admin/app.js, staff/, sync.js or
-- supabase-client.js calls .list() on any bucket. Avatars are read with
-- getPublicUrl(), which builds a string and makes no API call at all.
--
-- exercise-videos keeps its open policy: listing a library of exercise demos
-- says nothing about any person.

drop policy if exists "avatars are readable by anyone" on storage.objects;

drop policy if exists "members read their own avatar object" on storage.objects;
create policy "members read their own avatar object"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Staff keep a legitimate reason to enumerate - an admin screen may one day
-- want to show who has a photo - and they are signed in, so this is not a
-- public capability. Schema-qualified: a policy on storage.objects does not
-- necessarily run with `public` on its search path.
drop policy if exists "staff may list avatars" on storage.objects;
create policy "staff may list avatars"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and public.is_staff());

-- ============================================================ verify
-- Expect exactly two select policies for avatars, both `to authenticated`,
-- and none for anon. The insert / update / delete policies from 19-avatars.sql
-- are untouched.
select policyname, cmd, roles
  from pg_policies
 where schemaname = 'storage' and tablename = 'objects'
   -- Parenthesised: AND binds tighter than OR, and without these the query
   -- also returns policies on other tables whose with_check mentions avatars.
   and (qual::text like '%avatars%' or with_check::text like '%avatars%')
 order by cmd, policyname;
