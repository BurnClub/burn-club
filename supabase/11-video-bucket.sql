-- Storage bucket for the exercise demo videos (Burn Club, 2026-09-30).
--
-- Public, deliberately. The clips are demonstrations of exercises — there is
-- nothing private in them, and public means the app can use a plain URL that
-- browsers and CDNs cache normally. Signed URLs would expire, defeat caching,
-- and cost a round trip before every demo, all to protect nothing.
--
-- Writing stays locked: uploads use the service key, which never goes in the
-- app. Members can read, and that is all.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exercise-videos', 'exercise-videos', true, 52428800, array['video/mp4'])
on conflict (id) do update
  set public             = true,
      file_size_limit    = 52428800,
      allowed_mime_types = array['video/mp4'];

-- Anyone may read an object in this bucket. A public bucket already serves
-- /object/public/..., but the policy makes the intent explicit and covers the
-- authenticated path too.
drop policy if exists "exercise videos are readable by anyone" on storage.objects;
create policy "exercise videos are readable by anyone"
  on storage.objects for select
  using (bucket_id = 'exercise-videos');

-- Check it landed.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'exercise-videos';
