-- Let the exercise bucket hold cover frames as well as clips (Burn Club,
-- 2026-10-07).
--
-- 11-video-bucket.sql pinned allowed_mime_types to array['video/mp4'], which
-- was right when the bucket held nothing but demos. The admin Exercise Library
-- now shows a still from 50% through each clip, stored as <id>.jpg beside
-- <id>.mp4 in this same bucket — one id, two files, no second place to look.
-- Storage rejected every one of them with a 400 until this ran.
--
-- The size limit stays at 50MB: it is there for the videos, and a poster is
-- about 20KB.

update storage.buckets
   set allowed_mime_types = array['video/mp4', 'image/jpeg']
 where id = 'exercise-videos';

-- Check it landed: both types should be listed.
select id, public, file_size_limit, allowed_mime_types
  from storage.buckets
 where id = 'exercise-videos';
