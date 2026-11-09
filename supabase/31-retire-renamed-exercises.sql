-- Remove 13 exercise rows the app no longer knows about (2026-11-09).
--
-- These are the misspellings fixed in data.js on 2026-09-24 and never cleaned
-- up on the server: "Peck Deck Fly" for Pec, "DD Reverse Crunch" for DB,
-- "eg Extension" for Leg, "Secon" for Second, "Wall Leaning Posts March" for
-- Psoas, "Sumo DB DB" for Sumo DB, "RDLto"/"RDL ro" for "RDL to". Every one of
-- them has a correctly-spelled twin in the library that is already in use.
--
-- THIS IS TIDYING, NOT A FIX. Nothing reads these rows. Admin builds its
-- exercise list from admin/data.js rather than from here, so a stale row could
-- never be picked by accident. The only argument for running it is that the
-- table should say what the app says.
--
-- Checked before writing this: lifts, showcased_prs and block_exercises all
-- return zero references for all thirteen. The WHERE clause below re-checks
-- that anyway, at the moment of deletion rather than in a query someone ran
-- earlier - a member could have synced a lift between the two. An id that has
-- picked up a reference in the meantime is simply left alone, and the count at
-- the bottom will be less than 13 to say so.
--
-- DELETION IS PERMANENT. There is no undo. The rows hold nothing a member
-- wrote - name, body parts, equipment, technique - and all of that exists on
-- the correctly-spelled twin.
with old_ids(id) as (values
  ('1-4-front-raise-to-1-4-lateral-raise'),
  ('alternating-1-4-lateral-raise-w--static-hold'),
  ('alternating-wall-leaning-posts-march'),
  ('bear-crawl-to-shoulder-taps'),
  ('cable-rdlto-squat'),
  ('db-rdl-ro-top-loaded-squat'),
  ('dd-reverse-crunch'),
  ('eg-extension-w--toes-pointed-out'),
  ('leg-press-w--5-secon-static-hold'),
  ('peck-deck-fly'),
  ('peck-deck-fly-static-hold'),
  ('reverse-peck-deck-fly'),
  ('sumo-db-db-squat-to-calf-raise'))
delete from exercises e
 using old_ids o
 where e.id = o.id
   and not exists (select 1 from lifts           l where l.exercise_id = e.id)
   and not exists (select 1 from showcased_prs   p where p.exercise_id = e.id)
   and not exists (select 1 from block_exercises b where b.exercise_id = e.id);

-- Should be 688 - the same number the app carries. Anything higher means a row
-- was left alone because something had started pointing at it.
select count(*) as exercises_now from exercises;
