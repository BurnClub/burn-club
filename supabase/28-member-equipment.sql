-- What equipment a member actually has (2026-11-04).
--
-- Chris: "i think it may be a good idea to have a place in the user profile
-- that they can select the list of equipment they have access to using the
-- list we already have in admin."
--
-- Goes on member_preferences rather than a table of its own: it is one short
-- list per member, it is already the row that syncs every other per-member
-- setting, and that row is pushed and pulled whole. A new table would mean a
-- new policy, a new grant, a new store and a new way for a push to fail.
--
-- Values are the EQUIPMENT_TAGS strings from data.js - the same vocabulary the
-- exercise library is tagged with in admin, which is what makes a member's
-- list and an exercise's requirements comparable at all. Not constrained here:
-- the tag list is content and changes in data.js, and a check constraint would
-- mean a migration every time Kelly adds a piece of kit.
--
-- '[]' means "has not said", NOT "owns nothing" - the app treats an empty list
-- as no preference and ranks nothing down for it. A member who genuinely has
-- nothing picks Bodyweight, which is a real tag.
alter table member_preferences
  add column if not exists equipment jsonb not null default '[]'::jsonb;

select column_name, data_type, column_default
  from information_schema.columns
 where table_name = 'member_preferences' and column_name = 'equipment';
