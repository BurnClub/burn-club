-- Profile pictures (Burn Club, 2026-10-16).
--
-- Unlike the exercise videos, members WRITE to this bucket — so the policies
-- have to do real work. The rule is one folder per member, named for their
-- auth id, and you may only touch your own:
--
--     avatars/<auth uid>/<filename>
--
-- storage.foldername(name) returns the path segments, so [1] is that uid.
-- Comparing it to auth.uid() is what stops someone uploading into, or
-- deleting out of, another member's folder — which a bucket with a blanket
-- "authenticated can write" policy would happily allow.
--
-- Public for READING, like the videos: a profile picture is shown to other
-- members in the group chat and the activity feed, so a plain cacheable URL
-- is the right shape. Nothing private is in it that the app does not already
-- show.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
  set public             = true,
      -- 2MB. A phone camera shot is 3-5MB and does not need to be: the app
      -- downscales before upload, and a cap here is the backstop for anything
      -- that reaches the API another way.
      file_size_limit    = 2097152,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "avatars are readable by anyone" on storage.objects;
create policy "avatars are readable by anyone"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Upload, replace and remove: all three restricted to the member's own folder.
-- Separate policies rather than one FOR ALL, because insert takes with_check,
-- update takes both, and delete takes using — folding them together makes it
-- easy to leave one of the three unguarded without noticing.
drop policy if exists "members upload their own avatar" on storage.objects;
create policy "members upload their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "members replace their own avatar" on storage.objects;
create policy "members replace their own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "members remove their own avatar" on storage.objects;
create policy "members remove their own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Where the picture lives, on the member's own row.
--
-- A column rather than deriving the URL from the id, because the file has an
-- extension and a cache-busting suffix that only the uploader knows — and
-- because a member with no picture has to be distinguishable from one whose
-- file failed to upload. Null means "no picture"; the app shows the logo.
alter table members add column if not exists avatar_url text;

-- protect_member_columns() guards the columns a member must not change
-- themselves. avatar_url is deliberately NOT among them, the same as
-- first_name and last_name: a member owns their own name and face.

select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'avatars';
