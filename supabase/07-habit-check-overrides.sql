-- habit_checks has to record false as well as true (2026-09-19). Run after 06.
--
-- The app reads it as `if (habit.id in log) return log[habit.id]` — the
-- presence of an entry is the signal, and its value can be false. That false
-- is a deliberate override: an auto habit ticks itself from the wearable's
-- step count, and unticking it says "no, I didn't", which has to beat the
-- watch. A table holding only checked rows would drop that and silently
-- re-tick the habit on the member's next device.
alter table habit_checks add column if not exists checked boolean not null default true;
